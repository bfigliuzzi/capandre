"use client";

// Hook du module « Dictionnaire » : copie le fichier livré en base à la première
// ouverture (R31), puis le relit depuis IndexedDB, sans réseau.
import { useEffect, useState } from "react";
import { DICTIONARY_DATA_VERSION } from "../dictionnaire/constants";
import type { DictionaryFile } from "../dictionnaire/types";
import { validateDictionaryFile } from "../dictionnaire/validate";
import { getDB } from "./database";
import { installDictionary, installedDictionaryVersion, loadDictionary } from "./dictionary-operations";

export const DICTIONARY_URL = `/dictionnaire/dictionnaire-v${DICTIONARY_DATA_VERSION}.json`;

export type DictionaryState =
  | { readonly status: "chargement" }
  | { readonly status: "erreur-reseau" }
  | { readonly status: "erreur-fichier" }
  | { readonly status: "pret"; readonly dictionary: DictionaryFile };

class FileError extends Error {}

async function download(): Promise<DictionaryFile> {
  const response = await fetch(DICTIONARY_URL);
  if (!response.ok) throw new TypeError(`HTTP ${response.status}`);
  const validation = validateDictionaryFile(await response.json());
  if (!validation.ok) throw new FileError(validation.error);
  return validation.file;
}

async function openDictionary(): Promise<DictionaryFile> {
  const db = await getDB();
  if ((await installedDictionaryVersion()) !== DICTIONARY_DATA_VERSION) {
    await installDictionary(db, await download());
  }
  return loadDictionary(db, DICTIONARY_DATA_VERSION);
}

export function useDictionary(): DictionaryState {
  const [state, setState] = useState<DictionaryState>({ status: "chargement" });

  useEffect(() => {
    let cancelled = false;
    openDictionary()
      .then((dictionary) => {
        if (!cancelled) setState({ status: "pret", dictionary });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: error instanceof FileError ? "erreur-fichier" : "erreur-reseau" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

"use client";

// Hook du module « Dictionnaire » : copie le fichier livré en base à la première
// ouverture (R31), puis le relit depuis IndexedDB, sans réseau.
import { useCallback, useEffect, useState } from "react";
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

/** Seul l'échec de la requête elle-même est une absence de réseau ; tout le reste est un problème de fichier. */
class NetworkError extends Error {}

async function request(): Promise<Response> {
  try {
    return await fetch(DICTIONARY_URL);
  } catch (error) {
    throw new NetworkError(String(error));
  }
}

async function download(): Promise<DictionaryFile> {
  const response = await request();
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const validation = validateDictionaryFile(await response.json(), DICTIONARY_DATA_VERSION);
  if (!validation.ok) throw new Error(validation.error);
  return validation.file;
}

async function openDictionary(): Promise<DictionaryFile> {
  const db = await getDB();
  if ((await installedDictionaryVersion()) !== DICTIONARY_DATA_VERSION) {
    await installDictionary(db, await download());
  }
  return loadDictionary(db, DICTIONARY_DATA_VERSION);
}

export interface UseDictionaryResult {
  readonly state: DictionaryState;
  /** Relance la préparation après une erreur. */
  readonly retry: () => void;
}

export function useDictionary(): UseDictionaryResult {
  const [state, setState] = useState<DictionaryState>({ status: "chargement" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    openDictionary()
      .then((dictionary) => {
        if (!cancelled) setState({ status: "pret", dictionary });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: error instanceof NetworkError ? "erreur-reseau" : "erreur-fichier" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    setState({ status: "chargement" });
    setAttempt((a) => a + 1);
  }, []);

  return { state, retry };
}

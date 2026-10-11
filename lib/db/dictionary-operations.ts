// Persistance du module « Dictionnaire » : une copie du fichier livré, faite une fois.
import type { IDBPDatabase } from "idb";
import type { DictionaryFile } from "../dictionnaire/types";
import { defaultSettings, getSettings } from "./multiplication-operations";
import type { CapandreDB } from "./schema";

type DB = IDBPDatabase<CapandreDB>;

const SETTINGS_ID = "app";

/** Vide le store puis le remplit, et note la version, dans une seule transaction. */
export async function installDictionary(db: DB, file: DictionaryFile): Promise<void> {
  const tx = db.transaction(["dictionaryPages", "settings"], "readwrite");
  const pages = tx.objectStore("dictionaryPages");
  const settings = tx.objectStore("settings");
  await pages.clear();
  for (const page of file.pages) await pages.put(page);
  const current = (await settings.get(SETTINGS_ID)) ?? defaultSettings();
  await settings.put({ ...current, dictionaryVersion: file.version });
  await tx.done;
}

/** Version copiée en base, ou null si le dictionnaire n'a jamais été copié. */
export async function installedDictionaryVersion(): Promise<number | null> {
  return (await getSettings()).dictionaryVersion ?? null;
}

/** Tout le dictionnaire en mémoire : 750 pages, environ 2,4 Mo. */
export async function loadDictionary(db: DB, version: number): Promise<DictionaryFile> {
  const pages = await db.getAll("dictionaryPages");
  return { version, articlesPerPage: pages[0]?.articles.length ?? 0, pages };
}

import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { CapandreDB } from "./schema";
import { seedDatabase } from "./seed";

const DB_NAME = "capandre";
const DB_VERSION = 5;

let dbPromise: Promise<IDBPDatabase<CapandreDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<CapandreDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CapandreDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // v0/v1 → v2: clean up old French-named stores, create new ones
        if (oldVersion < 2) {
          const storeNames = db.objectStoreNames as unknown as DOMStringList;
          for (const name of ["modules", "niveaux", "dictees", "poemes"]) {
            if (storeNames.contains(name)) {
              db.deleteObjectStore(name as never);
            }
          }

          db.createObjectStore("modules", { keyPath: "id" });

          const levelsStore = db.createObjectStore("levels", {
            keyPath: "id",
          });
          levelsStore.createIndex("by-module", "moduleId");

          const dictationsStore = db.createObjectStore("dictations", {
            keyPath: "id",
          });
          dictationsStore.createIndex("by-module", "moduleId");

          const poemsStore = db.createObjectStore("poems", { keyPath: "id" });
          poemsStore.createIndex("by-module", "moduleId");
        }

        // v2 → v3: add mode field to existing dictations
        if (oldVersion >= 2 && oldVersion < 3) {
          const store = transaction.objectStore("dictations");
          store.openCursor().then(function migrate(cursor): void {
            if (!cursor) return;
            const record = cursor.value;
            if (!record.mode) {
              cursor.update({ ...record, mode: "words" });
            }
            cursor.continue().then(migrate);
          });
        }

        // v3 → v4 : stores du module Tables de multiplication.
        // Migration purement additive : aucun enregistrement existant n'est
        // relu ni réécrit, les dictées et poésies sont donc intactes.
        // Les `contains` défensifs évitent un ConstraintError si une v4
        // partielle a déjà existé sur l'appareil.
        if (oldVersion < 4) {
          const storeNames = db.objectStoreNames as unknown as DOMStringList;

          if (!storeNames.contains("multiplicationFacts")) {
            const factsStore = db.createObjectStore("multiplicationFacts", {
              keyPath: "id",
            });
            factsStore.createIndex("by-table", "a");
          }

          if (!storeNames.contains("multiplicationSessions")) {
            const sessionsStore = db.createObjectStore(
              "multiplicationSessions",
              { keyPath: "id" },
            );
            sessionsStore.createIndex("by-date", "completedAt");
            sessionsStore.createIndex("by-difficulty", "difficulty");
          }

          if (!storeNames.contains("multiplicationBadges")) {
            db.createObjectStore("multiplicationBadges", { keyPath: "id" });
          }

          if (!storeNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "id" });
          }
        }

        // v4 → v5 : store du module Dictionnaire. Purement additive, comme la v4.
        if (oldVersion < 5) {
          const storeNames = db.objectStoreNames as unknown as DOMStringList;
          if (!storeNames.contains("dictionaryPages")) {
            db.createObjectStore("dictionaryPages", { keyPath: "number" });
          }
        }
      },
    }).then(async (db) => {
      await seedDatabase(db);
      return db;
    });
  }
  return dbPromise;
}

/** Ferme la connexion et oublie le cache : chaque test d'écran repart d'une base neuve. */
export async function closeDB(): Promise<void> {
  if (!dbPromise) return;
  const pending = dbPromise;
  dbPromise = null;
  (await pending.catch(() => null))?.close();
}

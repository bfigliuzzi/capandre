import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { CapandreDB } from "./schema";
import { seedDatabase } from "./seed";

const DB_NAME = "capandre";
const DB_VERSION = 3;

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
      },
    }).then(async (db) => {
      await seedDatabase(db);
      return db;
    });
  }
  return dbPromise;
}

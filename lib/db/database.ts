import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import type { CapandreDB } from "./schema";
import { seedDatabase } from "./seed";

const DB_NAME = "capandre";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<CapandreDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<CapandreDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CapandreDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Clean up old v1 stores if they exist
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
      },
    }).then(async (db) => {
      await seedDatabase(db);
      return db;
    });
  }
  return dbPromise;
}

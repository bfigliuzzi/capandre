import type { IDBPDatabase } from "idb";
import type { CapandreDB, Module, Level } from "./schema";

const MODULES: Module[] = [
  { id: "mod-dictation", name: "Dictée", type: "dictation" },
  { id: "mod-poem", name: "Poésie", type: "poem" },
];

const LEVELS: Level[] = [
  {
    id: "lvl-dictation-discovery",
    moduleId: "mod-dictation",
    name: "Découverte",
    order: 1,
  },
  {
    id: "lvl-dictation-learning",
    moduleId: "mod-dictation",
    name: "Apprentissage",
    order: 2,
  },
  {
    id: "lvl-dictation-mastery",
    moduleId: "mod-dictation",
    name: "Maîtrise",
    order: 3,
  },
  {
    id: "lvl-poem-discovery",
    moduleId: "mod-poem",
    name: "Découverte",
    order: 1,
  },
  {
    id: "lvl-poem-learning",
    moduleId: "mod-poem",
    name: "Apprentissage",
    order: 2,
  },
  {
    id: "lvl-poem-mastery",
    moduleId: "mod-poem",
    name: "Maîtrise",
    order: 3,
  },
];

export async function seedDatabase(db: IDBPDatabase<CapandreDB>): Promise<void> {
  const existingModules = await db.count("modules");
  if (existingModules > 0) {
    return;
  }

  const tx = db.transaction(["modules", "levels"], "readwrite");

  const modulesStore = tx.objectStore("modules");
  for (const mod of MODULES) {
    await modulesStore.put(mod);
  }

  const levelsStore = tx.objectStore("levels");
  for (const level of LEVELS) {
    await levelsStore.put(level);
  }

  await tx.done;
}

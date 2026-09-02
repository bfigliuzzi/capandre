import type { IDBPDatabase } from "idb";
import type { CapandreDB, Module, Level } from "./schema";

const MODULES: Module[] = [
  { id: "mod-dictation", name: "Dictée", type: "dictation" },
  { id: "mod-poem", name: "Poésie", type: "poem" },
  {
    id: "mod-multiplication",
    name: "Tables de multiplication",
    type: "multiplication",
  },
];

// Aucun Level pour mod-multiplication : la difficulté d'une session
// (De base / Cadencé / Défi) est un paramètre de session, pas un contenu
// créé par le parent.

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

/**
 * Seed idempotent ENREGISTREMENT PAR ENREGISTREMENT.
 *
 * Un early-return sur `count("modules") > 0` empêcherait tout nouveau module
 * d'apparaître sur les installations existantes, quelle que soit la version de
 * la base. Ici chaque module et chaque niveau manquant est créé, sans jamais
 * écraser un enregistrement déjà présent.
 */
export async function seedDatabase(db: IDBPDatabase<CapandreDB>): Promise<void> {
  const tx = db.transaction(["modules", "levels"], "readwrite");

  const modulesStore = tx.objectStore("modules");
  for (const mod of MODULES) {
    const existing = await modulesStore.get(mod.id);
    if (!existing) {
      await modulesStore.put(mod);
    }
  }

  const levelsStore = tx.objectStore("levels");
  for (const level of LEVELS) {
    const existing = await levelsStore.get(level.id);
    if (!existing) {
      await levelsStore.put(level);
    }
  }

  await tx.done;
}

// Utilitaires de test (pas de « .test. » dans le nom : fichier non collecté).
import type { Rng } from "../types";

/** mulberry32 : générateur déterministe et rapide. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function constantRng(value: number): Rng {
  return () => value;
}

/** Parcourt les valeurs de façon cyclique. */
export function sequenceRng(values: number[]): Rng {
  let i = 0;
  return () => {
    const value = values[i % values.length];
    i += 1;
    return value;
  };
}

/** Gel profond, pour vérifier l'absence de mutation. */
export function freeze<T>(value: T): T {
  if (value && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      freeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

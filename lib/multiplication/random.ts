// Aléatoire injectable. `lib/exercise.ts` possède son propre shuffle non
// injectable (hors périmètre) : la duplication est assumée.
import type { Rng } from "./types";

/** Fisher-Yates ; ne mute jamais l'entrée. */
export function shuffleWithRng<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tirage pondéré. `r` doit appartenir à [0, 1).
 * Retourne -1 si la somme des poids est nulle (l'appelant relâche alors la
 * contrainte). Le clamp final protège des erreurs d'arrondi flottant quand
 * `r` tend vers 1.
 */
export function pickWeightedIndex(weights: readonly number[], r: number): number {
  let total = 0;
  let lastPositive = -1;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w > 0) {
      total += w;
      lastPositive = i;
    }
  }
  if (total <= 0) return -1;

  const threshold = r * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    if (w <= 0) continue;
    acc += w;
    if (threshold < acc) return i;
  }
  return lastPositive;
}

/** Entier aléatoire, bornes incluses. */
export function randomInt(min: number, max: number, rng: Rng = Math.random): number {
  if (max <= min) return min;
  return min + Math.floor(rng() * (max - min + 1));
}

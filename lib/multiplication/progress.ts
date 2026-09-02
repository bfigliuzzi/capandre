// Maîtrise des faits (Leitner simplifié) et étoiles par table.
import type { MultiplicationFactProgress } from "../db/schema";
import {
  FACT_MAX_LEVEL,
  STAR_MEAN_THRESHOLDS,
  STAR_THREE_MIN_LEVEL,
  TABLES,
} from "./constants";
import { factKey, factsForTable } from "./facts";
import type { Fact, ProgressMap, SessionSummary } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function defaultFactProgress(
  a: number,
  b: number,
  now: number = Date.now(),
): MultiplicationFactProgress {
  return {
    id: factKey(a, b),
    a,
    b,
    level: 0,
    attempts: 0,
    correct: 0,
    lastSeenAt: new Date(now).toISOString(),
    lastCorrectAt: null,
  };
}

export function toProgressMap(
  list: readonly MultiplicationFactProgress[],
): Map<string, MultiplicationFactProgress> {
  const map = new Map<string, MultiplicationFactProgress>();
  for (const record of list) {
    map.set(record.id, record);
  }
  return map;
}

/** Remplace les enregistrements mis à jour, conserve les autres, ajoute les nouveaux. */
export function mergeProgress(
  base: readonly MultiplicationFactProgress[],
  updates: readonly MultiplicationFactProgress[],
): MultiplicationFactProgress[] {
  const map = toProgressMap(base);
  for (const record of updates) {
    map.set(record.id, record);
  }
  return [...map.values()];
}

function readMap(
  progress: readonly MultiplicationFactProgress[] | ProgressMap,
): ProgressMap {
  return Array.isArray(progress) ? toProgressMap(progress) : (progress as ProgressMap);
}

/**
 * Poids de tirage d'un fait, entier borné [1, 8].
 *
 * Un fait régulièrement raté (niveau 0 → 6) passe devant un fait jamais vu
 * (5) : c'est là que se joue l'apprentissage. Le poids reste toujours ≥ 1,
 * donc même un fait à 3 étoiles réapparaît de temps en temps.
 */
export function factWeight(fact: Fact, progress: ProgressMap): number {
  const record = progress.get(factKey(fact.a, fact.b));
  let w = record ? 1 + (FACT_MAX_LEVEL - record.level) : 5;

  // Bonus de difficulté réelle.
  if (fact.a >= 6 && fact.b >= 6) w += 1;
  // Malus de trivialité.
  if (fact.a === 1 || fact.b === 1 || fact.a === 10 || fact.b === 10) w -= 1;

  return clamp(w, 1, 8);
}

/**
 * Applique les résultats d'une session à la maîtrise des faits.
 * Retourne UNIQUEMENT les enregistrements créés ou modifiés ; l'entrée
 * n'est jamais mutée.
 *
 * Le parcours est chronologique, reprises incluses. Deux propriétés en
 * découlent gratuitement :
 *  - une erreur suivie d'une reprise réussie donne un delta net de 0
 *    (« pas encore acquis, mais tu n'as rien perdu ») ;
 *  - un fait posé une seule fois ne saute jamais de 0 à 2.
 *
 * Le temps écoulé en mode Défi ne fait PAS baisser le niveau : échouer à
 * être rapide en 4 s n'efface pas une maîtrise réelle.
 */
export function updateProgress(
  progress: readonly MultiplicationFactProgress[],
  summary: SessionSummary,
  options?: { now?: number },
): MultiplicationFactProgress[] {
  const now = options?.now ?? Date.now();
  const seenAt = summary.completedAt ?? new Date(now).toISOString();
  const map = toProgressMap(progress);
  const touched = new Map<string, MultiplicationFactProgress>();
  const isChallenge = summary.config.difficulty === "challenge";

  for (const outcome of summary.outcomes) {
    const key = outcome.factKey;
    const previous = touched.get(key) ?? map.get(key);
    const fact = previous
      ? { a: previous.a, b: previous.b }
      : parseKeyLoose(key);
    const base = previous ?? defaultFactProgress(fact.a, fact.b, now);

    const next: MultiplicationFactProgress = {
      ...base,
      attempts: base.attempts + 1,
      lastSeenAt: seenAt,
    };

    if (outcome.status === "correct") {
      next.correct = base.correct + 1;
      next.level = Math.min(FACT_MAX_LEVEL, base.level + 1);
      next.lastCorrectAt = seenAt;
    } else if (outcome.status === "incorrect") {
      next.level = Math.max(0, base.level - 1);
    } else if (!isChallenge) {
      next.level = Math.max(0, base.level - 1);
    }

    touched.set(key, next);
  }

  return [...touched.values()];
}

function parseKeyLoose(key: string): Fact {
  const [a, b] = key.split("-");
  return { a: Number(a), b: Number(b) };
}

/**
 * Étoiles de maîtrise d'une table (0 à 3).
 *
 * Garde-fou 3 étoiles : un point faible ne peut pas se cacher derrière une
 * bonne moyenne. Plafond découverte : pas plus d'1 étoile tant que les 10
 * faits n'ont pas été rencontrés au moins une fois.
 */
export function computeTableStars(
  progress: readonly MultiplicationFactProgress[] | ProgressMap,
  table: number,
): number {
  const map = readMap(progress);
  const facts = factsForTable(table);
  if (facts.length === 0) return 0;

  const levels = facts.map((f) => map.get(factKey(f.a, f.b))?.level ?? 0);
  const allSeen = facts.every((f) => map.has(factKey(f.a, f.b)));
  const mean = levels.reduce((sum, l) => sum + l, 0) / facts.length;
  const min = Math.min(...levels);

  let stars =
    mean >= STAR_MEAN_THRESHOLDS[2]
      ? 3
      : mean >= STAR_MEAN_THRESHOLDS[1]
        ? 2
        : mean >= STAR_MEAN_THRESHOLDS[0]
          ? 1
          : 0;

  if (stars === 3 && min < STAR_THREE_MIN_LEVEL) stars = 2;
  if (!allSeen) stars = Math.min(stars, 1);

  return stars;
}

export function computeAllTableStars(
  progress: readonly MultiplicationFactProgress[],
): Record<string, number> {
  const map = toProgressMap(progress);
  const result: Record<string, number> = {};
  for (const table of TABLES) {
    result[String(table)] = computeTableStars(map, table);
  }
  return result;
}

/** Ne retourne que les tables dont la valeur change (dans les deux sens). */
export function computeStarsDelta(
  before: Record<string, number>,
  after: Record<string, number>,
): { table: number; from: number; to: number }[] {
  const deltas: { table: number; from: number; to: number }[] = [];
  for (const table of TABLES) {
    const key = String(table);
    const from = before[key] ?? 0;
    const to = after[key] ?? 0;
    if (from !== to) deltas.push({ table, from, to });
  }
  return deltas;
}

export function isTableMastered(
  progress: readonly MultiplicationFactProgress[],
  table: number,
): boolean {
  return computeTableStars(progress, table) === 3;
}

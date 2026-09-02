// Constantes du moteur « Tables de multiplication ».
import type { Difficulty, SessionLength } from "./types";

export const TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export const MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const SESSION_LENGTHS = [10, 20, 30] as const;
export const DEFAULT_SESSION_LENGTH: SessionLength = 10;

/**
 * Limite de temps par question. `null` = aucune contrainte temporelle.
 * Le mode « De base » est le chemin sans minuteur (WCAG 2.2.1) et reste
 * toujours proposé, par défaut.
 */
export const TIME_LIMITS_MS: Record<Difficulty, number | null> = {
  basic: null,
  paced: 7000,
  challenge: 4000,
};

export const DIFFICULTIES = ["basic", "paced", "challenge"] as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  basic: "De base",
  paced: "Cadencé",
  challenge: "Défi",
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  basic: "Prends tout le temps qu'il te faut",
  paced: "7 secondes par question",
  challenge: "4 secondes par question",
};

/** Part de questions à facteur manquant. Moins en Défi : lire l'énoncé prend du temps. */
export const MISSING_FACTOR_SHARE: Record<Difficulty, number> = {
  basic: 0.3,
  paced: 0.3,
  challenge: 0.2,
};

/** Les 3 premières questions sont toujours du type `product` (mise en confiance). */
export const MISSING_FACTOR_START_INDEX = 3;

/** Plafond dur du nombre de questions : ceil(length × 1,5). */
export const MAX_QUESTION_FACTOR = 1.5;

export const RETRY_MIN_GAP = 3;
export const RETRY_MAX_GAP = 5;
export const MAX_RETRY_DEPTH = 2;

export const FACT_MAX_LEVEL = 5;

/** Moyennes de niveau ouvrant 1, 2 puis 3 étoiles. */
export const STAR_MEAN_THRESHOLDS = [2, 3.5, 4.5] as const;
/** Niveau minimal de CHAQUE fait pour prétendre à 3 étoiles. */
export const STAR_THREE_MIN_LEVEL = 3;

export const MAX_FACTS_TO_REVISIT = 8;

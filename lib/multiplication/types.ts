// Types du moteur « Tables de multiplication ».
// Imports RELATIFS uniquement : il n'existe pas de vitest.config dans le
// dépôt, donc l'alias "@/" n'est pas résolu pendant les tests.
import type {
  MultiplicationDifficulty,
  MultiplicationFactProgress,
  MultiplicationSessionConfig,
  MultiplicationSessionLength,
} from "../db/schema";

export type Difficulty = MultiplicationDifficulty;

/** Générateur pseudo-aléatoire injectable : renvoie un nombre dans [0, 1). */
export type Rng = () => number;

export interface Fact {
  a: number;
  b: number;
}

/**
 * product      : a × b = ?   → réponse a*b
 * missingRight : a × ? = c   → réponse b   (facteur visible : a)
 * missingLeft  : ? × b = c   → réponse a   (facteur visible : b)
 */
export type QuestionKind = "product" | "missingRight" | "missingLeft";

export type SessionLength = MultiplicationSessionLength;

export type SessionConfig = MultiplicationSessionConfig;

export interface Question {
  /** "q0".."q9" pour les créneaux initiaux, "r10", "r11"… pour les reprises. */
  id: string;
  fact: Fact;
  kind: QuestionKind;
  /** a × b, précalculé. */
  product: number;
  /** Réponse attendue selon `kind`. */
  answer: number;
  isRetry: boolean;
  /** Identifiant de la question rejouée, sinon null. */
  retryOf: string | null;
  /** 0 = originale, 1 = première reprise, 2 = seconde reprise. */
  retryDepth: number;
}

export type AnswerInput =
  | { type: "answer"; value: number }
  | { type: "timeout" };

export type AnswerStatus = "correct" | "incorrect" | "timeout";

export interface AnswerOutcome {
  questionId: string;
  factKey: string;
  kind: QuestionKind;
  status: AnswerStatus;
  given: number | null;
  expected: number;
  isRetry: boolean;
  streakAfter: number;
  /** Français, neutre ou encourageant — jamais punitif. */
  message: string;
  /** Message de palier de série, sinon null. */
  celebration: string | null;
}

export interface SessionState {
  config: SessionConfig;
  /** Liste ordonnée ; peut GRANDIR (reprises), bornée par `maxQuestions`. */
  queue: Question[];
  /** Curseur sur la question courante. */
  index: number;
  outcomes: AnswerOutcome[];
  streak: number;
  bestStreak: number;
  /** Plafond dur : ceil(length × 1,5). */
  maxQuestions: number;
  /** ms epoch, injecté (jamais Date.now() implicite en test). */
  startedAt: number;
  finishedAt: number | null;
}

export interface FactSummary {
  key: string;
  a: number;
  b: number;
  product: number;
  /** "7 × 8 = 56" */
  label: string;
  missCount: number;
}

export interface SessionSummary {
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
  config: SessionConfig;
  /** config.length : nombre de faits nouveaux prévus. */
  nominalCount: number;
  askedCount: number;
  correctCount: number;
  firstTryCorrectCount: number;
  timeoutCount: number;
  bestStreak: number;
  isPerfect: boolean;
  factsToRevisit: FactSummary[];
  outcomes: AnswerOutcome[];
  /** Phrase de conclusion, toujours positive. */
  encouragement: string;
}

/** Reconstruit à la demande : jamais stocké dans un état sérialisable. */
export type ProgressMap = ReadonlyMap<string, MultiplicationFactProgress>;

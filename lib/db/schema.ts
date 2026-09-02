import type { DBSchema } from "idb";

// --- Domain entities ---

export type ModuleType = "dictation" | "poem" | "multiplication";

export interface Module {
  id: string;
  name: string;
  type: ModuleType;
}

export interface Level {
  id: string;
  moduleId: string;
  name: string;
  order: number;
}

export interface Word {
  id: string;
  text: string;
  order: number;
}

export type DictationMode = "words" | "text";

export interface Dictation {
  id: string;
  moduleId: string;
  title: string;
  mode: DictationMode;
  words: Word[];
  originalText?: string;
  createdAt: string; // ISO 8601
}

export interface Verse {
  id: string;
  text: string;
  order: number;
}

export interface Stanza {
  id: string;
  order: number;
  verses: Verse[];
}

export interface Poem {
  id: string;
  moduleId: string;
  title: string;
  author?: string;
  stanzas: Stanza[];
  createdAt: string; // ISO 8601
}

// --- Multiplication ---

/**
 * Clé d'un fait de multiplication : `${a}-${b}`, par exemple "7-8".
 * 7 × 8 et 8 × 7 sont deux faits DISTINCTS : la maîtrise se construit
 * séparément pour chaque sens, comme l'enfant les récite.
 */
export type MultiplicationFactKey = string;

export type MultiplicationDifficulty = "basic" | "paced" | "challenge";

export type MultiplicationSessionLength = 10 | 20 | 30;

/** Réglages d'une session d'exercice (paramètre de session, pas une entité Level). */
export interface MultiplicationSessionConfig {
  tables: number[];
  difficulty: MultiplicationDifficulty;
  length: MultiplicationSessionLength;
}

/** Maîtrise d'un fait, modèle de Leitner simplifié (boîtes 0 à 5). */
export interface MultiplicationFactProgress {
  id: MultiplicationFactKey; // "7-8"
  a: number; // table, 1..10
  b: number; // multiplicateur, 1..10
  level: number; // boîte Leitner 0..5
  attempts: number;
  correct: number;
  lastSeenAt: string; // ISO 8601
  lastCorrectAt: string | null; // ISO 8601
}

export interface MultiplicationSessionRecord {
  id: string;
  startedAt: string; // ISO 8601
  completedAt: string; // ISO 8601
  tables: number[];
  difficulty: MultiplicationDifficulty;
  requestedLength: number; // 10 | 20 | 30
  askedCount: number; // peut dépasser requestedLength (reprises)
  correctCount: number;
  firstTryCorrectCount: number;
  timeoutCount: number;
  bestStreak: number;
  factsToRevisit: MultiplicationFactKey[];
  starsByTable: Record<string, number>; // "1".."10" → 0..3, instantané après session
  newBadgeIds: string[];
}

export interface UnlockedBadge {
  id: string; // = BadgeDefinition.id
  unlockedAt: string; // ISO 8601
  sessionId: string | null;
}

/** Réglages appareil, enregistrement unique id = "app". Aucun localStorage dans le projet. */
export interface AppSettings {
  id: string; // "app"
  soundEnabled: boolean;
  lastSessionConfig: MultiplicationSessionConfig | null;
}

// --- IndexedDB schema for idb ---

export interface CapandreDB extends DBSchema {
  modules: {
    key: string;
    value: Module;
  };
  levels: {
    key: string;
    value: Level;
    indexes: { "by-module": string };
  };
  dictations: {
    key: string;
    value: Dictation;
    indexes: { "by-module": string };
  };
  poems: {
    key: string;
    value: Poem;
    indexes: { "by-module": string };
  };
  multiplicationFacts: {
    key: string;
    value: MultiplicationFactProgress;
    indexes: { "by-table": number };
  };
  multiplicationSessions: {
    key: string;
    value: MultiplicationSessionRecord;
    indexes: { "by-date": string; "by-difficulty": string };
  };
  multiplicationBadges: {
    key: string;
    value: UnlockedBadge;
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

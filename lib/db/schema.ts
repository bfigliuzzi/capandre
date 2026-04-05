import type { DBSchema } from "idb";

// --- Domain entities ---

export interface Module {
  id: string;
  name: string;
  type: "dictation" | "poem";
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
}

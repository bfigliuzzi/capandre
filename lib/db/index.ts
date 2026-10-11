export type {
  Module,
  ModuleType,
  Level,
  Word,
  DictationMode,
  Dictation,
  Verse,
  Stanza,
  Poem,
  MultiplicationFactKey,
  MultiplicationDifficulty,
  MultiplicationSessionLength,
  MultiplicationSessionConfig,
  MultiplicationFactProgress,
  MultiplicationSessionRecord,
  UnlockedBadge,
  AppSettings,
  CapandreDB,
} from "./schema";

export { closeDB, getDB } from "./database";

export {
  getAll,
  getAllByIndex,
  getById,
  create,
  update,
  remove,
} from "./operations";

export { seedDatabase } from "./seed";

export {
  useDB,
  useModules,
  useLevels,
  useDictations,
  usePoems,
  useHasContent,
  useDictation,
  usePoem,
  useDictationMutations,
  usePoemMutations,
} from "./hooks";

export {
  getFactProgress,
  getRecentSessions,
  getUnlockedBadges,
  getSettings,
  putSettings,
  recordSession,
} from "./multiplication-operations";
export type { RecordSessionResult } from "./multiplication-operations";

export {
  useMultiplicationProgress,
  useMultiplicationSessions,
  useUnlockedBadges,
  useMultiplicationMutations,
  useSettings,
} from "./multiplication-hooks";

export { installDictionary, installedDictionaryVersion, loadDictionary } from "./dictionary-operations";
export { DICTIONARY_URL, useDictionary } from "./dictionary-hooks";
export type { DictionaryState, UseDictionaryResult } from "./dictionary-hooks";

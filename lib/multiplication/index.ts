// API publique du moteur « Tables de multiplication ».
//
// ATTENTION : aucun fichier de ce dossier n'utilise l'alias "@/" — il
// n'existe pas de vitest.config dans le dépôt, donc l'alias n'est pas résolu
// pendant les tests. Imports relatifs uniquement ici ; les composants
// (components/, app/, hooks/) utilisent "@/" normalement.

export type {
  AnswerInput,
  AnswerOutcome,
  AnswerStatus,
  Difficulty,
  Fact,
  FactSummary,
  ProgressMap,
  Question,
  QuestionKind,
  Rng,
  SessionConfig,
  SessionLength,
  SessionState,
  SessionSummary,
} from "./types";

export {
  DEFAULT_SESSION_LENGTH,
  DIFFICULTIES,
  DIFFICULTY_DESCRIPTIONS,
  DIFFICULTY_LABELS,
  FACT_MAX_LEVEL,
  MAX_FACTS_TO_REVISIT,
  MAX_QUESTION_FACTOR,
  MAX_RETRY_DEPTH,
  MISSING_FACTOR_SHARE,
  MISSING_FACTOR_START_INDEX,
  MULTIPLIERS,
  RETRY_MAX_GAP,
  RETRY_MIN_GAP,
  SESSION_LENGTHS,
  STAR_MEAN_THRESHOLDS,
  STAR_THREE_MIN_LEVEL,
  TABLES,
  TIME_LIMITS_MS,
} from "./constants";

export { pickWeightedIndex, randomInt, shuffleWithRng } from "./random";

export {
  buildFacts,
  buildTable,
  factKey,
  factsForTable,
  formatFact,
  formatFactLine,
  parseFactKey,
} from "./facts";

export {
  computeAllTableStars,
  computeStarsDelta,
  computeTableStars,
  defaultFactProgress,
  factWeight,
  isTableMastered,
  mergeProgress,
  toProgressMap,
  updateProgress,
} from "./progress";

export {
  CORRECT_MESSAGES,
  RETRY_INTRO_MESSAGES,
  STREAK_MESSAGES,
  STREAK_THRESHOLDS,
  SUMMARY_MESSAGES,
  TIMEOUT_INTRO_MESSAGES,
  correctionMessage,
  pickMessage,
  starsMessage,
  streakMessage,
  summaryMessage,
  timeoutMessage,
} from "./messages";

export {
  answerQuestion,
  computeSummary,
  currentQuestion,
  formatQuestion,
  generateSession,
  isSessionFinished,
  progressRatio,
  questionParts,
  resolveMissingKind,
  scheduleRetry,
  timeLimitMs,
  toSessionRecord,
} from "./session";

export type { BadgeContext, BadgeDefinition, BadgeIconName } from "./badges";
export { BADGES, evaluateBadges, getBadge } from "./badges";

export type {
  QuitAction,
  SessionAction,
  SessionKeyAction,
  SessionUiState,
  UiPhase,
} from "./session-ui";
export {
  FEEDBACK_CORRECT_MS,
  FEEDBACK_WRONG_MS,
  MAX_INPUT_LENGTH,
  STREAK_ANNOUNCE_FROM,
  STREAK_MIN_DISPLAY,
  initSessionUiState,
  mapKeyToAction,
  sessionUiReducer,
} from "./session-ui";

export { DEFAULT_CONFIG, encodeSessionConfig, parseSessionConfig } from "./config-params";

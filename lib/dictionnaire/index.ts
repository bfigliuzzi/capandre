// API publique du module « Dictionnaire ».
// Imports relatifs uniquement ici, comme dans lib/multiplication/.

export type {
  Answer,
  Article,
  ArticleField,
  ArticleRef,
  ChoiceFields,
  DictionaryFile,
  DictionaryPage,
  Gender,
  Nature,
  Outcome,
  Question,
  Rng,
  Sense,
  Skill,
} from "./types";

export {
  ARTICLES_PAR_PAGE,
  CHOICES_PER_QUESTION,
  COMMON_NATURES,
  DICTIONARY_DATA_VERSION,
  GENDER_ABBREVIATIONS,
  LETTERS,
  NATURE_ABBREVIATIONS,
  NATURE_ORDER,
  QUESTIONS_PAR_ENTRAINEMENT,
  SKILLS,
  SKILL_LABELS,
  STAR_THRESHOLDS,
} from "./constants";

export { compareArticles, compareHeadwords } from "./collation";
export { paginate } from "./pagination";

export type { GoToPageResult } from "./navigation";
export {
  firstPageOfLetter,
  letterOf,
  lettersWithArticles,
  pageOfHeadword,
  parseGoToPage,
  spreadOf,
  turnPage,
} from "./navigation";

export type { NatureLabel } from "./format";
export { natureLabel, pageAnnouncement, pageTitle } from "./format";

export type { GeneratorContext } from "./questions";
export { eligibleCounts, generateQuestion, hasQuizSenses } from "./questions";

export { checkAnswer, createTraining, starsFor } from "./training";

export type { TrainingAction, TrainingPhase, TrainingUiState } from "./training-ui";
export {
  currentQuestion,
  initTrainingUiState,
  needsSearch,
  trainingScore,
  trainingUiReducer,
} from "./training-ui";

export type { ValidationResult } from "./validate";
export { validateDictionaryFile } from "./validate";

export { SKILLS_PARAM, encodeSkills, parseSkills } from "./skills-param";

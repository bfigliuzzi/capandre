// Réducteur PUR de l'écran d'entraînement, comme lib/multiplication/session-ui.ts.
//
// Une question passe par « chercher » (si elle demande de trouver un article),
// « répondre », puis « correction ». Les gardes de phase rendent les actions
// hors phase sans effet (un double « valider » ne corrige pas deux fois).
import { checkAnswer } from "./training";
import type { Outcome, Question } from "./types";

export type TrainingPhase = "chercher" | "repondre" | "correction" | "fin";

export interface TrainingUiState {
  readonly questions: readonly Question[];
  readonly index: number;
  readonly phase: TrainingPhase;
  /** Page ouverte pendant « chercher » : 0 pour la couverture. */
  readonly page: number;
  /** Affiché à l'enfant, sans effet sur la note (R17). */
  readonly pagesTurned: number;
  /** « Ce n'est pas renard, continue à chercher. » */
  readonly hint: string | null;
  /** « Je n'y arrive pas » pendant la recherche : la question comptera faux. */
  readonly gaveUp: boolean;
  /** Ranger : ordre courant des mots. */
  readonly order: readonly string[];
  /** Question à choix : proposition sélectionnée. */
  readonly selected: number | null;
  readonly outcome: Outcome | null;
  readonly results: readonly boolean[];
}

export type TrainingAction =
  | { readonly type: "tourner"; readonly page: number }
  | { readonly type: "toucher-article"; readonly headword: string }
  | { readonly type: "abandonner" }
  | { readonly type: "deplacer"; readonly from: number; readonly to: number }
  | { readonly type: "choisir"; readonly index: number }
  | { readonly type: "valider" }
  | { readonly type: "suivant" };

export function needsSearch(question: Question): question is Extract<Question, { headword: string }> {
  return "headword" in question;
}

function startQuestion(state: TrainingUiState, index: number): TrainingUiState {
  const question = state.questions[index];
  return {
    ...state,
    index,
    phase: needsSearch(question) ? "chercher" : "repondre",
    page: 0,
    pagesTurned: 0,
    hint: null,
    gaveUp: false,
    order: question.skill === "ranger" ? question.shuffled : [],
    selected: null,
    outcome: null,
  };
}

export function initTrainingUiState(questions: readonly Question[]): TrainingUiState {
  const empty: TrainingUiState = {
    questions,
    index: 0,
    phase: "fin",
    page: 0,
    pagesTurned: 0,
    hint: null,
    gaveUp: false,
    order: [],
    selected: null,
    outcome: null,
    results: [],
  };
  return questions.length === 0 ? empty : startQuestion(empty, 0);
}

export function currentQuestion(state: TrainingUiState): Question | null {
  return state.questions[state.index] ?? null;
}

export function trainingScore(state: TrainingUiState): number {
  return state.results.filter(Boolean).length;
}

function correct(state: TrainingUiState, outcome: Outcome): TrainingUiState {
  return { ...state, phase: "correction", outcome, results: [...state.results, outcome.correct] };
}

/** Après « Je n'y arrive pas », une bonne réponse ne compte pas, mais on le dit sans punir. */
function afterHelp(outcome: Outcome): Outcome {
  if (!outcome.correct) return outcome;
  return { correct: false, message: "Bonne réponse ! Le mot a été trouvé avec de l'aide : elle ne compte pas." };
}

function touchArticle(state: TrainingUiState, question: Question, headword: string): TrainingUiState {
  if (!needsSearch(question)) return state;
  if (headword !== question.headword) {
    return { ...state, hint: `Ce n'est pas « ${question.headword} », continue à chercher.` };
  }
  if (question.skill === "chercher") return correct(state, checkAnswer(question, { kind: "article", headword }));
  return { ...state, phase: "repondre", hint: null };
}

function giveUp(state: TrainingUiState, question: Question): TrainingUiState {
  if (!needsSearch(question)) return state;
  if (question.skill === "chercher") {
    return { ...correct(state, checkAnswer(question, { kind: "abandon" })), page: question.target.page };
  }
  return { ...state, phase: "repondre", gaveUp: true, hint: null, page: question.target.page };
}

function moveWord(order: readonly string[], from: number, to: number): readonly string[] {
  if (from < 0 || from >= order.length || to < 0 || to >= order.length) return order;
  const next = [...order];
  const [word] = next.splice(from, 1);
  next.splice(to, 0, word);
  return next;
}

function submit(state: TrainingUiState, question: Question): TrainingUiState {
  if (question.skill === "ranger") return correct(state, checkAnswer(question, { kind: "ordre", words: state.order }));
  if (state.selected === null) return state;
  const outcome = checkAnswer(question, { kind: "choix", index: state.selected });
  return correct(state, state.gaveUp ? afterHelp(outcome) : outcome);
}

export function trainingUiReducer(state: TrainingUiState, action: TrainingAction): TrainingUiState {
  const question = currentQuestion(state);
  if (!question) return state;
  switch (action.type) {
    case "tourner":
      if (state.phase !== "chercher" || action.page === state.page) return state;
      return { ...state, page: action.page, pagesTurned: state.pagesTurned + 1 };
    case "toucher-article":
      return state.phase === "chercher" ? touchArticle(state, question, action.headword) : state;
    case "abandonner":
      return state.phase === "chercher" ? giveUp(state, question) : state;
    case "deplacer":
      return state.phase === "repondre" ? { ...state, order: moveWord(state.order, action.from, action.to) } : state;
    case "choisir":
      return state.phase === "repondre" ? { ...state, selected: action.index } : state;
    case "valider":
      return state.phase === "repondre" ? submit(state, question) : state;
    case "suivant":
      if (state.phase !== "correction") return state;
      if (state.index + 1 >= state.questions.length) return { ...state, phase: "fin" };
      return startQuestion(state, state.index + 1);
    default:
      return state;
  }
}

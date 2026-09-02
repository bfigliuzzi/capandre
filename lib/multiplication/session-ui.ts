// Reducer PUR de l'écran de session, plus la table de correspondance clavier.
//
// Toute action porte son `now` : aucun `Date.now()` ni `Math.random()` dans le
// reducer, ce qui le rend testable et sûr en StrictMode. Les gardes de phase
// rendent les actions idempotentes hors phase (un `timeout` en retard ou un
// double `advance` sont des no-op) — cela élimine la classe de bugs
// « double avancement ».
import { answerQuestion, isSessionFinished } from "./session";
import type { AnswerOutcome, Rng, SessionState } from "./types";

/** La plus grande réponse possible est 100. */
export const MAX_INPUT_LENGTH = 3;
/** Flash bref puis enchaînement. */
export const FEEDBACK_CORRECT_MS = 700;
/** Temps de lire la bonne réponse. */
export const FEEDBACK_WRONG_MS = 1900;
/** Série affichée à partir de 2. */
export const STREAK_MIN_DISPLAY = 2;
/** Série annoncée au lecteur d'écran à partir de 3. */
export const STREAK_ANNOUNCE_FROM = 3;

export type UiPhase = "running" | "feedback" | "summary";

export interface SessionUiState {
  engine: SessionState;
  phase: UiPhase;
  /** Saisie en cours : "" | "7" | "56"… */
  input: string;
  feedback: AnswerOutcome | null;
  questionStartedAt: number;
  /** Incrémenté à chaque « Rejouer ». */
  runId: number;
}

export type SessionAction =
  | { type: "digit"; digit: number; now: number }
  | { type: "erase"; now: number }
  | { type: "clear"; now: number }
  | { type: "submit"; now: number; rng?: Rng }
  | { type: "timeout"; now: number; rng?: Rng }
  | { type: "advance"; now: number }
  | { type: "restart"; engine: SessionState; now: number };

/** Action spéciale interceptée par le composant : le reducer ne la traite pas. */
export interface QuitAction {
  type: "quit";
}

export type SessionKeyAction = SessionAction | QuitAction;

export function initSessionUiState(
  engine: SessionState,
  options: { runId?: number; now: number },
): SessionUiState {
  return {
    engine,
    phase: "running",
    input: "",
    feedback: null,
    questionStartedAt: options.now,
    runId: options.runId ?? 0,
  };
}

function answerWith(
  state: SessionUiState,
  input: { type: "answer"; value: number } | { type: "timeout" },
  now: number,
  rng: Rng | undefined,
): SessionUiState {
  const { state: engine, outcome } = answerQuestion(state.engine, input, {
    rng: rng ?? Math.random,
    now,
  });
  // `input` est CONSERVÉ : la réponse tapée reste visible dans l'équation
  // pendant le feedback.
  return { ...state, engine, phase: "feedback", feedback: outcome };
}

export function sessionUiReducer(
  state: SessionUiState,
  action: SessionAction,
): SessionUiState {
  switch (action.type) {
    case "digit": {
      if (state.phase !== "running") return state;
      if (!Number.isInteger(action.digit) || action.digit < 0 || action.digit > 9) {
        return state;
      }
      if (state.input.length >= MAX_INPUT_LENGTH) return state;
      // Aucune réponse valide ne commence par 0.
      if (state.input === "" && action.digit === 0) return state;
      return { ...state, input: state.input + String(action.digit) };
    }

    case "erase": {
      if (state.phase !== "running") return state;
      if (state.input === "") return state;
      return { ...state, input: state.input.slice(0, -1) };
    }

    case "clear": {
      if (state.phase !== "running") return state;
      if (state.input === "") return state;
      return { ...state, input: "" };
    }

    case "submit": {
      // Pas d'auto-validation : la validation est toujours explicite.
      if (state.phase !== "running") return state;
      if (state.input === "") return state;
      return answerWith(
        state,
        { type: "answer", value: Number(state.input) },
        action.now,
        action.rng,
      );
    }

    case "timeout": {
      if (state.phase !== "running") return state;
      // Bienveillance : une réponse tapée au moment où le temps expire est
      // évaluée normalement, et créditée si elle est juste.
      const input =
        state.input === ""
          ? ({ type: "timeout" } as const)
          : ({ type: "answer", value: Number(state.input) } as const);
      return answerWith(state, input, action.now, action.rng);
    }

    case "advance": {
      if (state.phase !== "feedback") return state;
      if (isSessionFinished(state.engine)) {
        return { ...state, phase: "summary" };
      }
      return {
        ...state,
        phase: "running",
        input: "",
        feedback: null,
        questionStartedAt: action.now,
      };
    }

    case "restart": {
      return initSessionUiState(action.engine, {
        runId: state.runId + 1,
        now: action.now,
      });
    }

    default:
      return state;
  }
}

/**
 * Correspondance touche → action. Pure et testable.
 * Les chiffres du pavé numérique et de la rangée principale donnent la même
 * valeur dans `KeyboardEvent.key`.
 */
export function mapKeyToAction(
  key: string,
  phase: UiPhase,
  now: number,
): SessionKeyAction | null {
  if (key === "Escape") return { type: "quit" };

  if (phase === "running") {
    if (/^[0-9]$/.test(key)) return { type: "digit", digit: Number(key), now };
    if (key === "Backspace") return { type: "erase", now };
    if (key === "Delete") return { type: "clear", now };
    if (key === "Enter" || key === " ") return { type: "submit", now };
    return null;
  }

  if (phase === "feedback") {
    if (key === "Enter" || key === " ") return { type: "advance", now };
    return null;
  }

  return null;
}

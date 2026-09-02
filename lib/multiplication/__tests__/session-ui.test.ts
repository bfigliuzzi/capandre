import { describe, it, expect } from "vitest";
import { generateSession, isSessionFinished } from "../session";
import {
  FEEDBACK_CORRECT_MS,
  FEEDBACK_WRONG_MS,
  MAX_INPUT_LENGTH,
  STREAK_ANNOUNCE_FROM,
  STREAK_MIN_DISPLAY,
  initSessionUiState,
  mapKeyToAction,
  sessionUiReducer,
} from "../session-ui";
import type { SessionAction, SessionUiState } from "../session-ui";
import type { SessionConfig, SessionState } from "../types";
import { seededRng } from "./test-rng";

const NOW = Date.UTC(2026, 0, 15, 10, 0, 0);
const RNG = () => 0.5;

const CONFIG: SessionConfig = {
  tables: [2, 3, 4, 5, 6, 7],
  difficulty: "paced",
  length: 10,
};

function engine(seed = 42, overrides: Partial<SessionConfig> = {}): SessionState {
  return generateSession({ ...CONFIG, ...overrides }, [], {
    rng: seededRng(seed),
    now: NOW,
  });
}

function init(seed = 42): SessionUiState {
  return initSessionUiState(engine(seed), { now: NOW });
}

function run(state: SessionUiState, actions: SessionAction[]): SessionUiState {
  return actions.reduce(sessionUiReducer, state);
}

const digits = (state: SessionUiState, value: string): SessionUiState =>
  run(
    state,
    [...value].map((d) => ({ type: "digit" as const, digit: Number(d), now: NOW })),
  );

describe("initSessionUiState", () => {
  it("démarre en phase running, sans saisie ni feedback", () => {
    const state = init();
    expect(state).toMatchObject({
      phase: "running",
      input: "",
      feedback: null,
      questionStartedAt: NOW,
      runId: 0,
    });
  });

  it("accepte un runId explicite", () => {
    expect(initSessionUiState(engine(), { runId: 3, now: NOW }).runId).toBe(3);
  });
});

describe("constantes UI", () => {
  it("expose les valeurs attendues par l'écran de session", () => {
    expect(MAX_INPUT_LENGTH).toBe(3);
    expect(FEEDBACK_CORRECT_MS).toBe(700);
    expect(FEEDBACK_WRONG_MS).toBe(1900);
    expect(STREAK_MIN_DISPLAY).toBe(2);
    expect(STREAK_ANNOUNCE_FROM).toBe(3);
  });
});

describe("saisie", () => {
  it("empile les chiffres tapés", () => {
    expect(digits(init(), "56").input).toBe("56");
  });

  it("ignore un zéro en tête", () => {
    expect(digits(init(), "0").input).toBe("");
    expect(digits(init(), "07").input).toBe("7");
  });

  it("accepte un zéro qui n'est pas en tête", () => {
    expect(digits(init(), "100").input).toBe("100");
  });

  it("s'arrête à 3 chiffres", () => {
    expect(digits(init(), "1234").input).toBe("123");
  });

  it("ignore une valeur qui n'est pas un chiffre", () => {
    const state = init();
    expect(sessionUiReducer(state, { type: "digit", digit: 12, now: NOW })).toBe(state);
    expect(sessionUiReducer(state, { type: "digit", digit: -1, now: NOW })).toBe(state);
  });

  it("efface le dernier chiffre", () => {
    expect(run(digits(init(), "56"), [{ type: "erase", now: NOW }]).input).toBe("5");
  });

  it("vide la saisie", () => {
    expect(run(digits(init(), "56"), [{ type: "clear", now: NOW }]).input).toBe("");
  });

  it("effacer et vider sur une saisie vide sont des no-op", () => {
    const state = init();
    expect(sessionUiReducer(state, { type: "erase", now: NOW })).toBe(state);
    expect(sessionUiReducer(state, { type: "clear", now: NOW })).toBe(state);
  });
});

describe("submit", () => {
  it("est ignoré si la saisie est vide", () => {
    const state = init();
    expect(sessionUiReducer(state, { type: "submit", now: NOW, rng: RNG })).toBe(state);
  });

  it("passe en phase feedback et conserve la saisie", () => {
    const state = init();
    const answer = String(state.engine.queue[0].answer);
    const next = run(digits(state, answer), [{ type: "submit", now: NOW, rng: RNG }]);
    expect(next.phase).toBe("feedback");
    expect(next.feedback?.status).toBe("correct");
    expect(next.input).toBe(answer);
    expect(next.engine.index).toBe(1);
  });

  it("signale un écart sans vocabulaire punitif", () => {
    const state = init();
    const q = state.engine.queue[0];
    const next = run(digits(state, String(q.answer + 1)), [
      { type: "submit", now: NOW, rng: RNG },
    ]);
    expect(next.feedback?.status).toBe("incorrect");
    expect(next.feedback?.message).toContain(`${q.fact.a} × ${q.fact.b} = ${q.product}`);
  });

  it("est un no-op hors de la phase running", () => {
    const state = init();
    const feedbackState = run(digits(state, String(state.engine.queue[0].answer)), [
      { type: "submit", now: NOW, rng: RNG },
    ]);
    expect(
      sessionUiReducer(feedbackState, { type: "submit", now: NOW, rng: RNG }),
    ).toBe(feedbackState);
  });

  it("est déterministe avec un rng injecté", () => {
    const state = digits(init(), "999");
    const first = sessionUiReducer(state, { type: "submit", now: NOW, rng: seededRng(4) });
    const second = sessionUiReducer(state, { type: "submit", now: NOW, rng: seededRng(4) });
    expect(first).toEqual(second);
  });
});

describe("timeout", () => {
  it("évalue la saisie non vide comme une réponse et la crédite si elle est juste", () => {
    const state = init();
    const answer = String(state.engine.queue[0].answer);
    const next = run(digits(state, answer), [{ type: "timeout", now: NOW, rng: RNG }]);
    expect(next.feedback?.status).toBe("correct");
    expect(next.phase).toBe("feedback");
  });

  it("enregistre un temps écoulé quand la saisie est vide", () => {
    const next = sessionUiReducer(init(), { type: "timeout", now: NOW, rng: RNG });
    expect(next.feedback?.status).toBe("timeout");
    expect(next.feedback?.given).toBeNull();
  });

  it("est un no-op hors de la phase running (timeout en retard)", () => {
    const feedbackState = sessionUiReducer(init(), {
      type: "timeout",
      now: NOW,
      rng: RNG,
    });
    expect(
      sessionUiReducer(feedbackState, { type: "timeout", now: NOW, rng: RNG }),
    ).toBe(feedbackState);
  });
});

describe("advance", () => {
  it("revient en phase running et réinitialise la saisie", () => {
    const state = sessionUiReducer(init(), { type: "timeout", now: NOW, rng: RNG });
    const next = sessionUiReducer(state, { type: "advance", now: NOW + 2000 });
    expect(next.phase).toBe("running");
    expect(next.input).toBe("");
    expect(next.feedback).toBeNull();
    expect(next.questionStartedAt).toBe(NOW + 2000);
  });

  it("passe en phase summary quand la session est terminée", () => {
    let state = init();
    let guard = 0;
    while (state.phase !== "summary" && guard < 100) {
      if (state.phase === "running") {
        const answer = String(state.engine.queue[state.engine.index].answer);
        state = run(digits(state, answer), [{ type: "submit", now: NOW, rng: RNG }]);
      } else {
        state = sessionUiReducer(state, { type: "advance", now: NOW });
      }
      guard += 1;
    }
    expect(isSessionFinished(state.engine)).toBe(true);
    expect(state.phase).toBe("summary");
  });

  it("est un no-op hors de la phase feedback (double avancement)", () => {
    const state = init();
    expect(sessionUiReducer(state, { type: "advance", now: NOW })).toBe(state);
    const feedbackState = sessionUiReducer(state, { type: "timeout", now: NOW, rng: RNG });
    const advanced = sessionUiReducer(feedbackState, { type: "advance", now: NOW });
    expect(sessionUiReducer(advanced, { type: "advance", now: NOW })).toBe(advanced);
  });
});

describe("restart", () => {
  it("repart d'un état vierge en incrémentant runId", () => {
    const state = sessionUiReducer(init(), { type: "timeout", now: NOW, rng: RNG });
    const fresh = engine(7);
    const next = sessionUiReducer(state, {
      type: "restart",
      engine: fresh,
      now: NOW + 5000,
    });
    expect(next).toEqual({
      engine: fresh,
      phase: "running",
      input: "",
      feedback: null,
      questionStartedAt: NOW + 5000,
      runId: 1,
    });
  });

  it("fonctionne aussi depuis la phase summary", () => {
    const summaryState: SessionUiState = { ...init(), phase: "summary", runId: 4 };
    const next = sessionUiReducer(summaryState, {
      type: "restart",
      engine: engine(9),
      now: NOW,
    });
    expect(next.phase).toBe("running");
    expect(next.runId).toBe(5);
  });
});

describe("immuabilité", () => {
  it("ne mute jamais l'état passé", () => {
    const state = digits(init(), "56");
    const snapshot = JSON.stringify(state);
    sessionUiReducer(state, { type: "submit", now: NOW, rng: RNG });
    sessionUiReducer(state, { type: "erase", now: NOW });
    sessionUiReducer(state, { type: "advance", now: NOW });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe("mapKeyToAction", () => {
  it("transforme les chiffres en action digit en phase running", () => {
    expect(mapKeyToAction("7", "running", NOW)).toEqual({
      type: "digit",
      digit: 7,
      now: NOW,
    });
    expect(mapKeyToAction("0", "running", NOW)).toEqual({
      type: "digit",
      digit: 0,
      now: NOW,
    });
  });

  it("associe Backspace à erase et Delete à clear", () => {
    expect(mapKeyToAction("Backspace", "running", NOW)).toEqual({
      type: "erase",
      now: NOW,
    });
    expect(mapKeyToAction("Delete", "running", NOW)).toEqual({ type: "clear", now: NOW });
  });

  it("valide avec Entrée et Espace en phase running", () => {
    expect(mapKeyToAction("Enter", "running", NOW)).toEqual({ type: "submit", now: NOW });
    expect(mapKeyToAction(" ", "running", NOW)).toEqual({ type: "submit", now: NOW });
  });

  it("avance avec Entrée et Espace en phase feedback", () => {
    expect(mapKeyToAction("Enter", "feedback", NOW)).toEqual({
      type: "advance",
      now: NOW,
    });
    expect(mapKeyToAction(" ", "feedback", NOW)).toEqual({ type: "advance", now: NOW });
  });

  it("ignore les chiffres et l'effacement en phase feedback", () => {
    expect(mapKeyToAction("7", "feedback", NOW)).toBeNull();
    expect(mapKeyToAction("Backspace", "feedback", NOW)).toBeNull();
    expect(mapKeyToAction("Delete", "feedback", NOW)).toBeNull();
  });

  it("renvoie l'action spéciale quit sur Échap, dans toutes les phases", () => {
    for (const phase of ["running", "feedback", "summary"] as const) {
      expect(mapKeyToAction("Escape", phase, NOW)).toEqual({ type: "quit" });
    }
  });

  it("ignore toute autre touche", () => {
    for (const key of ["a", "ArrowLeft", "Tab", "F5", "+"]) {
      expect(mapKeyToAction(key, "running", NOW)).toBeNull();
    }
  });

  it("n'agit sur aucune touche en phase summary, hors Échap", () => {
    expect(mapKeyToAction("Enter", "summary", NOW)).toBeNull();
    expect(mapKeyToAction("7", "summary", NOW)).toBeNull();
  });
});

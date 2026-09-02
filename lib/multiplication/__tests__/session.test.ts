import { describe, it, expect } from "vitest";
import type { MultiplicationFactProgress } from "../../db/schema";
import { factKey } from "../facts";
import {
  answerQuestion,
  computeSummary,
  currentQuestion,
  generateSession,
  isSessionFinished,
  progressRatio,
  resolveMissingKind,
  scheduleRetry,
  timeLimitMs,
  toSessionRecord,
} from "../session";
import type {
  AnswerInput,
  Difficulty,
  Question,
  SessionConfig,
  SessionLength,
  SessionState,
} from "../types";
import { constantRng, freeze, seededRng } from "./test-rng";

const NOW = Date.UTC(2026, 0, 15, 10, 0, 0);

const NEGATIVE_WORDS =
  /\b(faux|fausse|erreurs?|mauvais(?:e|es)?|rat[ée]e?s?|perdus?|perdue|nul(?:le|s)?|[ée]chec)\b/i;

function config(
  overrides: Partial<SessionConfig> = {},
): SessionConfig {
  return { tables: [2, 3, 4, 7], difficulty: "basic", length: 10, ...overrides };
}

function record(
  a: number,
  b: number,
  level: number,
): MultiplicationFactProgress {
  return {
    id: factKey(a, b),
    a,
    b,
    level,
    attempts: 3,
    correct: level,
    lastSeenAt: new Date(NOW).toISOString(),
    lastCorrectAt: null,
  };
}

function build(
  overrides: Partial<SessionConfig> = {},
  progress: MultiplicationFactProgress[] = [],
  seed = 42,
): SessionState {
  return generateSession(config(overrides), progress, {
    rng: seededRng(seed),
    now: NOW,
  });
}

/** Répond à toute la session avec un rng déterministe. */
function playAll(
  state: SessionState,
  answerFor: (q: Question, step: number) => AnswerInput,
  seed = 7,
): SessionState {
  const rng = seededRng(seed);
  let current = state;
  let step = 0;
  let guard = 0;
  while (!isSessionFinished(current) && guard < 200) {
    const q = current.queue[current.index];
    current = answerQuestion(current, answerFor(q, step), { rng, now: NOW }).state;
    step += 1;
    guard += 1;
  }
  return current;
}

const correctAnswer = (q: Question): AnswerInput => ({
  type: "answer",
  value: q.answer,
});
const wrongAnswer = (q: Question): AnswerInput => ({
  type: "answer",
  value: q.answer + 1,
});

// ---------------------------------------------------------------------------
// generateSession
// ---------------------------------------------------------------------------

describe("generateSession", () => {
  it("génère exactement 10 questions par défaut", () => {
    expect(build().queue).toHaveLength(10);
  });

  it("génère 20 puis 30 questions selon la longueur demandée", () => {
    expect(build({ length: 20 }).queue).toHaveLength(20);
    expect(build({ length: 30 }).queue).toHaveLength(30);
  });

  it("retombe sur 10 pour une longueur invalide", () => {
    const state = build({ length: 17 as unknown as SessionLength });
    expect(state.queue).toHaveLength(10);
    expect(state.config.length).toBe(10);
  });

  it("n'utilise que les tables sélectionnées", () => {
    const state = build({ tables: [3, 9] });
    expect(state.queue.every((q) => q.fact.a === 3 || q.fact.a === 9)).toBe(true);
  });

  it("lève une erreur si aucune table n'est sélectionnée", () => {
    expect(() => build({ tables: [] })).toThrow(/Aucune table sélectionnée/);
    expect(() => build({ tables: [0, 42] })).toThrow(/Aucune table sélectionnée/);
  });

  it("est reproductible avec la même graine", () => {
    expect(build({}, [], 42)).toEqual(build({}, [], 42));
  });

  it("ne pose jamais deux fois le même fait consécutivement quand le pool est grand", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 30 }, [], seed);
      for (let i = 1; i < state.queue.length; i++) {
        expect(state.queue[i].fact).not.toEqual(state.queue[i - 1].fact);
      }
    }
  });

  it("autorise les répétitions avec une seule table sur 30 questions", () => {
    const state = build({ tables: [7], length: 30 });
    expect(state.queue).toHaveLength(30);
    expect(state.queue.every((q) => q.fact.a === 7)).toBe(true);
  });

  it("répartit les faits d'une table sur 30 questions", () => {
    const counts = new Map<string, number>();
    const state = build({ tables: [7], length: 30 }, [], 3);
    for (const q of state.queue) {
      const key = factKey(q.fact.a, q.fact.b);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(10);
    for (const count of counts.values()) {
      expect(count).toBeGreaterThanOrEqual(2);
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  it("les 3 premières questions sont toujours du type product", () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const difficulty of ["basic", "paced", "challenge"] as Difficulty[]) {
        const state = build({ difficulty, length: 20 }, [], seed);
        expect(state.queue.slice(0, 3).every((q) => q.kind === "product")).toBe(true);
      }
    }
  });

  it("pose 6 questions à facteur manquant sur 20 en mode Cadencé", () => {
    const state = build({ difficulty: "paced", length: 20 });
    expect(state.queue.filter((q) => q.kind !== "product")).toHaveLength(6);
  });

  it("pose 4 questions à facteur manquant sur 20 en mode Défi", () => {
    const state = build({ difficulty: "challenge", length: 20 });
    expect(state.queue.filter((q) => q.kind !== "product")).toHaveLength(4);
  });

  it("ne place pas deux facteurs manquants consécutifs sur une session de 20", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const state = build({ difficulty: "paced", length: 20 }, [], seed);
      for (let i = 1; i < state.queue.length; i++) {
        const both =
          state.queue[i].kind !== "product" && state.queue[i - 1].kind !== "product";
        expect(both).toBe(false);
      }
    }
  });

  it("ne cache jamais un facteur derrière un 1 visible", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const state = build(
        { tables: [1, 2, 5, 10], difficulty: "paced", length: 30 },
        [],
        seed,
      );
      for (const q of state.queue) {
        if (q.kind === "missingRight") expect(q.fact.a).not.toBe(1);
        if (q.kind === "missingLeft") expect(q.fact.b).not.toBe(1);
      }
    }
  });

  it("renseigne la réponse attendue selon le type", () => {
    const state = build({ difficulty: "paced", length: 30 });
    for (const q of state.queue) {
      if (q.kind === "product") expect(q.answer).toBe(q.fact.a * q.fact.b);
      if (q.kind === "missingRight") expect(q.answer).toBe(q.fact.b);
      if (q.kind === "missingLeft") expect(q.answer).toBe(q.fact.a);
      expect(q.product).toBe(q.fact.a * q.fact.b);
    }
  });

  it("privilégie les faits jamais vus", () => {
    // Table de 2 entièrement maîtrisée, table de 3 jamais vue.
    const progress = Array.from({ length: 10 }, (_, i) => record(2, i + 1, 5));
    let seenTwo = 0;
    let seenThree = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const state = build({ tables: [2, 3], length: 30 }, progress, seed);
      seenTwo += state.queue.filter((q) => q.fact.a === 2).length;
      seenThree += state.queue.filter((q) => q.fact.a === 3).length;
    }
    expect(seenThree).toBeGreaterThan(seenTwo);
  });

  it("privilégie les faits de niveau 0 sur les faits jamais vus", () => {
    // Table de 2 au niveau 0 (régulièrement retravaillée), table de 3 jamais vue.
    const progress = Array.from({ length: 10 }, (_, i) => record(2, i + 1, 0));
    let seenTwo = 0;
    let seenThree = 0;
    for (let seed = 1; seed <= 10; seed++) {
      const state = build({ tables: [2, 3], length: 30 }, progress, seed);
      seenTwo += state.queue.filter((q) => q.fact.a === 2).length;
      seenThree += state.queue.filter((q) => q.fact.a === 3).length;
    }
    expect(seenTwo).toBeGreaterThan(seenThree);
  });

  it("fait tout de même apparaître les faits maîtrisés", () => {
    const progress = Array.from({ length: 10 }, (_, i) => record(7, i + 1, 5));
    const state = build({ tables: [7], length: 30 }, progress, 9);
    expect(state.queue).toHaveLength(30);
    expect(new Set(state.queue.map((q) => factKey(q.fact.a, q.fact.b))).size).toBe(10);
  });

  it("calcule maxQuestions à 15 pour une session de 10 et 45 pour 30", () => {
    expect(build({ length: 10 }).maxQuestions).toBe(15);
    expect(build({ length: 30 }).maxQuestions).toBe(45);
  });

  it("attribue des identifiants de questions uniques", () => {
    const state = build({ length: 30 });
    expect(new Set(state.queue.map((q) => q.id)).size).toBe(30);
  });

  it("part d'un état vierge", () => {
    const state = build();
    expect(state).toMatchObject({
      index: 0,
      outcomes: [],
      streak: 0,
      bestStreak: 0,
      startedAt: NOW,
      finishedAt: null,
    });
  });
});

describe("resolveMissingKind", () => {
  it("retombe sur le produit pour 1 × 1", () => {
    expect(resolveMissingKind({ a: 1, b: 1 }, 0.2)).toBe("product");
    expect(resolveMissingKind({ a: 1, b: 1 }, 0.8)).toBe("product");
  });

  it("ne laisse jamais le facteur visible à 1", () => {
    expect(resolveMissingKind({ a: 1, b: 7 }, 0.2)).toBe("missingLeft");
    expect(resolveMissingKind({ a: 7, b: 1 }, 0.8)).toBe("missingRight");
  });
});

describe("accesseurs", () => {
  it("currentQuestion suit l'index et devient null à la fin", () => {
    const state = build();
    expect(currentQuestion(state)).toBe(state.queue[0]);
    const finished = playAll(state, correctAnswer);
    expect(currentQuestion(finished)).toBeNull();
  });

  it("progressRatio va de 0 à 1", () => {
    const state = build();
    expect(progressRatio(state)).toBe(0);
    expect(progressRatio(playAll(state, correctAnswer))).toBe(1);
  });

  it("timeLimitMs vaut null en mode De base, 7000 en Cadencé, 4000 en Défi", () => {
    expect(timeLimitMs(build({ difficulty: "basic" }))).toBeNull();
    expect(timeLimitMs(build({ difficulty: "paced" }))).toBe(7000);
    expect(timeLimitMs(build({ difficulty: "challenge" }))).toBe(4000);
  });
});

// ---------------------------------------------------------------------------
// answerQuestion
// ---------------------------------------------------------------------------

describe("answerQuestion", () => {
  it("valide une réponse exacte", () => {
    const state = build();
    const { outcome } = answerQuestion(
      state,
      { type: "answer", value: state.queue[0].answer },
      { rng: seededRng(1), now: NOW },
    );
    expect(outcome.status).toBe("correct");
    expect(outcome.given).toBe(state.queue[0].answer);
    expect(outcome.expected).toBe(state.queue[0].answer);
  });

  it("refuse une réponse voisine", () => {
    const state = build();
    const { outcome } = answerQuestion(
      state,
      { type: "answer", value: state.queue[0].answer - 2 },
      { rng: seededRng(1), now: NOW },
    );
    expect(outcome.status).toBe("incorrect");
  });

  it("refuse NaN", () => {
    const state = build();
    const { outcome } = answerQuestion(
      state,
      { type: "answer", value: Number("") + NaN },
      { rng: seededRng(1), now: NOW },
    );
    expect(outcome.status).toBe("incorrect");
  });

  it("refuse une réponse non entière", () => {
    const state = build();
    const { outcome } = answerQuestion(
      state,
      { type: "answer", value: state.queue[0].answer + 0.5 },
      { rng: seededRng(1), now: NOW },
    );
    expect(outcome.status).toBe("incorrect");
  });

  it("accepte la réponse d'une question à facteur manquant", () => {
    const state = build({ difficulty: "paced", length: 20 });
    const index = state.queue.findIndex((q) => q.kind !== "product");
    expect(index).toBeGreaterThan(0);
    const positioned: SessionState = { ...state, index };
    const q = state.queue[index];
    const { outcome } = answerQuestion(
      positioned,
      { type: "answer", value: q.kind === "missingRight" ? q.fact.b : q.fact.a },
      { rng: seededRng(1), now: NOW },
    );
    expect(outcome.status).toBe("correct");
  });

  it("incrémente la série sur bonne réponse", () => {
    let state = build();
    for (let i = 0; i < 3; i++) {
      state = answerQuestion(state, correctAnswer(state.queue[state.index]), {
        rng: seededRng(1),
        now: NOW,
      }).state;
    }
    expect(state.streak).toBe(3);
  });

  it("remet la série à zéro sur mauvaise réponse", () => {
    let state = build();
    state = answerQuestion(state, correctAnswer(state.queue[state.index]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    state = answerQuestion(state, wrongAnswer(state.queue[state.index]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(state.streak).toBe(0);
  });

  it("remet la série à zéro sur temps écoulé", () => {
    let state = build({ difficulty: "paced" });
    state = answerQuestion(state, correctAnswer(state.queue[state.index]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    state = answerQuestion(state, { type: "timeout" }, {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(state.streak).toBe(0);
  });

  it("mémorise la meilleure série de la session", () => {
    let state = build({ length: 20 });
    for (let i = 0; i < 4; i++) {
      state = answerQuestion(state, correctAnswer(state.queue[state.index]), {
        rng: seededRng(1),
        now: NOW,
      }).state;
    }
    state = answerQuestion(state, wrongAnswer(state.queue[state.index]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(state.streak).toBe(0);
    expect(state.bestStreak).toBe(4);
  });

  it("renvoie un message de palier à 3, 5 puis 10 d'affilée", () => {
    let state = build({ tables: [2, 3, 4, 5, 6, 7], length: 30 });
    const celebrations: (string | null)[] = [];
    for (let i = 0; i < 10; i++) {
      const step = answerQuestion(state, correctAnswer(state.queue[state.index]), {
        rng: seededRng(1),
        now: NOW,
      });
      celebrations.push(step.outcome.celebration);
      state = step.state;
    }
    expect(celebrations[2]).toBeTruthy();
    expect(celebrations[4]).toBeTruthy();
    expect(celebrations[9]).toBeTruthy();
  });

  it("ne renvoie pas de message de palier à 4 ou 7 d'affilée", () => {
    let state = build({ tables: [2, 3, 4, 5, 6, 7], length: 30 });
    const celebrations: (string | null)[] = [];
    for (let i = 0; i < 8; i++) {
      const step = answerQuestion(state, correctAnswer(state.queue[state.index]), {
        rng: seededRng(1),
        now: NOW,
      });
      celebrations.push(step.outcome.celebration);
      state = step.state;
    }
    expect(celebrations[3]).toBeNull();
    expect(celebrations[6]).toBeNull();
  });

  it("expose la bonne réponse dans le message en cas d'écart", () => {
    const state = build();
    const q = state.queue[0];
    const { outcome } = answerQuestion(state, wrongAnswer(q), {
      rng: seededRng(1),
      now: NOW,
    });
    expect(outcome.message).toContain(`${q.fact.a} × ${q.fact.b} = ${q.product}`);
  });

  it("n'emploie aucun vocabulaire négatif dans les messages", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const state = build({ difficulty: "paced", length: 30 }, [], seed);
      const played = playAll(
        state,
        (q, step) => (step % 3 === 0 ? wrongAnswer(q) : correctAnswer(q)),
        seed,
      );
      for (const outcome of played.outcomes) {
        expect(outcome.message).not.toMatch(NEGATIVE_WORDS);
        if (outcome.celebration) {
          expect(outcome.celebration).not.toMatch(NEGATIVE_WORDS);
        }
      }
    }
  });

  it("ne mute pas l'état passé", () => {
    const state = freeze(build());
    const snapshot = JSON.stringify(state);
    expect(() =>
      answerQuestion(state, wrongAnswer(state.queue[0]), {
        rng: seededRng(1),
        now: NOW,
      }),
    ).not.toThrow();
    expect(JSON.stringify(state)).toBe(snapshot);
  });

  it("est déterministe avec un rng injecté", () => {
    const state = build();
    const first = answerQuestion(state, wrongAnswer(state.queue[0]), {
      rng: seededRng(99),
      now: NOW,
    });
    const second = answerQuestion(state, wrongAnswer(state.queue[0]), {
      rng: seededRng(99),
      now: NOW,
    });
    expect(first).toEqual(second);
  });

  it("termine la session après la dernière question", () => {
    const finished = playAll(build(), correctAnswer);
    expect(isSessionFinished(finished)).toBe(true);
    expect(finished.finishedAt).toBe(NOW);
    expect(currentQuestion(finished)).toBeNull();
  });

  it("lève une erreur si l'on répond après la fin", () => {
    const finished = playAll(build(), correctAnswer);
    expect(() =>
      answerQuestion(finished, { type: "timeout" }, { rng: seededRng(1), now: NOW }),
    ).toThrow(/Session terminée/);
  });
});

// ---------------------------------------------------------------------------
// scheduleRetry
// ---------------------------------------------------------------------------

describe("scheduleRetry", () => {
  it("programme une reprise après une mauvaise réponse", () => {
    const state = build();
    const next = answerQuestion(state, wrongAnswer(state.queue[0]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(next.queue).toHaveLength(11);
    expect(next.queue.filter((q) => q.isRetry)).toHaveLength(1);
  });

  it("programme une reprise après un temps écoulé", () => {
    const state = build({ difficulty: "paced" });
    const next = answerQuestion(state, { type: "timeout" }, {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(next.queue).toHaveLength(11);
  });

  it("ne programme pas de reprise après une bonne réponse", () => {
    const state = build();
    const next = answerQuestion(state, correctAnswer(state.queue[0]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(next.queue).toHaveLength(10);
  });

  it("place la reprise entre 3 et 5 questions plus loin", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 30 }, [], seed);
      const next = answerQuestion(state, wrongAnswer(state.queue[0]), {
        rng: seededRng(seed),
        now: NOW,
      }).state;
      const position = next.queue.findIndex((q) => q.isRetry);
      expect(position).toBeGreaterThanOrEqual(3);
      expect(position).toBeLessThanOrEqual(6); // 5 + décalage anti-voisinage
    }
  });

  it("la reprise porte sur le même fait et est de type product", () => {
    const state = build({ difficulty: "paced", length: 20 });
    const index = state.queue.findIndex((q) => q.kind !== "product");
    const positioned: SessionState = { ...state, index };
    const q = state.queue[index];
    const next = answerQuestion(positioned, wrongAnswer(q), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    const retry = next.queue.find((item) => item.isRetry);
    expect(retry?.fact).toEqual(q.fact);
    expect(retry?.kind).toBe("product");
    expect(retry?.answer).toBe(q.product);
    expect(retry?.retryOf).toBe(q.id);
    expect(retry?.retryDepth).toBe(1);
  });

  it("n'est jamais collée à une autre occurrence du même fait", () => {
    const queue: Question[] = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({
      id: `q${i}`,
      fact: { a: 7, b: 8 },
      kind: "product" as const,
      product: 56,
      answer: 56,
      isRetry: false,
      retryOf: null,
      retryDepth: 0,
    }));
    // Toutes les questions portent le même fait : aucun placement n'est
    // possible sans voisinage, la reprise part donc en fin de file.
    const next = scheduleRetry(queue, 0, queue[0], {
      rng: seededRng(1),
      maxQuestions: 12,
    });
    expect(next).toHaveLength(9);
    expect(next[8].isRetry).toBe(true);
  });

  it("ajoute en fin de file quand l'écart dépasse la dernière question", () => {
    const state = build();
    const positioned: SessionState = { ...state, index: 8 };
    const next = answerQuestion(positioned, wrongAnswer(state.queue[8]), {
      rng: seededRng(1),
      now: NOW,
    }).state;
    expect(next.queue).toHaveLength(11);
    expect(next.queue[10].isRetry).toBe(true);
  });

  it("ne dépasse jamais maxQuestions en répondant à côté à chaque question", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 10 }, [], seed);
      const played = playAll(state, wrongAnswer, seed);
      expect(played.queue.length).toBeLessThanOrEqual(15);
      expect(isSessionFinished(played)).toBe(true);
    }
  });

  it("reprogramme au plus deux fois le même fait", () => {
    for (let seed = 1; seed <= 10; seed++) {
      const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 10 }, [], seed);
      const played = playAll(state, wrongAnswer, seed);
      expect(Math.max(...played.queue.map((q) => q.retryDepth))).toBeLessThanOrEqual(2);
    }
  });

  it("écrase un créneau non encore posé quand le plafond est atteint", () => {
    const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 10 });
    const saturated: SessionState = {
      ...state,
      maxQuestions: state.queue.length,
      index: 1,
    };
    const next = scheduleRetry(saturated.queue, 1, saturated.queue[1], {
      rng: seededRng(1),
      maxQuestions: saturated.maxQuestions,
    });
    expect(next).toHaveLength(state.queue.length);
    expect(next.filter((q) => q.isRetry)).toHaveLength(1);
  });

  it("abandonne la reprise si aucun créneau n'est disponible", () => {
    const state = build({ tables: [2, 3, 4, 5, 6, 7], length: 10 });
    const next = scheduleRetry(state.queue, 9, state.queue[9], {
      rng: seededRng(1),
      maxQuestions: state.queue.length,
    });
    expect(next).toEqual([...state.queue]);
  });

  it("en écrasement, ne recrée jamais de voisinage même quand le créneau naïvement choisi est suivi du fait repris", () => {
    // File saturée (queue.length === maxQuestions). Avec gap=3 (rng figé à
    // 0), le créneau naïf est l'index 3 : son contenu n'est pas `key`, mais
    // son VOISIN DE DROITE (index 4) l'est. Sans le contrôle sur p+1, on
    // écraserait l'index 3 et on recréerait deux `key` consécutifs (3 et 4).
    const key = { a: 6, b: 7 };
    const mk = (i: number, fact: { a: number; b: number }): Question => ({
      id: `q${i}`,
      fact,
      kind: "product",
      product: fact.a * fact.b,
      answer: fact.a * fact.b,
      isRetry: false,
      retryOf: null,
      retryDepth: 0,
    });
    const queue: Question[] = [
      mk(0, key),
      mk(1, { a: 2, b: 3 }),
      mk(2, { a: 3, b: 4 }),
      mk(3, { a: 4, b: 5 }),
      mk(4, key),
      mk(5, { a: 5, b: 6 }),
      mk(6, { a: 8, b: 2 }),
      mk(7, { a: 8, b: 3 }),
      mk(8, { a: 8, b: 4 }),
      mk(9, { a: 8, b: 5 }),
    ];

    const next = scheduleRetry(queue, 0, queue[0], {
      rng: constantRng(0),
      maxQuestions: queue.length,
    });

    expect(next).toHaveLength(queue.length);
    for (let i = 1; i < next.length; i++) {
      expect(factKey(next[i].fact.a, next[i].fact.b)).not.toBe(
        factKey(next[i - 1].fact.a, next[i - 1].fact.b),
      );
    }
  });

  it("en écrasements successifs sur une file saturée, tous les id de questions restent uniques", () => {
    const mk = (i: number, fact: { a: number; b: number }): Question => ({
      id: `q${i}`,
      fact,
      kind: "product",
      product: fact.a * fact.b,
      answer: fact.a * fact.b,
      isRetry: false,
      retryOf: null,
      retryDepth: 0,
    });
    const queue: Question[] = [
      mk(0, { a: 1, b: 2 }),
      mk(1, { a: 1, b: 3 }),
      mk(2, { a: 1, b: 4 }),
      mk(3, { a: 1, b: 5 }),
      mk(4, { a: 1, b: 6 }),
      mk(5, { a: 1, b: 7 }),
      mk(6, { a: 1, b: 8 }),
      mk(7, { a: 1, b: 9 }),
      mk(8, { a: 1, b: 10 }),
      mk(9, { a: 2, b: 3 }),
    ];

    const afterFirst = scheduleRetry(queue, 0, queue[0], {
      rng: constantRng(0),
      maxQuestions: queue.length,
    });
    expect(afterFirst).toHaveLength(queue.length);

    const afterSecond = scheduleRetry(afterFirst, 1, afterFirst[1], {
      rng: constantRng(0),
      maxQuestions: queue.length,
    });
    expect(afterSecond).toHaveLength(queue.length);

    expect(afterSecond.filter((q) => q.isRetry)).toHaveLength(2);
    expect(new Set(afterSecond.map((q) => q.id)).size).toBe(afterSecond.length);
  });
});

// ---------------------------------------------------------------------------
// computeSummary
// ---------------------------------------------------------------------------

describe("computeSummary", () => {
  it("compte les questions posées et les bonnes réponses", () => {
    const played = playAll(build(), correctAnswer);
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.askedCount).toBe(10);
    expect(summary.correctCount).toBe(10);
    expect(summary.nominalCount).toBe(10);
  });

  it("distingue les bonnes réponses du premier coup des reprises réussies", () => {
    const played = playAll(
      build({ tables: [2, 3, 4, 5, 6, 7] }),
      (q, step) => (step === 0 ? wrongAnswer(q) : correctAnswer(q)),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.askedCount).toBe(11);
    expect(summary.correctCount).toBe(10);
    expect(summary.firstTryCorrectCount).toBe(9);
  });

  it("compte les temps écoulés", () => {
    const played = playAll(build({ difficulty: "paced" }), (q, step) =>
      step === 0 ? { type: "timeout" } : correctAnswer(q),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.timeoutCount).toBe(1);
  });

  it("isPerfect seulement si aucune reprise et aucun écart", () => {
    const played = playAll(build(), correctAnswer);
    expect(computeSummary(played, { rng: seededRng(1), now: NOW }).isPerfect).toBe(true);
  });

  it("isPerfect est faux si une reprise a été programmée puis réussie", () => {
    const played = playAll(build({ tables: [2, 3, 4, 5, 6, 7] }), (q, step) =>
      step === 0 ? wrongAnswer(q) : correctAnswer(q),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.isPerfect).toBe(false);
  });

  it("liste les faits à retravailler sans doublon", () => {
    const played = playAll(build({ tables: [2, 3, 4, 5, 6, 7] }), (q, step) =>
      step === 0 ? wrongAnswer(q) : correctAnswer(q),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.factsToRevisit).toHaveLength(1);
    expect(summary.factsToRevisit[0].label).toMatch(/^\d+ × \d+ = \d+$/);
    expect(summary.factsToRevisit[0].missCount).toBe(1);
  });

  it("trie les faits à retravailler par nombre d'écarts décroissant", () => {
    const played = playAll(
      build({ tables: [2, 3, 4, 5, 6, 7], length: 20 }),
      wrongAnswer,
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    const counts = summary.factsToRevisit.map((f) => f.missCount);
    expect([...counts].sort((a, b) => b - a)).toEqual(counts);
  });

  it("limite la liste à 8 faits", () => {
    const played = playAll(
      build({ tables: [2, 3, 4, 5, 6, 7], length: 30 }),
      wrongAnswer,
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.factsToRevisit.length).toBeLessThanOrEqual(8);
  });

  it("renvoie un message de conclusion positif même sans aucune bonne réponse", () => {
    const played = playAll(build(), wrongAnswer);
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.correctCount).toBe(0);
    expect(summary.encouragement.length).toBeGreaterThan(0);
    expect(summary.encouragement).not.toMatch(NEGATIVE_WORDS);
  });

  it("est sérialisable en JSON", () => {
    const played = playAll(build({ difficulty: "paced" }), (q, step) =>
      step % 2 === 0 ? wrongAnswer(q) : correctAnswer(q),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(JSON.parse(JSON.stringify(summary))).toEqual(summary);
  });

  it("horodate le début et la fin au format ISO", () => {
    const played = playAll(build(), correctAnswer);
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    expect(summary.startedAt).toBe(new Date(NOW).toISOString());
    expect(summary.completedAt).toBe(new Date(NOW).toISOString());
  });
});

describe("toSessionRecord", () => {
  it("produit un enregistrement sérialisable et complet", () => {
    const played = playAll(build({ difficulty: "paced" }), (q, step) =>
      step === 0 ? wrongAnswer(q) : correctAnswer(q),
    );
    const summary = computeSummary(played, { rng: seededRng(1), now: NOW });
    const record = toSessionRecord(summary, {
      id: "session-1",
      starsByTable: { "2": 1 },
      newBadgeIds: ["first-session"],
    });
    expect(record).toMatchObject({
      id: "session-1",
      difficulty: "paced",
      requestedLength: 10,
      askedCount: summary.askedCount,
      correctCount: summary.correctCount,
      starsByTable: { "2": 1 },
      newBadgeIds: ["first-session"],
    });
    expect(record.factsToRevisit).toEqual(summary.factsToRevisit.map((f) => f.key));
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
  });
});

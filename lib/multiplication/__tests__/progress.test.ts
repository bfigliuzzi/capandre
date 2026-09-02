import { describe, it, expect } from "vitest";
import type { MultiplicationFactProgress } from "../../db/schema";
import {
  computeAllTableStars,
  computeStarsDelta,
  computeTableStars,
  defaultFactProgress,
  factWeight,
  isTableMastered,
  mergeProgress,
  toProgressMap,
  updateProgress,
} from "../progress";
import { factKey } from "../facts";
import type { AnswerOutcome, Difficulty, SessionSummary } from "../types";
import { freeze } from "./test-rng";

const NOW = Date.UTC(2026, 0, 15, 10, 0, 0);
const ISO = new Date(NOW).toISOString();

function record(
  a: number,
  b: number,
  level: number,
  extra: Partial<MultiplicationFactProgress> = {},
): MultiplicationFactProgress {
  return {
    id: factKey(a, b),
    a,
    b,
    level,
    attempts: 1,
    correct: level,
    lastSeenAt: ISO,
    lastCorrectAt: level > 0 ? ISO : null,
    ...extra,
  };
}

function outcome(
  a: number,
  b: number,
  status: AnswerOutcome["status"],
  isRetry = false,
): AnswerOutcome {
  return {
    questionId: `q-${a}-${b}-${status}-${isRetry}`,
    factKey: factKey(a, b),
    kind: "product",
    status,
    given: status === "correct" ? a * b : null,
    expected: a * b,
    isRetry,
    streakAfter: 0,
    message: "message",
    celebration: null,
  };
}

function summary(
  outcomes: AnswerOutcome[],
  difficulty: Difficulty = "paced",
): SessionSummary {
  return {
    startedAt: ISO,
    completedAt: ISO,
    config: { tables: [7], difficulty, length: 10 },
    nominalCount: 10,
    askedCount: outcomes.length,
    correctCount: outcomes.filter((o) => o.status === "correct").length,
    firstTryCorrectCount: 0,
    timeoutCount: outcomes.filter((o) => o.status === "timeout").length,
    bestStreak: 0,
    isPerfect: false,
    factsToRevisit: [],
    outcomes,
    encouragement: "Bravo !",
  };
}

// ---------------------------------------------------------------------------
// factWeight
// ---------------------------------------------------------------------------

describe("factWeight", () => {
  it("un fait jamais vu pèse plus qu'un fait maîtrisé", () => {
    const mastered = toProgressMap([record(3, 4, 5)]);
    expect(factWeight({ a: 3, b: 4 }, new Map())).toBeGreaterThan(
      factWeight({ a: 3, b: 4 }, mastered),
    );
  });

  it("un fait de niveau 0 pèse plus qu'un fait jamais vu", () => {
    const struggling = toProgressMap([record(3, 4, 0)]);
    expect(factWeight({ a: 3, b: 4 }, struggling)).toBeGreaterThan(
      factWeight({ a: 3, b: 4 }, new Map()),
    );
  });

  it("un fait maîtrisé garde un poids strictement positif", () => {
    const mastered = toProgressMap([record(5, 5, 5)]);
    expect(factWeight({ a: 5, b: 5 }, mastered)).toBeGreaterThanOrEqual(1);
  });

  it("les grands faits pèsent un peu plus", () => {
    const map = toProgressMap([record(7, 8, 2), record(3, 4, 2)]);
    expect(factWeight({ a: 7, b: 8 }, map)).toBeGreaterThan(
      factWeight({ a: 3, b: 4 }, map),
    );
  });

  it("les faits avec un facteur 1 ou 10 pèsent un peu moins", () => {
    const map = toProgressMap([record(3, 1, 2), record(3, 10, 2), record(3, 4, 2)]);
    expect(factWeight({ a: 3, b: 1 }, map)).toBeLessThan(
      factWeight({ a: 3, b: 4 }, map),
    );
    expect(factWeight({ a: 3, b: 10 }, map)).toBeLessThan(
      factWeight({ a: 3, b: 4 }, map),
    );
  });

  it("le poids reste borné entre 1 et 8", () => {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        for (let level = 0; level <= 5; level++) {
          const w = factWeight({ a, b }, toProgressMap([record(a, b, level)]));
          expect(w).toBeGreaterThanOrEqual(1);
          expect(w).toBeLessThanOrEqual(8);
        }
        const unseen = factWeight({ a, b }, new Map());
        expect(unseen).toBeGreaterThanOrEqual(1);
        expect(unseen).toBeLessThanOrEqual(8);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// updateProgress
// ---------------------------------------------------------------------------

describe("updateProgress", () => {
  it("crée un enregistrement pour un fait jamais vu", () => {
    const updates = updateProgress([], summary([outcome(7, 8, "correct")]), {
      now: NOW,
    });
    expect(updates).toHaveLength(1);
    expect(updates[0]).toMatchObject({ id: "7-8", a: 7, b: 8, level: 1, attempts: 1 });
  });

  it("monte le niveau de 1 sur bonne réponse", () => {
    const updates = updateProgress(
      [record(7, 8, 2)],
      summary([outcome(7, 8, "correct")]),
      { now: NOW },
    );
    expect(updates[0].level).toBe(3);
  });

  it("plafonne le niveau à 5", () => {
    const updates = updateProgress(
      [record(7, 8, 5)],
      summary([outcome(7, 8, "correct")]),
      { now: NOW },
    );
    expect(updates[0].level).toBe(5);
  });

  it("descend le niveau de 1 sur mauvaise réponse", () => {
    const updates = updateProgress(
      [record(7, 8, 3)],
      summary([outcome(7, 8, "incorrect")]),
      { now: NOW },
    );
    expect(updates[0].level).toBe(2);
  });

  it("ne descend pas en dessous de 0", () => {
    const updates = updateProgress(
      [record(7, 8, 0)],
      summary([outcome(7, 8, "incorrect")]),
      { now: NOW },
    );
    expect(updates[0].level).toBe(0);
  });

  it("une erreur puis une reprise réussie laisse le niveau inchangé", () => {
    const updates = updateProgress(
      [record(7, 8, 3)],
      summary([outcome(7, 8, "incorrect"), outcome(7, 8, "correct", true)]),
      { now: NOW },
    );
    expect(updates).toHaveLength(1);
    expect(updates[0].level).toBe(3);
    expect(updates[0].attempts).toBe(3);
  });

  it("un temps écoulé en mode Cadencé fait baisser le niveau", () => {
    const updates = updateProgress(
      [record(7, 8, 3)],
      summary([outcome(7, 8, "timeout")], "paced"),
      { now: NOW },
    );
    expect(updates[0].level).toBe(2);
  });

  it("un temps écoulé en mode Défi ne fait pas baisser le niveau", () => {
    const updates = updateProgress(
      [record(7, 8, 3)],
      summary([outcome(7, 8, "timeout")], "challenge"),
      { now: NOW },
    );
    expect(updates[0].level).toBe(3);
    expect(updates[0].attempts).toBe(2);
  });

  it("incrémente attempts pour chaque tentative, reprises incluses", () => {
    const updates = updateProgress(
      [],
      summary([
        outcome(7, 8, "incorrect"),
        outcome(7, 8, "incorrect", true),
        outcome(7, 8, "correct", true),
      ]),
      { now: NOW },
    );
    expect(updates[0].attempts).toBe(3);
    expect(updates[0].correct).toBe(1);
  });

  it("met à jour lastSeenAt sur tous les faits touchés", () => {
    const older = record(7, 8, 2, { lastSeenAt: "2020-01-01T00:00:00.000Z" });
    const updates = updateProgress([older], summary([outcome(7, 8, "incorrect")]), {
      now: NOW,
    });
    expect(updates[0].lastSeenAt).toBe(ISO);
  });

  it("met à jour lastCorrectAt seulement sur bonne réponse", () => {
    const base = record(7, 8, 2, { lastCorrectAt: null });
    expect(
      updateProgress([base], summary([outcome(7, 8, "incorrect")]), { now: NOW })[0]
        .lastCorrectAt,
    ).toBeNull();
    expect(
      updateProgress([base], summary([outcome(7, 8, "correct")]), { now: NOW })[0]
        .lastCorrectAt,
    ).toBe(ISO);
  });

  it("ne retourne que les faits touchés par la session", () => {
    const updates = updateProgress(
      [record(7, 8, 2), record(3, 4, 2)],
      summary([outcome(7, 8, "correct")]),
      { now: NOW },
    );
    expect(updates.map((u) => u.id)).toEqual(["7-8"]);
  });

  it("ne mute pas les enregistrements d'entrée", () => {
    const input = freeze([record(7, 8, 2)]);
    expect(() =>
      updateProgress(input, summary([outcome(7, 8, "correct")]), { now: NOW }),
    ).not.toThrow();
    expect(input[0].level).toBe(2);
  });
});

describe("defaultFactProgress", () => {
  it("part du niveau 0 sans bonne réponse", () => {
    expect(defaultFactProgress(4, 6, NOW)).toEqual({
      id: "4-6",
      a: 4,
      b: 6,
      level: 0,
      attempts: 0,
      correct: 0,
      lastSeenAt: ISO,
      lastCorrectAt: null,
    });
  });
});

// ---------------------------------------------------------------------------
// Étoiles
// ---------------------------------------------------------------------------

function tableAtLevel(table: number, level: number, count = 10) {
  return Array.from({ length: count }, (_, i) => record(table, i + 1, level));
}

describe("computeTableStars", () => {
  it("0 étoile pour une table jamais travaillée", () => {
    expect(computeTableStars([], 7)).toBe(0);
  });

  it("1 étoile au maximum si les 10 faits ne sont pas tous vus", () => {
    expect(computeTableStars(tableAtLevel(7, 5, 9), 7)).toBe(1);
  });

  it("1 étoile à partir d'une moyenne de 2", () => {
    expect(computeTableStars(tableAtLevel(7, 2), 7)).toBe(1);
  });

  it("2 étoiles à partir d'une moyenne de 3,5", () => {
    const mixed = [...tableAtLevel(7, 4, 5), ...tableAtLevel(7, 3).slice(5)];
    expect(computeTableStars(mixed, 7)).toBe(2);
  });

  it("3 étoiles à partir d'une moyenne de 4,5 avec tous les faits à 3 minimum", () => {
    expect(computeTableStars(tableAtLevel(7, 5), 7)).toBe(3);
  });

  it("refuse 3 étoiles si un fait reste sous 3", () => {
    const weakSpot = [...tableAtLevel(7, 5, 9), record(7, 10, 2)];
    expect(weakSpot).toHaveLength(10);
    expect(computeTableStars(weakSpot, 7)).toBe(2);
  });

  it("ignore les faits appartenant à une autre table", () => {
    expect(computeTableStars(tableAtLevel(3, 5), 7)).toBe(0);
  });

  it("isTableMastered est vrai uniquement à 3 étoiles", () => {
    expect(isTableMastered(tableAtLevel(7, 5), 7)).toBe(true);
    expect(isTableMastered(tableAtLevel(7, 2), 7)).toBe(false);
  });
});

describe("computeAllTableStars", () => {
  it("retourne 10 entrées de « 1 » à « 10 »", () => {
    const stars = computeAllTableStars([]);
    expect(Object.keys(stars)).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    expect(Object.values(stars).every((v) => v === 0)).toBe(true);
  });

  it("reflète la maîtrise d'une table", () => {
    expect(computeAllTableStars(tableAtLevel(4, 5))["4"]).toBe(3);
  });
});

describe("computeStarsDelta", () => {
  it("ne retourne que les tables qui changent", () => {
    const before = computeAllTableStars([]);
    const after = { ...before, "4": 2 };
    expect(computeStarsDelta(before, after)).toEqual([{ table: 4, from: 0, to: 2 }]);
  });

  it("détecte aussi une baisse", () => {
    const before = { ...computeAllTableStars([]), "7": 3 };
    const after = { ...computeAllTableStars([]), "7": 2 };
    expect(computeStarsDelta(before, after)).toEqual([{ table: 7, from: 3, to: 2 }]);
  });

  it("retourne une liste vide quand rien ne change", () => {
    const stars = computeAllTableStars([]);
    expect(computeStarsDelta(stars, { ...stars })).toEqual([]);
  });
});

describe("mergeProgress", () => {
  it("remplace les enregistrements mis à jour et conserve les autres", () => {
    const base = [record(7, 8, 2), record(3, 4, 1)];
    const merged = mergeProgress(base, [record(7, 8, 5)]);
    expect(merged).toHaveLength(2);
    expect(merged.find((r) => r.id === "7-8")?.level).toBe(5);
    expect(merged.find((r) => r.id === "3-4")?.level).toBe(1);
  });

  it("ajoute les enregistrements nouveaux", () => {
    expect(mergeProgress([], [record(9, 9, 1)])).toHaveLength(1);
  });
});

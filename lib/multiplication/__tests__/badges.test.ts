import { describe, it, expect } from "vitest";
import type { MultiplicationFactProgress, UnlockedBadge } from "../../db/schema";
import { BADGES, evaluateBadges, getBadge } from "../badges";
import type { BadgeContext } from "../badges";
import { computeAllTableStars } from "../progress";
import { factKey } from "../facts";
import type { Difficulty, SessionLength, SessionSummary } from "../types";

const ISO = new Date(Date.UTC(2026, 0, 15)).toISOString();

function record(a: number, b: number, level: number, correct = 0): MultiplicationFactProgress {
  return {
    id: factKey(a, b),
    a,
    b,
    level,
    attempts: 5,
    correct,
    lastSeenAt: ISO,
    lastCorrectAt: ISO,
  };
}

function masteredTables(tables: number[]): MultiplicationFactProgress[] {
  return tables.flatMap((table) =>
    Array.from({ length: 10 }, (_, i) => record(table, i + 1, 5)),
  );
}

function summary(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    startedAt: ISO,
    completedAt: ISO,
    config: { tables: [7], difficulty: "basic", length: 10 },
    nominalCount: 10,
    askedCount: 10,
    correctCount: 7,
    firstTryCorrectCount: 7,
    timeoutCount: 0,
    bestStreak: 3,
    isPerfect: false,
    factsToRevisit: [],
    outcomes: [],
    encouragement: "Bon travail, ça progresse !",
    ...overrides,
  };
}

function context(overrides: Partial<BadgeContext> = {}): BadgeContext {
  const progress = overrides.progress ?? [];
  return {
    summary: summary(),
    progress,
    stars: computeAllTableStars([...progress]),
    sessionCount: 1,
    challengeSessionCount: 0,
    totalCorrectCount: 7,
    ...overrides,
  };
}

const noBadges: UnlockedBadge[] = [];
const unlocked = (...ids: string[]): UnlockedBadge[] =>
  ids.map((id) => ({ id, unlockedAt: ISO, sessionId: null }));

function ids(ctx: BadgeContext, already: UnlockedBadge[] = noBadges): string[] {
  return evaluateBadges(ctx, already).map((badge) => badge.id);
}

describe("catalogue", () => {
  it("contient des identifiants uniques", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
  });

  it("expose un titre, une description et un emoji non vides", () => {
    for (const badge of BADGES) {
      expect(badge.title.length, badge.id).toBeGreaterThan(0);
      expect(badge.description.length, badge.id).toBeGreaterThan(0);
      expect(badge.emoji.length, badge.id).toBeGreaterThan(0);
    }
  });

  it("getBadge retrouve un trophée par identifiant", () => {
    expect(getBadge("first-session")?.title).toBe("Premier pas");
    expect(getBadge("inconnu")).toBeUndefined();
  });
});

describe("evaluateBadges", () => {
  it("débloque « Premier pas » à la première session", () => {
    expect(ids(context())).toContain("first-session");
  });

  it("ne débloque pas deux fois un trophée déjà obtenu", () => {
    expect(ids(context(), unlocked("first-session"))).not.toContain("first-session");
  });

  it("débloque « Série de 10 » avec une meilleure série de 10", () => {
    expect(ids(context({ summary: summary({ bestStreak: 10 }) }))).toContain("streak-10");
  });

  it("débloque « Série de 20 » sans redébloquer « Série de 10 »", () => {
    const result = ids(
      context({ summary: summary({ bestStreak: 20 }) }),
      unlocked("first-session", "streak-10"),
    );
    expect(result).toContain("streak-20");
    expect(result).not.toContain("streak-10");
  });

  it("débloque « Sans faute » pour une session parfaite", () => {
    expect(ids(context({ summary: summary({ isPerfect: true }) }))).toContain(
      "perfect-session",
    );
  });

  it("ne débloque pas « Sans faute » si une reprise a eu lieu", () => {
    expect(ids(context({ summary: summary({ isPerfect: false }) }))).not.toContain(
      "perfect-session",
    );
  });

  it("débloque « Chrono lancé » à la première session en mode Défi", () => {
    const ctx = context({
      summary: summary({
        config: { tables: [7], difficulty: "challenge" as Difficulty, length: 10 },
      }),
      challengeSessionCount: 1,
    });
    expect(ids(ctx)).toContain("first-challenge");
  });

  it("débloque « Éclair » pour une session Défi parfaite", () => {
    const ctx = context({
      summary: summary({
        config: { tables: [7], difficulty: "challenge" as Difficulty, length: 10 },
        isPerfect: true,
      }),
      challengeSessionCount: 1,
    });
    expect(ids(ctx)).toContain("challenge-perfect");
  });

  it("débloque « Grande session » pour une session de 30 questions", () => {
    const ctx = context({
      summary: summary({
        config: { tables: [7], difficulty: "basic", length: 30 as SessionLength },
      }),
    });
    expect(ids(ctx)).toContain("long-session");
  });

  it("débloque « Habitué » à la 5e session", () => {
    expect(ids(context({ sessionCount: 4 }))).not.toContain("five-sessions");
    expect(ids(context({ sessionCount: 5 }))).toContain("five-sessions");
  });

  it("débloque « Marathon » à la 20e session", () => {
    expect(ids(context({ sessionCount: 20 }))).toContain("twenty-sessions");
  });

  it("débloque « Cinquante » à 50 bonnes réponses cumulées", () => {
    expect(ids(context({ totalCorrectCount: 49 }))).not.toContain("fifty-correct");
    expect(ids(context({ totalCorrectCount: 50 }))).toContain("fifty-correct");
  });

  it("débloque « Cinq cents » à 500 bonnes réponses cumulées", () => {
    expect(ids(context({ totalCorrectCount: 500 }))).toContain("five-hundred-correct");
  });

  it("débloque « La table de 7 » quand la table de 7 atteint 3 étoiles", () => {
    const progress = masteredTables([7]);
    expect(ids(context({ progress, stars: computeAllTableStars(progress) }))).toContain(
      "table-7-mastered",
    );
  });

  it("débloque « Trois tables » à la troisième table à 3 étoiles", () => {
    const two = masteredTables([2, 3]);
    expect(ids(context({ progress: two, stars: computeAllTableStars(two) }))).not.toContain(
      "three-tables-mastered",
    );
    const three = masteredTables([2, 3, 4]);
    expect(
      ids(context({ progress: three, stars: computeAllTableStars(three) })),
    ).toContain("three-tables-mastered");
  });

  it("débloque « Toutes les tables » quand les 10 tables ont 3 étoiles", () => {
    const all = masteredTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(ids(context({ progress: all, stars: computeAllTableStars(all) }))).toContain(
      "all-tables-mastered",
    );
  });

  it("retourne les trophées dans l'ordre du catalogue", () => {
    const all = masteredTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const ctx = context({
      summary: summary({
        bestStreak: 30,
        isPerfect: true,
        config: { tables: [7], difficulty: "challenge" as Difficulty, length: 30 },
      }),
      progress: all,
      stars: computeAllTableStars(all),
      sessionCount: 20,
      challengeSessionCount: 3,
      totalCorrectCount: 900,
    });
    const result = ids(ctx);
    expect(result).toEqual(BADGES.map((b) => b.id));
  });

  it("ne débloque aucun trophée sur une session sans progrès pour un profil avancé", () => {
    const all = masteredTables([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const ctx = context({
      progress: all,
      stars: computeAllTableStars(all),
      sessionCount: 30,
      challengeSessionCount: 5,
      totalCorrectCount: 900,
    });
    expect(ids(ctx, unlocked(...BADGES.map((b) => b.id)))).toEqual([]);
  });
});

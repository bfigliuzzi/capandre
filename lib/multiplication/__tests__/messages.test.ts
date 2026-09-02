import { describe, it, expect } from "vitest";
import {
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
} from "../messages";
import { formatQuestion, questionParts } from "../session";
import type { Question } from "../types";
import { constantRng, seededRng } from "./test-rng";

/** Vocabulaire proscrit à l'écran (jamais punitif). */
const NEGATIVE_WORDS =
  /\b(faux|fausse|erreurs?|mauvais(?:e|es)?|rat[ée]e?s?|perdus?|perdue|nul(?:le|s)?|[ée]chec)\b/i;

function question(kind: Question["kind"], a = 7, b = 8): Question {
  const product = a * b;
  return {
    id: "q0",
    fact: { a, b },
    kind,
    product,
    answer: kind === "product" ? product : kind === "missingRight" ? b : a,
    isRetry: false,
    retryOf: null,
    retryDepth: 0,
  };
}

describe("pickMessage", () => {
  it("est déterministe avec un rng constant", () => {
    expect(pickMessage(CORRECT_MESSAGES, constantRng(0))).toBe(CORRECT_MESSAGES[0]);
    expect(pickMessage(CORRECT_MESSAGES, constantRng(0.999999))).toBe(
      CORRECT_MESSAGES[CORRECT_MESSAGES.length - 1],
    );
  });

  it("retourne toujours un élément du pool", () => {
    const rng = seededRng(5);
    for (let i = 0; i < 100; i++) {
      expect(CORRECT_MESSAGES).toContain(pickMessage(CORRECT_MESSAGES, rng));
    }
  });

  it("gère un pool d'un seul élément", () => {
    expect(pickMessage(["Bravo !"], constantRng(0.7))).toBe("Bravo !");
  });

  it("retourne une chaîne vide pour un pool vide", () => {
    expect(pickMessage([], constantRng(0.5))).toBe("");
  });
});

describe("streakMessage", () => {
  it("retourne null en dessous de 3", () => {
    for (const streak of [0, 1, 2]) {
      expect(streakMessage(streak, constantRng(0))).toBeNull();
    }
  });

  it("retourne un message à chaque palier", () => {
    for (const threshold of STREAK_THRESHOLDS) {
      const message = streakMessage(threshold, constantRng(0));
      expect(message).toBeTruthy();
      expect(STREAK_MESSAGES[threshold]).toContain(message as string);
    }
  });

  it("retourne null entre deux paliers", () => {
    for (const streak of [4, 7, 12, 18, 25]) {
      expect(streakMessage(streak, constantRng(0))).toBeNull();
    }
  });

  it("gère les séries au-delà de 30 sur les multiples de 10", () => {
    expect(streakMessage(40, constantRng(0))).toBe("40 d'affilée, tu es en feu !");
    expect(streakMessage(41, constantRng(0))).toBeNull();
  });
});

describe("correctionMessage", () => {
  it("contient l'égalité complète", () => {
    expect(correctionMessage(question("product"), constantRng(0))).toContain(
      "7 × 8 = 56",
    );
  });

  it("montre la bonne réponse même pour un facteur manquant", () => {
    expect(correctionMessage(question("missingRight"), constantRng(0))).toContain(
      "7 × 8 = 56",
    );
  });
});

describe("timeoutMessage", () => {
  it("reste neutre et contient la bonne réponse", () => {
    const message = timeoutMessage(question("product"), constantRng(0));
    expect(message).toContain("7 × 8 = 56");
    expect(message).not.toMatch(NEGATIVE_WORDS);
  });
});

describe("summaryMessage", () => {
  it("couvre tous les seuils, y compris un ratio de 0", () => {
    for (const ratio of [0, 0.2, 0.5, 0.79, 0.8, 0.99, 1]) {
      const message = summaryMessage(ratio, constantRng(0));
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toMatch(NEGATIVE_WORDS);
    }
  });

  it("félicite un sans-faute", () => {
    expect(summaryMessage(1, constantRng(0))).toBe(SUMMARY_MESSAGES[0].messages[0]);
  });

  it("reste positif sans aucune bonne réponse", () => {
    expect(summaryMessage(0, constantRng(0))).toBe(
      "Tu t'es entraîné, c'est déjà une victoire !",
    );
  });
});

describe("starsMessage", () => {
  it("annonce un gain d'étoile", () => {
    expect(starsMessage({ table: 7, from: 1, to: 2 })).toBe("Table de 7 : +1 étoile !");
    expect(starsMessage({ table: 7, from: 1, to: 3 })).toBe("Table de 7 : +2 étoiles !");
  });

  it("présente une baisse comme un travail à poursuivre", () => {
    const message = starsMessage({ table: 7, from: 3, to: 2 });
    expect(message).toContain("à retravailler");
    expect(message).not.toMatch(NEGATIVE_WORDS);
  });
});

describe("vocabulaire", () => {
  it("aucun message du module ne contient de vocabulaire négatif", () => {
    const pools: string[] = [
      ...CORRECT_MESSAGES,
      ...RETRY_INTRO_MESSAGES,
      ...TIMEOUT_INTRO_MESSAGES,
      ...Object.values(STREAK_MESSAGES).flatMap((pool) => [...pool]),
      ...SUMMARY_MESSAGES.flatMap((tier) => [...tier.messages]),
    ];
    for (const message of pools) {
      expect(message, message).not.toMatch(NEGATIVE_WORDS);
    }
  });

  it("aucun message n'utilise « X » comme marqueur", () => {
    for (const message of [...CORRECT_MESSAGES, ...RETRY_INTRO_MESSAGES]) {
      expect(message).not.toMatch(/\bX\b/);
    }
  });
});

describe("formatQuestion et questionParts", () => {
  it("affiche « 7 × 8 = ? »", () => {
    expect(formatQuestion(question("product"))).toBe("7 × 8 = ?");
  });

  it("affiche « 7 × ? = 56 »", () => {
    expect(formatQuestion(question("missingRight"))).toBe("7 × ? = 56");
  });

  it("affiche « ? × 8 = 56 »", () => {
    expect(formatQuestion(question("missingLeft"))).toBe("? × 8 = 56");
  });

  it("marque le bon emplacement caché pour chaque type", () => {
    expect(questionParts(question("product"))).toEqual({
      left: "7",
      operator: "×",
      right: "8",
      result: "",
      hidden: "result",
    });
    expect(questionParts(question("missingRight"))).toEqual({
      left: "7",
      operator: "×",
      right: "",
      result: "56",
      hidden: "right",
    });
    expect(questionParts(question("missingLeft"))).toEqual({
      left: "",
      operator: "×",
      right: "8",
      result: "56",
      hidden: "left",
    });
  });
});

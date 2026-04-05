import { describe, it, expect } from "vitest";
import {
  extractArticle,
  computeMaskedPositions,
  shuffleArray,
  validateLetter,
  computeResults,
  type ExerciseWord,
} from "../exercise";

// ---------------------------------------------------------------------------
// extractArticle
// ---------------------------------------------------------------------------

describe("extractArticle", () => {
  it("extrait l'article défini 'le'", () => {
    expect(extractArticle("le coq")).toEqual({ article: "le", baseWord: "coq" });
  });

  it("extrait l'article défini 'la'", () => {
    expect(extractArticle("la poule")).toEqual({ article: "la", baseWord: "poule" });
  });

  it("extrait l'article défini 'les'", () => {
    expect(extractArticle("les oies")).toEqual({ article: "les", baseWord: "oies" });
  });

  it("extrait l'article élidé l' (apostrophe droite)", () => {
    expect(extractArticle("l'écurie")).toEqual({ article: "l'", baseWord: "écurie" });
  });

  it("extrait l'article élidé l' (apostrophe typographique)", () => {
    expect(extractArticle("l\u2019écurie")).toEqual({ article: "l\u2019", baseWord: "écurie" });
  });

  it("extrait l'article indéfini 'un'", () => {
    expect(extractArticle("un caneton")).toEqual({ article: "un", baseWord: "caneton" });
  });

  it("extrait l'article indéfini 'une'", () => {
    expect(extractArticle("une poule")).toEqual({ article: "une", baseWord: "poule" });
  });

  it("extrait l'article indéfini 'des'", () => {
    expect(extractArticle("des oiseaux")).toEqual({ article: "des", baseWord: "oiseaux" });
  });

  it("extrait l'article partitif 'du'", () => {
    expect(extractArticle("du pain")).toEqual({ article: "du", baseWord: "pain" });
  });

  it("extrait l'article partitif 'de la'", () => {
    expect(extractArticle("de la farine")).toEqual({ article: "de la", baseWord: "farine" });
  });

  it("extrait l'article partitif 'de l''", () => {
    expect(extractArticle("de l'eau")).toEqual({ article: "de l'", baseWord: "eau" });
  });

  it("retourne null pour un mot sans article", () => {
    expect(extractArticle("cheval")).toEqual({ article: null, baseWord: "cheval" });
  });

  it("ne retire PAS 'le' dans 'leader'", () => {
    expect(extractArticle("leader")).toEqual({ article: null, baseWord: "leader" });
  });

  it("ne retire PAS 'la' dans 'lavande'", () => {
    expect(extractArticle("lavande")).toEqual({ article: null, baseWord: "lavande" });
  });

  it("ne retire PAS 'un' dans 'uniforme'", () => {
    expect(extractArticle("uniforme")).toEqual({ article: null, baseWord: "uniforme" });
  });

  it("ne retire PAS 'des' dans 'dessin'", () => {
    expect(extractArticle("dessin")).toEqual({ article: null, baseWord: "dessin" });
  });

  it("gère un article seul sans mot (retourne le mot entier)", () => {
    expect(extractArticle("le")).toEqual({ article: null, baseWord: "le" });
  });

  it("gère les espaces autour", () => {
    expect(extractArticle("  le coq  ")).toEqual({ article: "le", baseWord: "coq" });
  });
});

// ---------------------------------------------------------------------------
// computeMaskedPositions
// ---------------------------------------------------------------------------

describe("computeMaskedPositions", () => {
  it("masque 1/3 en mode discovery (ceil(3×1/3) = 1)", () => {
    const positions = computeMaskedPositions("coq", "discovery");
    expect(positions).toHaveLength(1);
    expect(positions[0]).toBeGreaterThanOrEqual(0);
    expect(positions[0]).toBeLessThan(3);
  });

  it("masque 3/4 en mode learning (ceil(3×3/4) = 3)", () => {
    const positions = computeMaskedPositions("coq", "learning");
    expect(positions).toHaveLength(3);
  });

  it("masque 100% en mode mastery", () => {
    const positions = computeMaskedPositions("coq", "mastery");
    expect(positions).toEqual([0, 1, 2]);
  });

  it("masque ceil(8×1/3) = 3 lettres pour un mot de 8 lettres en discovery", () => {
    const positions = computeMaskedPositions("mouton", "discovery");
    expect(positions).toHaveLength(2); // ceil(6×1/3) = 2
  });

  it("retourne les positions triées", () => {
    for (let i = 0; i < 20; i++) {
      const positions = computeMaskedPositions("abcdefgh", "learning");
      for (let j = 1; j < positions.length; j++) {
        expect(positions[j]).toBeGreaterThan(positions[j - 1]);
      }
    }
  });

  it("gère un mot d'une seule lettre", () => {
    const positions = computeMaskedPositions("a", "discovery");
    expect(positions).toEqual([0]);
  });

  it("gère un mot de 2 lettres en discovery", () => {
    const positions = computeMaskedPositions("os", "discovery");
    expect(positions).toHaveLength(1); // ceil(2×1/3) = 1
  });

  it("gère un mot vide", () => {
    expect(computeMaskedPositions("", "discovery")).toEqual([]);
  });

  it("ne contient que des indices valides", () => {
    for (let i = 0; i < 50; i++) {
      const word = "hippopotame";
      const positions = computeMaskedPositions(word, "discovery");
      for (const pos of positions) {
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThan(word.length);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// shuffleArray
// ---------------------------------------------------------------------------

describe("shuffleArray", () => {
  it("préserve la longueur", () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffleArray(arr)).toHaveLength(5);
  });

  it("préserve les éléments", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("ne mute pas l'original", () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it("gère un tableau vide", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("gère un tableau d'un seul élément", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});

// ---------------------------------------------------------------------------
// validateLetter
// ---------------------------------------------------------------------------

describe("validateLetter", () => {
  it("valide une lettre correcte", () => {
    expect(validateLetter("a", "a")).toBe(true);
  });

  it("est insensible à la casse", () => {
    expect(validateLetter("a", "A")).toBe(true);
    expect(validateLetter("A", "a")).toBe(true);
  });

  it("exige les accents", () => {
    expect(validateLetter("é", "e")).toBe(false);
    expect(validateLetter("è", "e")).toBe(false);
    expect(validateLetter("ç", "c")).toBe(false);
  });

  it("valide un accent correct", () => {
    expect(validateLetter("é", "é")).toBe(true);
    expect(validateLetter("É", "é")).toBe(true);
  });

  it("retourne false pour une chaîne vide", () => {
    expect(validateLetter("a", "")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// computeResults
// ---------------------------------------------------------------------------

describe("computeResults", () => {
  const words: ExerciseWord[] = [
    { article: "le", baseWord: "coq", originalText: "le coq" },
    { article: "la", baseWord: "poule", originalText: "la poule" },
  ];

  it("retourne 100% si tout est correct", () => {
    const masked = [[1], [2]]; // 'o' dans coq, 'u' dans poule
    const answers = [["", "o", ""], ["", "", "u", "", ""]];
    const results = computeResults("Test", "discovery", words, masked, answers);
    expect(results.percentage).toBe(100);
    expect(results.correctCount).toBe(2);
  });

  it("retourne 0% si tout est faux", () => {
    const masked = [[0, 1, 2], [0, 1, 2, 3, 4]];
    const answers = [["x", "x", "x"], ["x", "x", "x", "x", "x"]];
    const results = computeResults("Test", "mastery", words, masked, answers);
    expect(results.percentage).toBe(0);
  });

  it("compte les mots non remplis comme fautes", () => {
    const masked = [[1], [2]];
    const answers = [["", "o", ""], ["", "", "", "", ""]]; // poule non remplie
    const results = computeResults("Test", "discovery", words, masked, answers);
    expect(results.correctCount).toBe(1);
    expect(results.percentage).toBe(50);
  });

  it("contient le détail lettre par lettre", () => {
    const masked = [[1]];
    const answers = [["", "x", ""]];
    const results = computeResults("Test", "discovery", [words[0]], masked, answers);
    const letters = results.results[0].letters;
    expect(letters).toHaveLength(3);
    expect(letters[0]).toMatchObject({ masked: false, correct: true });
    expect(letters[1]).toMatchObject({ masked: true, correct: false, expected: "o", given: "x" });
    expect(letters[2]).toMatchObject({ masked: false, correct: true });
  });

  it("valide en insensible à la casse", () => {
    const masked = [[0, 1, 2]];
    const answers = [["C", "O", "Q"]];
    const results = computeResults("Test", "mastery", [words[0]], masked, answers);
    expect(results.results[0].correct).toBe(true);
  });
});

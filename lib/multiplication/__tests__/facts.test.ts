import { describe, it, expect } from "vitest";
import {
  buildFacts,
  buildTable,
  factKey,
  factsForTable,
  formatFact,
  formatFactLine,
  parseFactKey,
} from "../facts";

describe("factsForTable", () => {
  it("génère 10 faits pour une table", () => {
    const facts = factsForTable(7);
    expect(facts).toHaveLength(10);
    expect(facts[0]).toEqual({ a: 7, b: 1 });
    expect(facts[9]).toEqual({ a: 7, b: 10 });
  });

  it("retourne un tableau vide pour une table hors de 1 à 10", () => {
    expect(factsForTable(0)).toEqual([]);
    expect(factsForTable(11)).toEqual([]);
    expect(factsForTable(2.5)).toEqual([]);
  });
});

describe("buildFacts", () => {
  it("génère 100 faits pour les 10 tables", () => {
    expect(buildFacts([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toHaveLength(100);
  });

  it("distingue 7 × 8 et 8 × 7", () => {
    const facts = buildFacts([7, 8]);
    expect(facts).toContainEqual({ a: 7, b: 8 });
    expect(facts).toContainEqual({ a: 8, b: 7 });
  });

  it("ne contient pas 8 × 7 quand seule la table de 7 est choisie", () => {
    const facts = buildFacts([7]);
    expect(facts).toContainEqual({ a: 7, b: 8 });
    expect(facts).not.toContainEqual({ a: 8, b: 7 });
  });

  it("ignore les tables en doublon", () => {
    expect(buildFacts([3, 3, 3])).toHaveLength(10);
  });

  it("ignore les tables hors de 1 à 10", () => {
    expect(buildFacts([0, 11, -3, 2.5, 4])).toHaveLength(10);
    expect(buildFacts([0, 11, -3, 2.5, 4]).every((f) => f.a === 4)).toBe(true);
  });

  it("retourne un tableau vide sans table", () => {
    expect(buildFacts([])).toEqual([]);
    expect(buildFacts([0, 42])).toEqual([]);
  });

  it("trie les tables par ordre croissant", () => {
    const facts = buildFacts([9, 2, 5]);
    expect(facts[0].a).toBe(2);
    expect(facts[10].a).toBe(5);
    expect(facts[20].a).toBe(9);
  });
});

describe("factKey et parseFactKey", () => {
  it("produit la clé « 7-8 »", () => {
    expect(factKey(7, 8)).toBe("7-8");
  });

  it("relit une clé", () => {
    expect(parseFactKey("7-8")).toEqual({ a: 7, b: 8 });
    expect(parseFactKey("10-10")).toEqual({ a: 10, b: 10 });
  });

  it("lève une erreur sur une clé invalide", () => {
    expect(() => parseFactKey("7")).toThrow(/Clé de fait invalide/);
    expect(() => parseFactKey("a-b")).toThrow(/Clé de fait invalide/);
    expect(() => parseFactKey("")).toThrow(/Clé de fait invalide/);
  });
});

describe("mise en forme", () => {
  it("formatFact retourne « 7 × 8 »", () => {
    expect(formatFact({ a: 7, b: 8 })).toBe("7 × 8");
  });

  it("formatFactLine retourne « 7 × 8 = 56 »", () => {
    expect(formatFactLine({ a: 7, b: 8 })).toBe("7 × 8 = 56");
  });
});

describe("buildTable", () => {
  it("retourne 10 lignes de « 7 × 1 = 7 » à « 7 × 10 = 70 »", () => {
    const lines = buildTable(7);
    expect(lines).toHaveLength(10);
    expect(lines[0].label).toBe("7 × 1 = 7");
    expect(lines[9].label).toBe("7 × 10 = 70");
    expect(lines[9].product).toBe(70);
  });

  it("retourne un tableau vide pour une table invalide", () => {
    expect(buildTable(12)).toEqual([]);
  });
});

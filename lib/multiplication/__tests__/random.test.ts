import { describe, it, expect } from "vitest";
import { pickWeightedIndex, randomInt, shuffleWithRng } from "../random";
import { seededRng, constantRng } from "./test-rng";

describe("shuffleWithRng", () => {
  it("préserve la longueur du tableau", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffleWithRng(input, seededRng(1))).toHaveLength(5);
  });

  it("préserve les éléments du tableau", () => {
    const input = [1, 2, 3, 4, 5];
    expect([...shuffleWithRng(input, seededRng(7))].sort((a, b) => a - b)).toEqual(input);
  });

  it("ne mute pas le tableau d'origine", () => {
    const input = [1, 2, 3, 4, 5];
    shuffleWithRng(input, seededRng(3));
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });

  it("gère un tableau vide et un tableau à un élément", () => {
    expect(shuffleWithRng([], seededRng(1))).toEqual([]);
    expect(shuffleWithRng(["a"], seededRng(1))).toEqual(["a"]);
  });

  it("est reproductible avec la même graine", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(shuffleWithRng(input, seededRng(42))).toEqual(
      shuffleWithRng(input, seededRng(42)),
    );
  });
});

describe("pickWeightedIndex", () => {
  it("retourne le premier indice pour r = 0", () => {
    expect(pickWeightedIndex([1, 2, 3], 0)).toBe(0);
  });

  it("retourne le dernier indice de poids non nul pour r proche de 1", () => {
    expect(pickWeightedIndex([1, 2, 3, 0], 0.999999)).toBe(2);
  });

  it("ignore les poids nuls", () => {
    // Poids : [0, 5, 0] → seul l'indice 1 est atteignable.
    for (const r of [0, 0.3, 0.6, 0.99]) {
      expect(pickWeightedIndex([0, 5, 0], r)).toBe(1);
    }
  });

  it("retourne -1 si tous les poids sont nuls", () => {
    expect(pickWeightedIndex([0, 0, 0], 0.5)).toBe(-1);
    expect(pickWeightedIndex([], 0.5)).toBe(-1);
  });

  it("répartit proportionnellement aux poids", () => {
    // Poids [1, 3] : r < 0,25 → 0, sinon 1.
    expect(pickWeightedIndex([1, 3], 0.2)).toBe(0);
    expect(pickWeightedIndex([1, 3], 0.3)).toBe(1);
  });
});

describe("randomInt", () => {
  it("respecte les bornes incluses", () => {
    expect(randomInt(3, 5, constantRng(0))).toBe(3);
    expect(randomInt(3, 5, constantRng(0.999999))).toBe(5);
  });

  it("reste dans l'intervalle demandé sur de nombreux tirages", () => {
    const rng = seededRng(11);
    for (let i = 0; i < 200; i++) {
      const value = randomInt(3, 5, rng);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it("retourne la borne minimale quand l'intervalle est vide", () => {
    expect(randomInt(4, 4, constantRng(0.5))).toBe(4);
  });
});

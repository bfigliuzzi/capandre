import { describe, expect, it } from "vitest";
import { paginate } from "../pagination";
import type { Article, Nature } from "../types";

function article(headword: string, nature: Nature = "nom"): Article {
  return {
    headword,
    nature,
    senses: [{ definition: `définition de ${headword}` }],
    synonyms: [],
    antonyms: [],
    source: "dicoado",
  };
}

const SEVEN = ["gamme", "abri", "fée", "dé", "éclair", "bol", "cil"].map((word) => article(word));

describe("paginate — pages et mots repères (R2, R3)", () => {
  it("met le même nombre d'articles par page, la dernière page en ayant moins", () => {
    const pages = paginate(SEVEN, 3);

    expect(pages.map((page) => page.articles.length)).toEqual([3, 3, 1]);
  });

  it("numérote les pages à partir de 1 et range les articles par ordre alphabétique", () => {
    const pages = paginate(SEVEN, 3);

    expect(pages.map((page) => page.number)).toEqual([1, 2, 3]);
    expect(pages.flatMap((page) => page.articles.map((a) => a.headword))).toEqual([
      "abri", "bol", "cil", "dé", "éclair", "fée", "gamme",
    ]);
  });

  it("prend pour mots repères le premier et le dernier mot d'entrée de la page", () => {
    const pages = paginate(SEVEN, 3);

    expect(pages.map((page) => page.guideWords)).toEqual([
      ["abri", "cil"],
      ["dé", "fée"],
      ["gamme", "gamme"],
    ]);
  });

  it("range les homographes par nature : le nom avant l'adjectif", () => {
    const pages = paginate([article("fin", "adjectif"), article("fin", "nom")], 8);

    expect(pages[0].articles.map((a) => a.nature)).toEqual(["nom", "adjectif"]);
  });

  it("ne produit aucune page sans article", () => {
    expect(paginate([], 8)).toEqual([]);
  });
});

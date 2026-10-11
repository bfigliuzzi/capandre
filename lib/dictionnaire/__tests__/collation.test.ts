import { describe, expect, it } from "vitest";
import { compareHeadwords } from "../collation";

function sorted(words: readonly string[]): string[] {
  return [...words].sort(compareHeadwords);
}

describe("compareHeadwords — ordre d'un dictionnaire français (R4)", () => {
  it("départage les accents en partant de la fin du mot : cote, côte, coté, côté", () => {
    expect(sorted(["côté", "coté", "côte", "cote"])).toEqual(["cote", "côte", "coté", "côté"]);
  });

  it("range un mot avant la locution qui le prolonge : pomme, pomme de terre, pommier", () => {
    expect(sorted(["pommier", "pomme de terre", "pomme"])).toEqual(["pomme", "pomme de terre", "pommier"]);
  });

  it("ignore le trait d'union au premier passage", () => {
    expect(sorted(["porter", "porte-monnaie", "portail"])).toEqual(["portail", "porte-monnaie", "porter"]);
  });

  it("ignore la majuscule au premier passage, puis range la minuscule d'abord", () => {
    expect(sorted(["Bébé", "abri", "bébé", "cabane"])).toEqual(["abri", "bébé", "Bébé", "cabane"]);
  });

  it("ignore les accents au premier passage : élève se range entre éclair et elfe", () => {
    expect(sorted(["elfe", "élève", "éclair"])).toEqual(["éclair", "élève", "elfe"]);
  });
});

import { describe, expect, it } from "vitest";
import { selectLemmas, toArticle } from "../filters";
import type { Candidate, CandidateSense, Lemma } from "../types";

function lemma(headword: string, frequency: number, nature: Lemma["nature"] = "nom"): Lemma {
  return { headword, nature, frequency };
}

function sense(definition: string, examples: string[] = [], marks: CandidateSense["marks"] = []): CandidateSense {
  return { definition, examples, marks };
}

function candidate(senses: CandidateSense[], extra: Partial<Candidate> = {}): Candidate {
  return {
    headword: "glace",
    nature: "nom",
    gender: "féminin",
    senses,
    synonyms: [],
    antonyms: [],
    source: "wiktionnaire",
    ...extra,
  };
}

describe("selectLemmas — choix des mots (R28)", () => {
  it("range les mots du plus fréquent au moins fréquent", () => {
    const selected = selectLemmas([lemma("loup", 50), lemma("chat", 300), lemma("lune", 120)], new Set());
    expect(selected.map((l) => l.headword)).toEqual(["chat", "lune", "loup"]);
  });

  it("retire les mots de la liste d'exclusion et les noms propres restés dans la liste", () => {
    const selected = selectLemmas(
      [lemma("chat", 300), lemma("Paris", 200), lemma("crotte", 100)],
      new Set(["crotte"]),
    );
    expect(selected.map((l) => l.headword)).toEqual(["chat"]);
  });

  it("ne garde qu'une fois un même mot de même nature", () => {
    const selected = selectLemmas([lemma("fin", 90), lemma("fin", 80), lemma("fin", 70, "adjectif")], new Set());
    expect(selected.map((l) => `${l.headword} ${l.nature}`)).toEqual(["fin nom", "fin adjectif"]);
  });
});

describe("toArticle — filtres d'un article (R28)", () => {
  it("retire les sens vulgaires, vieillis et argotiques", () => {
    const article = toArticle(
      candidate([
        sense("vieux sens", [], ["vieilli"]),
        sense("eau gelée"),
        sense("sens d'argot", [], ["argot"]),
        sense("sens grossier", [], ["vulgaire"]),
      ]),
    );
    expect(article?.senses.map((s) => s.definition)).toEqual(["eau gelée"]);
  });

  it("écarte un mot sans aucun sens utilisable", () => {
    expect(toArticle(candidate([sense("vieux sens", [], ["vieilli"]), sense("  ")]))).toBeNull();
  });

  it("garde 3 sens au plus, dans l'ordre de la source", () => {
    const article = toArticle(candidate([sense("un"), sense("deux"), sense("trois"), sense("quatre")]));
    expect(article?.senses.map((s) => s.definition)).toEqual(["un", "deux", "trois"]);
  });

  it("affiche le premier exemple court et réserve le second à la question", () => {
    const long = "Cette phrase d'exemple est beaucoup trop longue pour un enfant car elle compte plus de quinze mots en tout.";
    const article = toArticle(
      candidate([sense("miroir", [long, "Elle se regarde dans la glace.", "Il se coiffe devant la glace."])]),
    );
    expect(article?.senses[0]).toEqual({
      definition: "miroir",
      example: "Elle se regarde dans la glace.",
      quizExample: "Il se coiffe devant la glace.",
    });
  });

  it("n'accepte comme phrase de question qu'une vraie phrase : 4 mots au moins et un point final", () => {
    const article = toArticle(
      candidate([
        sense("miroir", ["Elle se regarde dans la glace.", "Glace de poche.", "Une glace"]),
        sense("eau gelée", ["Le lac est gelé.", "Les enfants glissent sur la glace !"]),
      ]),
    );
    expect(article?.senses[0].quizExample).toBeUndefined();
    expect(article?.senses[1].quizExample).toBe("Les enfants glissent sur la glace !");
  });

  it("ignore un exemple qui ne contient aucune lettre", () => {
    const article = toArticle(candidate([sense("miroir", ["'''''''", "Elle se regarde dans la glace."])]));
    expect(article?.senses[0].example).toBe("Elle se regarde dans la glace.");
  });

  it("n'a ni exemple ni phrase de question quand la source n'en donne pas", () => {
    expect(toArticle(candidate([sense("miroir")]))?.senses[0]).toEqual({ definition: "miroir" });
  });

  it("dédoublonne synonymes et contraires et en retire le mot lui-même", () => {
    const article = toArticle(
      candidate([sense("miroir")], { synonyms: ["miroir", "glace", "miroir"], antonyms: ["feu", "feu"] }),
    );
    expect(article?.synonyms).toEqual(["miroir"]);
    expect(article?.antonyms).toEqual(["feu"]);
  });
});

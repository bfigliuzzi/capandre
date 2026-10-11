import { describe, expect, it } from "vitest";
import { mergeSources } from "../merge";
import type { Candidate, Lemma } from "../types";

function lemma(headword: string, nature: Lemma["nature"] = "nom"): Lemma {
  return { headword, nature, frequency: 100 };
}

function candidate(headword: string, source: Candidate["source"], extra: Partial<Candidate> = {}): Candidate {
  return {
    headword,
    nature: "nom",
    senses: [{ definition: `${headword} selon ${source}`, examples: [], marks: [] }],
    synonyms: [],
    antonyms: [],
    source,
    ...extra,
  };
}

describe("mergeSources — fusion des sources (R29, R30)", () => {
  it("préfère le Dico des Ados quand il a le mot", () => {
    const [article] = mergeSources([lemma("loup")], [candidate("loup", "dicoado")], [candidate("loup", "wiktionnaire")], 10);
    expect(article.source).toBe("dicoado");
  });

  it("prend le Wiktionnaire pour un mot que le Dico des Ados n'a pas", () => {
    const [article] = mergeSources([lemma("loup")], [], [candidate("loup", "wiktionnaire")], 10);
    expect(article.source).toBe("wiktionnaire");
  });

  it("prend le Wiktionnaire quand le Dico des Ados n'a le mot que sous une autre nature", () => {
    const [article] = mergeSources(
      [lemma("fin", "adjectif")],
      [candidate("fin", "dicoado")],
      [candidate("fin", "wiktionnaire", { nature: "adjectif" })],
      10,
    );
    expect(article).toMatchObject({ nature: "adjectif", source: "wiktionnaire" });
  });

  it("prend le Wiktionnaire quand l'article du Dico des Ados est vidé par les filtres", () => {
    const vide = candidate("loup", "dicoado", {
      senses: [{ definition: "sens d'argot", examples: [], marks: ["argot"] }],
    });
    const [article] = mergeSources([lemma("loup")], [vide], [candidate("loup", "wiktionnaire")], 10);
    expect(article.source).toBe("wiktionnaire");
  });

  it("écarte un mot qu'aucune source ne définit et s'arrête au nombre d'articles voulu", () => {
    const articles = mergeSources(
      [lemma("chat"), lemma("zzz"), lemma("chien"), lemma("loup")],
      [candidate("chat", "dicoado"), candidate("chien", "dicoado"), candidate("loup", "dicoado")],
      [],
      2,
    );
    expect(articles.map((a) => a.headword)).toEqual(["chat", "chien"]);
  });

  it("ne livre aucune donnée de Manulex (R30)", () => {
    const [article] = mergeSources([lemma("loup")], [candidate("loup", "dicoado")], [], 10);
    expect(Object.keys(article).sort()).toEqual(["antonyms", "headword", "nature", "senses", "source", "synonyms"]);
    expect(JSON.stringify(article)).not.toContain("frequency");
  });
});

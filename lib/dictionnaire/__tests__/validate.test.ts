import { describe, expect, it } from "vitest";
import { validateDictionaryFile } from "../validate";
import { FIXTURE_DICTIONARY } from "./fixtures";

function withFirstArticle(patch: Record<string, unknown>) {
  const [first, ...rest] = FIXTURE_DICTIONARY.pages;
  const [article, ...others] = first.articles;
  return { ...FIXTURE_DICTIONARY, pages: [{ ...first, articles: [{ ...article, ...patch }, ...others] }, ...rest] };
}

describe("validateDictionaryFile — le fichier téléchargé avant sa copie", () => {
  it("accepte le dictionnaire de la version attendue", () => {
    expect(validateDictionaryFile(FIXTURE_DICTIONARY, 1).ok).toBe(true);
  });

  it.each([
    ["pas un objet", "texte"],
    ["une autre version", { ...FIXTURE_DICTIONARY, version: 2 }],
    ["aucune page", { ...FIXTURE_DICTIONARY, pages: [] }],
    ["des pages mal numérotées", { ...FIXTURE_DICTIONARY, pages: [...FIXTURE_DICTIONARY.pages].reverse() }],
    ["une nature inconnue", withFirstArticle({ nature: "verbe-adjectif" })],
    ["plus de 3 sens", withFirstArticle({ senses: Array(4).fill({ definition: "x" }) })],
    ["aucun sens", withFirstArticle({ senses: [] })],
    ["une source inconnue", withFirstArticle({ source: "manulex" })],
  ])("refuse %s", (_, value) => {
    expect(validateDictionaryFile(value, 1).ok).toBe(false);
  });
});

// Se déplacer dans le dictionnaire : onglets, mot d'entrée, « aller à la page ».
import type { DictionaryPage } from "./types";

/** Lettre d'onglet d'un mot : sans accent, en minuscule (« œuf » → « o »). */
export function letterOf(word: string): string {
  const first = word.trim().charAt(0).toLowerCase();
  if (first === "œ") return "o";
  if (first === "æ") return "a";
  return first.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Première page qui contient un article de cette lettre, sinon null (onglet désactivé). */
export function firstPageOfLetter(pages: readonly DictionaryPage[], letter: string): number | null {
  const page = pages.find((p) => p.articles.some((a) => letterOf(a.headword) === letter));
  return page ? page.number : null;
}

/** Lettres qui ont au moins un article. */
export function lettersWithArticles(pages: readonly DictionaryPage[]): ReadonlySet<string> {
  return new Set(pages.flatMap((p) => p.articles.map((a) => letterOf(a.headword))));
}

export function pageOfHeadword(pages: readonly DictionaryPage[], headword: string): number | null {
  const page = pages.find((p) => p.articles.some((a) => a.headword === headword));
  return page ? page.number : null;
}

export type GoToPageResult =
  | { readonly ok: true; readonly page: number }
  | { readonly ok: false; readonly error: string };

/** Valide la saisie de « aller à la page » (R7). */
export function parseGoToPage(input: string, totalPages: number): GoToPageResult {
  const trimmed = input.trim();
  const outOfRange = `Choisis une page entre 1 et ${totalPages}.`;
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: outOfRange };
  const page = Number(trimmed);
  if (page < 1 || page > totalPages) return { ok: false, error: outOfRange };
  return { ok: true, page };
}

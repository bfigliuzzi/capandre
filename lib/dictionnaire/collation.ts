// Ordre alphabétique d'un dictionnaire français (R4).
//
// Premier passage : lettres seules, accents, majuscules, espaces et traits
// d'union ignorés. Départage ensuite : les accents comparés en partant de la
// fin du mot (cote, côte, coté, côté), ce que `Intl.Collator("fr")` ne fait
// pas ; puis les minuscules avant les majuscules.
import { NATURE_ORDER } from "./constants";
import type { Article } from "./types";

const baseCollator = new Intl.Collator("fr", { sensitivity: "base", ignorePunctuation: true });

function stripAccent(char: string): string {
  return char.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function compareAccentsFromEnd(a: string, b: string): number {
  const charsA = [...a.toLowerCase()];
  const charsB = [...b.toLowerCase()];
  for (let i = 1; i <= Math.min(charsA.length, charsB.length); i++) {
    const charA = charsA[charsA.length - i];
    const charB = charsB[charsB.length - i];
    if (charA === charB) continue;
    const accentedA = charA !== stripAccent(charA);
    const accentedB = charB !== stripAccent(charB);
    if (accentedA !== accentedB) return accentedA ? 1 : -1;
  }
  return 0;
}

export function compareHeadwords(a: string, b: string): number {
  const base = baseCollator.compare(a, b);
  if (base !== 0) return base;
  const accents = compareAccentsFromEnd(a, b);
  if (accents !== 0) return accents;
  return a < b ? 1 : a > b ? -1 : 0;
}

/** Homographes : même mot d'entrée, rangés par nature (fin n. f., puis fin adj.). */
export function compareArticles(a: Article, b: Article): number {
  const byHeadword = compareHeadwords(a.headword, b.headword);
  if (byHeadword !== 0) return byHeadword;
  return NATURE_ORDER.indexOf(a.nature) - NATURE_ORDER.indexOf(b.nature);
}

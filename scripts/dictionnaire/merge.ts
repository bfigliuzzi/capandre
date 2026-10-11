// Fusion des sources (R29) : le Dico des Ados d'abord, le Wiktionnaire pour les
// mots qu'il n'a pas. Les lemmes Manulex ne servent qu'à choisir et ordonner :
// l'article est construit depuis les sources seules, rien de Manulex n'est livré (R30).
import type { Article } from "../../lib/dictionnaire/types";
import { toArticle } from "./filters";
import type { Candidate, Lemma } from "./types";

type Index = ReadonlyMap<string, Candidate>;

function keyOf(headword: string, nature: string): string {
  return `${headword}\n${nature}`;
}

/** Une entrée par (mot, nature) : la première rencontrée dans la source. */
export function indexCandidates(candidates: readonly Candidate[]): Index {
  const index = new Map<string, Candidate>();
  for (const c of candidates) {
    const key = keyOf(c.headword, c.nature);
    if (!index.has(key)) index.set(key, c);
  }
  return index;
}

function articleFor(lemma: Lemma, dicoado: Index, wiktionnaire: Index): Article | null {
  const key = keyOf(lemma.headword, lemma.nature);
  const fromDicoado = dicoado.get(key);
  const preferred = fromDicoado ? toArticle(fromDicoado) : null;
  if (preferred) return preferred;
  const fromWiktionnaire = wiktionnaire.get(key);
  return fromWiktionnaire ? toArticle(fromWiktionnaire) : null;
}

/** Les `limit` premiers mots de la liste (déjà triée par fréquence) qu'une source définit. */
export function mergeSources(
  lemmas: readonly Lemma[],
  dicoado: readonly Candidate[],
  wiktionnaire: readonly Candidate[],
  limit: number,
): Article[] {
  const dicoadoIndex = indexCandidates(dicoado);
  const wiktionnaireIndex = indexCandidates(wiktionnaire);
  const articles: Article[] = [];
  for (const lemma of lemmas) {
    if (articles.length >= limit) break;
    const article = articleFor(lemma, dicoadoIndex, wiktionnaireIndex);
    if (article) articles.push(article);
  }
  return articles;
}

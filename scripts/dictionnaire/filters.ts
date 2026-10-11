// Filtres du script (R28) : quels mots garder, et ce qu'on garde de chaque article.
import type { Article, Sense } from "../../lib/dictionnaire/types";
import type { Candidate, CandidateSense, Lemma } from "./types";

export const MAX_SENSES = 3;
/** Un exemple court compte moins de 15 mots (cadrage). */
export const MAX_EXAMPLE_WORDS = 14;
export const MAX_RELATED_WORDS = 5;
/** Une phrase de question est une vraie phrase : assez de mots, et une ponctuation finale. */
export const MIN_QUIZ_WORDS = 4;

/** Mots de la liste, du plus fréquent au moins fréquent, sans exclusion ni nom propre. */
export function selectLemmas(lemmas: readonly Lemma[], exclusions: ReadonlySet<string>): Lemma[] {
  const seen = new Set<string>();
  return [...lemmas]
    .sort((a, b) => b.frequency - a.frequency)
    .filter((l) => {
      const key = `${l.headword}\n${l.nature}`;
      if (seen.has(key) || exclusions.has(l.headword) || /^\p{Lu}/u.test(l.headword)) return false;
      seen.add(key);
      return true;
    });
}

function wordCount(sentence: string): number {
  return sentence.split(/\s+/).filter(Boolean).length;
}

function isSentence(text: string): boolean {
  return wordCount(text) >= MIN_QUIZ_WORDS && /[.!?…»]$/.test(text);
}

function shortExamples(candidate: CandidateSense): string[] {
  return candidate.examples.map((e) => e.trim()).filter((e) => /\p{L}/u.test(e) && wordCount(e) <= MAX_EXAMPLE_WORDS);
}

/** `displayed` : les exemples affichés de tout l'article, qu'une phrase de question ne reprend jamais (R22). */
function toSense(candidate: CandidateSense, displayed: ReadonlySet<string>): Sense {
  const [example, ...others] = shortExamples(candidate);
  const quizExample = others.find((e) => isSentence(e) && !displayed.has(e));
  return {
    definition: candidate.definition.trim(),
    ...(example ? { example } : {}),
    ...(quizExample ? { quizExample } : {}),
  };
}

function relatedWords(words: readonly string[], headword: string): string[] {
  const unique = [...new Set(words.map((w) => w.trim()))];
  return unique.filter((w) => w.length > 0 && w !== headword).slice(0, MAX_RELATED_WORDS);
}

/** L'article livré, ou null si aucun sens ne reste après filtrage. */
export function toArticle(candidate: Candidate): Article | null {
  const kept = candidate.senses
    .filter((s) => s.marks.length === 0 && s.definition.trim().length > 0)
    .slice(0, MAX_SENSES);
  const displayed = new Set(kept.flatMap((s) => shortExamples(s).slice(0, 1)));
  const senses = kept.map((s) => toSense(s, displayed));
  if (senses.length === 0) return null;
  return {
    headword: candidate.headword,
    nature: candidate.nature,
    ...(candidate.gender ? { gender: candidate.gender } : {}),
    senses,
    synonyms: relatedWords(candidate.synonyms, candidate.headword),
    antonyms: relatedWords(candidate.antonyms, candidate.headword),
    source: candidate.source,
  };
}

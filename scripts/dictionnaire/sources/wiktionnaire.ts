// Wiktionnaire (CC BY-SA 4.0), extrait JSON de kaikki.org. Le fichier fait
// 3,2 Go une fois décompressé : il est lu en flux, ligne à ligne, et seules
// les entrées des mots retenus sont analysées.
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { createGunzip } from "node:zlib";
import type { Candidate, CandidateSense } from "../types";
import { usageMarks } from "./marks";
import { genderFromKaikki, natureFromKaikki } from "./natures";
import { wikiToText } from "./wikitext";

export const KAIKKI_URL = "https://kaikki.org/frwiktionary/Fran%C3%A7ais/kaikki.org-dictionary-Fran%C3%A7ais.jsonl";

interface KaikkiExample {
  readonly text?: string;
  readonly ref?: string;
}

interface KaikkiSense {
  readonly glosses?: readonly string[];
  readonly tags?: readonly string[];
  readonly raw_tags?: readonly string[];
  readonly examples?: readonly KaikkiExample[];
}

interface KaikkiRelated {
  readonly word?: string;
  readonly tags?: readonly string[];
  readonly raw_tags?: readonly string[];
}

interface KaikkiEntry {
  readonly word: string;
  readonly pos_title?: string;
  readonly tags?: readonly string[];
  readonly senses?: readonly KaikkiSense[];
  readonly synonyms?: readonly KaikkiRelated[];
  readonly antonyms?: readonly KaikkiRelated[];
}

const SKIPPED_SENSE_TAGS = new Set(["form-of", "alt-of", "no-gloss"]);

function toSense(sense: KaikkiSense): CandidateSense | null {
  const tags = sense.tags ?? [];
  const gloss = sense.glosses?.at(-1);
  const definition = gloss ? wikiToText(gloss) : "";
  if (!definition || tags.some((t) => SKIPPED_SENSE_TAGS.has(t))) return null;
  // Les exemples sans référence sont écrits pour le Wiktionnaire, plus simples que les citations.
  const examples = [...(sense.examples ?? [])]
    .sort((a, b) => Number(Boolean(a.ref)) - Number(Boolean(b.ref)))
    .flatMap((e) => (e.text ? [wikiToText(e.text)] : []));
  return { definition, examples, marks: usageMarks([...tags, ...(sense.raw_tags ?? [])]) };
}

function relatedWords(related: readonly KaikkiRelated[] | undefined): string[] {
  return (related ?? [])
    .filter((r) => usageMarks([...(r.tags ?? []), ...(r.raw_tags ?? [])]).length === 0)
    .flatMap((r) => (r.word ? [r.word] : []));
}

function toCandidate(entry: KaikkiEntry): Candidate | null {
  const nature = natureFromKaikki(entry.pos_title ?? "");
  if (!nature) return null;
  const gender = nature === "nom" ? genderFromKaikki(entry.tags ?? []) : undefined;
  return {
    headword: entry.word,
    nature,
    ...(gender ? { gender } : {}),
    senses: (entry.senses ?? []).flatMap((s) => toSense(s) ?? []),
    synonyms: relatedWords(entry.synonyms),
    antonyms: relatedWords(entry.antonyms),
    source: "wiktionnaire",
  };
}

const WORD_PREFIX = /^\{"word": ("(?:[^"\\]|\\.)*")/;

/** Les entrées des seuls mots demandés, dans l'ordre du fichier. */
export async function readKaikki(path: string, wanted: ReadonlySet<string>): Promise<Candidate[]> {
  const lines = createInterface({ input: createReadStream(path).pipe(createGunzip()), crlfDelay: Infinity });
  const candidates: Candidate[] = [];
  for await (const line of lines) {
    const match = WORD_PREFIX.exec(line);
    if (!match || !wanted.has(JSON.parse(match[1]) as string)) continue;
    const candidate = toCandidate(JSON.parse(line) as KaikkiEntry);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

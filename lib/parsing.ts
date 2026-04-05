const WORD_SEPARATORS = /[,\s\n]+/;
const FRENCH_TEXT_SEPARATORS = /[.,;:!?\u00AB\u00BB"()\-\u2014'\u2019\s]+/;
const STANZA_SEPARATOR = /\n\s*\n/;

export function parseWords(text: string): string[] {
  return text
    .split(WORD_SEPARATORS)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

export function parseFullText(text: string): string[] {
  return text
    .split(FRENCH_TEXT_SEPARATORS)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function parseStanzas(text: string): { verses: string[] }[] {
  return text
    .split(STANZA_SEPARATOR)
    .map((block) =>
      block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .filter((verses) => verses.length > 0)
    .map((verses) => ({ verses }));
}

export function findDuplicates(words: string[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const word of words) {
    if (seen.has(word)) {
      duplicates.add(word);
    }
    seen.add(word);
  }
  return duplicates;
}

export function generateTitle(type: "dictation" | "poem"): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  const prefix = type === "dictation" ? "Dictée" : "Poème";
  return `${prefix} du ${day}/${month}/${year}`;
}

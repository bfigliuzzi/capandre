const WORD_SEPARATORS = /[,\n]+/;
const FRENCH_TEXT_SEPARATORS = /[.,;:!?\u00AB\u00BB"()\-\u2014'\u2019\s]+/;
const STANZA_SEPARATOR = /\n\s*\n/;

const FRENCH_ARTICLES =
  /^(?:de\s+la\s+|de\s+l['\u2019]\s*|les?\s+|la\s+|l['\u2019]\s*|une?\s+|des\s+|du\s+)/i;

export function parseWords(text: string): string[] {
  return text
    .split(WORD_SEPARATORS)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);
}

export function stripArticle(entry: string): string {
  return entry.replace(FRENCH_ARTICLES, "").trim().toLowerCase();
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

export function findDuplicates(
  words: string[],
  normalize: (w: string) => string = (w) => w,
): Set<string> {
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = normalize(word);
    const group = groups.get(key) ?? [];
    group.push(word);
    groups.set(key, group);
  }
  const duplicates = new Set<string>();
  for (const group of groups.values()) {
    if (group.length > 1) {
      for (const w of group) duplicates.add(w);
    }
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

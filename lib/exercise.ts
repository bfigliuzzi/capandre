// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExerciseLevel = "discovery" | "learning" | "mastery";

export interface ExerciseWord {
  article: string | null;
  baseWord: string;
  originalText: string;
}

export interface LetterResult {
  index: number;
  expected: string;
  given: string;
  masked: boolean;
  correct: boolean;
}

export interface WordResult {
  article: string | null;
  word: string;
  originalText: string;
  letters: LetterResult[];
  correct: boolean;
}

export interface ExerciseResults {
  title: string;
  level: ExerciseLevel;
  results: WordResult[];
  correctCount: number;
  totalCount: number;
  percentage: number;
}

// ---------------------------------------------------------------------------
// Article extraction
// ---------------------------------------------------------------------------

const FRENCH_ARTICLES =
  /^(?:de\s+la\s+|de\s+l['\u2019]\s*|les?\s+|la\s+|l['\u2019]\s*|une?\s+|des\s+|du\s+)/i;

export function extractArticle(text: string): {
  article: string | null;
  baseWord: string;
} {
  const trimmed = text.trim();
  const match = trimmed.match(FRENCH_ARTICLES);

  if (!match) {
    return { article: null, baseWord: trimmed };
  }

  const articlePart = match[0];
  const remaining = trimmed.slice(articlePart.length).trim();

  // If stripping the article leaves nothing, it's not an article
  if (!remaining) {
    return { article: null, baseWord: trimmed };
  }

  return { article: articlePart.trim(), baseWord: remaining };
}

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------

function getMaskRatio(level: ExerciseLevel): number {
  switch (level) {
    case "discovery":
      return 1 / 3;
    case "learning":
      return 3 / 4;
    case "mastery":
      return 1;
  }
}

export function computeMaskedPositions(
  word: string,
  level: ExerciseLevel,
): number[] {
  const len = word.length;
  if (len === 0) return [];

  const ratio = getMaskRatio(level);
  const count = Math.ceil(len * ratio);

  const indices: number[] = [];
  for (let i = 0; i < len; i++) indices.push(i);

  // Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, count).sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Shuffle
// ---------------------------------------------------------------------------

export function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateLetter(expected: string, given: string): boolean {
  if (!given) return false;
  return given.toLowerCase() === expected.toLowerCase();
}

export function computeResults(
  title: string,
  level: ExerciseLevel,
  words: ExerciseWord[],
  maskedPositions: number[][],
  userAnswers: string[][],
): ExerciseResults {
  const results: WordResult[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i].baseWord;
    const masked = maskedPositions[i];
    const answers = userAnswers[i];

    const letters: LetterResult[] = [];
    let allCorrect = true;

    for (let j = 0; j < word.length; j++) {
      const isMasked = masked.includes(j);
      if (isMasked) {
        const correct = validateLetter(word[j], answers[j] ?? "");
        if (!correct) allCorrect = false;
        letters.push({
          index: j,
          expected: word[j],
          given: answers[j] ?? "",
          masked: true,
          correct,
        });
      } else {
        letters.push({
          index: j,
          expected: word[j],
          given: word[j],
          masked: false,
          correct: true,
        });
      }
    }

    results.push({
      article: words[i].article,
      word,
      originalText: words[i].originalText,
      letters,
      correct: allCorrect,
    });
  }

  const correctCount = results.filter((r) => r.correct).length;
  const totalCount = results.length;
  const percentage =
    totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  return { title, level, results, correctCount, totalCount, percentage };
}

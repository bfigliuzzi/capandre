// Un générateur par compétence, chacun avec sa règle d'éligibilité (R16–R22).
// Un générateur renvoie null quand plus aucun mot n'est éligible.
import { shuffleWithRng } from "../multiplication/random";
import { compareHeadwords } from "./collation";
import { CHOICES_PER_QUESTION, COMMON_NATURES, ORDER_PREFIX_LENGTHS, ORDER_WORD_COUNTS } from "./constants";
import type { Article, ArticleField, ArticleRef, ChoiceFields, DictionaryFile, DictionaryPage, Question, Rng, Skill } from "./types";

export interface GeneratorContext {
  readonly dictionary: DictionaryFile;
  readonly rng: Rng;
  /** Mots d'entrée déjà employés dans l'entraînement. */
  readonly usedWords: ReadonlySet<string>;
}

type Generator = (ctx: GeneratorContext) => Question | null;

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

/** Lettres seules, sans accent ni majuscule : la clé du premier passage de l'ordre alphabétique. */
function bareLetters(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-zœæ]/g, "");
}

function availableHeadwords(ctx: GeneratorContext): string[] {
  const all = ctx.dictionary.pages.flatMap((p) => p.articles.map((a) => a.headword));
  const unique = [...new Set(all)].filter((w) => !ctx.usedWords.has(w));
  // Deux mots qui ne diffèrent que par l'accent (cote, côte) rendraient l'ordre ambigu pour l'enfant.
  const byBare = new Map<string, string>();
  for (const word of unique) if (!byBare.has(bareLetters(word))) byBare.set(bareLetters(word), word);
  return [...byBare.values()];
}

function groupsByPrefix(words: readonly string[], prefixLength: number, minSize: number): string[][] {
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = bareLetters(word).slice(0, prefixLength);
    if (key.length < prefixLength) continue;
    groups.set(key, [...(groups.get(key) ?? []), word]);
  }
  return [...groups.values()].filter((g) => g.length >= minSize);
}

function shuffleUnlike(solution: readonly string[], rng: Rng): string[] {
  const shuffled = shuffleWithRng(solution, rng);
  if (shuffled.some((w, i) => w !== solution[i])) return shuffled;
  return [...solution.slice(1), solution[0]];
}

const generateOrder: Generator = (ctx) => {
  const words = availableHeadwords(ctx);
  const combos = shuffleWithRng(
    ORDER_WORD_COUNTS.flatMap((count) => ORDER_PREFIX_LENGTHS.map((prefix) => ({ count, prefix }))),
    ctx.rng,
  );
  for (const { count, prefix } of combos) {
    const groups = groupsByPrefix(words, prefix, count);
    if (groups.length === 0) continue;
    const chosen = shuffleWithRng(pick(groups, ctx.rng), ctx.rng).slice(0, count);
    const solution = [...chosen].sort(compareHeadwords);
    return { skill: "ranger", words: solution, solution, shuffled: shuffleUnlike(solution, ctx.rng) };
  }
  return null;
};

interface Located {
  readonly ref: ArticleRef;
  readonly article: Article;
}

function locateAll(dictionary: DictionaryFile): Located[] {
  return dictionary.pages.flatMap((page) =>
    page.articles.map((article, index) => ({ ref: { page: page.number, index }, article })),
  );
}

/** Articles qu'on peut demander de chercher : mot pas encore employé, et sans homographe. */
function searchTargets(ctx: GeneratorContext, eligible: (a: Article) => boolean = () => true): Located[] {
  const all = locateAll(ctx.dictionary);
  const counts = new Map<string, number>();
  for (const { article } of all) counts.set(article.headword, (counts.get(article.headword) ?? 0) + 1);
  return all.filter(
    ({ article }) =>
      counts.get(article.headword) === 1 && !ctx.usedWords.has(article.headword) && eligible(article),
  );
}

const generateSearch: Generator = (ctx) => {
  const targets = searchTargets(ctx);
  if (targets.length === 0) return null;
  const { ref, article } = pick(targets, ctx.rng);
  return { skill: "chercher", words: [article.headword], target: ref, headword: article.headword };
};

/** Mélange la bonne proposition parmi les mauvaises. */
function choiceFields(prompt: string, correct: string, wrongs: readonly string[], rng: Rng): ChoiceFields {
  const choices = shuffleWithRng([correct, ...wrongs], rng);
  return { prompt, choices, answerIndex: choices.indexOf(correct) };
}

function guidePair(page: DictionaryPage): string {
  return page.guideWords.join(" – ");
}

function guideWordsQuestion(ctx: GeneratorContext, page: DictionaryPage): Question | null {
  const { pages } = ctx.dictionary;
  const correct = guidePair(page);
  const nearest = [...pages]
    .filter((p) => p.number !== page.number && guidePair(p) !== correct)
    .sort((a, b) => Math.abs(a.number - page.number) - Math.abs(b.number - page.number))
    .slice(0, CHOICES_PER_QUESTION - 1)
    .map(guidePair);
  if (nearest.length < CHOICES_PER_QUESTION - 1) return null;
  const prompt = `Quels sont les mots repères de la page ${page.number} ?`;
  return { skill: "lire-page", page: page.number, words: [...page.guideWords], ...choiceFields(prompt, correct, nearest, ctx.rng) };
}

function wordOnPageQuestion(ctx: GeneratorContext, page: DictionaryPage): Question | null {
  const unused = (p: DictionaryPage | undefined) =>
    (p?.articles ?? []).map((a) => a.headword).filter((w) => !ctx.usedWords.has(w));
  const here = unused(page);
  const nearby = [...unused(ctx.dictionary.pages[page.number - 2]), ...unused(ctx.dictionary.pages[page.number])];
  const wantsYes = ctx.rng() < 0.5;
  const pool = (wantsYes && here.length > 0) || nearby.length === 0 ? here : nearby;
  if (pool.length === 0) return null;
  const word = pick(pool, ctx.rng);
  const prompt = `Le mot « ${word} » est-il sur la page ${page.number} ?`;
  const answerIndex = pool === here ? 0 : 1;
  return { skill: "lire-page", page: page.number, words: [word], prompt, choices: ["Oui", "Non"], answerIndex };
}

const generatePageReading: Generator = (ctx) => {
  const candidates = ctx.dictionary.pages
    .slice(0, -1)
    .filter((p) => !p.guideWords.some((w) => ctx.usedWords.has(w)));
  if (candidates.length === 0) return null;
  const page = pick(candidates, ctx.rng);
  const first = ctx.rng() < 0.5 ? guideWordsQuestion : wordOnPageQuestion;
  const second = first === guideWordsQuestion ? wordOnPageQuestion : guideWordsQuestion;
  return first(ctx, page) ?? second(ctx, page);
};

type FieldBuilder = (article: Article, ctx: GeneratorContext) => ChoiceFields | null;

function natureChoices(article: Article, ctx: GeneratorContext): ChoiceFields {
  const wrongs = COMMON_NATURES.filter((n) => n !== article.nature).slice(0, CHOICES_PER_QUESTION - 1);
  return choiceFields(`Quelle est la nature du mot « ${article.headword} » ?`, article.nature, wrongs, ctx.rng);
}

function genderChoices(article: Article, ctx: GeneratorContext): ChoiceFields | null {
  if (article.nature !== "nom" || !article.gender) return null;
  const wrong = article.gender === "masculin" ? "féminin" : "masculin";
  return choiceFields(`Quel est le genre du nom « ${article.headword} » ?`, article.gender, [wrong], ctx.rng);
}

function senseCountChoices(article: Article): ChoiceFields {
  const choices = ["1", "2", "3"];
  return {
    prompt: `Combien de sens le mot « ${article.headword} » a-t-il dans ce dictionnaire ?`,
    choices,
    answerIndex: choices.indexOf(String(article.senses.length)),
  };
}

function relatedWordChoices(field: "synonyme" | "contraire"): FieldBuilder {
  return (article, ctx) => {
    const own = field === "synonyme" ? article.synonyms : article.antonyms;
    if (own.length === 0) return null;
    const related = new Set([article.headword, ...article.synonyms, ...article.antonyms]);
    const others = locateAll(ctx.dictionary)
      .map((l) => l.article)
      .filter((a) => a.nature === article.nature && !related.has(a.headword))
      .map((a) => a.headword);
    const wrongs = shuffleWithRng([...new Set(others)], ctx.rng).slice(0, CHOICES_PER_QUESTION - 1);
    if (wrongs.length < CHOICES_PER_QUESTION - 1) return null;
    const prompt = `Quel mot est un ${field} de « ${article.headword} » ?`;
    return choiceFields(prompt, pick(own, ctx.rng), wrongs, ctx.rng);
  };
}

function exampleChoices(article: Article, ctx: GeneratorContext): ChoiceFields | null {
  const numbered = article.senses.map((s, i) => ({ number: i + 1, example: s.example }));
  const withExample = numbered.filter((s): s is { number: number; example: string } => Boolean(s.example));
  if (withExample.length < 2) return null;
  const asked = pick(withExample, ctx.rng);
  const wrongs = withExample.filter((s) => s !== asked).map((s) => s.example);
  const prompt = `Quel est l'exemple du sens ${asked.number} du mot « ${article.headword} » ?`;
  return choiceFields(prompt, asked.example, wrongs, ctx.rng);
}

const FIELD_BUILDERS: Readonly<Record<ArticleField, FieldBuilder>> = {
  nature: natureChoices,
  genre: genderChoices,
  "nombre-sens": senseCountChoices,
  synonyme: relatedWordChoices("synonyme"),
  contraire: relatedWordChoices("contraire"),
  exemple: exampleChoices,
};

const generateArticleReading: Generator = (ctx) => {
  const targets = searchTargets(ctx);
  if (targets.length === 0) return null;
  const { ref, article } = pick(targets, ctx.rng);
  const fields = shuffleWithRng(Object.keys(FIELD_BUILDERS) as ArticleField[], ctx.rng);
  for (const field of fields) {
    const choices = FIELD_BUILDERS[field](article, ctx);
    if (!choices) continue;
    return { skill: "lire-article", field, words: [article.headword], target: ref, headword: article.headword, ...choices };
  }
  return null;
};

interface QuizSense {
  /** Numéro du sens dans l'article, à partir de 1. */
  readonly number: number;
  readonly sentence: string;
}

/** Sens utilisables en question : phrase réservée, différente de l'exemple affiché (R22). */
function quizSenses(article: Article): QuizSense[] {
  return article.senses.flatMap((sense, i) =>
    sense.quizExample && sense.quizExample !== sense.example
      ? [{ number: i + 1, sentence: sense.quizExample }]
      : [],
  );
}

/** Éligibilité des deux compétences de sens : au moins 2 sens avec une phrase de question. */
export function hasQuizSenses(article: Article): boolean {
  return quizSenses(article).length >= 2;
}

const generateSenseFromContext: Generator = (ctx) => {
  const targets = searchTargets(ctx, hasQuizSenses);
  if (targets.length === 0) return null;
  const { ref, article } = pick(targets, ctx.rng);
  const asked = pick(quizSenses(article), ctx.rng);
  return {
    skill: "sens-contexte",
    words: [article.headword],
    target: ref,
    headword: article.headword,
    sentence: asked.sentence,
    prompt: `Dans cette phrase, quel sens du mot « ${article.headword} » est utilisé ?`,
    choices: article.senses.map((_, i) => `Sens ${i + 1}`),
    answerIndex: asked.number - 1,
  };
};

const generateSenseUsage: Generator = (ctx) => {
  const targets = searchTargets(ctx, hasQuizSenses);
  if (targets.length === 0) return null;
  const { ref, article } = pick(targets, ctx.rng);
  const senses = quizSenses(article);
  const asked = pick(senses, ctx.rng);
  const wrongs = senses.filter((s) => s !== asked).map((s) => s.sentence);
  const prompt = `Dans quelle phrase le mot « ${article.headword} » a-t-il le sens ${asked.number} ?`;
  return {
    skill: "utiliser-sens",
    words: [article.headword],
    target: ref,
    headword: article.headword,
    ...choiceFields(prompt, asked.sentence, wrongs, ctx.rng),
  };
};

const GENERATORS: Readonly<Record<Skill, Generator>> = {
  "sens-contexte": generateSenseFromContext,
  "utiliser-sens": generateSenseUsage,
  "lire-article": generateArticleReading,
  ranger: generateOrder,
  chercher: generateSearch,
  "lire-page": generatePageReading,
};

export function generateQuestion(skill: Skill, ctx: GeneratorContext): Question | null {
  return GENERATORS[skill](ctx);
}

/** Nombre de mots (ou de pages pour « lire une page ») sur lesquels chaque compétence peut porter. */
export function eligibleCounts(dictionary: DictionaryFile): Readonly<Record<Skill, number>> {
  const ctx: GeneratorContext = { dictionary, rng: () => 0, usedWords: new Set() };
  const searchable = searchTargets(ctx).length;
  const senses = searchTargets(ctx, hasQuizSenses).length;
  return {
    ranger: availableHeadwords(ctx).length,
    chercher: searchable,
    "lire-page": Math.max(dictionary.pages.length - 1, 0),
    "lire-article": searchable,
    "sens-contexte": senses,
    "utiliser-sens": senses,
  };
}

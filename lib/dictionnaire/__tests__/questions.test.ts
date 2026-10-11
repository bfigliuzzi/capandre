import { describe, expect, it } from "vitest";
import { seededRng } from "../../multiplication/__tests__/test-rng";
import { compareHeadwords } from "../collation";
import { generateQuestion } from "../questions";
import { paginate } from "../pagination";
import type { Article, Question, Skill } from "../types";
import { FIXTURE_DICTIONARY } from "./fixtures";

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);

function generate<S extends Skill>(
  skill: S,
  seed: number,
  usedWords: ReadonlySet<string> = new Set(),
): Extract<Question, { skill: S }> {
  const question = generateQuestion(skill, {
    dictionary: FIXTURE_DICTIONARY,
    rng: seededRng(seed),
    usedWords,
  });
  if (!question || question.skill !== skill) throw new Error(`aucune question ${skill}`);
  return question as Extract<Question, { skill: S }>;
}

function bare(word: string): string {
  return word.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

describe("ranger (R16)", () => {
  it("propose 4 ou 5 mots du dictionnaire qui partagent leur première lettre", () => {
    for (const seed of SEEDS) {
      const { solution } = generate("ranger", seed);
      expect([4, 5]).toContain(solution.length);
      expect(new Set(solution.map((w) => bare(w)[0])).size).toBe(1);
    }
  });

  it("donne pour solution l'ordre alphabétique, et présente les mots dans un autre ordre", () => {
    for (const seed of SEEDS) {
      const { shuffled, solution } = generate("ranger", seed);
      expect(solution).toEqual([...solution].sort(compareHeadwords));
      expect([...shuffled].sort(compareHeadwords)).toEqual(solution);
      expect(shuffled).not.toEqual(solution);
    }
  });

  it("n'utilise pas un mot déjà employé dans l'entraînement", () => {
    const usedWords = new Set(["balle", "ballon", "chat", "maison"]);
    for (const seed of SEEDS) {
      const { words } = generate("ranger", seed, usedWords);
      expect(words.some((w) => usedWords.has(w))).toBe(false);
    }
  });
});

function articleAt(ref: { page: number; index: number }) {
  return FIXTURE_DICTIONARY.pages[ref.page - 1].articles[ref.index];
}

describe("chercher (R17)", () => {
  it("demande un mot d'entrée et désigne son article dans le dictionnaire", () => {
    for (const seed of SEEDS) {
      const question = generate("chercher", seed);
      expect(articleAt(question.target).headword).toBe(question.headword);
      expect(question.words).toEqual([question.headword]);
    }
  });

  it("ne demande jamais un homographe, dont l'article serait ambigu", () => {
    for (const seed of SEEDS) {
      expect(generate("chercher", seed).headword).not.toBe("fin");
    }
  });

  it("ne redemande pas un mot déjà employé", () => {
    const all = FIXTURE_DICTIONARY.pages.flatMap((p) => p.articles.map((a) => a.headword));
    const usedWords = new Set(all.filter((w) => w !== "renard"));
    expect(generate("chercher", 1, usedWords).headword).toBe("renard");
  });
});

const LAST_PAGE = FIXTURE_DICTIONARY.pages.length;

function pageAt(number: number) {
  return FIXTURE_DICTIONARY.pages[number - 1];
}

function headwordsOf(number: number): string[] {
  return pageAt(number)?.articles.map((a) => a.headword) ?? [];
}

describe("lire une page (R18)", () => {
  it("ne porte jamais sur la dernière page", () => {
    for (const seed of SEEDS) {
      const { page } = generate("lire-page", seed);
      expect(page).toBeGreaterThanOrEqual(1);
      expect(page).toBeLessThan(LAST_PAGE);
    }
  });

  it("mots repères : la bonne paire parmi 4, les autres venant des pages voisines (3 pages au plus)", () => {
    const questions = SEEDS.map((seed) => generate("lire-page", seed)).filter((q) => q.choices.length === 4);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      const pairOf = (n: number) => pageAt(n).guideWords.join(" – ");
      expect(q.choices[q.answerIndex]).toBe(pairOf(q.page));
      expect(new Set(q.choices).size).toBe(4);
      const neighbours = [q.page - 3, q.page - 2, q.page - 1, q.page + 1, q.page + 2, q.page + 3]
        .filter((n) => n >= 1 && n <= LAST_PAGE)
        .map(pairOf);
      for (const choice of q.choices.filter((_, i) => i !== q.answerIndex)) {
        expect(neighbours).toContain(choice);
      }
    }
  });

  it("mot présent : « Oui » si le mot est sur la page, « Non » s'il est sur une page voisine", () => {
    const questions = SEEDS.map((seed) => generate("lire-page", seed)).filter((q) => q.choices.length === 2);
    expect(questions.map((q) => q.choices[q.answerIndex])).toEqual(expect.arrayContaining(["Oui", "Non"]));
    for (const q of questions) {
      expect(q.choices).toEqual(["Oui", "Non"]);
      const [word] = q.words;
      expect(q.prompt).toContain(word);
      const onPage = headwordsOf(q.page).includes(word);
      expect(q.choices[q.answerIndex]).toBe(onPage ? "Oui" : "Non");
      if (!onPage) expect([...headwordsOf(q.page - 1), ...headwordsOf(q.page + 1)]).toContain(word);
    }
  });
});

function generateMany<S extends Skill>(skill: S): Extract<Question, { skill: S }>[] {
  return Array.from({ length: 200 }, (_, i) => generate(skill, i + 1));
}

describe("lire un article (R19)", () => {
  const questions = generateMany("lire-article");
  const ofField = (field: string) => questions.filter((q) => q.field === field);

  it("demande tour à tour la nature, le genre, le nombre de sens, un synonyme, un contraire, un exemple", () => {
    expect(new Set(questions.map((q) => q.field))).toEqual(
      new Set(["nature", "genre", "nombre-sens", "synonyme", "contraire", "exemple"]),
    );
  });

  it("porte sur l'article à chercher, avec des propositions toutes différentes", () => {
    for (const q of questions) {
      expect(articleAt(q.target).headword).toBe(q.headword);
      expect(q.prompt).toContain(q.headword);
      expect(new Set(q.choices).size).toBe(q.choices.length);
    }
  });

  it("nature : la bonne parmi des natures courantes", () => {
    for (const q of ofField("nature")) {
      expect(q.choices[q.answerIndex]).toBe(articleAt(q.target).nature);
      expect(q.choices).toHaveLength(4);
    }
  });

  it("genre : demandé seulement pour un nom, entre masculin et féminin", () => {
    for (const q of ofField("genre")) {
      const article = articleAt(q.target);
      expect(article.nature).toBe("nom");
      expect(q.choices).toEqual(expect.arrayContaining(["masculin", "féminin"]));
      expect(q.choices[q.answerIndex]).toBe(article.gender);
    }
  });

  it("nombre de sens : le nombre de sens numérotés de l'article", () => {
    for (const q of ofField("nombre-sens")) {
      expect(q.choices[q.answerIndex]).toBe(String(articleAt(q.target).senses.length));
    }
  });

  it("synonyme et contraire : la bonne réponse vient de l'article, les autres d'articles de même nature", () => {
    for (const q of [...ofField("synonyme"), ...ofField("contraire")]) {
      const article = articleAt(q.target);
      const own = q.field === "synonyme" ? article.synonyms : article.antonyms;
      expect(own).toContain(q.choices[q.answerIndex]);
      const sameNature = FIXTURE_DICTIONARY.pages
        .flatMap((p) => p.articles)
        .filter((a) => a.nature === article.nature && a.headword !== article.headword)
        .map((a) => a.headword);
      for (const wrong of q.choices.filter((_, i) => i !== q.answerIndex)) {
        expect(sameNature).toContain(wrong);
        expect([...article.synonyms, ...article.antonyms]).not.toContain(wrong);
      }
    }
  });

  it("exemple : l'exemple affiché du sens demandé, parmi ceux des autres sens", () => {
    for (const q of ofField("exemple")) {
      const article = articleAt(q.target);
      const senseNumber = Number(q.prompt.match(/sens (\d)/)?.[1]);
      expect(q.choices[q.answerIndex]).toBe(article.senses[senseNumber - 1].example);
      expect(article.senses.map((s) => s.example)).toEqual(expect.arrayContaining([...q.choices]));
    }
  });
});

const DISPLAYED_EXAMPLES = new Set(
  FIXTURE_DICTIONARY.pages.flatMap((p) => p.articles.flatMap((a) => a.senses.map((s) => s.example))),
);

function quizSenseCount(ref: { page: number; index: number }): number {
  return articleAt(ref).senses.filter((s) => s.quizExample).length;
}

describe("sens grâce au contexte (R20)", () => {
  const questions = generateMany("sens-contexte");

  it("ne porte que sur un mot qui a au moins 2 sens avec une phrase de question", () => {
    for (const q of questions) expect(quizSenseCount(q.target)).toBeGreaterThanOrEqual(2);
  });

  it("donne la phrase d'un sens et fait choisir son numéro parmi ceux de l'article", () => {
    for (const q of questions) {
      const senses = articleAt(q.target).senses;
      expect(q.choices).toEqual(senses.map((_, i) => `Sens ${i + 1}`));
      expect(senses[q.answerIndex].quizExample).toBe(q.sentence);
    }
  });
});

describe("utiliser les sens (R21)", () => {
  const questions = generateMany("utiliser-sens");

  it("fait choisir la phrase où le mot a le sens demandé, parmi les phrases des autres sens", () => {
    for (const q of questions) {
      const senses = articleAt(q.target).senses;
      const senseNumber = Number(q.prompt.match(/sens (\d)/)?.[1]);
      expect(q.choices[q.answerIndex]).toBe(senses[senseNumber - 1].quizExample);
      expect(senses.map((s) => s.quizExample)).toEqual(expect.arrayContaining([...q.choices]));
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("phrase de question jamais affichée (R22)", () => {
  it("n'utilise jamais un exemple affiché dans le dictionnaire", () => {
    for (const q of generateMany("sens-contexte")) expect(DISPLAYED_EXAMPLES.has(q.sentence)).toBe(false);
    for (const q of generateMany("utiliser-sens")) {
      for (const choice of q.choices) expect(DISPLAYED_EXAMPLES.has(choice)).toBe(false);
    }
  });

  it("écarte un sens dont la phrase de question est identique à son exemple affiché", () => {
    const same = "Le chat dort.";
    const dictionary = {
      ...FIXTURE_DICTIONARY,
      pages: [
        {
          number: 1,
          guideWords: ["chat", "chat"] as const,
          articles: [
            {
              headword: "chat",
              nature: "nom" as const,
              senses: [
                { definition: "animal", example: same, quizExample: same },
                { definition: "jeu", example: "On joue à chat.", quizExample: "Tu es chat, attrape-nous !" },
              ],
              synonyms: [],
              antonyms: [],
              source: "dicoado" as const,
            },
          ],
        },
      ],
    };
    for (const seed of SEEDS) {
      const ctx = { dictionary, rng: seededRng(seed), usedWords: new Set<string>() };
      expect(generateQuestion("sens-contexte", ctx)).toBeNull();
      expect(generateQuestion("utiliser-sens", ctx)).toBeNull();
    }
  });
});

describe("mauvaises propositions vérifiées contre tout le dictionnaire", () => {
  function entry(headword: string, nature: Article["nature"], extra: Partial<Article> = {}): Article {
    return { headword, nature, senses: [{ definition: headword }], synonyms: [], antonyms: [], source: "dicoado", ...extra };
  }

  it("lire une page : un homographe à cheval sur deux pages n'est jamais proposé comme absent", () => {
    const articles = [
      entry("abri", "nom"), entry("bien", "adverbe"),
      entry("bien", "nom"), entry("bol", "nom"),
      entry("cil", "nom"), entry("dé", "nom"),
    ];
    const pages = paginate(articles, 2);
    const dictionary = { version: 1, articlesPerPage: 2, pages };
    for (const seed of Array.from({ length: 200 }, (_, i) => i + 1)) {
      const q = generateQuestion("lire-page", { dictionary, rng: seededRng(seed), usedWords: new Set() });
      if (!q || q.skill !== "lire-page" || q.choices.length !== 2) continue;
      const onPage = pages[q.page - 1].articles.some((a) => a.headword === q.words[0]);
      expect(q.choices[q.answerIndex]).toBe(onPage ? "Oui" : "Non");
    }
  });

  it("lire un article : un mot qui cite l'article comme synonyme n'est pas une mauvaise proposition", () => {
    const articles = [
      entry("profiter", "verbe", { synonyms: ["jouir"] }),
      entry("bénéficier", "verbe", { synonyms: ["profiter"] }),
      entry("courir", "verbe"), entry("manger", "verbe"), entry("dormir", "verbe"), entry("lire", "verbe"),
    ];
    const dictionary = { version: 1, articlesPerPage: 8, pages: paginate(articles, 8) };
    for (const seed of Array.from({ length: 300 }, (_, i) => i + 1)) {
      const q = generateQuestion("lire-article", { dictionary, rng: seededRng(seed), usedWords: new Set() });
      if (!q || q.skill !== "lire-article" || q.field !== "synonyme" || q.headword !== "profiter") continue;
      expect(q.choices).not.toContain("bénéficier");
    }
  });

  it("R22 : une phrase de question n'est jamais l'exemple affiché d'un autre sens de l'article", () => {
    const articles = [
      entry("miner", "verbe", {
        senses: [
          { definition: "creuser", example: "On mine la colline.", quizExample: "Les eaux minent la falaise peu à peu." },
          { definition: "affaiblir", example: "Le chagrin la mine.", quizExample: "Les eaux minent la falaise peu à peu." },
          { definition: "poser des mines", example: "Les eaux minent la falaise peu à peu.", quizExample: "Les soldats minent le pont avant de partir." },
        ],
      }),
    ];
    const dictionary = { version: 1, articlesPerPage: 8, pages: paginate(articles, 8) };
    for (const seed of SEEDS) {
      const ctx = { dictionary, rng: seededRng(seed), usedWords: new Set<string>() };
      const q = generateQuestion("utiliser-sens", ctx);
      for (const choice of q && "choices" in q ? q.choices : []) expect(choice).not.toBe("Les eaux minent la falaise peu à peu.");
    }
  });
});

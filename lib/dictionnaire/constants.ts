import type { Gender, Nature, Skill } from "./types";

/** Nombre d'articles par page : il détermine le nombre total de pages. */
export const ARTICLES_PAR_PAGE = 8;

export const QUESTIONS_PAR_ENTRAINEMENT = 10;

/** Étoiles selon le nombre de bonnes réponses sur 10 (R25), du plus exigeant au moins exigeant. */
export const STAR_THRESHOLDS: readonly { readonly minScore: number; readonly stars: number }[] = [
  { minScore: 9, stars: 3 },
  { minScore: 7, stars: 2 },
  { minScore: 5, stars: 1 },
];

/** Version du fichier livré attendue par l'app : `public/dictionnaire/dictionnaire-v<N>.json`. */
export const DICTIONARY_DATA_VERSION = 1;

/** Ordre de présentation des compétences, celui de la fiche d'évaluation. */
export const SKILLS: readonly Skill[] = [
  "ranger",
  "chercher",
  "lire-page",
  "lire-article",
  "sens-contexte",
  "utiliser-sens",
];

export const SKILL_LABELS: Readonly<Record<Skill, string>> = {
  ranger: "Ranger les mots par ordre alphabétique",
  chercher: "Chercher un mot",
  "lire-page": "Lire une page",
  "lire-article": "Lire un article",
  "sens-contexte": "Trouver le sens grâce au contexte",
  "utiliser-sens": "Utiliser les différents sens d'un mot",
};

/** Abréviation affichée dans l'article (c'est ce qu'on apprend à lire). */
export const NATURE_ABBREVIATIONS: Readonly<Record<Nature, string>> = {
  nom: "n.",
  verbe: "v.",
  adjectif: "adj.",
  adverbe: "adv.",
  pronom: "pron.",
  préposition: "prép.",
  conjonction: "conj.",
  déterminant: "dét.",
  interjection: "interj.",
};

export const GENDER_ABBREVIATIONS: Readonly<Record<Gender, string>> = {
  masculin: "m.",
  féminin: "f.",
};

/** Ordre des homographes de même mot d'entrée (fin n. f., puis fin adj.). */
export const NATURE_ORDER: readonly Nature[] = [
  "nom",
  "verbe",
  "adjectif",
  "adverbe",
  "pronom",
  "déterminant",
  "préposition",
  "conjonction",
  "interjection",
];

/** Les natures proposées en mauvaises réponses de « lire un article ». */
export const COMMON_NATURES: readonly Nature[] = ["nom", "verbe", "adjectif", "adverbe"];

/** Nombre de propositions d'une question à choix. */
export const CHOICES_PER_QUESTION = 4;

/** Ranger : 4 ou 5 mots, partageant de 1 à 3 premières lettres (R16). */
export const ORDER_WORD_COUNTS: readonly number[] = [4, 5];
export const ORDER_PREFIX_LENGTHS: readonly number[] = [1, 2, 3];

export const LETTERS: readonly string[] = "abcdefghijklmnopqrstuvwxyz".split("");

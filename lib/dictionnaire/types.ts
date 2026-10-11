// Types du module « Dictionnaire ». Vocabulaire : CONTEXT.md.
// Imports RELATIFS uniquement, comme dans lib/multiplication/.

/** Générateur pseudo-aléatoire injectable : renvoie un nombre dans [0, 1). */
export type Rng = () => number;

export type Nature =
  | "nom"
  | "verbe"
  | "adjectif"
  | "adverbe"
  | "pronom"
  | "préposition"
  | "conjonction"
  | "déterminant"
  | "interjection";

export type Gender = "masculin" | "féminin";

export interface Sense {
  readonly definition: string;
  /** Affiché dans l'article. */
  readonly example?: string;
  /** Réservé aux questions de sens, jamais affiché (R22). */
  readonly quizExample?: string;
}

export interface Article {
  /** Mot d'entrée. */
  readonly headword: string;
  readonly nature: Nature;
  /** Noms seulement. */
  readonly gender?: Gender;
  /** 1 à 3. */
  readonly senses: readonly Sense[];
  readonly synonyms: readonly string[];
  /** Contraires. */
  readonly antonyms: readonly string[];
  readonly source: "dicoado" | "wiktionnaire";
}

export interface DictionaryPage {
  /** 1, 2, 3… */
  readonly number: number;
  /** Mots repères : mot d'entrée du premier et du dernier article. */
  readonly guideWords: readonly [string, string];
  readonly articles: readonly Article[];
}

export interface DictionaryFile {
  readonly version: number;
  readonly articlesPerPage: number;
  readonly pages: readonly DictionaryPage[];
}

/** Position d'un article dans le dictionnaire. */
export interface ArticleRef {
  readonly page: number;
  readonly index: number;
}

export type Skill =
  | "ranger"
  | "chercher"
  | "lire-page"
  | "lire-article"
  | "sens-contexte"
  | "utiliser-sens";

/** Ce que « lire un article » demande d'identifier (R19). */
export type ArticleField = "nature" | "genre" | "nombre-sens" | "synonyme" | "contraire" | "exemple";

/** Question à choix : consigne, propositions, indice de la bonne. */
export interface ChoiceFields {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly answerIndex: number;
}

interface QuestionBase {
  /** Mots d'entrée sur lesquels porte la question : jamais deux fois dans un entraînement. */
  readonly words: readonly string[];
}

/** Questions qui commencent par trouver l'article dans le dictionnaire. */
interface SearchFields {
  readonly target: ArticleRef;
  readonly headword: string;
}

export type Question =
  | (QuestionBase & {
      readonly skill: "ranger";
      /** Dans l'ordre présenté à l'enfant. */
      readonly shuffled: readonly string[];
      /** Dans l'ordre alphabétique. */
      readonly solution: readonly string[];
    })
  | (QuestionBase & SearchFields & { readonly skill: "chercher" })
  | (QuestionBase & ChoiceFields & { readonly skill: "lire-page"; readonly page: number })
  | (QuestionBase &
      SearchFields &
      ChoiceFields & { readonly skill: "lire-article"; readonly field: ArticleField })
  | (QuestionBase &
      SearchFields &
      ChoiceFields & { readonly skill: "sens-contexte"; readonly sentence: string })
  | (QuestionBase & SearchFields & ChoiceFields & { readonly skill: "utiliser-sens" });

export type Answer =
  | { readonly kind: "ordre"; readonly words: readonly string[] }
  | { readonly kind: "article"; readonly headword: string }
  | { readonly kind: "choix"; readonly index: number }
  | { readonly kind: "abandon" };

export interface Outcome {
  readonly correct: boolean;
  /** Texte de correction, en français : « Bonne réponse » ou « La bonne réponse était… ». */
  readonly message: string;
  /** Bonne réponse après « Je n'y arrive pas » : ne compte pas, sans être une erreur. */
  readonly helped?: boolean;
}

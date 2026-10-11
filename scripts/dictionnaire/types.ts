// Types intermédiaires du script : ce que chaque source produit avant filtrage et fusion.
import type { Gender, Nature } from "../../lib/dictionnaire/types";

/** Une ligne de la liste Manulex. Sert à choisir les mots ; rien n'en est livré (R30). */
export interface Lemma {
  readonly headword: string;
  readonly nature: Nature;
  /** Fréquence par million de mots, CP à CM2. */
  readonly frequency: number;
}

/** Marques d'usage qui retirent un sens (R28). */
export type UsageMark = "vulgaire" | "vieilli" | "argot";

export interface CandidateSense {
  readonly definition: string;
  /** Exemples dans l'ordre de la source. */
  readonly examples: readonly string[];
  readonly marks: readonly UsageMark[];
}

/** Un article tel que lu dans une source, avant filtres. */
export interface Candidate {
  readonly headword: string;
  readonly nature: Nature;
  readonly gender?: Gender;
  readonly senses: readonly CandidateSense[];
  readonly synonyms: readonly string[];
  readonly antonyms: readonly string[];
  readonly source: "dicoado" | "wiktionnaire";
}

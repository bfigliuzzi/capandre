// Correspondance des natures de chaque source vers celles du dictionnaire.
// null : la nature n'entre pas dans le dictionnaire (nom propre, locution, sigle…).
import type { Gender, Nature } from "../../../lib/dictionnaire/types";

const MANULEX: Readonly<Record<string, Nature>> = {
  NC: "nom",
  VER: "verbe",
  ADJ: "adjectif",
  ADV: "adverbe",
  PRO: "pronom",
  PRE: "préposition",
  CON: "conjonction",
  DET: "déterminant",
  INT: "interjection",
};

export function natureFromManulex(code: string): Nature | null {
  return MANULEX[code.trim()] ?? null;
}

export interface NatureAndGender {
  readonly nature: Nature;
  readonly gender?: Gender;
}

const DICOADO_SIMPLE: Readonly<Record<string, Nature>> = {
  adjectif: "adjectif",
  verbe: "verbe",
  adverbe: "adverbe",
  pronom: "pronom",
  préposition: "préposition",
  conjonction: "conjonction",
  déterminant: "déterminant",
  interjection: "interjection",
};

/** Champ `classe` du Dico des Ados : « nom commun (féminin) », « verbe »… */
export function natureFromDicoado(classe: string): NatureAndGender | null {
  const label = classe.trim().toLowerCase();
  if (label === "nom commun (masculin)") return { nature: "nom", gender: "masculin" };
  if (label === "nom commun (féminin)") return { nature: "nom", gender: "féminin" };
  if (label.startsWith("nom commun")) return { nature: "nom" };
  const nature = DICOADO_SIMPLE[label];
  return nature ? { nature } : null;
}

const KAIKKI_TITLES: readonly (readonly [RegExp, Nature])[] = [
  [/^Nom commun/, "nom"],
  [/^Verbe/, "verbe"],
  [/^Adjectif (possessif|démonstratif|indéfini|interrogatif|exclamatif|relatif|numéral)/, "déterminant"],
  [/^Adjectif/, "adjectif"],
  [/^Adverbe/, "adverbe"],
  [/^Pronom/, "pronom"],
  [/^Préposition/, "préposition"],
  [/^Conjonction/, "conjonction"],
  [/^Article/, "déterminant"],
  [/^Interjection/, "interjection"],
];

/** Titre de section du Wiktionnaire (`pos_title`) : « Nom commun », « Verbe »… Les formes fléchies et locutions sont exclues. */
export function natureFromKaikki(posTitle: string): Nature | null {
  return KAIKKI_TITLES.find(([pattern]) => pattern.test(posTitle))?.[1] ?? null;
}

export function genderFromKaikki(tags: readonly string[]): Gender | undefined {
  const masculine = tags.includes("masculine");
  const feminine = tags.includes("feminine");
  if (masculine === feminine) return undefined;
  return masculine ? "masculin" : "féminin";
}

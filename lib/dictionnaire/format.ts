// Textes d'affichage d'un article et d'une page.
import { GENDER_ABBREVIATIONS, NATURE_ABBREVIATIONS } from "./constants";
import type { Article, DictionaryPage } from "./types";

export interface NatureLabel {
  /** Ce qu'on apprend à lire : « n. m. ». */
  readonly short: string;
  /** Pour les lecteurs d'écran : « nom masculin ». */
  readonly long: string;
}

export function natureLabel(article: Article): NatureLabel {
  const nature = NATURE_ABBREVIATIONS[article.nature];
  if (!article.gender) return { short: nature, long: article.nature };
  return {
    short: `${nature} ${GENDER_ABBREVIATIONS[article.gender]}`,
    long: `${article.nature} ${article.gender}`,
  };
}

/** « Page 42, de mouton à moutarde » */
export function pageTitle(page: DictionaryPage): string {
  const [first, last] = page.guideWords;
  return `Page ${page.number}, de ${first} à ${last}`;
}

/** Annonce après avoir tourné : « Page 43 sur 750, de moutarde à moyen ». */
export function pageAnnouncement(pages: readonly DictionaryPage[], totalPages: number): string {
  if (pages.length === 0) return "Couverture du dictionnaire";
  const first = pages[0];
  const last = pages[pages.length - 1];
  const numbers = pages.length === 1 ? `Page ${first.number}` : `Pages ${first.number} et ${last.number}`;
  return `${numbers} sur ${totalPages}, de ${first.guideWords[0]} à ${last.guideWords[1]}`;
}

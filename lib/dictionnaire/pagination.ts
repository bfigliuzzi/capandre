// Découpage en pages (R2, R3). Utilisé par le script de données : l'app lit
// les pages toutes faites dans le fichier livré, ce qui garantit R5.
import { compareArticles } from "./collation";
import type { Article, DictionaryPage } from "./types";

export function paginate(articles: readonly Article[], perPage: number): DictionaryPage[] {
  const ordered = [...articles].sort(compareArticles);
  const pages: DictionaryPage[] = [];
  for (let start = 0; start < ordered.length; start += perPage) {
    const content = ordered.slice(start, start + perPage);
    pages.push({
      number: pages.length + 1,
      guideWords: [content[0].headword, content[content.length - 1].headword],
      articles: content,
    });
  }
  return pages;
}

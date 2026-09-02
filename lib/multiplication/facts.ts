// Faits de multiplication : clés, mise en forme, construction des pools.
import type { Fact } from "./types";

/** Clé canonique d'un fait : "7-8". */
export function factKey(a: number, b: number): string {
  return `${a}-${b}`;
}

export function parseFactKey(key: string): Fact {
  const match = /^(\d+)-(\d+)$/.exec(key);
  if (!match) {
    throw new Error(`Clé de fait invalide : ${key}`);
  }
  return { a: Number(match[1]), b: Number(match[2]) };
}

/** "7 × 8" */
export function formatFact(fact: Fact): string {
  return `${fact.a} × ${fact.b}`;
}

/** "7 × 8 = 56" */
export function formatFactLine(fact: Fact): string {
  return `${fact.a} × ${fact.b} = ${fact.a * fact.b}`;
}

/**
 * Les 10 faits de la table de `table` : `table × 1` à `table × 10`.
 * « La table de 7 » ne contient donc PAS 8 × 7 — ce fait appartient à la
 * table de 8. C'est la raison d'être des 100 faits distincts.
 */
export function factsForTable(table: number): Fact[] {
  if (!Number.isInteger(table) || table < 1 || table > 10) return [];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((b) => ({ a: table, b }));
}

/** Dédoublonne, filtre les entiers hors 1..10, trie, puis concatène. */
export function buildFacts(tables: readonly number[]): Fact[] {
  const valid = Array.from(
    new Set(tables.filter((t) => Number.isInteger(t) && t >= 1 && t <= 10)),
  ).sort((x, y) => x - y);
  return valid.flatMap((t) => factsForTable(t));
}

/** Lignes prêtes à afficher pour la sous-section Révision (lecture seule). */
export function buildTable(
  table: number,
): { fact: Fact; product: number; label: string }[] {
  return factsForTable(table).map((fact) => ({
    fact,
    product: fact.a * fact.b,
    label: formatFactLine(fact),
  }));
}

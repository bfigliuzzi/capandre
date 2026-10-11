// Contrôle de forme du fichier téléchargé, seule donnée venue de l'extérieur,
// avant sa copie en base. Un fichier mal formé n'est jamais copié.
import { NATURE_ORDER } from "./constants";
import type { DictionaryFile } from "./types";

export type ValidationResult =
  | { readonly ok: true; readonly file: DictionaryFile }
  | { readonly ok: false; readonly error: string };

type Shape = Record<string, unknown>;

function isShape(value: unknown): value is Shape {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === "string";
}

function isSense(value: unknown): boolean {
  return (
    isShape(value) &&
    typeof value.definition === "string" &&
    isOptionalString(value.example) &&
    isOptionalString(value.quizExample)
  );
}

function isArticle(value: unknown): boolean {
  if (!isShape(value)) return false;
  const { headword, nature, gender, senses, synonyms, antonyms, source } = value;
  return (
    typeof headword === "string" &&
    NATURE_ORDER.includes(nature as never) &&
    (gender === undefined || gender === "masculin" || gender === "féminin") &&
    Array.isArray(senses) &&
    senses.length >= 1 &&
    senses.length <= 3 &&
    senses.every(isSense) &&
    isStringArray(synonyms) &&
    isStringArray(antonyms) &&
    (source === "dicoado" || source === "wiktionnaire")
  );
}

function pageError(value: unknown, expectedNumber: number): string | null {
  if (!isShape(value)) return `page ${expectedNumber} : forme inattendue`;
  if (value.number !== expectedNumber) return `page ${expectedNumber} : numéro ${String(value.number)}`;
  const { guideWords, articles } = value;
  if (!isStringArray(guideWords) || (guideWords as unknown[]).length !== 2) {
    return `page ${expectedNumber} : mots repères invalides`;
  }
  if (!Array.isArray(articles) || articles.length === 0) return `page ${expectedNumber} : aucun article`;
  const bad = articles.findIndex((a) => !isArticle(a));
  return bad === -1 ? null : `page ${expectedNumber} : article ${bad + 1} invalide`;
}

/** `expectedVersion` : un fichier d'une autre version serait retéléchargé à chaque ouverture. */
export function validateDictionaryFile(value: unknown, expectedVersion?: number): ValidationResult {
  if (!isShape(value)) return { ok: false, error: "le fichier n'est pas un objet" };
  if (typeof value.version !== "number") return { ok: false, error: "version absente" };
  if (expectedVersion !== undefined && value.version !== expectedVersion) {
    return { ok: false, error: `version ${value.version}, attendue ${expectedVersion}` };
  }
  if (typeof value.articlesPerPage !== "number") return { ok: false, error: "articlesPerPage absent" };
  if (!Array.isArray(value.pages) || value.pages.length === 0) return { ok: false, error: "aucune page" };
  for (const [i, page] of value.pages.entries()) {
    const error = pageError(page, i + 1);
    if (error) return { ok: false, error };
  }
  return { ok: true, file: value as unknown as DictionaryFile };
}

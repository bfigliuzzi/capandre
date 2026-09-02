// Lecture / écriture des réglages de session dans l'URL.
import {
  DEFAULT_SESSION_LENGTH,
  DIFFICULTIES,
  SESSION_LENGTHS,
  TABLES,
} from "./constants";
import type { Difficulty, SessionConfig, SessionLength } from "./types";

export const DEFAULT_CONFIG: SessionConfig = {
  tables: [...TABLES],
  difficulty: "basic",
  length: DEFAULT_SESSION_LENGTH,
};

type ParamSource = URLSearchParams | Record<string, string>;

function readParam(params: ParamSource, name: string): string | null {
  if (typeof (params as URLSearchParams).get === "function") {
    return (params as URLSearchParams).get(name);
  }
  const value = (params as Record<string, string>)[name];
  return value === undefined ? null : value;
}

function parseTables(raw: string): number[] {
  const values = raw
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 10);
  return Array.from(new Set(values)).sort((x, y) => x - y);
}

/**
 * Retourne `null` dès qu'un paramètre est inutilisable : l'appelant redirige
 * alors vers l'écran de réglages plutôt que de démarrer une session bancale.
 * `difficulty` et `length` absents retombent sur les valeurs par défaut ;
 * `tables` est obligatoire.
 */
export function parseSessionConfig(params: ParamSource): SessionConfig | null {
  const rawTables = readParam(params, "tables");
  if (!rawTables) return null;
  const tables = parseTables(rawTables);
  if (tables.length === 0) return null;

  const rawDifficulty = readParam(params, "difficulty");
  let difficulty: Difficulty = DEFAULT_CONFIG.difficulty;
  if (rawDifficulty !== null) {
    if (!(DIFFICULTIES as readonly string[]).includes(rawDifficulty)) return null;
    difficulty = rawDifficulty as Difficulty;
  }

  const rawLength = readParam(params, "length");
  let length: SessionLength = DEFAULT_SESSION_LENGTH;
  if (rawLength !== null) {
    const parsed = Number(rawLength);
    if (!(SESSION_LENGTHS as readonly number[]).includes(parsed)) return null;
    length = parsed as SessionLength;
  }

  return { tables, difficulty, length };
}

/** « tables=2,3,7&difficulty=paced&length=20 » */
export function encodeSessionConfig(config: SessionConfig): string {
  const params = new URLSearchParams({
    tables: config.tables.join(","),
    difficulty: config.difficulty,
    length: String(config.length),
  });
  // URLSearchParams encode la virgule en %2C : on la restiture pour garder
  // une URL lisible par l'enfant comme par le parent.
  return params.toString().replace(/%2C/g, ",");
}

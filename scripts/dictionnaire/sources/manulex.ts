// Manulex (Lété et al., CC BY-NC-SA) : fréquences des lemmes dans les manuels du primaire.
// Sert seulement à choisir et ordonner les mots ; rien n'en est livré (R30).
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import type { Lemma } from "../types";
import { natureFromManulex } from "./natures";

export const MANULEX_URL = "https://www.manulex.org/docs/fr/Manulex.xls";
const SHEET = "LEMMES";
/** Fréquence par million de mots, tous niveaux du CP au CM2. */
const FREQUENCY_COLUMN = "CP-CM2 U";

type Row = Record<string, string | number | undefined>;

function toLemma(row: Row): Lemma | null {
  const nature = natureFromManulex(String(row.SYNT ?? ""));
  const frequency = Number(row[FREQUENCY_COLUMN]);
  const headword = String(row.LEMMES ?? "").trim();
  if (!nature || !headword || !Number.isFinite(frequency)) return null;
  return { headword, nature, frequency };
}

export function readManulex(path: string): Lemma[] {
  const workbook = XLSX.read(readFileSync(path), { type: "buffer" });
  const sheet = workbook.Sheets[SHEET];
  if (!sheet) throw new Error(`Manulex : feuille ${SHEET} absente`);
  return XLSX.utils.sheet_to_json<Row>(sheet).flatMap((row) => toLemma(row) ?? []);
}

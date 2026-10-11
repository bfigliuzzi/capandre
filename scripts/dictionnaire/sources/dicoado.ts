// Le Dico des Ados (fr.dicoado.org, CC BY-SA 4.0) : téléchargement du wikitexte
// de tous les articles via l'API MediaWiki, puis lecture des modèles {{Article}}.
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Candidate, CandidateSense } from "../types";
import { usageMarks } from "./marks";
import { natureFromDicoado } from "./natures";
import { categoriesOf, wikiToText } from "./wikitext";

const API = "https://fr.dicoado.org/w/api.php";
const PAUSE_MS = 500;
const USER_AGENT = "capandre-dictionnaire/1.0 (script hors ligne, une passe)";

type Wikitexts = Record<string, string>;

interface ApiPage {
  readonly title: string;
  readonly revisions?: readonly { readonly slots: { readonly main: { readonly content: string } } }[];
}

interface ApiResponse {
  readonly query?: { readonly pages: readonly ApiPage[] };
  readonly continue?: Record<string, string>;
}

function pageUrl(cont: Record<string, string>): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    generator: "allpages",
    gapnamespace: "0",
    gaplimit: "50",
    prop: "revisions",
    rvprop: "content",
    rvslots: "main",
    ...cont,
  });
  return `${API}?${params}`;
}

async function download(): Promise<Wikitexts> {
  const texts: Wikitexts = {};
  let cont: Record<string, string> | undefined = {};
  while (cont) {
    const response = await fetch(pageUrl(cont), { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) throw new Error(`Dico des Ados : HTTP ${response.status}`);
    const body = (await response.json()) as ApiResponse;
    for (const page of body.query?.pages ?? []) {
      const content = page.revisions?.[0]?.slots.main.content;
      if (content) texts[page.title] = content;
    }
    cont = body.continue;
    process.stdout.write(`\r  Dico des Ados : ${Object.keys(texts).length} pages`);
    await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
  }
  process.stdout.write("\n");
  return texts;
}

/** Wikitexte de toutes les pages, depuis le cache s'il existe. */
export async function loadDicoadoWikitexts(cacheDir: string): Promise<Wikitexts> {
  const cache = join(cacheDir, "dicoado.json");
  if (existsSync(cache)) return JSON.parse(await readFile(cache, "utf8")) as Wikitexts;
  const texts = await download();
  await writeFile(cache, JSON.stringify(texts));
  return texts;
}

/** Valeur brute d'un champ `|nom=…` du modèle, sur une ou plusieurs lignes. */
function field(body: string, name: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex((l) => l.startsWith(`|${name}=`));
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith("|"));
  const value = [lines[start].slice(name.length + 2), ...(end === -1 ? rest : rest.slice(0, end))];
  return value.join("\n").trim();
}

/** Une liste numérotée `#…` donne un élément par ligne ; sinon tout le champ est un seul élément. */
function numberedItems(value: string): string[] {
  const lines = value.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.some((l) => l.startsWith("#"))) return value ? [value] : [];
  return lines.filter((l) => l.startsWith("#")).map((l) => l.replace(/^#+/, "").trim());
}

function wordList(value: string): string[] {
  return wikiToText(value).split(",").map((w) => w.trim()).filter(Boolean);
}

function parseArticle(headword: string, body: string): Candidate | null {
  const kind = natureFromDicoado(field(body, "classe"));
  if (!kind) return null;
  const examples = numberedItems(field(body, "ex"));
  const senses: CandidateSense[] = numberedItems(field(body, "def")).map((def, i) => ({
    definition: wikiToText(def),
    examples: examples[i] ? [wikiToText(examples[i])] : [],
    marks: usageMarks(categoriesOf(def)),
  }));
  return {
    headword,
    ...kind,
    senses,
    synonyms: wordList(field(body, "syn")),
    antonyms: wordList(field(body, "contr")),
    source: "dicoado",
  };
}

/** Un candidat par modèle {{Article}} : une page peut en porter plusieurs (fin n. f., fin adj.). */
export function parseDicoado(texts: Readonly<Record<string, string>>): Candidate[] {
  return Object.entries(texts).flatMap(([title, text]) =>
    [...text.matchAll(/\{\{Article\s*\n([\s\S]*?)\n\}\}/g)].flatMap((m) => parseArticle(title, m[1]) ?? []),
  );
}

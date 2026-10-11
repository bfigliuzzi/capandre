// Produit public/dictionnaire/dictionnaire-v<N>.json à partir de Manulex, du
// Dico des Ados et du Wiktionnaire (R27). Lancé à la main : pnpm dictionnaire:build.
// Les sources sont gardées dans .cache/dictionnaire/ (non versionné) : un second
// passage ne retélécharge rien.
import { createWriteStream, existsSync, readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { get } from "node:https";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { ARTICLES_PAR_PAGE, DICTIONARY_DATA_VERSION } from "../../lib/dictionnaire/constants";
import { eligibleCounts } from "../../lib/dictionnaire/questions";
import { paginate } from "../../lib/dictionnaire/pagination";
import type { Article, DictionaryFile } from "../../lib/dictionnaire/types";
import { validateDictionaryFile } from "../../lib/dictionnaire/validate";
import { selectLemmas } from "./filters";
import { mergeSources } from "./merge";
import { loadDicoadoWikitexts, parseDicoado } from "./sources/dicoado";
import { MANULEX_URL, readManulex } from "./sources/manulex";
import { KAIKKI_URL, readKaikki } from "./sources/wiktionnaire";

/** Nombre d'articles visé (cadrage : environ 6 000). */
const TARGET_ARTICLES = 6000;
/** pnpm lance ses scripts depuis la racine du dépôt. */
const ROOT = process.cwd();
const CACHE = join(ROOT, ".cache", "dictionnaire");
const OUTPUT = join(ROOT, "public", "dictionnaire", `dictionnaire-v${DICTIONARY_DATA_VERSION}.json`);

/** Télécharge tel quel, sans décompresser : le cache kaikki reste au format gzip. */
async function downloadRaw(url: string, path: string, headers: Record<string, string> = {}): Promise<void> {
  if (existsSync(path)) return;
  console.log(`Téléchargement de ${url}…`);
  const response = await new Promise<import("node:http").IncomingMessage>((resolve, reject) =>
    get(url, { headers }, resolve).on("error", reject),
  );
  if (response.statusCode !== 200) throw new Error(`${url} : HTTP ${response.statusCode}`);
  // Écrit à côté puis renomme : un téléchargement interrompu ne laisse pas un cache tronqué.
  await pipeline(response, createWriteStream(`${path}.part`));
  await rename(`${path}.part`, path);
}

function readExclusions(): Set<string> {
  const text = readFileSync(join(ROOT, "scripts", "dictionnaire", "exclusions.txt"), "utf8");
  return new Set(text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
}

async function buildArticles(): Promise<Article[]> {
  const manulexPath = join(CACHE, "Manulex.xls");
  const kaikkiPath = join(CACHE, "kaikki-fr.jsonl.gz");
  await downloadRaw(MANULEX_URL, manulexPath);
  await downloadRaw(KAIKKI_URL, kaikkiPath, { "Accept-Encoding": "gzip" });
  const lemmas = selectLemmas(readManulex(manulexPath), readExclusions());
  console.log(`Manulex : ${lemmas.length} lemmes retenus avant fusion`);
  const dicoado = parseDicoado(await loadDicoadoWikitexts(CACHE));
  console.log(`Dico des Ados : ${dicoado.length} articles lus`);
  const wiktionnaire = await readKaikki(kaikkiPath, new Set(lemmas.map((l) => l.headword)));
  console.log(`Wiktionnaire : ${wiktionnaire.length} entrées lues`);
  // Une source vide ou un dictionnaire trop court veut dire qu'un format a changé : on s'arrête.
  if (dicoado.length === 0 || wiktionnaire.length === 0) throw new Error("Une source n'a rien produit.");
  const articles = mergeSources(lemmas, dicoado, wiktionnaire, TARGET_ARTICLES);
  if (articles.length < TARGET_ARTICLES) throw new Error(`${articles.length} articles seulement, ${TARGET_ARTICLES} attendus.`);
  return articles;
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} Ko`;
}

function printMeasures(file: DictionaryFile, json: string): void {
  const articles = file.pages.flatMap((p) => p.articles);
  const fromDicoado = articles.filter((a) => a.source === "dicoado").length;
  const senses = articles.flatMap((a) => a.senses);
  console.log("\n— Mesures —");
  console.log(`Articles : ${articles.length} (Dico des Ados ${fromDicoado}, Wiktionnaire ${articles.length - fromDicoado})`);
  console.log(`Pages : ${file.pages.length} (${file.articlesPerPage} articles par page)`);
  console.log(`Sens : ${senses.length}, dont ${senses.filter((s) => s.example).length} avec exemple affiché et ${senses.filter((s) => s.quizExample).length} avec phrase de question`);
  console.log("Éligibles par compétence :");
  for (const [skill, count] of Object.entries(eligibleCounts(file))) console.log(`  ${skill} : ${count}`);
  const bytes = Buffer.byteLength(json);
  console.log(`Taille : ${kilobytes(bytes)} brut, ${kilobytes(gzipSync(json, { level: 9 }).length)} gzip, ${kilobytes(brotliCompressSync(json).length)} brotli`);
}

async function main(): Promise<void> {
  await mkdir(CACHE, { recursive: true });
  const articles = await buildArticles();
  const file: DictionaryFile = {
    version: DICTIONARY_DATA_VERSION,
    articlesPerPage: ARTICLES_PAR_PAGE,
    pages: paginate(articles, ARTICLES_PAR_PAGE),
  };
  const validation = validateDictionaryFile(file, DICTIONARY_DATA_VERSION);
  if (!validation.ok) throw new Error(`Fichier produit invalide : ${validation.error}`);
  const json = JSON.stringify(file);
  await mkdir(join(OUTPUT, ".."), { recursive: true });
  await writeFile(OUTPUT, json);
  console.log(`Écrit : ${OUTPUT}`);
  printMeasures(file, json);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

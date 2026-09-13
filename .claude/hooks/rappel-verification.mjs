#!/usr/bin/env node
// Stop — rappelle ce qui doit être fait en fin de session de travail :
//   - la boucle de feedback quand des sources ont changé
//   - la tenue de intent/ETAT.md, mais UNIQUEMENT si une unité de travail est
//     ouverte. Hors feature — configuration, outillage, documentation — il n'y a
//     rien à noter et le rappel serait du bruit.
// Non bloquant : ce sont des rappels, pas des portes. La porte, c'est la revue.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

let touches = [];
try {
  touches = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8", cwd: RACINE })
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter(Boolean);
} catch {
  process.exit(0); // hors dépôt git : rien à rappeler
}

const sources = touches.filter((f) => /^(app|components|hooks|lib)\/.*\.(ts|tsx|css)$/.test(f));
const etatTenu = touches.includes("intent/ETAT.md");
const rappels = [];

if (sources.length) {
  const apercu = sources.slice(0, 5).join(", ");
  const reste = sources.length > 5 ? ` (+${sources.length - 5})` : "";
  rappels.push(`${sources.length} source(s) modifiée(s) : ${apercu}${reste}. Boucle de feedback : pnpm verify`);
}

/** Unités ouvertes : un dossier de intent/ non préfixé DONE-. */
function uniteOuverte() {
  try {
    return readdirSync(join(RACINE, "intent"), { withFileTypes: true }).some(
      (e) => e.isDirectory() && e.name !== "_templates" && !e.name.startsWith("DONE-"),
    );
  } catch {
    return false;
  }
}

// Le rappel ne vaut que pendant une unité de travail. Hors feature, il n'y a
// rien à noter : ETAT.md suit les features, pas les commits.
if (touches.length && !etatTenu && uniteOuverte()) {
  rappels.push("intent/ETAT.md n'a pas été mis à jour : note la dernière action avant de commiter.");
}

if (rappels.length) {
  process.stdout.write(JSON.stringify({ systemMessage: rappels.join(" · ") }));
}
process.exit(0);

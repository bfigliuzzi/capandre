#!/usr/bin/env node
// Stop — rappelle ce qui doit être fait en fin de session de travail :
//   - la boucle de feedback quand des sources ont changé
//   - la tenue de intent/ETAT.md, sans quoi la session suivante repart en
//     redécouverte, ce que ce fichier existe précisément pour éviter
// Non bloquant : ce sont des rappels, pas des portes. La porte, c'est la revue.
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
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

// Du travail réel sans ligne d'avancement mise à jour : la session suivante
// repartira en redécouverte.
if (touches.length && !etatTenu) {
  rappels.push("intent/ETAT.md n'a pas été mis à jour : note la dernière action avant de commiter.");
}

if (rappels.length) {
  process.stdout.write(JSON.stringify({ systemMessage: rappels.join(" · ") }));
}
process.exit(0);

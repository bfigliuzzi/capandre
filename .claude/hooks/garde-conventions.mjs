#!/usr/bin/env node
// PostToolUse (Edit|Write) — vérifie les conventions mécaniquement vérifiables
// sur le fichier qui vient d'être écrit.
//
// Deux niveaux :
//   bloquant  — règle sans exception dans le codebase aujourd'hui
//   signalé   — règle avec de la dette existante : on avertit, on ne bloque pas
// Les règles elles-mêmes sont écrites dans CLAUDE.md ; ce hook les rend déterministes.
import { readFileSync } from "node:fs";
import { relative, isAbsolute, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SOURCES = /^(app|components|hooks|lib)\//;
const EXT = /\.(ts|tsx|css)$/;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const brut = await new Promise((res) => {
  let d = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (c) => (d += c));
  process.stdin.on("end", () => res(d));
});

let charge;
try {
  charge = JSON.parse(brut);
} catch {
  process.exit(0);
}

const chemin = charge?.tool_response?.filePath ?? charge?.tool_input?.file_path;
if (!chemin) process.exit(0);

const rel = isAbsolute(chemin) ? relative(RACINE, chemin) : chemin;
if (!SOURCES.test(rel) || !EXT.test(rel)) process.exit(0);

let contenu;
try {
  contenu = readFileSync(isAbsolute(chemin) ? chemin : resolve(RACINE, chemin), "utf8");
} catch {
  process.exit(0);
}

const lignes = contenu.split("\n");
const trouve = (predicat) =>
  lignes.reduce((acc, l, i) => (predicat(l) ? [...acc, i + 1] : acc), []);

const bloquants = [];
const signales = [];

// Bloquant — aucune occurrence dans le codebase, la règle tient sans exception.
const xs = trouve((l) => /\btext-xs\b/.test(l));
if (xs.length) {
  bloquants.push(
    `text-xs est interdit (${rel}:${xs.join(", ")}). Texte de base : text-base (16px). ` +
      `Annotations, aides et méta : text-sm (14px). Rien en dessous.`,
  );
}

// Signalé — dette existante dans le codebase, voir docs/dette-conventions.md.
if (rel !== "app/globals.css") {
  const durs = trouve((l) => /#[0-9a-fA-F]{6}\b/.test(l) || /oklch\(/.test(l));
  if (durs.length) {
    signales.push(
      `Couleur en dur (${rel}:${durs.join(", ")}). Les couleurs passent par les tokens de ` +
        `app/globals.css (voir docs/design-tokens.md), pas par une valeur littérale.`,
    );
  }
}

const emo = trouve((l) => EMOJI.test(l));
if (emo.length) {
  signales.push(
    `Emoji dans une source d'interface (${rel}:${emo.join(", ")}). ` +
      `La règle du projet est de passer par lucide-react. Le codebase porte déjà cette dette ` +
      `(voir docs/dette-conventions.md) : ne l'aggrave pas sans raison écrite dans plan.md.`,
  );
}

if (bloquants.length) {
  process.stdout.write(
    JSON.stringify({ decision: "block", reason: bloquants.join("\n") }),
  );
  process.exit(0);
}

if (signales.length) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: signales.join("\n"),
      },
      suppressOutput: true,
    }),
  );
}
process.exit(0);

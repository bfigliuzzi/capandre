#!/usr/bin/env node
// SessionStart — injecte l'état d'avancement dans le contexte d'ouverture.
//
// CLAUDE.md dit à Claude de lire intent/ETAT.md ; ce hook fait qu'il l'ait
// forcément lu. Même partage qu'ailleurs dans le projet : les skills conseillent,
// les hooks appliquent.
//
// Le hook informe, il ne décide pas : reprendre le travail reste une proposition
// que l'humain accepte ou non.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ETAT = join(RACINE, "intent", "ETAT.md");
const INTENT = join(RACINE, "intent");

if (!existsSync(ETAT)) process.exit(0);

/** Lignes du tableau d'état, hors en-tête et séparateur. */
function unites() {
  const lignes = readFileSync(ETAT, "utf8").split("\n");
  return lignes
    .filter((l) => l.startsWith("|") && !/^\|\s*-+/.test(l) && !/\|\s*Unité\s*\|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()).filter(Boolean))
    .filter((c) => c.length >= 4)
    .map(([unite, etape, action, date, suite = ""]) => ({
      unite: unite.replace(/`/g, ""),
      etape,
      action,
      date,
      suite,
    }));
}

/** Dossiers réellement présents, pour détecter une dérive avec le tableau. */
function dossiers() {
  try {
    return readdirSync(INTENT, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== "_templates")
      .map((e) => e.name);
  } catch {
    return [];
  }
}

const toutes = unites();
const enCours = toutes.filter((u) => !u.unite.startsWith("DONE-"));
const surDisque = dossiers();
const absentesDuTableau = surDisque.filter((d) => !toutes.some((u) => u.unite === d));
const absentesDuDisque = toutes.filter((u) => !surDisque.includes(u.unite)).map((u) => u.unite);

const bloc = [];

if (enCours.length === 0) {
  bloc.push(
    "Avancement : aucune unité de travail en cours. " +
      `${toutes.length} terminée(s) dans intent/.`,
    "",
    "Une nouvelle feature démarre par un intent.md — voir intent/README.md.",
  );
} else {
  bloc.push(`Avancement : ${enCours.length} unité(s) en cours.`, "");
  for (const u of enCours) {
    bloc.push(`- ${u.unite} — étape « ${u.etape} »`);
    bloc.push(`  Dernière action (${u.date}) : ${u.action}`);
    if (u.suite && u.suite !== "—") bloc.push(`  Prochaine étape : ${u.suite}`);
    bloc.push(`  Détail : intent/${u.unite}/`);
  }
  bloc.push(
    "",
    "Annonce cet état en une ligne et PROPOSE de reprendre la prochaine étape.",
    "Ne reprends pas le travail sans accord : l'agent écrit, l'humain approuve.",
  );
}

// Une dérive dans un sens ou dans l'autre rend l'état faux : elle se signale,
// elle ne se corrige pas en silence.
if (absentesDuTableau.length) {
  bloc.push(
    "",
    `Dérive à signaler : ${absentesDuTableau.join(", ")} — dossier(s) présent(s) dans ` +
      "intent/ mais absent(s) du tableau de intent/ETAT.md.",
  );
}
if (absentesDuDisque.length) {
  bloc.push(
    "",
    `Dérive à signaler : ${absentesDuDisque.join(", ")} — ligne(s) de intent/ETAT.md sans ` +
      "dossier correspondant dans intent/.",
  );
}

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: bloc.join("\n"),
    },
    suppressOutput: true,
  }),
);
process.exit(0);

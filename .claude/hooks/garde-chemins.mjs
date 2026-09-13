#!/usr/bin/env node
// PreToolUse (Edit|Write) — refuse l'écriture dans les chemins protégés.
// Ces fichiers sont régénérés par un outil ou tenus hors du dépôt : les modifier
// à la main casse silencieusement l'installation ou fuite un secret.
import { relative, isAbsolute, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Racine du projet déduite de l'emplacement du hook : indépendante du cwd de la session.
const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const PROTEGES = [
  {
    test: (p) => p === "pnpm-lock.yaml",
    raison: "pnpm-lock.yaml est généré. Utilise `pnpm install` / `pnpm add` plutôt qu'une édition manuelle.",
  },
  {
    test: (p) => p.startsWith(".agents/skills/") || p === "skills-lock.json",
    raison:
      "Les skills de .agents/skills/ sont importées depuis vercel-labs/agent-skills et verrouillées par skills-lock.json. " +
      "Une politique propre au projet va dans .claude/skills/capandre-*/SKILL.md.",
  },
  {
    test: (p) => /(^|\/)\.env($|\.)/.test(p),
    raison: "Les fichiers .env sont gitignorés et contiennent des secrets. Ils se modifient à la main, hors session.",
  },
  {
    test: (p) => p.startsWith("node_modules/"),
    raison: "node_modules/ est géré par pnpm. Une modification y est perdue au prochain install.",
  },
];

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
  process.exit(0); // charge illisible : on ne bloque pas sur une panne du hook
}

const chemin = charge?.tool_input?.file_path ?? charge?.tool_input?.notebook_path;
if (!chemin) process.exit(0);

const rel = isAbsolute(chemin) ? relative(RACINE, chemin) : chemin;
const touche = PROTEGES.find((r) => r.test(rel));

if (touche) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: `Chemin protégé (${rel}). ${touche.raison}`,
      },
    }),
  );
}
process.exit(0);

#!/usr/bin/env node
// Stop — rappelle la boucle de feedback quand des sources ont changé sans vérification.
// Non bloquant : c'est un rappel, pas une porte. La porte, c'est la revue.
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

let modifies = [];
try {
  const sortie = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8", cwd: RACINE });
  modifies = sortie
    .split("\n")
    .map((l) => l.slice(3).trim())
    .filter((f) => /^(app|components|hooks|lib)\/.*\.(ts|tsx|css)$/.test(f));
} catch {
  process.exit(0); // hors dépôt git : rien à rappeler
}

if (modifies.length) {
  const apercu = modifies.slice(0, 5).join(", ");
  const reste = modifies.length > 5 ? ` (+${modifies.length - 5})` : "";
  process.stdout.write(
    JSON.stringify({
      systemMessage: `${modifies.length} source(s) modifiée(s) : ${apercu}${reste}. Boucle de feedback : pnpm verify`,
    }),
  );
}
process.exit(0);

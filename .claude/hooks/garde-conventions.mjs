#!/usr/bin/env node
// PostToolUse (Edit|Write) — applique les conventions mécaniquement vérifiables
// au fichier qui vient d'être écrit. Toutes les règles sont BLOQUANTES : le
// codebase les respecte intégralement (voir intent/DONE-DETTE-01-conventions/).
//
// Les règles elles-mêmes sont écrites dans CLAUDE.md et dans les skills
// capandre-* ; ce hook les rend déterministes.
//
// Exception : un marqueur motivé lève une règle pour le paragraphe qu'il
// introduit — sa propre ligne, puis les lignes suivantes jusqu'à la première
// ligne vide :
//   // couleur-en-dur: <raison>
//   // emoji-ui: <raison>
// Le marqueur exige une raison écrite : l'exception reste visible en revue au
// lieu d'être cachée dans une liste d'exclusion.
import { readFileSync } from "node:fs";
import { relative, isAbsolute, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SOURCES = /^(app|components|hooks|lib)\//;
const EXT = /\.(ts|tsx|css)$/;

// Plage large : plans emoji, symboles divers, dingbats, flèches et pictogrammes
// techniques (U+2300-U+23FF couvre ⏱, que la première version de ce hook ratait).
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2300}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
// Couvre #abc, #aabbcc, #aabbccdd et les fonctions de couleur.
const COULEUR = /#[0-9a-fA-F]{3,8}\b|\b(?:oklch|oklab|lch|lab|rgba?|hsla?|hwb|color)\(/;

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

/**
 * Index des lignes couvertes par un marqueur : la ligne du marqueur, puis les
 * suivantes jusqu'à la première ligne vide. Le marqueur porte donc sur le
 * paragraphe qu'il introduit, ce qui couvre une valeur multiligne sans exiger
 * un marqueur par ligne.
 */
function lignesExemptees(marqueur) {
  // `// marqueur:` en TS/TSX, `/* marqueur: */` en CSS.
  const motif = new RegExp(`(?://|/\\*)\\s*${marqueur}\\s*:\\s*\\S`);
  const couvertes = new Set();
  lignes.forEach((ligne, i) => {
    if (!motif.test(ligne)) return;
    for (let j = i; j < lignes.length && lignes[j].trim() !== ""; j += 1) couvertes.add(j);
  });
  return couvertes;
}

function infractions(predicat, marqueur) {
  const exemptees = marqueur ? lignesExemptees(marqueur) : new Set();
  const lignesFautives = [];
  lignes.forEach((ligne, i) => {
    if (predicat(ligne, i) && !exemptees.has(i)) lignesFautives.push(i + 1);
  });
  return lignesFautives;
}

const constats = [];

const xs = infractions((l) => /\btext-xs\b/.test(l));
if (xs.length) {
  constats.push(
    `text-xs est interdit (${rel}:${xs.join(", ")}). Texte de base : text-base (16px). ` +
      `Annotations, aides et méta : text-sm (14px). Rien en dessous.`,
  );
}

/**
 * Lignes appartenant à un bloc de DÉFINITION de tokens (`@theme`, `:root`, `.dark`).
 * C'est le seul endroit d'app/globals.css où une couleur littérale est à sa place :
 * ailleurs dans le fichier, un littéral fige une valeur d'un seul thème et casse
 * le mode sombre — c'est exactement ce qu'on a trouvé en résorbant DETTE-01.
 */
function lignesDeTokens() {
  const couvertes = new Set();
  let profondeur = 0;
  let dedans = false;
  lignes.forEach((ligne, i) => {
    if (!dedans && /^\s*(@theme|:root|\.dark)\b[^;]*$/.test(ligne)) dedans = true;
    if (!dedans) return;
    couvertes.add(i);
    profondeur += (ligne.match(/\{/g) ?? []).length - (ligne.match(/\}/g) ?? []).length;
    if (profondeur <= 0 && ligne.includes("}")) {
      dedans = false;
      profondeur = 0;
    }
  });
  return couvertes;
}

{
  const tokens = rel.endsWith(".css") ? lignesDeTokens() : new Set();
  const durs = infractions((l, i) => COULEUR.test(l) && !tokens.has(i), "couleur-en-dur");
  if (durs.length) {
    constats.push(
      `Couleur en dur (${rel}:${durs.join(", ")}). Les couleurs passent par les tokens de ` +
        `app/globals.css — utilitaires bg-/text-/border- ou color-mix(in oklab, var(--token) N%, var(--card)). ` +
        `Voir docs/design-tokens.md et la skill capandre-design-tokens. ` +
        `Dans app/globals.css, seuls @theme, :root et .dark peuvent porter un littéral : ` +
        `ailleurs il fige un seul thème et casse le mode sombre. ` +
        `Si la valeur sort vraiment du CSS (metadata theme-color), marque le paragraphe ` +
        `avec « couleur-en-dur: <raison> ».`,
    );
  }
}

const emo = infractions((l) => EMOJI.test(l), "emoji-ui");
if (emo.length) {
  constats.push(
    `Emoji dans une source d'interface (${rel}:${emo.join(", ")}). ` +
      `Les icônes viennent de lucide-react. Si l'icône est une donnée de domaine, ` +
      `stocke un nom sémantique dans lib/ (voir BadgeIconName) et résous-le en composant ` +
      `dans la couche présentation — lib/ ne dépend pas de React.`,
  );
}

if (constats.length) {
  process.stdout.write(
    JSON.stringify({ decision: "block", reason: constats.join("\n\n") }),
  );
}
process.exit(0);

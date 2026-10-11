// Wikitexte du Dico des Ados → texte brut.

/** Modèles qui gardent un de leurs paramètres comme texte. */
function renderTemplate(name: string, args: readonly string[]): string {
  const key = name.trim();
  if (key.startsWith("formatnum:")) return key.slice("formatnum:".length);
  if (key === '"') return `« ${args[0] ?? ""} »`;
  if (key === "e" || key === "er") return key;
  if (/^lienvd$/i.test(key)) return args[0] ?? "";
  if (/^lang$/i.test(key)) return args[1] ?? "";
  return "";
}

function stripTemplates(text: string): string {
  let current = text;
  let previous = "";
  while (current !== previous) {
    previous = current;
    current = current.replace(/\{\{([^{}]*)\}\}/g, (_, inner: string) => {
      const [name, ...args] = inner.split("|");
      return renderTemplate(name, args);
    });
  }
  return current;
}

export function wikiToText(wikitext: string): string {
  return stripTemplates(wikitext)
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    // Balisage mal fermé dans la source : « [[gaz », « [[fleurs|fr}} ».
    .replace(/\[\[[^\]{}]*\}\}/g, "")
    .replace(/\[\[|\]\]|\{\{|\}\}/g, "")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Valeurs des `{{cat|…}}` d'un sens : « familier », « vieilli »… */
export function categoriesOf(wikitext: string): string[] {
  return [...wikitext.matchAll(/\{\{cat\|([^}]*)\}\}/g)].flatMap((m) => m[1].split("|").map((c) => c.trim()));
}

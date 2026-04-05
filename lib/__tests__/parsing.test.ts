import { describe, it, expect } from "vitest";
import {
  parseWords,
  stripArticle,
  findDuplicates,
  parseFullText,
  parseStanzas,
} from "../parsing";

// ---------------------------------------------------------------------------
// parseWords
// ---------------------------------------------------------------------------

describe("parseWords", () => {
  it("sépare par virgule en conservant les groupes article+nom", () => {
    expect(parseWords("le coq, les oies")).toEqual(["le coq", "les oies"]);
  });

  it("sépare par retour à la ligne", () => {
    expect(parseWords("chat\nchien\nlapin")).toEqual(["chat", "chien", "lapin"]);
  });

  it("sépare par un mix virgule et retour à la ligne", () => {
    expect(parseWords("le coq\nles oies,un caneton")).toEqual([
      "le coq",
      "les oies",
      "un caneton",
    ]);
  });

  it("gère les mots simples séparés par des virgules", () => {
    expect(parseWords("chat, chien, lapin")).toEqual(["chat", "chien", "lapin"]);
  });

  it("trim les espaces autour des entrées", () => {
    expect(parseWords("  le coq ,  les oies  ")).toEqual(["le coq", "les oies"]);
  });

  it("normalise en minuscules", () => {
    expect(parseWords("Le Coq, LES OIES")).toEqual(["le coq", "les oies"]);
  });

  it("retourne un tableau vide pour une chaîne vide", () => {
    expect(parseWords("")).toEqual([]);
  });

  it("retourne un tableau vide pour des séparateurs seuls", () => {
    expect(parseWords(",,,")).toEqual([]);
  });

  it("ne sépare PAS par les espaces simples", () => {
    expect(parseWords("le coq")).toEqual(["le coq"]);
  });

  it("gère l'élision avec apostrophe", () => {
    expect(parseWords("l'écurie, l'arbre")).toEqual(["l'écurie", "l'arbre"]);
  });

  it("gère les articles partitifs composés", () => {
    expect(parseWords("de la farine, de l'eau")).toEqual([
      "de la farine",
      "de l'eau",
    ]);
  });
});

// ---------------------------------------------------------------------------
// stripArticle
// ---------------------------------------------------------------------------

describe("stripArticle", () => {
  it("retire l'article défini 'le'", () => {
    expect(stripArticle("le coq")).toBe("coq");
  });

  it("retire l'article défini 'la'", () => {
    expect(stripArticle("la poule")).toBe("poule");
  });

  it("retire l'article défini 'les'", () => {
    expect(stripArticle("les oies")).toBe("oies");
  });

  it("retire l'article élidé l' (apostrophe droite)", () => {
    expect(stripArticle("l'écurie")).toBe("écurie");
  });

  it("retire l'article élidé l' (apostrophe typographique \u2019)", () => {
    expect(stripArticle("l\u2019écurie")).toBe("écurie");
  });

  it("retire l'article indéfini 'un'", () => {
    expect(stripArticle("un caneton")).toBe("caneton");
  });

  it("retire l'article indéfini 'une'", () => {
    expect(stripArticle("une poule")).toBe("poule");
  });

  it("retire l'article indéfini 'des'", () => {
    expect(stripArticle("des oiseaux")).toBe("oiseaux");
  });

  it("retire l'article partitif 'du'", () => {
    expect(stripArticle("du pain")).toBe("pain");
  });

  it("retire l'article partitif 'de la'", () => {
    expect(stripArticle("de la farine")).toBe("farine");
  });

  it("retire l'article partitif 'de l''", () => {
    expect(stripArticle("de l'eau")).toBe("eau");
  });

  it("ne touche pas un mot sans article", () => {
    expect(stripArticle("cheval")).toBe("cheval");
  });

  it("ne retire PAS 'le' dans 'leader' (faux positif)", () => {
    expect(stripArticle("leader")).toBe("leader");
  });

  it("ne retire PAS 'la' dans 'lavande' (faux positif)", () => {
    expect(stripArticle("lavande")).toBe("lavande");
  });

  it("ne retire PAS 'un' dans 'uniforme' (faux positif)", () => {
    expect(stripArticle("uniforme")).toBe("uniforme");
  });

  it("ne retire PAS 'des' dans 'dessin' (faux positif)", () => {
    expect(stripArticle("dessin")).toBe("dessin");
  });

  it("est insensible à la casse", () => {
    expect(stripArticle("Le Coq")).toBe("coq");
    expect(stripArticle("LES OIES")).toBe("oies");
  });

  it("normalise le résultat en minuscules", () => {
    expect(stripArticle("UN Caneton")).toBe("caneton");
  });
});

// ---------------------------------------------------------------------------
// findDuplicates (sans normalizer — comportement par défaut)
// ---------------------------------------------------------------------------

describe("findDuplicates (sans normalizer)", () => {
  it("détecte les doublons exacts", () => {
    const result = findDuplicates(["chat", "chien", "chat"]);
    expect(result).toEqual(new Set(["chat"]));
  });

  it("retourne un set vide sans doublon", () => {
    const result = findDuplicates(["chat", "chien", "lapin"]);
    expect(result).toEqual(new Set());
  });

  it("retourne un set vide pour un tableau vide", () => {
    expect(findDuplicates([])).toEqual(new Set());
  });

  it("marque toutes les occurrences d'un doublon", () => {
    const words = ["a", "b", "a", "c", "a"];
    const result = findDuplicates(words);
    expect(result).toEqual(new Set(["a"]));
    // Vérifie que chaque occurrence "a" est dans le set
    for (const w of words) {
      if (w === "a") expect(result.has(w)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// findDuplicates (avec stripArticle comme normalizer)
// ---------------------------------------------------------------------------

describe("findDuplicates (avec stripArticle)", () => {
  it("détecte 'le chat' et 'un chat' comme doublons", () => {
    const result = findDuplicates(["le chat", "un chat"], stripArticle);
    expect(result).toEqual(new Set(["le chat", "un chat"]));
  });

  it("ne marque pas de faux doublons entre mots différents", () => {
    const result = findDuplicates(["le coq", "les oies"], stripArticle);
    expect(result).toEqual(new Set());
  });

  it("détecte les doublons identiques", () => {
    const result = findDuplicates(["le chat", "le chat"], stripArticle);
    expect(result).toEqual(new Set(["le chat"]));
  });

  it("ne marque pas la souris quand seuls les chats sont en double", () => {
    const result = findDuplicates(
      ["le chat", "un chat", "la souris"],
      stripArticle,
    );
    expect(result).toEqual(new Set(["le chat", "un chat"]));
    expect(result.has("la souris")).toBe(false);
  });

  it("détecte les doublons avec articles partitifs", () => {
    const result = findDuplicates(
      ["du pain", "le pain"],
      stripArticle,
    );
    expect(result).toEqual(new Set(["du pain", "le pain"]));
  });

  it("détecte les doublons entre mot simple et mot avec article", () => {
    const result = findDuplicates(["chat", "le chat"], stripArticle);
    expect(result).toEqual(new Set(["chat", "le chat"]));
  });
});

// ---------------------------------------------------------------------------
// parseFullText (non impacté, mais vérifié pour non-régression)
// ---------------------------------------------------------------------------

describe("parseFullText", () => {
  it("sépare un texte par ponctuation et espaces", () => {
    expect(parseFullText("Le chat mange.")).toEqual(["Le", "chat", "mange"]);
  });

  it("gère les guillemets français", () => {
    expect(parseFullText("Il dit \u00ABbonjour\u00BB")).toEqual([
      "Il",
      "dit",
      "bonjour",
    ]);
  });
});

// ---------------------------------------------------------------------------
// parseStanzas (non impacté, vérifié pour non-régression)
// ---------------------------------------------------------------------------

describe("parseStanzas", () => {
  it("sépare les strophes par double retour à la ligne", () => {
    const result = parseStanzas("vers 1\nvers 2\n\nvers 3\nvers 4");
    expect(result).toEqual([
      { verses: ["vers 1", "vers 2"] },
      { verses: ["vers 3", "vers 4"] },
    ]);
  });

  it("retourne un tableau vide pour une chaîne vide", () => {
    expect(parseStanzas("")).toEqual([]);
  });
});

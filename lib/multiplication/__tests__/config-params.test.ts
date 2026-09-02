import { describe, it, expect } from "vitest";
import {
  DEFAULT_CONFIG,
  encodeSessionConfig,
  parseSessionConfig,
} from "../config-params";
import type { SessionConfig } from "../types";

describe("parseSessionConfig", () => {
  it("lit une configuration complète depuis un URLSearchParams", () => {
    const params = new URLSearchParams("tables=2,3,7&difficulty=paced&length=20");
    expect(parseSessionConfig(params)).toEqual({
      tables: [2, 3, 7],
      difficulty: "paced",
      length: 20,
    });
  });

  it("accepte aussi un objet simple", () => {
    expect(
      parseSessionConfig({ tables: "5", difficulty: "challenge", length: "30" }),
    ).toEqual({ tables: [5], difficulty: "challenge", length: 30 });
  });

  it("filtre, dédoublonne et trie les tables", () => {
    const params = new URLSearchParams("tables=9,0,3,3,11,-2,9");
    expect(parseSessionConfig(params)?.tables).toEqual([3, 9]);
  });

  it("retourne null si le paramètre tables est absent", () => {
    expect(parseSessionConfig(new URLSearchParams("difficulty=paced"))).toBeNull();
  });

  it("retourne null si aucune table n'est valide", () => {
    expect(parseSessionConfig(new URLSearchParams("tables=0,42,abc"))).toBeNull();
    expect(parseSessionConfig(new URLSearchParams("tables="))).toBeNull();
  });

  it("retombe sur le mode De base quand la difficulté est absente", () => {
    expect(parseSessionConfig(new URLSearchParams("tables=4"))?.difficulty).toBe("basic");
  });

  it("retourne null pour une difficulté inconnue", () => {
    expect(parseSessionConfig(new URLSearchParams("tables=4&difficulty=turbo"))).toBeNull();
  });

  it("retombe sur 10 questions quand la longueur est absente", () => {
    expect(parseSessionConfig(new URLSearchParams("tables=4"))?.length).toBe(10);
  });

  it("retourne null pour une longueur invalide", () => {
    expect(parseSessionConfig(new URLSearchParams("tables=4&length=15"))).toBeNull();
    expect(parseSessionConfig(new URLSearchParams("tables=4&length=abc"))).toBeNull();
    expect(parseSessionConfig(new URLSearchParams("tables=4&length="))).toBeNull();
  });
});

describe("encodeSessionConfig", () => {
  it("produit « tables=2,3,7&difficulty=paced&length=20 »", () => {
    const config: SessionConfig = {
      tables: [2, 3, 7],
      difficulty: "paced",
      length: 20,
    };
    expect(encodeSessionConfig(config)).toBe("tables=2,3,7&difficulty=paced&length=20");
  });

  it("fait un aller-retour fidèle", () => {
    const config: SessionConfig = {
      tables: [1, 5, 10],
      difficulty: "challenge",
      length: 30,
    };
    expect(parseSessionConfig(new URLSearchParams(encodeSessionConfig(config)))).toEqual(
      config,
    );
  });

  it("fait un aller-retour fidèle sur la configuration par défaut", () => {
    expect(
      parseSessionConfig(new URLSearchParams(encodeSessionConfig(DEFAULT_CONFIG))),
    ).toEqual(DEFAULT_CONFIG);
  });
});

describe("DEFAULT_CONFIG", () => {
  it("propose les 10 tables, le mode De base et 10 questions", () => {
    expect(DEFAULT_CONFIG).toEqual({
      tables: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      difficulty: "basic",
      length: 10,
    });
  });
});

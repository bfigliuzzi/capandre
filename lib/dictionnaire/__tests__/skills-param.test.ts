import { describe, expect, it } from "vitest";
import { SKILLS } from "../constants";
import { encodeSkills, parseSkills } from "../skills-param";

describe("compétences dans l'URL", () => {
  it("relit les compétences encodées, dans l'ordre de la fiche", () => {
    expect(parseSkills(encodeSkills(["lire-page", "ranger"]))).toEqual(["ranger", "lire-page"]);
  });

  it("ignore les valeurs inconnues", () => {
    expect(parseSkills("ranger,pirate")).toEqual(["ranger"]);
  });

  it("revient à toutes les compétences si l'URL n'en donne aucune valide", () => {
    expect(parseSkills(null)).toEqual(SKILLS);
    expect(parseSkills("pirate")).toEqual(SKILLS);
  });
});

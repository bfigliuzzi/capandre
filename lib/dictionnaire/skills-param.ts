// Les compétences choisies passent de l'écran de choix à la session par l'URL.
import { SKILLS } from "./constants";
import type { Skill } from "./types";

export const SKILLS_PARAM = "competences";

export function encodeSkills(skills: readonly Skill[]): string {
  return skills.join(",");
}

/** Les compétences reconnues, dans l'ordre de la fiche ; toutes si l'URL n'en donne aucune valide. */
export function parseSkills(value: string | null): readonly Skill[] {
  const asked = new Set((value ?? "").split(","));
  const skills = SKILLS.filter((s) => asked.has(s));
  return skills.length > 0 ? skills : SKILLS;
}

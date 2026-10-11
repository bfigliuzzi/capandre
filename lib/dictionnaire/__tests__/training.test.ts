import { describe, expect, it } from "vitest";
import { seededRng } from "../../multiplication/__tests__/test-rng";
import { checkAnswer, createTraining, starsFor } from "../training";
import type { Question, Skill } from "../types";
import { FIXTURE_DICTIONARY } from "./fixtures";

const SEEDS = Array.from({ length: 30 }, (_, i) => i + 1);
const ALL: readonly Skill[] = ["ranger", "chercher", "lire-page", "lire-article", "sens-contexte", "utiliser-sens"];

function countBySkill(questions: readonly Question[]): Map<Skill, number> {
  const counts = new Map<Skill, number>();
  for (const q of questions) counts.set(q.skill, (counts.get(q.skill) ?? 0) + 1);
  return counts;
}

describe("createTraining (R15)", () => {
  it("tire 10 questions parmi les seules compétences cochées", () => {
    for (const seed of SEEDS) {
      const questions = createTraining(FIXTURE_DICTIONARY, ["chercher", "lire-page"], seededRng(seed));
      expect(questions).toHaveLength(10);
      expect(new Set(questions.map((q) => q.skill))).toEqual(new Set(["chercher", "lire-page"]));
    }
  });

  it("répartit les questions aussi également que possible : 6 compétences, 1 ou 2 questions chacune", () => {
    for (const seed of SEEDS) {
      const counts = countBySkill(createTraining(FIXTURE_DICTIONARY, ALL, seededRng(seed)));
      expect([...counts.keys()].sort()).toEqual([...ALL].sort());
      for (const count of counts.values()) expect([1, 2]).toContain(count);
    }
  });

  it("ne fait jamais porter deux questions sur le même mot", () => {
    for (const seed of SEEDS) {
      const words = createTraining(FIXTURE_DICTIONARY, ALL, seededRng(seed)).flatMap((q) => q.words);
      expect(new Set(words).size).toBe(words.length);
    }
  });

  it("donne les mêmes questions pour la même graine", () => {
    const first = createTraining(FIXTURE_DICTIONARY, ALL, seededRng(7));
    expect(createTraining(FIXTURE_DICTIONARY, ALL, seededRng(7))).toEqual(first);
  });

  it("complète avec les autres compétences cochées quand une compétence n'a plus de mot éligible", () => {
    // Le dictionnaire de test n'a que 5 mots éligibles aux questions de sens.
    const questions = createTraining(FIXTURE_DICTIONARY, ["sens-contexte", "chercher"], seededRng(3));
    const counts = countBySkill(questions);
    expect(questions).toHaveLength(10);
    expect(counts.get("sens-contexte")).toBe(5);
    expect(counts.get("chercher")).toBe(5);
  });
});

describe("checkAnswer (R24)", () => {
  const [order] = createTraining(FIXTURE_DICTIONARY, ["ranger"], seededRng(1));
  const [search] = createTraining(FIXTURE_DICTIONARY, ["chercher"], seededRng(1));
  const [choice] = createTraining(FIXTURE_DICTIONARY, ["lire-article"], seededRng(1));
  if (order.skill !== "ranger" || search.skill !== "chercher" || choice.skill !== "lire-article") {
    throw new Error("questions inattendues");
  }

  it("ranger : juste seulement dans l'ordre alphabétique, sinon donne l'ordre attendu", () => {
    expect(checkAnswer(order, { kind: "ordre", words: order.solution })).toEqual({
      correct: true,
      message: "Bonne réponse !",
    });
    const wrong = checkAnswer(order, { kind: "ordre", words: order.shuffled });
    expect(wrong.correct).toBe(false);
    expect(wrong.message).toBe(`La bonne réponse était : ${order.solution.join(", ")}.`);
  });

  it("chercher : juste si l'enfant touche l'article demandé", () => {
    expect(checkAnswer(search, { kind: "article", headword: search.headword }).correct).toBe(true);
    expect(checkAnswer(search, { kind: "article", headword: "zèbre" }).correct).toBe(false);
  });

  it("« Je n'y arrive pas » compte faux et dit où était le mot", () => {
    expect(checkAnswer(search, { kind: "abandon" })).toEqual({
      correct: false,
      message: `Le mot « ${search.headword} » était à la page ${search.target.page}.`,
    });
  });

  it("question à choix : juste si l'enfant choisit la bonne proposition, sinon la donne", () => {
    expect(checkAnswer(choice, { kind: "choix", index: choice.answerIndex }).correct).toBe(true);
    const wrongIndex = (choice.answerIndex + 1) % choice.choices.length;
    expect(checkAnswer(choice, { kind: "choix", index: wrongIndex })).toEqual({
      correct: false,
      message: `La bonne réponse était : ${choice.choices[choice.answerIndex]}.`,
    });
  });
});

describe("starsFor (R25)", () => {
  it.each([
    [4, 0],
    [5, 1],
    [6, 1],
    [7, 2],
    [8, 2],
    [9, 3],
    [10, 3],
  ])("%i bonnes réponses sur 10 donnent %i étoile(s)", (score, stars) => {
    expect(starsFor(score)).toBe(stars);
  });
});

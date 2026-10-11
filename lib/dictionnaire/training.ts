// Composer un entraînement, corriger une réponse, compter les étoiles (R15, R24, R25).
import { shuffleWithRng } from "../multiplication/random";
import { QUESTIONS_PAR_ENTRAINEMENT, STAR_THRESHOLDS } from "./constants";
import { generateQuestion } from "./questions";
import type { Answer, DictionaryFile, Outcome, Question, Rng, Skill } from "./types";

/** Nombre de questions par compétence, aussi égal que possible ; le reste va à des compétences tirées au sort. */
function plannedCounts(skills: readonly Skill[], rng: Rng): Map<Skill, number> {
  const base = Math.floor(QUESTIONS_PAR_ENTRAINEMENT / skills.length);
  const extra = new Set(shuffleWithRng(skills, rng).slice(0, QUESTIONS_PAR_ENTRAINEMENT % skills.length));
  return new Map(skills.map((s) => [s, base + (extra.has(s) ? 1 : 0)]));
}

/** Ordre de passage : la compétence prévue d'abord, puis les autres, les moins servies en premier. */
function fallbackOrder(planned: Skill, skills: readonly Skill[], done: ReadonlyMap<Skill, number>): Skill[] {
  const others = skills.filter((s) => s !== planned).sort((a, b) => (done.get(a) ?? 0) - (done.get(b) ?? 0));
  return [planned, ...others];
}

export function createTraining(dictionary: DictionaryFile, skills: readonly Skill[], rng: Rng): Question[] {
  if (skills.length === 0) return [];
  const counts = plannedCounts(skills, rng);
  const plan = shuffleWithRng([...counts].flatMap(([skill, n]) => Array<Skill>(n).fill(skill)), rng);
  const questions: Question[] = [];
  const usedWords = new Set<string>();
  const done = new Map<Skill, number>();
  for (const planned of plan) {
    for (const skill of fallbackOrder(planned, skills, done)) {
      const question = generateQuestion(skill, { dictionary, rng, usedWords });
      if (!question) continue;
      questions.push(question);
      question.words.forEach((w) => usedWords.add(w));
      done.set(skill, (done.get(skill) ?? 0) + 1);
      break;
    }
  }
  return questions;
}

const CORRECT: Outcome = { correct: true, message: "Bonne réponse !" };

function wrong(expected: string): Outcome {
  return { correct: false, message: `La bonne réponse était : ${expected}.` };
}

function checkSearch(question: Extract<Question, { headword: string }>, answer: Answer): Outcome {
  if (answer.kind === "article" && answer.headword === question.headword) return CORRECT;
  return {
    correct: false,
    message: `Le mot « ${question.headword} » était à la page ${question.target.page}.`,
  };
}

export function checkAnswer(question: Question, answer: Answer): Outcome {
  switch (question.skill) {
    case "ranger": {
      const ok = answer.kind === "ordre" && answer.words.join("\n") === question.solution.join("\n");
      return ok ? CORRECT : wrong(question.solution.join(", "));
    }
    case "chercher":
      return checkSearch(question, answer);
    default: {
      const ok = answer.kind === "choix" && answer.index === question.answerIndex;
      return ok ? CORRECT : wrong(question.choices[question.answerIndex]);
    }
  }
}

export function starsFor(score: number): number {
  return STAR_THRESHOLDS.find((t) => score >= t.minScore)?.stars ?? 0;
}

"use client";

import { questionParts, type Question } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

interface QuestionDisplayProps {
  question: Question;
  /** Saisie en cours ("" | "7" | "56"…). */
  input: string;
  /** `idle` pendant la saisie ; `correct` / `wrong` pendant le feedback. */
  state: "idle" | "correct" | "wrong";
}

/**
 * Carte de l'énoncé. L'équation est `aria-hidden` : le glyphe « × » et le
 * chiffre en cours de frappe donnent une lecture erratique. L'équivalent
 * accessible passe par la région live unique de la session.
 */
export function QuestionDisplay({ question, input, state }: QuestionDisplayProps) {
  const parts = questionParts(question);
  // Pendant le feedback, l'emplacement caché montre la bonne réponse.
  const value = state === "idle" ? input : String(question.answer);

  const slot = (
    <span className={cn("mult-answer-slot", value === "" && "mult-answer-slot--empty")}>
      {value === "" ? "?" : value}
    </span>
  );

  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border-2 border-border bg-card p-6 shadow-md min-h-44",
        state === "correct" && "mult-card--correct",
      )}
    >
      <div className="mult-question" aria-hidden="true">
        <span>{parts.hidden === "left" ? slot : parts.left}</span>
        <span>{parts.operator}</span>
        <span>{parts.hidden === "right" ? slot : parts.right}</span>
        <span>=</span>
        <span>{parts.hidden === "result" ? slot : parts.result}</span>
      </div>
    </div>
  );
}

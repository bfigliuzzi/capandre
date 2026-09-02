"use client";

import { Check, Clock, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnswerOutcome } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  outcome: AnswerOutcome;
  onContinue: () => void;
}

/**
 * Retour après réponse. `aria-hidden` : le texte est déjà porté par la région
 * live unique de la session. Icônes jamais punitives — aucune croix rouge,
 * aucun compteur d'erreurs.
 */
export function FeedbackBanner({ outcome, onContinue }: FeedbackBannerProps) {
  const isCorrect = outcome.status === "correct";
  const Icon = isCorrect ? Check : outcome.status === "timeout" ? Clock : Lightbulb;

  return (
    <div className="exercise-fade-in flex flex-col items-center gap-3 text-center" aria-hidden="true">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isCorrect ? "bg-success/15" : "bg-info/15",
          )}
        >
          <Icon className="size-6 text-foreground" />
        </span>
        <div className="text-left">
          <p className="font-heading text-base font-bold text-foreground">{outcome.message}</p>
          {outcome.celebration && (
            <p className="text-sm text-muted-foreground">{outcome.celebration}</p>
          )}
        </div>
      </div>

      {!isCorrect && (
        <Button variant="outline" onClick={onContinue} tabIndex={-1}>
          Continuer
        </Button>
      )}
    </div>
  );
}

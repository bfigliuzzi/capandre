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
 * Retour après réponse. Le texte (icône + message) porte `aria-hidden` :
 * il est déjà annoncé par la région live unique de la session. La racine,
 * elle, NE porte PAS `aria-hidden` — elle contient le bouton « Continuer »,
 * cliquable et focalisable. Icônes jamais punitives — aucune croix rouge,
 * aucun compteur d'erreurs.
 */
export function FeedbackBanner({ outcome, onContinue }: FeedbackBannerProps) {
  const isCorrect = outcome.status === "correct";
  const Icon = isCorrect ? Check : outcome.status === "timeout" ? Clock : Lightbulb;

  return (
    <div className="exercise-fade-in flex flex-col items-center gap-3 text-center">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            isCorrect ? "bg-success/15" : "bg-info/15",
          )}
          aria-hidden="true"
        >
          <Icon className="size-6 text-foreground" />
        </span>
        <div className="text-left" aria-hidden="true">
          <p className="font-heading text-base font-bold text-foreground">{outcome.message}</p>
          {outcome.celebration && (
            <p className="text-sm text-muted-foreground">{outcome.celebration}</p>
          )}
        </div>
      </div>

      {!isCorrect && (
        <Button variant="outline" onClick={onContinue}>
          Continuer
        </Button>
      )}
    </div>
  );
}

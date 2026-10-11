"use client";

import Link from "next/link";
import { StarRating, starsLabel } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { starsFor } from "@/lib/dictionnaire";

interface TrainingSummaryProps {
  readonly score: number;
  readonly total: number;
  readonly onRestart: () => void;
}

/** Fin de l'entraînement : bonnes réponses et étoiles (R25). Rien n'est enregistré (R26). */
export function TrainingSummary({ score, total, onRestart }: TrainingSummaryProps) {
  const stars = starsFor(score);
  const answers = `${score} bonne${score > 1 ? "s" : ""} réponse${score > 1 ? "s" : ""}`;

  return (
    <section aria-labelledby="dico-resume" className="mx-auto flex max-w-prose flex-col items-center gap-4 text-center">
      <h2 id="dico-resume" tabIndex={-1} className="font-heading text-2xl font-bold">
        Entraînement terminé
      </h2>
      <StarRating value={stars} size="lg" animated label={starsLabel(stars)} />
      <p className="text-lg">
        {answers} sur {total}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onRestart}>Recommencer</Button>
        <Button variant="outline" render={<Link href="/dictionnaire/entrainement" />}>
          Choisir d&apos;autres compétences
        </Button>
      </div>
    </section>
  );
}

"use client";

import { DifficultySelector } from "@/components/difficulty-selector";
import { ExercisePlaceholder } from "@/components/exercise-placeholder";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DicteeExercicePage() {
  useSetHeader("Dictée", "/dictee");

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <DifficultySelector />
        <ExercisePlaceholder
          icon="📝"
          title="Exercice de dictée"
          message="Le contenu de l'exercice apparaîtra ici. Ce squelette sera complété dans une prochaine étape."
        />
      </div>
    </PageTransition>
  );
}

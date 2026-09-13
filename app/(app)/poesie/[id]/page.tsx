"use client";

import { BookOpen } from "lucide-react";
import { DifficultySelector } from "@/components/difficulty-selector";
import { ExercisePlaceholder } from "@/components/exercise-placeholder";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function PoesieExercicePage() {
  useSetHeader("Poésie", "/poesie");

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <DifficultySelector />
        <ExercisePlaceholder
          icon={BookOpen}
          title="Exercice de poésie"
          message="Le contenu de l'exercice de poésie apparaîtra ici. Les mots disparaîtront progressivement selon le niveau choisi."
        />
      </div>
    </PageTransition>
  );
}

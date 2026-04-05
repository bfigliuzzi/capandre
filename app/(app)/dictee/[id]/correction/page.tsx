"use client";

import { use } from "react";
import { ExercisePlaceholder } from "@/components/exercise-placeholder";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DicteeCorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  useSetHeader("Correction", `/dictee/${id}`);

  return (
    <PageTransition>
      <ExercisePlaceholder
        icon="✅"
        title="Correction de la dictée"
        message="La page de correction apparaîtra ici. Ce squelette sera complété dans une prochaine étape."
      />
    </PageTransition>
  );
}

"use client";

import { Suspense } from "react";
import { TrainingSessionRoute } from "@/components/dictionnaire/dictionary-routes";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DictionnaireSessionPage() {
  useSetHeader("Entraînement", "/dictionnaire/entrainement");

  return (
    <PageTransition>
      {/* <Suspense> obligatoire autour de useSearchParams() (prerender Next 16). */}
      <Suspense>
        <TrainingSessionRoute />
      </Suspense>
    </PageTransition>
  );
}

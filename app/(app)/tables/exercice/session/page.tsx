"use client";

import { Suspense } from "react";
import { PageTransition } from "@/components/page-transition";
import { MultiplicationSessionRoute } from "@/components/tables/multiplication-session-route";
import { TablesLoader } from "@/components/tables/tables-loader";

// Le header est piloté par `MultiplicationSession` selon la phase (« Exercice »
// pendant la partie, « Résultats » ensuite) : cette page n'appelle donc PAS
// `useSetHeader`, sinon l'effet parent écraserait le titre du résumé.
export default function TablesSessionPage() {
  return (
    <PageTransition>
      {/* <Suspense> obligatoire autour de useSearchParams() (prerender Next 16). */}
      <Suspense fallback={<TablesLoader />}>
        <MultiplicationSessionRoute />
      </Suspense>
    </PageTransition>
  );
}

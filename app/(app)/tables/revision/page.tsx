"use client";

import { Suspense } from "react";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { RevisionView } from "@/components/tables/revision-view";
import { TablesLoader } from "@/components/tables/tables-loader";

export default function TablesRevisionPage() {
  useSetHeader("Révision", "/tables");

  return (
    <PageTransition>
      <Suspense fallback={<TablesLoader />}>
        <RevisionView />
      </Suspense>
    </PageTransition>
  );
}

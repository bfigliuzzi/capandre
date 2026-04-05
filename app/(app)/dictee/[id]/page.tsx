"use client";

import { use } from "react";
import { DicteeExercise } from "@/components/dictee-exercise";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { useDictation } from "@/lib/db";

export default function DicteeExercicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dictation, isLoading } = useDictation(id);

  useSetHeader(dictation?.title ?? "Dictée", "/dictee");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Chargement en cours">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden="true" />
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  if (!dictation) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">Dictée introuvable.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <DicteeExercise dictation={dictation} />
    </PageTransition>
  );
}

"use client";

import { use } from "react";
import { DictationForm } from "@/components/dictation-form";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { useDictation } from "@/lib/db";

export default function EditDictationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useSetHeader("Modifier la dictee", "/dictee");

  const { dictation, isLoading } = useDictation(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!dictation) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">Dictee introuvable.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <DictationForm mode="edit" dictation={dictation} />
    </PageTransition>
  );
}

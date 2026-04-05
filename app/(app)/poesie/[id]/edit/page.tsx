"use client";

import { use } from "react";
import { PoemForm } from "@/components/poem-form";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { usePoem } from "@/lib/db";

export default function EditPoemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useSetHeader("Modifier le poème", "/poesie");

  const { poem, isLoading } = usePoem(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12" role="status" aria-label="Chargement en cours">
        <div className="size-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" aria-hidden="true" />
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">Poème introuvable.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <PoemForm mode="edit" poem={poem} />
    </PageTransition>
  );
}

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
  useSetHeader("Modifier le poeme", "/poesie");

  const { poem, isLoading } = usePoem(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="size-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">Poeme introuvable.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <PoemForm mode="edit" poem={poem} />
    </PageTransition>
  );
}

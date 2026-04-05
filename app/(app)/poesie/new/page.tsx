"use client";

import { PoemForm } from "@/components/poem-form";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function NewPoemPage() {
  useSetHeader("Nouveau poeme", "/poesie");

  return (
    <PageTransition>
      <PoemForm mode="create" />
    </PageTransition>
  );
}

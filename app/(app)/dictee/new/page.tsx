"use client";

import { DictationForm } from "@/components/dictation-form";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function NewDictationPage() {
  useSetHeader("Nouvelle dictee", "/dictee");

  return (
    <PageTransition>
      <DictationForm mode="create" />
    </PageTransition>
  );
}

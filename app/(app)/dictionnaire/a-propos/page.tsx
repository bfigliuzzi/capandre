"use client";

import { DictionaryAbout } from "@/components/dictionnaire/dictionary-about";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DictionnaireAProposPage() {
  useSetHeader("À propos du dictionnaire", "/dictionnaire");

  return (
    <PageTransition>
      <DictionaryAbout />
    </PageTransition>
  );
}

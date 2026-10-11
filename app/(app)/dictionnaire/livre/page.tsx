"use client";

import { DictionaryBookRoute } from "@/components/dictionnaire/dictionary-routes";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DictionnaireLivrePage() {
  useSetHeader("Dictionnaire", "/dictionnaire");

  return (
    <PageTransition>
      <DictionaryBookRoute />
    </PageTransition>
  );
}

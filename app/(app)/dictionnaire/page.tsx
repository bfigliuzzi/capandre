"use client";

import { BookOpenText, GraduationCap, Info } from "lucide-react";
import { useSetHeader } from "@/components/layout/use-set-header";
import { ModuleCard } from "@/components/module-card";
import { PageTransition } from "@/components/page-transition";

export default function DictionnairePage() {
  useSetHeader("Dictionnaire", "/");

  return (
    <PageTransition>
      <div className="grid gap-4 sm:grid-cols-2">
        <ModuleCard
          href="/dictionnaire/livre"
          icon={BookOpenText}
          title="Ouvrir le dictionnaire"
          description="Feuillette les pages et lis les articles, comme dans un vrai livre"
          variant="primary"
        />
        <ModuleCard
          href="/dictionnaire/entrainement"
          icon={GraduationCap}
          title="M'entraîner"
          description="10 questions pour apprendre à chercher un mot et lire un article"
          variant="secondary"
        />
        <ModuleCard
          href="/dictionnaire/a-propos"
          icon={Info}
          title="À propos"
          description="D'où viennent les mots du dictionnaire"
          variant="tertiary"
        />
      </div>
    </PageTransition>
  );
}

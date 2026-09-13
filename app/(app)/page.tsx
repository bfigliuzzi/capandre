"use client";

import { BookOpen, Calculator, NotebookPen } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModuleCard } from "@/components/module-card";
import { OnboardingMessage } from "@/components/onboarding-message";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function HomePage() {
  useSetHeader("", null);

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-2 md:hidden">
          <SidebarTrigger />
        </div>

        <div className="flex flex-col items-center gap-2 pt-4">
          <h1 className="font-heading text-3xl font-extrabold text-primary">
            Capandre
          </h1>
          <p className="text-lg text-muted-foreground">La boîte à outils pour réviser ses leçons</p>
        </div>

        <OnboardingMessage />

        <div className="grid gap-4 sm:grid-cols-2">
          <ModuleCard
            href="/dictee"
            icon={NotebookPen}
            title="Dictée"
            description="Révise tes mots de dictée avec 3 niveaux de difficulté"
            variant="primary"
          />
          <ModuleCard
            href="/poesie"
            icon={BookOpen}
            title="Poésie"
            description="Apprends ta poésie par cœur, les mots disparaissent progressivement"
            variant="secondary"
          />
          <ModuleCard
            href="/tables"
            icon={Calculator}
            title="Tables de multiplication"
            description="Révise tes tables, gagne des étoiles et débloque des trophées !"
            variant="tertiary"
          />
        </div>
      </div>
    </PageTransition>
  );
}

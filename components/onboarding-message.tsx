"use client";

import { useHasContent } from "@/lib/db";

export function OnboardingMessage() {
  const { hasContent, isLoading } = useHasContent();

  if (isLoading || hasContent) return null;

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-border p-6 text-center">
      <div className="text-4xl mb-3" aria-hidden="true">👋</div>
      <p className="font-heading text-xl font-bold mb-2">
        Bienvenue dans Capandre !
      </p>
      <p className="text-base text-muted-foreground leading-relaxed">
        Pour commencer, ouvre un module ci-dessous et appuie sur
        <strong className="text-primary font-bold"> Ajouter</strong> pour créer ton premier contenu.
      </p>
    </div>
  );
}

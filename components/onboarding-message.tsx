"use client";

import { useHasContent } from "@/lib/db";

export function OnboardingMessage() {
  const { hasContent, isLoading } = useHasContent();

  if (isLoading || hasContent) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Commencez par ajouter du contenu : ouvrez un module et appuyez sur
        <span className="font-semibold text-foreground"> Ajouter</span>.
      </p>
    </div>
  );
}

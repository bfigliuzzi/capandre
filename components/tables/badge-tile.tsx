"use client";

import { Lock } from "lucide-react";
import type { BadgeDefinition } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

interface BadgeTileProps {
  definition: BadgeDefinition;
  unlockedAt: string | null;
  highlighted?: boolean;
}

/** Tuile de trophée : colorée débloquée, grisée + cadenas verrouillée. */
export function BadgeTile({ definition, unlockedAt, highlighted = false }: BadgeTileProps) {
  const isUnlocked = unlockedAt !== null;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center shadow-sm",
        isUnlocked ? "border-warning/40 bg-warning/10" : "border-border bg-muted/40 opacity-60 grayscale",
        highlighted && "border-primary ring-2 ring-primary/40",
      )}
      {...(isUnlocked
        ? {}
        : { role: "group", "aria-label": `Trophée à débloquer : ${definition.title}. ${definition.description}` })}
    >
      {isUnlocked ? (
        <span className="text-[2rem]" aria-hidden="true">
          {definition.emoji}
        </span>
      ) : (
        <Lock className="size-8 text-muted-foreground" aria-hidden="true" />
      )}
      <p className="font-heading text-base font-bold text-foreground" aria-hidden={!isUnlocked}>
        {definition.title}
      </p>
      <p className="text-sm text-muted-foreground" aria-hidden={!isUnlocked}>
        {definition.description}
      </p>
      {isUnlocked && unlockedAt && (
        <p className="text-sm text-muted-foreground">
          Débloqué le {new Date(unlockedAt).toLocaleDateString("fr-FR")}
        </p>
      )}
    </div>
  );
}

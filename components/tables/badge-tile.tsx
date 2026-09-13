"use client";

import {
  Brain,
  Calculator,
  CalendarCheck,
  Crown,
  Flame,
  Footprints,
  Library,
  Lock,
  Percent,
  Sparkles,
  Sprout,
  Star,
  Target,
  Timer,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BadgeDefinition, BadgeIconName } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

/** Résolution du nom d'icône du domaine vers le composant de rendu. */
const BADGE_ICONS: Record<BadgeIconName, LucideIcon> = {
  sprout: Sprout,
  flame: Flame,
  zap: Zap,
  target: Target,
  "calendar-check": CalendarCheck,
  footprints: Footprints,
  calculator: Calculator,
  percent: Percent,
  timer: Timer,
  sparkles: Sparkles,
  library: Library,
  brain: Brain,
  star: Star,
  crown: Crown,
};

interface BadgeTileProps {
  definition: BadgeDefinition;
  unlockedAt: string | null;
  highlighted?: boolean;
}

/** Tuile de trophée : colorée débloquée, grisée + cadenas verrouillée. */
export function BadgeTile({ definition, unlockedAt, highlighted = false }: BadgeTileProps) {
  const isUnlocked = unlockedAt !== null;
  const Icon = BADGE_ICONS[definition.icon];

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
        <Icon className="size-8 text-warning" strokeWidth={1.75} aria-hidden="true" />
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

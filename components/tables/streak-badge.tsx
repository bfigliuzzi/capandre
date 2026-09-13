"use client";

import { Flame } from "lucide-react";
import { STREAK_MIN_DISPLAY } from "@/lib/multiplication";

interface StreakBadgeProps {
  streak: number;
}

/**
 * Série en cours. `aria-hidden` : l'information est relayée dans la phrase de
 * feedback aux paliers (3, 5, 10…), pas à chaque bonne réponse.
 */
export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak < STREAK_MIN_DISPLAY) return null;

  return (
    <span
      // Le changement de `key` remonte l'élément : l'animation se rejoue.
      key={streak}
      className="mult-streak-pop inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-base font-bold"
      aria-hidden="true"
    >
      <Flame className="size-4 text-warning" strokeWidth={2} />
      <span>{streak} à la suite !</span>
    </span>
  );
}

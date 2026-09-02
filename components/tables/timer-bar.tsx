"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface TimerBarProps {
  /** `null` en mode « De base » : aucune barre n'est rendue. */
  durationMs: number | null;
  paused: boolean;
}

/**
 * Barre de temps 100 % CSS (aucun tick JS, aucune re-render par frame).
 * L'appelant la remonte avec `key={runKey}` pour repartir de zéro.
 * `aria-hidden` : aucune annonce à la seconde, ce serait anxiogène.
 */
export function TimerBar({ durationMs, paused }: TimerBarProps) {
  if (durationMs === null) return null;

  return (
    <div className="mult-timer" aria-hidden="true">
      <div
        className={cn("mult-timer-fill", paused && "mult-timer-fill--paused")}
        style={{ "--mult-timer-duration": `${durationMs}ms` } as CSSProperties}
      />
    </div>
  );
}

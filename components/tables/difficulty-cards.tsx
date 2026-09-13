"use client";

import { Timer, Turtle, Zap, type LucideIcon } from "lucide-react";
import { DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS } from "@/lib/multiplication";
import type { Difficulty } from "@/lib/multiplication";
import { useRovingTabindex } from "@/hooks/use-roving-tabindex";
import { cn } from "@/lib/utils";

const DIFFICULTIES: { id: Difficulty; Icon: LucideIcon }[] = [
  { id: "basic", Icon: Turtle },
  { id: "paced", Icon: Timer },
  { id: "challenge", Icon: Zap },
];

export interface DifficultyCardsProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
  labelId: string;
}

/** Radiogroup 3 cartes (De base / Cadencé / Défi), roving tabindex. */
export function DifficultyCards({ value, onChange, labelId }: DifficultyCardsProps) {
  const activeIndex = DIFFICULTIES.findIndex((d) => d.id === value);
  const { getItemProps } = useRovingTabindex({
    count: DIFFICULTIES.length,
    activeIndex,
    onActivate: (index) => onChange(DIFFICULTIES[index].id),
  });

  return (
    <div
      className="flex flex-col gap-2 md:flex-row md:gap-4"
      role="radiogroup"
      aria-labelledby={labelId}
    >
      {DIFFICULTIES.map((difficulty, index) => {
        const active = difficulty.id === value;
        const itemProps = getItemProps(index);
        return (
          <button
            key={difficulty.id}
            ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={itemProps.tabIndex}
            onClick={() => onChange(difficulty.id)}
            onKeyDown={itemProps.onKeyDown}
            className={cn("difficulty-card", active && "difficulty-card--active")}
          >
            <div className="flex shrink-0 w-12 justify-center" aria-hidden="true">
              <difficulty.Icon className="size-7" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <div className="font-heading font-bold text-base">{DIFFICULTY_LABELS[difficulty.id]}</div>
              <div className="text-sm text-muted-foreground">{DIFFICULTY_DESCRIPTIONS[difficulty.id]}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

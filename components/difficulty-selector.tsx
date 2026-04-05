"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const levels = [
  { id: "discovery", label: "Découverte", stars: "⭐" },
  { id: "learning", label: "Apprentissage", stars: "⭐⭐" },
  { id: "mastery", label: "Maîtrise", stars: "⭐⭐⭐" },
] as const;

interface DifficultySelectorProps {
  defaultLevel?: string;
  onSelect?: (levelId: string) => void;
}

export function DifficultySelector({ defaultLevel = "discovery", onSelect }: DifficultySelectorProps) {
  const [selected, setSelected] = useState(defaultLevel);

  function handleSelect(levelId: string) {
    setSelected(levelId);
    onSelect?.(levelId);
  }

  return (
    <div className="flex gap-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Niveau de difficulté">
      {levels.map((level) => (
        <button
          key={level.id}
          role="radio"
          aria-checked={selected === level.id}
          onClick={() => handleSelect(level.id)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] text-center focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            selected === level.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="block text-base" aria-hidden>{level.stars}</span>
          <span className="block text-xs mt-0.5">{level.label}</span>
        </button>
      ))}
    </div>
  );
}

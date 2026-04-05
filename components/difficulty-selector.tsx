"use client";

import { useState, useRef, useCallback } from "react";
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
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function handleSelect(levelId: string) {
    setSelected(levelId);
    onSelect?.(levelId);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let next = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (index + 1) % levels.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (index - 1 + levels.length) % levels.length;
      }
      if (next !== index) {
        refs.current[next]?.focus();
        handleSelect(levels[next].id);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSelect]
  );

  return (
    <div className="flex gap-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label="Niveau de difficulté">
      {levels.map((level, i) => (
        <button
          key={level.id}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={selected === level.id}
          tabIndex={selected === level.id ? 0 : -1}
          onClick={() => handleSelect(level.id)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] text-center focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
            selected === level.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className="block text-base" aria-hidden>{level.stars}</span>
          <span className="block text-base mt-0.5">{level.label}</span>
        </button>
      ))}
    </div>
  );
}

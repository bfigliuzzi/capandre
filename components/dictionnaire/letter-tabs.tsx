"use client";

import { useState } from "react";
import { LETTERS } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";

interface LetterTabsProps {
  readonly available: ReadonlySet<string>;
  readonly onSelect: (letter: string) => void;
}

/**
 * Onglets des lettres (R6). Sous `md`, 26 onglets ne tiennent pas : un bouton
 * « Lettres » ouvre la grille. À partir de `md`, ils sont toujours visibles.
 */
export function LetterTabs({ available, onSelect }: LetterTabsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="dico-lettres"
        onClick={() => setOpen((o) => !o)}
        className="min-h-11 self-start rounded-lg border-2 border-border px-4 font-bold md:hidden focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        Lettres
      </button>
      <nav id="dico-lettres" aria-label="Lettres" className={cn(open ? "grid" : "hidden", "grid-cols-7 gap-1 md:flex md:flex-wrap")}>
        {LETTERS.map((letter) => {
          const enabled = available.has(letter);
          return (
            <button
              key={letter}
              type="button"
              aria-label={`Lettre ${letter.toUpperCase()}`}
              aria-disabled={!enabled}
              onClick={() => {
                if (!enabled) return;
                onSelect(letter);
                setOpen(false);
              }}
              className={cn(
                "size-11 rounded-lg border-2 border-border font-heading font-bold uppercase focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                enabled ? "hover:bg-muted" : "cursor-not-allowed text-muted-foreground opacity-50",
              )}
            >
              {letter}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

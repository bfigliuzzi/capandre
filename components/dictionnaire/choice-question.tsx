"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { useRovingTabindex } from "@/hooks/use-roving-tabindex";
import { cn } from "@/lib/utils";

interface ChoiceQuestionProps {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly selected: number | null;
  readonly onSelect: (index: number) => void;
  readonly onSubmit: () => void;
}

/** Propositions en radiogroup avec roving tabindex, puis « Valider » (R23). */
export function ChoiceQuestion({ prompt, choices, selected, onSelect, onSubmit }: ChoiceQuestionProps) {
  const promptId = useId();
  const { getItemProps } = useRovingTabindex({
    count: choices.length,
    activeIndex: selected ?? 0,
    onActivate: onSelect,
    orientation: "both",
  });

  return (
    <div className="flex flex-col gap-4">
      <p id={promptId} className="font-heading text-lg font-bold">
        {prompt}
      </p>
      <div role="radiogroup" aria-labelledby={promptId} className="flex flex-col gap-2">
        {choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected === index}
            onClick={() => onSelect(index)}
            {...getItemProps(index)}
            className={cn(
              "min-h-11 rounded-xl border-2 px-4 py-2 text-left text-base focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              selected === index ? "border-primary bg-primary/10 font-bold" : "border-border hover:bg-muted",
            )}
          >
            {choice}
          </button>
        ))}
      </div>
      <Button onClick={onSubmit} disabled={selected === null} className="self-start">
        Valider
      </Button>
    </div>
  );
}

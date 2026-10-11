"use client";

import { useId, useState, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { useRovingTabindex } from "@/hooks/use-roving-tabindex";
import { cn } from "@/lib/utils";

interface ChoiceQuestionProps {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly selected: number | null;
  readonly onSelect: (index: number) => void;
  readonly onSubmit: () => void;
  /** Reçoit le focus quand la question apparaît après la recherche. */
  readonly promptRef?: RefObject<HTMLElement | null>;
}

/** Propositions en radiogroup avec roving tabindex, puis « Valider » (R23). */
export function ChoiceQuestion({ prompt, choices, selected, onSelect, onSubmit, promptRef }: ChoiceQuestionProps) {
  const promptId = useId();
  const errorId = useId();
  const [missing, setMissing] = useState(false);

  function submit() {
    if (selected === null) {
      setMissing(true);
      return;
    }
    onSubmit();
  }
  const { getItemProps } = useRovingTabindex({
    count: choices.length,
    activeIndex: selected ?? 0,
    onActivate: onSelect,
    orientation: "both",
  });

  return (
    <div className="flex flex-col gap-4">
      <p id={promptId} ref={promptRef as RefObject<HTMLParagraphElement | null>} tabIndex={-1} className="font-heading text-lg font-bold focus-visible:outline-none">
        {prompt}
      </p>
      <div role="radiogroup" aria-labelledby={promptId} aria-describedby={missing ? errorId : undefined} className="flex flex-col gap-2">
        {choices.map((choice, index) => (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={selected === index}
            onClick={() => {
              setMissing(false);
              onSelect(index);
            }}
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
      {missing && (
        <p id={errorId} role="alert" className="text-base text-destructive">
          Choisis une réponse.
        </p>
      )}
      <Button onClick={submit} className="self-start">
        Valider
      </Button>
    </div>
  );
}

"use client";

import { SESSION_LENGTHS } from "@/lib/multiplication";
import type { SessionLength } from "@/lib/multiplication";
import { useRovingTabindex } from "@/hooks/use-roving-tabindex";
import { cn } from "@/lib/utils";

const LENGTH_LABELS: Record<SessionLength, string> = {
  10: "Rapide",
  20: "Moyen",
  30: "Long",
};

export interface SessionLengthPickerProps {
  value: SessionLength;
  onChange: (length: SessionLength) => void;
  labelId: string;
}

/** Radiogroup segmenté 10/20/30 questions, roving tabindex. */
export function SessionLengthPicker({ value, onChange, labelId }: SessionLengthPickerProps) {
  const lengths = SESSION_LENGTHS as readonly SessionLength[];
  const activeIndex = lengths.indexOf(value);
  const { getItemProps } = useRovingTabindex({
    count: lengths.length,
    activeIndex,
    onActivate: (index) => onChange(lengths[index]),
  });

  return (
    <div
      className="flex gap-2 rounded-xl bg-muted p-1"
      role="radiogroup"
      aria-labelledby={labelId}
    >
      {lengths.map((length, index) => {
        const active = length === value;
        const itemProps = getItemProps(index);
        return (
          <button
            key={length}
            ref={itemProps.ref as (el: HTMLButtonElement | null) => void}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={itemProps.tabIndex}
            onClick={() => onChange(length)}
            onKeyDown={itemProps.onKeyDown}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-center transition-[background-color,color,box-shadow] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="block font-heading text-lg font-bold tabular-nums">{length}</span>
            <span className="block text-sm">{LENGTH_LABELS[length]}</span>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALL_TABLES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export interface TableChipsProps {
  value: number[];
  onChange: (next: number[]) => void;
  invalid?: boolean;
  describedBy?: string;
  labelId: string;
}

/**
 * Multi-sélection des tables (1 à 10) + bascule « Toutes ». Ordre de
 * tabulation normal (ce n'est pas un radiogroup) : roving tabindex non
 * requis, l'accès direct est plus robuste pour 11 chips.
 */
export function TableChips({ value, onChange, invalid = false, describedBy, labelId }: TableChipsProps) {
  const allSelected = value.length === ALL_TABLES.length;

  function toggleTable(table: number) {
    if (value.includes(table)) {
      onChange(value.filter((t) => t !== table));
    } else {
      onChange([...value, table].sort((a, b) => a - b));
    }
  }

  function toggleAll() {
    onChange(allSelected ? [] : [...ALL_TABLES]);
  }

  const describedByIds = describedBy ?? (invalid ? "tables-error" : "tables-hint");

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- spec-ui.md §5 impose aria-invalid sur ce role="group" pour signaler l'absence de sélection ; la règle ne reconnaît pas encore cet usage. */}
      <div
        role="group"
        aria-labelledby={labelId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedByIds}
        className="flex flex-wrap gap-2"
      >
        {ALL_TABLES.map((table) => {
          const active = value.includes(table);
          return (
            <Button
              key={table}
              type="button"
              variant="outline"
              size="icon-lg"
              aria-pressed={active}
              onClick={() => toggleTable(table)}
              className="relative size-12 text-lg font-heading font-bold tabular-nums aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-primary"
            >
              {table}
              {active && (
                <Check className="absolute right-0.5 top-0.5 size-3.5" aria-hidden="true" />
              )}
            </Button>
          );
        })}
        <Button
          type="button"
          variant="outline"
          aria-pressed={allSelected}
          onClick={toggleAll}
          className={cn(
            "h-12 px-4 font-heading font-bold aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-primary",
          )}
        >
          Toutes
        </Button>
      </div>
      {invalid ? (
        <p id="tables-error" role="alert" className="text-sm font-bold text-destructive">
          Choisis au moins une table pour commencer.
        </p>
      ) : (
        <p id="tables-hint" className="text-sm text-muted-foreground">
          Tu peux en choisir plusieurs.
        </p>
      )}
    </div>
  );
}

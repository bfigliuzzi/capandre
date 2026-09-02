"use client";

import type { FactSummary } from "@/lib/multiplication";

interface FactListProps {
  facts: readonly FactSummary[];
  /** `id` du titre de section, pour `aria-labelledby`. */
  labelledBy?: string;
}

/**
 * Liste « À retravailler ». L'équation visuelle est `aria-hidden` et doublée
 * d'un équivalent parlé : `aria-label` sur un `<li>` n'est pas fiablement
 * supporté selon les combinaisons lecteur d'écran / navigateur.
 */
export function FactList({ facts, labelledBy }: FactListProps) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-labelledby={labelledBy}>
      {facts.map((fact) => (
        <li
          key={fact.key}
          className="rounded-xl border-2 border-border bg-card px-3 py-2 text-center font-heading text-base font-bold tabular-nums"
        >
          <span aria-hidden="true">{fact.label}</span>
          <span className="sr-only">
            {fact.a} fois {fact.b} égale {fact.product}
          </span>
        </li>
      ))}
    </ul>
  );
}

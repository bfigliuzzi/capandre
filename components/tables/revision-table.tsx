"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buildTable } from "@/lib/multiplication";

interface RevisionTableProps {
  tableId: number;
  hideResults: boolean;
}

/**
 * Les 10 lignes de la table, révélation ligne par ligne quand `hideResults`
 * est actif. L'appelant remonte le composant (via `key`) quand `tableId` ou
 * `hideResults` change, ce qui réinitialise l'état de révélation sans effet.
 */
export function RevisionTable({ tableId, hideResults }: RevisionTableProps) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const lines = buildTable(tableId);

  function toggleLine(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function revealAll() {
    setRevealed(new Set(lines.map((_, index) => index)));
  }

  return (
    <div className="flex flex-col gap-3">
      {hideResults && (
        <Button type="button" variant="outline" onClick={revealAll} className="self-start">
          Tout révéler
        </Button>
      )}
      <ol aria-labelledby="revision-title" className="flex flex-col gap-2">
        {lines.map(({ fact, product }, index) => {
          const isRevealed = !hideResults || revealed.has(index);
          const spoken = `${fact.a} fois ${fact.b} égale ${product}`;
          return (
            <li key={index} className="mult-revision-line">
              <span aria-hidden="true">{fact.a}</span>
              <span aria-hidden="true">×</span>
              <span aria-hidden="true">{fact.b}</span>
              <span aria-hidden="true">=</span>
              {isRevealed ? (
                <span aria-hidden="true">{product}</span>
              ) : (
                <button
                  type="button"
                  aria-pressed={isRevealed}
                  aria-label={`Voir le résultat de ${fact.a} fois ${fact.b}`}
                  onClick={() => toggleLine(index)}
                  className="justify-self-start font-heading text-inherit hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none rounded"
                >
                  ?
                </button>
              )}
              {isRevealed && <span className="sr-only">{spoken}</span>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/tables/star-rating";
import { RevisionTable } from "@/components/tables/revision-table";
import { TablesLoader } from "@/components/tables/tables-loader";
import { useRovingTabindex } from "@/hooks/use-roving-tabindex";
import { useMultiplicationProgress } from "@/lib/db";
import { TABLES } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

function parseTableParam(raw: string | null): number {
  const value = raw ? Number(raw) : 1;
  if (!Number.isInteger(value) || value < 1 || value > 10) return 1;
  return value;
}

/** Lit/écrit ?table=, gère prev/next, sélecteur rapide et la bascule de révélation. */
export function RevisionView() {
  const router = useRouter();
  const params = useSearchParams();
  const tableId = parseTableParam(params.get("table"));

  const { stars, isLoading } = useMultiplicationProgress();
  const [hideResults, setHideResults] = useState(false);

  const activeIndex = tableId - 1;

  function goToTable(next: number) {
    if (next < 1 || next > 10) return;
    router.replace(`/tables/revision?table=${next}`, { scroll: false });
  }

  const { getItemProps } = useRovingTabindex({
    count: TABLES.length,
    activeIndex,
    onActivate: (index) => goToTable(index + 1),
  });

  const tableStars = stars[String(tableId)] ?? 0;
  const tipFactor = tableId === 4 ? 3 : 4;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="revision-title" className="font-heading text-2xl font-bold">
          La table de {tableId}
        </h2>
        {!isLoading && (
          <StarRating value={tableStars} label={`Table de ${tableId} : ${tableStars} étoile${tableStars > 1 ? "s" : ""} sur 3`} />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Table précédente"
          disabled={tableId <= 1}
          onClick={() => goToTable(tableId - 1)}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </Button>

        <div role="radiogroup" aria-label="Choisis une table" className="flex flex-wrap justify-center gap-2">
          {TABLES.map((n, index) => {
            const itemProps = getItemProps(index);
            const checked = n === tableId;
            return (
              <button
                key={n}
                {...itemProps}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => goToTable(n)}
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl border-2 font-heading text-base font-bold transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                  checked
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/50",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Table suivante"
          disabled={tableId >= 10}
          onClick={() => goToTable(tableId + 1)}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        aria-pressed={hideResults}
        onClick={() => setHideResults((v) => !v)}
        className="self-center"
      >
        {hideResults ? (
          <Check className="size-4" aria-hidden="true" />
        ) : null}
        {hideResults ? "Montrer les résultats" : "Cacher les résultats"}
      </Button>

      {isLoading ? (
        <TablesLoader />
      ) : (
        <RevisionTable key={`${tableId}-${hideResults}`} tableId={tableId} hideResults={hideResults} />
      )}

      {!isLoading && tableStars === 0 && (
        <p className="text-muted-foreground text-center">
          Tu n&apos;as pas encore d&apos;étoile sur cette table. Essaie un{" "}
          <Link href="/tables/exercice" transitionTypes={["nav-forward"]} className="font-bold text-primary underline-offset-4 hover:underline">
            exercice
          </Link>{" "}
          !
        </p>
      )}

      <p className="text-sm text-muted-foreground text-center">
        Astuce : {tableId} × {tipFactor}, c&apos;est la même chose que {tipFactor} × {tableId} !
      </p>
    </div>
  );
}

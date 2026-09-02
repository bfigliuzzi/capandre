"use client";

import { useMemo } from "react";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { BadgeGrid } from "@/components/tables/badge-grid";
import { BADGES } from "@/lib/multiplication";
import { useUnlockedBadges } from "@/lib/db";

export default function TablesTrophiesPage() {
  useSetHeader("Mes trophées", "/tables");
  const { unlocked, earned, isLoading } = useUnlockedBadges();

  const unlockedAtById = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of unlocked) map.set(entry.id, entry.unlockedAt);
    return map;
  }, [unlocked]);

  const badges = useMemo(
    () =>
      BADGES.map((definition) => ({
        definition,
        unlockedAt: unlockedAtById.get(definition.id) ?? null,
      })),
    [unlockedAtById],
  );

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-heading text-2xl font-bold">Mes trophées</h2>
          {!isLoading && (
            <p className="text-muted-foreground">
              {earned.length} trophée{earned.length > 1 ? "s" : ""} sur {BADGES.length}
            </p>
          )}
        </div>

        {!isLoading && earned.length === 0 && (
          <p className="text-muted-foreground text-center py-6">
            Termine une session d&apos;exercice pour gagner ton premier trophée !
          </p>
        )}

        <BadgeGrid badges={badges} isLoading={isLoading} />
      </div>
    </PageTransition>
  );
}

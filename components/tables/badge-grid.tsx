"use client";

import type { BadgeDefinition } from "@/lib/multiplication";
import { BadgeTile } from "@/components/tables/badge-tile";
import { TablesLoader } from "@/components/tables/tables-loader";

interface BadgeGridEntry {
  definition: BadgeDefinition;
  unlockedAt: string | null;
}

interface BadgeGridProps {
  badges: BadgeGridEntry[];
  isLoading: boolean;
  highlightIds?: string[];
}

/** Grille de trophées, 2 colonnes en mobile, 3 à partir de sm. */
export function BadgeGrid({ badges, isLoading, highlightIds }: BadgeGridProps) {
  if (isLoading) return <TablesLoader label="Chargement de tes trophées" />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {badges.map(({ definition, unlockedAt }) => (
        <BadgeTile
          key={definition.id}
          definition={definition}
          unlockedAt={unlockedAt}
          highlighted={highlightIds?.includes(definition.id)}
        />
      ))}
    </div>
  );
}

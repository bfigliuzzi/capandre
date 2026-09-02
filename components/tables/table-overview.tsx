"use client";

import { TABLES } from "@/lib/multiplication";
import { TableStarsTile } from "@/components/tables/table-stars-tile";
import { TablesLoader } from "@/components/tables/tables-loader";

interface TableOverviewProps {
  stars: Record<string, number>;
  isLoading: boolean;
}

/** Grille compacte des 10 tables avec leurs étoiles de maîtrise. */
export function TableOverview({ stars, isLoading }: TableOverviewProps) {
  if (isLoading) return <TablesLoader label="Chargement de tes étoiles" />;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {TABLES.map((tableId) => (
        <TableStarsTile
          key={tableId}
          tableId={tableId}
          stars={stars[String(tableId)] ?? 0}
          href={`/tables/revision?table=${tableId}`}
        />
      ))}
    </div>
  );
}

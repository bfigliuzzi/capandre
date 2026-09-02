"use client";

import Link from "next/link";
import { StarRating, starsLabel } from "@/components/tables/star-rating";
import { cn } from "@/lib/utils";

interface TableStarsTileProps {
  tableId: number;
  stars: number;
  href: string;
}

/** Une case de l'aperçu des tables : gros numéro + étoiles de maîtrise. */
export function TableStarsTile({ tableId, stars, href }: TableStarsTileProps) {
  return (
    <Link
      href={href}
      transitionTypes={["nav-forward"]}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border-2 border-border bg-card px-2 py-3 shadow-sm transition-[transform,box-shadow,border-color] motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      <span className="font-heading text-2xl font-bold text-foreground" aria-hidden="true">
        {tableId}
      </span>
      <StarRating value={stars} size="sm" label={`Table de ${tableId} : ${starsLabel(stars)}`} />
    </Link>
  );
}

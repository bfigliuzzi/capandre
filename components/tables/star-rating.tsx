"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  /** Nombre d'étoiles pleines (0..max). */
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Anime l'apparition des étoiles (utilisé au résumé de session). */
  animated?: boolean;
  /** Nom accessible complet, ex. "Table de 7 : 3 étoiles sur 3". */
  label: string;
}

const SIZE_CLASSES: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "size-5",
  md: "size-6",
  lg: "size-8",
};

/**
 * "2 étoiles sur 3". Règle française : 0 ET 1 restent au singulier
 * (« 0 étoile », pas « 0 étoiles »), seul le pluriel à partir de 2 prend un s.
 */
export function starsLabel(count: number, max = 3): string {
  return `${count} étoile${count > 1 ? "s" : ""} sur ${max}`;
}

/** Étoiles de maîtrise par table. Pleines/vides + role="img" — jamais couleur seule. */
export function StarRating({ value, max = 3, size = "md", animated = false, label }: StarRatingProps) {
  const sizeClass = SIZE_CLASSES[size];

  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < value;
        return (
          <Star
            key={index}
            className={cn(
              sizeClass,
              filled ? "fill-current text-warning" : "text-muted-foreground",
              animated && "mult-star-pop",
            )}
            style={animated ? ({ "--mult-star-delay": `${index * 90}ms` } as React.CSSProperties) : undefined}
            aria-hidden="true"
          />
        );
      })}
    </span>
  );
}

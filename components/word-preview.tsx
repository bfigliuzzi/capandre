"use client";

import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordPreviewProps {
  words: string[];
  duplicates: Set<string>;
}

export function WordPreview({ words, duplicates }: WordPreviewProps) {
  if (words.length === 0) {
    return (
      <p className="text-base text-muted-foreground italic">
        Les mots apparaîtront ici au fur et à mesure de la saisie...
      </p>
    );
  }

  const uniqueCount = new Set(words).size;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {words.map((word, i) => (
          <span
            key={`${word}-${i}`}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
              duplicates.has(word)
                ? "bg-warning/20 text-warning border border-warning/40"
                : "bg-primary/10 text-primary border border-primary/20"
            )}
          >
            {duplicates.has(word) && <TriangleAlert className="mr-1 size-4" strokeWidth={2} aria-hidden="true" />}
            {word}
            {duplicates.has(word) && <span className="sr-only">(doublon)</span>}
          </span>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {words.length} mot{words.length > 1 ? "s" : ""}
        {uniqueCount < words.length && ` (${uniqueCount} unique${uniqueCount > 1 ? "s" : ""})`}
      </p>
    </div>
  );
}

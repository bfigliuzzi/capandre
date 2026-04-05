"use client";

import { ViewTransition } from "react";
import { Plus } from "lucide-react";
import { usePoems } from "@/lib/db";
import { ContentItem } from "@/components/content-item";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function PoesieListPage() {
  useSetHeader("Poésie", "/");
  const { poems, isLoading } = usePoems();

  return (
    <PageTransition>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : poems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden>📖</span>
            <p className="text-muted-foreground">
              Aucun poème pour le moment.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {poems.map((poem) => (
              <ViewTransition key={poem.id}>
                <ContentItem
                  href={`/poesie/${poem.id}`}
                  icon="📖"
                  title={poem.title}
                  meta={`${poem.author ? `${poem.author} — ` : ""}${poem.stanzas.length} strophe${poem.stanzas.length > 1 ? "s" : ""}`}
                  variant="secondary"
                />
              </ViewTransition>
            ))}
          </div>
        )}

        <Button variant="secondary" className="w-full" disabled aria-disabled="true">
          <Plus className="size-4" />
          Ajouter un poème
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Bientôt disponible
        </p>
      </div>
    </PageTransition>
  );
}

"use client";

import { ViewTransition } from "react";
import { Plus } from "lucide-react";
import { useDictations } from "@/lib/db";
import { ContentItem } from "@/components/content-item";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DicteeListPage() {
  useSetHeader("Dictée", "/");
  const { dictations, isLoading } = useDictations();

  return (
    <PageTransition>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : dictations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden>📝</span>
            <p className="text-muted-foreground">
              Aucune dictée pour le moment.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {dictations.map((dictation) => (
              <ViewTransition key={dictation.id}>
                <ContentItem
                  href={`/dictee/${dictation.id}`}
                  icon="📝"
                  title={dictation.title}
                  meta={`${dictation.words.length} mot${dictation.words.length > 1 ? "s" : ""}`}
                  variant="primary"
                />
              </ViewTransition>
            ))}
          </div>
        )}

        <Button className="w-full" disabled aria-disabled="true">
          <Plus className="size-4" />
          Ajouter une dictée
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Bientôt disponible
        </p>
      </div>
    </PageTransition>
  );
}

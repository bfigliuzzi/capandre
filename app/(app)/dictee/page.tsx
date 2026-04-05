"use client";

import { useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useDictations, useDictationMutations } from "@/lib/db";
import { ContentItem } from "@/components/content-item";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DicteeListPage() {
  useSetHeader("Dictee", "/");
  const { dictations, isLoading, refetch } = useDictations();
  const { deleteDictation } = useDictationMutations();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteDictation(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : dictations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden>
              📝
            </span>
            <p className="text-muted-foreground">
              Aucune dictee pour le moment.
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
                  meta={`${dictation.words.length} mot${dictation.words.length > 1 ? "s" : ""} — ${dictation.mode === "words" ? "Mots isoles" : "Texte complet"}`}
                  variant="primary"
                  editHref={`/dictee/${dictation.id}/edit`}
                  onDelete={() =>
                    setDeleteTarget({
                      id: dictation.id,
                      title: dictation.title,
                    })
                  }
                />
              </ViewTransition>
            ))}
          </div>
        )}

        <Button className="w-full" render={<Link href="/dictee/new" transitionTypes={["nav-forward"]} />}>
          <Plus className="size-4" />
          Ajouter une dictee
        </Button>

        <DeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Supprimer cette dictee ?"
          itemName={deleteTarget?.title ?? ""}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

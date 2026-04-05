"use client";

import { useState } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { usePoems, usePoemMutations } from "@/lib/db";
import { ContentItem } from "@/components/content-item";
import { DeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function PoesieListPage() {
  useSetHeader("Poesie", "/");
  const { poems, isLoading, refetch } = usePoems();
  const { deletePoem } = usePoemMutations();

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  async function handleDelete() {
    if (!deleteTarget) return;
    await deletePoem(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-12" role="status" aria-label="Chargement en cours">
            <div className="size-6 rounded-full border-2 border-secondary border-t-transparent animate-spin" aria-hidden="true" />
            <span className="sr-only">Chargement en cours…</span>
          </div>
        ) : poems.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl" aria-hidden>
              📖
            </span>
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
                  editHref={`/poesie/${poem.id}/edit`}
                  onDelete={() =>
                    setDeleteTarget({ id: poem.id, title: poem.title })
                  }
                />
              </ViewTransition>
            ))}
          </div>
        )}

        <Button
          variant="secondary"
          className="w-full"
          render={<Link href="/poesie/new" transitionTypes={["nav-forward"]} />}
        >
          <Plus className="size-4" />
          Ajouter un poème
        </Button>

        <DeleteDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Supprimer ce poème ?"
          itemName={deleteTarget?.title ?? ""}
          onConfirm={handleDelete}
        />
      </div>
    </PageTransition>
  );
}

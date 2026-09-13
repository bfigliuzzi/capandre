"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CircleX, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { StanzaPreview } from "@/components/stanza-preview";
import { UnsavedChangesBanner } from "@/components/unsaved-changes-banner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { usePoemMutations } from "@/lib/db";
import type { Poem } from "@/lib/db";
import { parseStanzas, generateTitle } from "@/lib/parsing";

type PoemFormProps =
  | { mode: "create" }
  | { mode: "edit"; poem: Poem };

function reconstructText(poem: Poem): string {
  return poem.stanzas
    .map((stanza) => stanza.verses.map((v) => v.text).join("\n"))
    .join("\n\n");
}

export function PoemForm(props: PoemFormProps) {
  const router = useRouter();
  const { createPoem, updatePoem } = usePoemMutations();

  const isEdit = props.mode === "edit";
  const existing = isEdit ? props.poem : null;

  const [title, setTitle] = useState(
    existing?.title ?? generateTitle("poem")
  );
  const [author, setAuthor] = useState(existing?.author ?? "");
  const [content, setContent] = useState(
    existing ? reconstructText(existing) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const parsedStanzas = useMemo(() => parseStanzas(content), [content]);

  function markDirty() {
    setIsDirty(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (parsedStanzas.length === 0) {
      setError("Veuillez saisir au moins un vers.");
      return;
    }

    setIsSubmitting(true);

    const stanzas = parsedStanzas.map((s, si) => ({
      id: crypto.randomUUID(),
      order: si,
      verses: s.verses.map((text, vi) => ({
        id: crypto.randomUUID(),
        text,
        order: vi,
      })),
    }));

    if (isEdit && existing) {
      await updatePoem(existing.id, {
        title,
        author: author || undefined,
        stanzas,
      });
    } else {
      await createPoem({
        moduleId: "mod-poem",
        title,
        author: author || undefined,
        stanzas,
        createdAt: new Date().toISOString(),
      });
    }

    setIsDirty(false);
    router.push("/poesie");
  }

  function handleCancel() {
    if (isDirty && !confirm("Vous avez des modifications non enregistrées. Quitter quand même ?")) {
      return;
    }
    router.push("/poesie");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Title */}
      <div className="flex flex-col gap-3">
        <label htmlFor="title" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Titre
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Titre du poème..."
        />
      </div>

      {/* Author */}
      <div className="flex flex-col gap-3">
        <label htmlFor="author" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Auteur <span className="font-normal normal-case tracking-normal">(optionnel)</span>
        </label>
        <Input
          id="author"
          value={author}
          onChange={(e) => {
            setAuthor(e.target.value);
            markDirty();
          }}
          placeholder="Nom de l'auteur..."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <label htmlFor="content" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Texte du poème
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            markDirty();
          }}
          placeholder="Saisissez le poème ici. Séparez les strophes par une ligne vide..."
          aria-invalid={!!error || undefined}
          aria-describedby={[
            "content-hint",
            error ? "form-error" : undefined,
          ].filter(Boolean).join(" ") || undefined}
          className="min-h-[16rem]"
        />
        <p id="content-hint" className="text-sm text-muted-foreground">
          Séparez les strophes par une ligne vide. Chaque ligne correspond à un vers.
        </p>
      </div>

      {/* Preview */}
      {content.trim() && (
        <div className="flex flex-col gap-3">
          <div className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Eye className="size-4" strokeWidth={2} aria-hidden="true" />
            Aperçu des strophes
          </div>
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <StanzaPreview stanzas={parsedStanzas} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          id="form-error"
          className="flex items-start gap-2.5 p-4 bg-destructive/10 border border-destructive rounded-lg text-sm text-destructive leading-normal"
          role="alert"
        >
          <CircleX className="shrink-0 size-5" strokeWidth={2} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          className="w-full sm:w-auto sm:min-w-40"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:min-w-40"
        >
          {isSubmitting
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer le poème"}
        </Button>
      </div>

      <UnsavedChangesBanner visible={isDirty} />
    </form>
  );
}

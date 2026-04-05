"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
    if (isDirty && !confirm("Vous avez des modifications non enregistrees. Quitter quand meme ?")) {
      return;
    }
    router.push("/poesie");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium">
          Titre
        </label>
        <Input
          id="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            markDirty();
          }}
          placeholder="Titre du poeme..."
        />
      </div>

      {/* Author */}
      <div className="flex flex-col gap-2">
        <label htmlFor="author" className="text-sm font-medium">
          Auteur <span className="text-muted-foreground font-normal">(optionnel)</span>
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
      <div className="flex flex-col gap-2">
        <label htmlFor="content" className="text-sm font-medium">
          Texte du poeme
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            markDirty();
          }}
          placeholder="Saisissez le poeme ici. Separez les strophes par une ligne vide..."
          className="min-h-[16rem]"
        />
        <p className="text-xs text-muted-foreground">
          Separez les strophes par une ligne vide. Chaque ligne correspond a un vers.
        </p>
      </div>

      {/* Preview */}
      {content.trim() && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Apercu</p>
          <StanzaPreview stanzas={parsedStanzas} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="secondary"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer le poeme"}
        </Button>
      </div>

      <UnsavedChangesBanner visible={isDirty} />
    </form>
  );
}

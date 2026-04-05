"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { WordPreview } from "@/components/word-preview";
import { UnsavedChangesBanner } from "@/components/unsaved-changes-banner";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useDictationMutations } from "@/lib/db";
import type { Dictation, DictationMode } from "@/lib/db";
import {
  parseWords,
  parseFullText,
  findDuplicates,
  generateTitle,
} from "@/lib/parsing";
import { cn } from "@/lib/utils";

type DictationFormProps =
  | { mode: "create" }
  | { mode: "edit"; dictation: Dictation };

export function DictationForm(props: DictationFormProps) {
  const router = useRouter();
  const { createDictation, updateDictation } = useDictationMutations();

  const isEdit = props.mode === "edit";
  const existing = isEdit ? props.dictation : null;

  const [dictationMode, setDictationMode] = useState<DictationMode>(
    existing?.mode ?? "words"
  );
  const [title, setTitle] = useState(
    existing?.title ?? generateTitle("dictation")
  );
  const [content, setContent] = useState(() => {
    if (!existing) return "";
    if (existing.mode === "text") return existing.originalText ?? "";
    return existing.words.map((w) => w.text).join(", ");
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useUnsavedChanges(isDirty);

  const parsedWords = useMemo(
    () =>
      dictationMode === "words"
        ? parseWords(content)
        : parseFullText(content),
    [content, dictationMode]
  );

  const duplicates = useMemo(
    () => (dictationMode === "words" ? findDuplicates(parsedWords) : new Set<string>()),
    [parsedWords, dictationMode]
  );

  function markDirty() {
    setIsDirty(true);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (parsedWords.length === 0) {
      setError(
        dictationMode === "words"
          ? "Veuillez saisir au moins un mot."
          : "Veuillez saisir un texte."
      );
      return;
    }

    setIsSubmitting(true);

    const words = parsedWords.map((text, i) => ({
      id: crypto.randomUUID(),
      text,
      order: i,
    }));

    if (isEdit && existing) {
      await updateDictation(existing.id, {
        title,
        words,
        originalText: existing.mode === "text" ? content : undefined,
      });
    } else {
      await createDictation({
        moduleId: "mod-dictation",
        title,
        mode: dictationMode,
        words,
        originalText: dictationMode === "text" ? content : undefined,
        createdAt: new Date().toISOString(),
      });
    }

    setIsDirty(false);
    router.push("/dictee");
  }

  function handleCancel() {
    if (isDirty && !confirm("Vous avez des modifications non enregistrees. Quitter quand meme ?")) {
      return;
    }
    router.push("/dictee");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Mode toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Type de dictee</label>
        <div
          className="flex gap-2 rounded-xl bg-muted p-1"
          role="radiogroup"
          aria-label="Type de dictee"
        >
          {(["words", "text"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={dictationMode === m}
              disabled={isEdit}
              onClick={() => {
                if (!isEdit) {
                  setDictationMode(m);
                  markDirty();
                }
              }}
              className={cn(
                "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color,box-shadow] text-center focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                dictationMode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                isEdit && "opacity-50 cursor-not-allowed"
              )}
            >
              {m === "words" ? "Mots isoles" : "Texte complet"}
            </button>
          ))}
        </div>
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            Le type ne peut pas etre modifie apres la creation.
          </p>
        )}
      </div>

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
          placeholder="Titre de la dictee..."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <label htmlFor="content" className="text-sm font-medium">
          {dictationMode === "words" ? "Mots" : "Texte"}
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            markDirty();
          }}
          placeholder={
            dictationMode === "words"
              ? "Saisissez les mots separes par des virgules, espaces ou retours a la ligne..."
              : "Saisissez le texte complet de la dictee..."
          }
          className={dictationMode === "text" ? "min-h-[10rem]" : undefined}
        />
        {dictationMode === "words" && (
          <p className="text-xs text-muted-foreground">
            Separez les mots par des virgules, espaces ou retours a la ligne.
          </p>
        )}
      </div>

      {/* Preview */}
      {content.trim() && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Apercu</p>
          <WordPreview words={parsedWords} duplicates={duplicates} />
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
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer la dictee"}
        </Button>
      </div>

      <UnsavedChangesBanner visible={isDirty} />
    </form>
  );
}

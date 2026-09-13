"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CircleX, Eye, TriangleAlert } from "lucide-react";
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
  stripArticle,
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
  const modeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const modeOptions = ["words", "text"] as const;

  const [dictationMode, setDictationMode] = useState<DictationMode>(
    existing?.mode ?? "words",
  );
  const [title, setTitle] = useState(
    existing?.title ?? generateTitle("dictation"),
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
      dictationMode === "words" ? parseWords(content) : parseFullText(content),
    [content, dictationMode],
  );

  const duplicates = useMemo(
    () =>
      dictationMode === "words"
        ? findDuplicates(parsedWords, stripArticle)
        : new Set<string>(),
    [parsedWords, dictationMode],
  );

  function markDirty() {
    setIsDirty(true);
    setError(null);
  }

  const handleModeKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (isEdit) return;
      let next = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        next = (index + 1) % modeOptions.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        next = (index - 1 + modeOptions.length) % modeOptions.length;
      }
      if (next !== index) {
        modeRefs.current[next]?.focus();
        setDictationMode(modeOptions[next]);
        markDirty();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEdit],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (parsedWords.length === 0) {
      setError(
        dictationMode === "words"
          ? "Veuillez saisir au moins un mot."
          : "Veuillez saisir un texte.",
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
    if (
      isDirty &&
      !confirm(
        "Vous avez des modifications non enregistrées. Quitter quand même ?",
      )
    ) {
      return;
    }
    router.push("/dictee");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Mode toggle */}
      <div className="flex flex-col gap-3">
        <label className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Type de dictée
        </label>
        <div
          className="flex gap-0 rounded-xl bg-muted p-1 border border-input"
          role="radiogroup"
          aria-label="Type de dictée"
        >
          {modeOptions.map((m, i) => (
            <button
              key={m}
              ref={(el) => {
                modeRefs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={dictationMode === m}
              tabIndex={dictationMode === m ? 0 : -1}
              disabled={isEdit}
              onClick={() => {
                if (!isEdit) {
                  setDictationMode(m);
                  markDirty();
                }
              }}
              onKeyDown={(e) => handleModeKeyDown(e, i)}
              className={cn(
                "flex-1 rounded-[calc(var(--radius)-0.25rem)] px-4 py-2.5 text-sm font-semibold transition-[background-color,color,box-shadow] text-center focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                dictationMode === m
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-primary",
                isEdit && "opacity-60 cursor-not-allowed",
              )}
            >
              {m === "words" ? "Mots isolés" : "Texte complet"}
            </button>
          ))}
        </div>
        {isEdit && (
          <p className="text-sm text-muted-foreground">
            Le type ne peut pas être modifié après la création.
          </p>
        )}
      </div>

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
          placeholder="Titre de la dictée..."
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3">
        <label htmlFor="content" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
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
              ? "Saisissez les mots séparés par des virgules ou retours à la ligne...\n\nExemple : le coq, les oies, un caneton"
              : "Saisissez le texte complet de la dictée..."
          }
          aria-invalid={!!error || undefined}
          aria-describedby={
            [
              dictationMode === "words" ? "content-hint" : undefined,
              error ? "form-error" : undefined,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={dictationMode === "text" ? "min-h-[14rem]" : undefined}
        />
        {dictationMode === "words" && (
          <p id="content-hint" className="text-sm text-muted-foreground">
            Séparateurs acceptés : virgule ou retour à la ligne
          </p>
        )}

        {/* Duplicate warning */}
        {dictationMode === "words" && duplicates.size > 0 && (
          <div className="callout-warning flex items-start gap-2.5 p-4 border rounded-lg text-sm leading-normal" role="status">
            <TriangleAlert className="shrink-0 size-5" strokeWidth={2} aria-hidden="true" />
            <span>Des mots en double ont été détectés (surlignage jaune).</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {content.trim() && (
        <div className="flex flex-col gap-3">
          <div className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Eye className="size-4" strokeWidth={2} aria-hidden="true" />
            Aperçu {dictationMode === "words" ? "des mots" : "du texte"}
          </div>
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <WordPreview words={parsedWords} duplicates={duplicates} />
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
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:min-w-40"
        >
          {isSubmitting
            ? "Enregistrement..."
            : isEdit
              ? "Enregistrer les modifications"
              : "Enregistrer la dictée"}
        </Button>
      </div>

      <UnsavedChangesBanner visible={isDirty} />
    </form>
  );
}

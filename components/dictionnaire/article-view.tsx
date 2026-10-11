"use client";

import { useId } from "react";
import { natureLabel, type Article } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";

interface ArticleViewProps {
  readonly article: Article;
  /** Pendant « chercher » : toucher l'article le désigne. */
  readonly onSelect?: () => void;
  /** Le bon article, montré à la correction (R24). */
  readonly highlighted?: boolean;
}

function RelatedWords({ label, words }: { readonly label: string; readonly words: readonly string[] }) {
  if (words.length === 0) return null;
  return (
    <p className="text-base">
      <span className="font-bold">{label} :</span> {words.join(", ")}
    </p>
  );
}

/** Un article (R12) : mot d'entrée en gras, nature abrégée, sens numérotés, exemples en italique. */
export function ArticleView({ article, onSelect, highlighted = false }: ArticleViewProps) {
  const headingId = useId();
  const label = natureLabel(article);

  return (
    <article
      aria-labelledby={headingId}
      className={cn(
        "relative flex flex-col gap-1 rounded-lg p-2",
        onSelect && "hover:bg-muted focus-within:bg-muted",
        highlighted && "ring-2 ring-primary bg-primary/10",
      )}
    >
      <h3 id={headingId} className="text-lg">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="font-bold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:underline"
          >
            {article.headword}
          </button>
        ) : (
          <span className="font-bold">{article.headword}</span>
        )}
      </h3>
      <p className="text-sm text-muted-foreground">
        <span aria-hidden="true">{label.short}</span>
        <span className="sr-only">{label.long}</span>
      </p>
      <ol className="flex list-decimal flex-col gap-1 pl-6 text-base">
        {article.senses.map((sense, i) => (
          <li key={i}>
            {sense.definition}
            {sense.example && (
              <>
                {" "}
                <em>{sense.example}</em>
              </>
            )}
          </li>
        ))}
      </ol>
      <RelatedWords label="Synonymes" words={article.synonyms} />
      <RelatedWords label="Contraires" words={article.antonyms} />
    </article>
  );
}

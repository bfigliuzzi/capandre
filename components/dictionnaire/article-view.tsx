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
  /** 3 dans le livre (sous le h2 de la page), 4 sous une page de session. */
  readonly headingLevel?: 3 | 4;
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
export function ArticleView({ article, onSelect, highlighted = false, headingLevel = 3 }: ArticleViewProps) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  const headingId = useId();
  const label = natureLabel(article);

  return (
    <article
      aria-labelledby={headingId}
      aria-current={highlighted ? "true" : undefined}
      className={cn(
        "relative flex flex-col gap-1 rounded-lg p-2",
        onSelect && "hover:bg-muted focus-within:bg-muted",
        highlighted && "ring-2 ring-primary bg-primary/10",
      )}
    >
      <Heading id={headingId} className="text-lg">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            className="font-bold after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-primary"
          >
            {article.headword}
          </button>
        ) : (
          <span className="font-bold">{article.headword}</span>
        )}
      </Heading>
      <p className="text-sm text-foreground">
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

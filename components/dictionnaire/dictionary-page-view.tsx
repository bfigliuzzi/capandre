"use client";

import { useId } from "react";
import { pageTitle, type ArticleRef, type DictionaryPage } from "@/lib/dictionnaire";
import { cn } from "@/lib/utils";
import { ArticleView } from "./article-view";

interface DictionaryPageViewProps {
  readonly page: DictionaryPage;
  readonly onSelectArticle?: (headword: string) => void;
  readonly highlight?: ArticleRef | null;
  readonly animated?: boolean;
  readonly direction?: "forward" | "back";
}

/** Une page : numéro et mots repères en haut, toujours visibles (R11), puis les articles. */
export function DictionaryPageView({ page, onSelectArticle, highlight, animated = false, direction = "forward" }: DictionaryPageViewProps) {
  const headingId = useId();
  const [first, last] = page.guideWords;

  return (
    <section
      aria-labelledby={headingId}
      data-direction={direction}
      className={cn("flex min-w-0 flex-1 flex-col rounded-xl border-2 border-border bg-card", animated && "dico-page-turn")}
    >
      <h2 id={headingId} className="sr-only">
        {pageTitle(page)}
      </h2>
      <div aria-hidden="true" className="sticky top-14 z-[1] flex items-baseline justify-between gap-2 rounded-t-xl border-b-2 border-border bg-card px-4 py-2 font-heading font-bold">
        <span>{first}</span>
        <span className="text-sm text-muted-foreground">{page.number}</span>
        <span>{last}</span>
      </div>
      <div className="flex flex-col gap-2 p-2">
        {page.articles.map((article, index) => (
          <ArticleView
            key={`${article.headword}-${article.nature}`}
            article={article}
            onSelect={onSelectArticle ? () => onSelectArticle(article.headword) : undefined}
            highlighted={highlight?.page === page.number && highlight.index === index}
          />
        ))}
      </div>
    </section>
  );
}

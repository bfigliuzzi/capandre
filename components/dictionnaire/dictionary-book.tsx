"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import {
  firstPageOfLetter,
  lettersWithArticles,
  pageAnnouncement,
  spreadOf,
  turnPage,
  type ArticleRef,
  type DictionaryFile,
} from "@/lib/dictionnaire";
import { DictionaryPageView } from "./dictionary-page-view";
import { GoToPage } from "./go-to-page";
import { LetterTabs } from "./letter-tabs";

/** Tablette en paysage et au-delà : deux pages se font face (R10). */
const SPREAD_QUERY = "(min-width: 64rem) and (orientation: landscape)";
/** Distance minimale d'un glissement de doigt pour tourner la page. */
const SWIPE_MIN_PX = 60;

interface DictionaryBookProps {
  readonly dictionary: DictionaryFile;
  /** 0 pour la couverture. */
  readonly page: number;
  readonly onPageChange: (page: number) => void;
  readonly onSelectArticle?: (headword: string) => void;
  readonly highlight?: ArticleRef | null;
}

function Cover({ totalPages }: { readonly totalPages: number }) {
  return (
    <section
      aria-label="Couverture du dictionnaire"
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-primary bg-primary/10 p-8 text-center"
    >
      <p className="font-heading text-3xl font-extrabold text-primary">Dictionnaire</p>
      <p className="text-lg">{totalPages} pages</p>
      <p className="text-sm text-muted-foreground">D&apos;après le Dico des Ados et le Wiktionnaire</p>
    </section>
  );
}

/** Ne capte pas les flèches quand l'enfant écrit ou choisit une réponse. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.getAttribute("role") === "radio";
}

function useArrowKeys(onTurn: (step: number) => void): void {
  const onTurnRef = useRef(onTurn);
  useEffect(() => {
    onTurnRef.current = onTurn;
  });
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") onTurnRef.current(1);
      if (event.key === "ArrowLeft") onTurnRef.current(-1);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

function useSwipe(onTurn: (step: number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = e.pointerType === "touch" ? { x: e.clientX, y: e.clientY } : null;
    },
    onPointerUp: (e: PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy)) onTurn(dx < 0 ? 1 : -1);
    },
  };
}

/** Le livre : couverture, pages, onglets, aller à la page, tourner (R1, R5–R11). */
export function DictionaryBook({ dictionary, page, onPageChange, onSelectArticle, highlight }: DictionaryBookProps) {
  const total = dictionary.pages.length;
  const spread = useMediaQuery(SPREAD_QUERY);
  const reducedMotion = usePrefersReducedMotion();
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [turned, setTurned] = useState(false);
  const letters = useMemo(() => lettersWithArticles(dictionary.pages), [dictionary]);

  const shown = spread ? spreadOf(page, total).filter((n): n is number => n !== null) : [page];
  const shownPages = shown.filter((n) => n > 0).map((n) => dictionary.pages[n - 1]);

  function goTo(target: number) {
    if (target === page) return;
    setDirection(target > page ? "forward" : "back");
    setTurned(true);
    onPageChange(target);
  }

  function turn(step: number) {
    goTo(turnPage(spread ? spreadOf(page, total)[0] : page, spread ? step * 2 : step, total));
  }

  useArrowKeys(turn);
  const swipe = useSwipe(turn);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <LetterTabs
          available={letters}
          onSelect={(letter) => {
            const target = firstPageOfLetter(dictionary.pages, letter);
            if (target !== null) goTo(target);
          }}
        />
        <GoToPage totalPages={total} onGo={goTo} />
      </div>

      <p role="status" className="sr-only">
        {turned ? pageAnnouncement(shownPages, total) : ""}
      </p>

      <div className="flex touch-pan-y gap-4" {...swipe}>
        {shown.map((n) =>
          n === 0 ? (
            <Cover key="cover" totalPages={total} />
          ) : (
            <DictionaryPageView
              key={n}
              page={dictionary.pages[n - 1]}
              onSelectArticle={onSelectArticle}
              highlight={highlight}
              animated={turned && !reducedMotion}
              direction={direction}
            />
          ),
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => turn(-1)} disabled={page === 0} focusableWhenDisabled>
          <ChevronLeft aria-hidden="true" />
          Page précédente
        </Button>
        <Button variant="outline" onClick={() => turn(1)} disabled={shown[shown.length - 1] >= total} focusableWhenDisabled>
          Page suivante
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

/** Le dictionnaire en consultation libre : il garde sa page et met `document.title` à jour. */
export function DictionaryReader({ dictionary }: { readonly dictionary: DictionaryFile }) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    document.title = page === 0 ? "Dictionnaire — Capandre" : `Page ${page} — Dictionnaire — Capandre`;
  }, [page]);

  return <DictionaryBook dictionary={dictionary} page={page} onPageChange={setPage} />;
}

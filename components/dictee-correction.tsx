"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CircleCheck,
  CircleX,
  HeartHandshake,
  PartyPopper,
  Search,
  Sprout,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseResults, WordResult } from "@/lib/exercise";

// ---------------------------------------------------------------------------
// Score tiers
// ---------------------------------------------------------------------------

interface ScoreTier {
  Icon: LucideIcon;
  message: string;
  className: string;
}

function getScoreTier(pct: number): ScoreTier {
  if (pct === 100) return { Icon: Trophy, message: "Parfait ! Tu as tout bon, bravo !", className: "correction-score--perfect" };
  if (pct >= 80) return { Icon: PartyPopper, message: "Super travail ! Encore un petit effort pour le sans-faute !", className: "correction-score--great" };
  if (pct >= 50) return { Icon: TrendingUp, message: "Bien joué ! Continue à t'entraîner, tu progresses !", className: "correction-score--good" };
  if (pct > 0) return { Icon: Sprout, message: "C'est un bon début ! Refais l'exercice pour t'améliorer.", className: "correction-score--keep-going" };
  return { Icon: HeartHandshake, message: "Ne t'inquiète pas, recommence et tu vas y arriver !", className: "correction-score--keep-going" };
}

const LEVEL_LABELS: Record<string, string> = {
  discovery: "Découverte",
  learning: "Apprentissage",
  mastery: "Maîtrise",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DicteeCorrectionProps {
  dictationId: string;
}

export function DicteeCorrection({ dictationId }: DicteeCorrectionProps) {
  const [results] = useState<ExerciseResults | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem("dicteeResults");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  if (!results) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 min-h-[300px] text-center">
        <Search className="size-12 opacity-50" strokeWidth={1.5} aria-hidden="true" />
        <h2 className="font-heading text-xl font-bold text-muted-foreground">Aucun résultat</h2>
        <p className="text-base text-muted-foreground">
          Commence un exercice depuis la{" "}
          <Link href="/dictee" className="text-primary underline">liste des dictées</Link>.
        </p>
      </div>
    );
  }

  const tier = getScoreTier(results.percentage);

  return (
    <div className="flex flex-col gap-6 exercise-fade-in">
      {/* Score */}
      <div className={cn("text-center p-6 border-2 rounded-xl", tier.className)}>
        <tier.Icon className="size-12 mb-2 mx-auto" strokeWidth={1.5} aria-hidden="true" />
        <div className="font-heading text-4xl font-extrabold">
          {results.correctCount}&nbsp;/&nbsp;{results.totalCount}
        </div>
        <div className="font-heading text-xl font-bold text-muted-foreground mt-1">
          {results.percentage}&nbsp;%
        </div>
        <p className="text-base font-medium mt-3 leading-normal">{tier.message}</p>
        <p className="text-sm text-muted-foreground mt-2">
          Niveau : {LEVEL_LABELS[results.level] ?? results.level}
        </p>
      </div>

      {/* Detail */}
      <h3 className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Détail des mots
      </h3>

      <div className="flex flex-col gap-2">
        {results.results.map((wordResult, idx) => (
          <WordResultCard key={idx} result={wordResult} />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          onClick={() => {
            sessionStorage.removeItem("dicteeResults");
            window.location.href = `/dictee/${dictationId}`;
          }}
          className="w-full sm:w-auto sm:min-w-56"
        >
          Refaire l&apos;exercice
        </Button>
        <Button
          variant="ghost"
          render={<Link href="/dictee" />}
          className="w-full sm:w-auto sm:min-w-56"
        >
          Retour à la liste
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Word Result Card
// ---------------------------------------------------------------------------

function WordResultCard({ result }: { result: WordResult }) {
  const label = result.article
    ? `${result.article} ${result.word}`
    : result.word;

  return (
    <div
      className={cn(
        "flex items-start gap-4 px-6 py-4 bg-card rounded-xl border-2",
        result.correct
          ? "border-l-[4px] border-l-success"
          : "border-l-[4px] border-l-destructive bg-destructive/5",
      )}
    >
      <div className="shrink-0 pt-0.5" aria-hidden="true">
        {result.correct ? (
          <CircleCheck className="size-5 text-success" strokeWidth={2} />
        ) : (
          <CircleX className="size-5 text-destructive" strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-bold mb-1">{label}</div>
        <div className="flex gap-1 flex-wrap">
          {result.letters.map((letter, j) => {
            if (!letter.masked) {
              return (
                <span key={j} className="correction-letter correction-letter--given">
                  {letter.expected}
                </span>
              );
            }
            if (letter.correct) {
              return (
                <span key={j} className="correction-letter correction-letter--correct">
                  {letter.given}
                </span>
              );
            }
            return (
              <span key={j} className="correction-letter correction-letter--wrong">
                <span className="correction-letter-given">{letter.given || "_"}</span>
                <span className="correction-letter-arrow">→</span>
                <span className="correction-letter-expected">{letter.expected}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

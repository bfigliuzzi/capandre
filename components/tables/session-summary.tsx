"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeTile } from "@/components/tables/badge-tile";
import { Confetti } from "@/components/tables/confetti";
import { FactList } from "@/components/tables/fact-list";
import { StarRating } from "@/components/tables/star-rating";
import type { RecordSessionResult } from "@/lib/db";
import { getBadge, type SessionConfig, type SessionSummary as Summary } from "@/lib/multiplication";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Rédactionnel local
// ---------------------------------------------------------------------------

const EYEBROW = "font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider";

const RECORD_ERROR_MESSAGE =
  "Tes étoiles n'ont pas pu être enregistrées, mais ta partie compte quand même !";
const NO_STARS_YET = "Continue, tes étoiles arrivent !";
const NOTHING_TO_REVISIT = "Rien à retravailler, tout est bon !";

interface SessionTier {
  emoji: string;
  message: string;
  className: string;
}

/** Palier de fin de session — toujours encourageant, jamais punitif. */
function getSessionTier(percentage: number): SessionTier {
  if (percentage >= 100) {
    return {
      emoji: "🏆",
      message: "Sans faute ! Tu connais tes tables sur le bout des doigts !",
      className: "session-score--perfect",
    };
  }
  if (percentage >= 80) {
    return {
      emoji: "🎉",
      message: "Super ! Tu y es presque, encore un petit effort !",
      className: "session-score--great",
    };
  }
  if (percentage >= 50) {
    return {
      emoji: "💪",
      message: "Bien joué ! Tu progresses à chaque partie.",
      className: "session-score--good",
    };
  }
  if (percentage > 0) {
    return {
      emoji: "🌱",
      message: "C'est un bon début ! Recommence pour t'entraîner.",
      className: "session-score--keep-going",
    };
  }
  return {
    emoji: "🤗",
    message: "Ce n'est pas grave ! Va voir la révision, puis réessaie.",
    className: "session-score--keep-going",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionRecordState {
  status: "pending" | "done" | "error";
  result: RecordSessionResult | null;
}

interface SessionSummaryProps {
  summary: Summary;
  recordState: SessionRecordState;
  config: SessionConfig;
  /** Étoiles connues avant l'enregistrement : sert de repli si l'écriture échoue. */
  fallbackStars: Record<string, number>;
  onReplay: () => void;
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function SessionSummary({
  summary,
  recordState,
  config,
  fallbackStars,
  onReplay,
}: SessionSummaryProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Le résumé prend le focus à son apparition : l'enfant (ou le lecteur
  // d'écran) démarre au bon endroit.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  const percentage =
    summary.askedCount === 0
      ? 0
      : Math.round((summary.correctCount / summary.askedCount) * 100);
  const tier = getSessionTier(percentage);

  const stars = recordState.result?.starsAfter ?? fallbackStars;
  const gains = (recordState.result?.starsDelta ?? []).filter((delta) => delta.to > delta.from);
  const newBadgeIds = recordState.result?.newBadgeIds ?? [];
  const newBadges = newBadgeIds
    .map((id) => getBadge(id))
    .filter((badge): badge is NonNullable<typeof badge> => badge !== undefined);

  const resolved = recordState.status !== "pending";
  const celebrate = resolved && (percentage >= 80 || newBadges.length > 0);

  return (
    <div className="exercise-fade-in flex flex-col gap-6">
      <Confetti active={celebrate} />

      {recordState.status === "error" && (
        <p
          role="status"
          className="rounded-xl border-2 border-info/40 bg-info/10 p-4 text-base text-foreground"
        >
          {RECORD_ERROR_MESSAGE}
        </p>
      )}

      {/* --- Score et palier --- */}
      <div className={cn("session-score p-6 text-center", tier.className)}>
        <div className="mb-2 text-5xl" aria-hidden="true">
          {tier.emoji}
        </div>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-2xl font-extrabold outline-none"
        >
          Tu as réussi {summary.correctCount}&nbsp;
          {summary.correctCount === 1 ? "question" : "questions"} sur{" "}
          {summary.askedCount}&nbsp;!
        </h2>
        <p className="mt-2 text-base text-foreground">{tier.message}</p>
        <p className="mt-1 text-base text-muted-foreground">{summary.encouragement}</p>
        {summary.bestStreak >= 2 && (
          <p className="mt-3 font-heading text-base font-bold text-foreground">
            Ta meilleure série&nbsp;: {summary.bestStreak} <span aria-hidden="true">🔥</span>
          </p>
        )}
      </div>

      {/* --- Étoiles par table --- */}
      <section aria-labelledby="summary-stars" className="flex flex-col gap-3">
        <h3 id="summary-stars" className={EYEBROW}>
          Tes étoiles
        </h3>
        <ul className="flex flex-col gap-2">
          {config.tables.map((table) => {
            const value = stars[String(table)] ?? 0;
            const gain = gains.find((delta) => delta.table === table);
            return (
              <li
                key={table}
                className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-card px-4 py-3"
              >
                <span className="font-heading text-base font-bold">Table de {table}</span>
                <span className="flex items-center gap-3">
                  {gain && (
                    <span className="text-sm font-bold text-foreground">
                      +{gain.to - gain.from} {gain.to - gain.from === 1 ? "étoile" : "étoiles"}
                    </span>
                  )}
                  <StarRating
                    value={value}
                    size="sm"
                    animated
                    label={`Table de ${table} : ${value} ${value === 1 ? "étoile" : "étoiles"} sur 3`}
                  />
                </span>
              </li>
            );
          })}
        </ul>
        {gains.length === 0 && (
          <p className="text-base text-muted-foreground">{NO_STARS_YET}</p>
        )}
      </section>

      {/* --- Trophées débloqués --- */}
      {newBadges.length > 0 && (
        <section role="status" className="flex flex-col gap-3">
          <h3 className={EYEBROW}>
            {newBadges.length === 1
              ? "Nouveau trophée débloqué !"
              : `${newBadges.length} nouveaux trophées !`}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {newBadges.map((badge) => (
              <BadgeTile
                key={badge.id}
                definition={badge}
                unlockedAt={summary.completedAt}
                highlighted
              />
            ))}
          </div>
        </section>
      )}

      {/* --- À retravailler --- */}
      <section aria-labelledby="summary-revisit" className="flex flex-col gap-3">
        <h3 id="summary-revisit" className={EYEBROW}>
          À retravailler
        </h3>
        {summary.factsToRevisit.length > 0 ? (
          <FactList facts={summary.factsToRevisit} labelledBy="summary-revisit" />
        ) : (
          <p className="text-base text-muted-foreground">{NOTHING_TO_REVISIT}</p>
        )}
      </section>

      {/* --- Actions --- */}
      <div className="flex flex-col gap-2">
        <Button onClick={onReplay} className="w-full">
          <RotateCcw className="size-4" />
          Rejouer
        </Button>
        <Button
          variant="outline"
          className="w-full"
          render={<Link href="/tables/exercice" transitionTypes={["nav-back"]} />}
        >
          Changer les réglages
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          render={<Link href="/tables" transitionTypes={["nav-back"]} />}
        >
          Retour aux tables
        </Button>
      </div>
    </div>
  );
}

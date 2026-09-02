"use client";

interface SessionProgressProps {
  /** Numéro de la question en cours (1-based). */
  current: number;
  /** Total = `engine.queue.length` : il peut CROÎTRE d'une unité lors d'une
   *  reprise, jamais décroître. La barre ralentit, elle ne recule pas. */
  total: number;
}

/** Barre de progression de la session — réutilise les classes de la dictée. */
export function SessionProgress({ current, total }: SessionProgressProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.min(Math.max(1, current), safeTotal);
  const percent = (safeCurrent / safeTotal) * 100;

  return (
    <div>
      <div
        className="exercise-progress-bar"
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-label="Progression de l'exercice"
      >
        <div className="exercise-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-2 text-center text-sm font-bold text-muted-foreground">
        Question&nbsp;{safeCurrent}&nbsp;/&nbsp;{safeTotal}
      </p>
    </div>
  );
}

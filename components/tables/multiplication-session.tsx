"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetHeader } from "@/components/layout/use-set-header";
import { FeedbackBanner } from "@/components/tables/feedback-banner";
import { Numpad } from "@/components/tables/numpad";
import { QuestionDisplay } from "@/components/tables/question-display";
import { QuitSessionDialog } from "@/components/tables/quit-session-dialog";
import { SessionProgress } from "@/components/tables/session-progress";
import {
  SessionSummary,
  type SessionRecordState,
} from "@/components/tables/session-summary";
import { StreakBadge } from "@/components/tables/streak-badge";
import { TimerBar } from "@/components/tables/timer-bar";
import { useCountdown } from "@/hooks/use-countdown";
import { useDocumentVisible } from "@/hooks/use-document-visibility";
import { useSound } from "@/hooks/use-sound";
import { useMultiplicationMutations, type RecordSessionResult } from "@/lib/db";
import type { MultiplicationFactProgress } from "@/lib/db";
import {
  DIFFICULTY_LABELS,
  FEEDBACK_CORRECT_MS,
  FEEDBACK_WRONG_MS,
  TIME_LIMITS_MS,
  computeAllTableStars,
  computeSummary,
  generateSession,
  initSessionUiState,
  mapKeyToAction,
  sessionUiReducer,
} from "@/lib/multiplication";
import type { Question, Rng, SessionConfig, SessionSummary as Summary } from "@/lib/multiplication";

// ---------------------------------------------------------------------------
// Rédactionnel local
// ---------------------------------------------------------------------------

const ROOT_LABEL = "Exercice de tables de multiplication";
const QUIT_LABEL = "Quitter l'exercice";
const SETUP_HREF = "/tables/exercice";

// ---------------------------------------------------------------------------
// Aides pures
// ---------------------------------------------------------------------------

/**
 * Générateur déterministe dérivé de l'horodatage de la session : les messages
 * du moteur varient d'une partie à l'autre tout en restant PURS, donc
 * calculables pendant le rendu (contrairement à `Math.random`).
 */
function stableRng(seed: number): Rng {
  let x = Math.abs(Math.trunc(seed)) % 2147483647 || 1;
  return () => {
    x = (x * 48271) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

/** Énoncé parlé, pour la région live. */
function spellQuestion(question: Question): string {
  const { a, b } = question.fact;
  if (question.kind === "missingRight") return `${a} fois combien égale ${question.product} ?`;
  if (question.kind === "missingLeft") return `Combien fois ${b} égale ${question.product} ?`;
  return `${a} fois ${b} égale combien ?`;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function isActivationKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

function isButtonTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button") !== null;
}

function isNumpadTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("[data-numpad]") !== null;
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

interface MultiplicationSessionProps {
  config: SessionConfig;
  progress: MultiplicationFactProgress[];
  soundEnabled: boolean;
  /** Appelé après un enregistrement réussi, pour rafraîchir la progression. */
  onProgressChange: () => void;
}

export function MultiplicationSession({
  config,
  progress,
  soundEnabled,
  onProgressChange,
}: MultiplicationSessionProps) {
  const router = useRouter();
  const { recordSession } = useMultiplicationMutations();
  const { play, prime } = useSound(soundEnabled);

  // L'initialiseur paresseux appelle Math.random / Date.now : il ne doit
  // JAMAIS s'exécuter au rendu serveur. C'est garanti par le gating de
  // `MultiplicationSessionRoute`, qui ne monte ce composant qu'une fois la
  // progression chargée côté client.
  const [state, dispatch] = useReducer(sessionUiReducer, undefined, () =>
    initSessionUiState(
      generateSession(config, progress, { rng: Math.random, now: Date.now() }),
      { runId: 0, now: Date.now() },
    ),
  );

  const [quitOpen, setQuitOpen] = useState(false);
  const [record, setRecord] = useState<{
    runId: number;
    status: "done" | "error";
    result: RecordSessionResult | null;
  } | null>(null);

  const { phase, engine, feedback, input } = state;

  useSetHeader(phase === "summary" ? "Résultats" : "Exercice", phase === "summary" ? "/tables" : null);

  // --- Refs (toujours réassignées dans un effet, jamais pendant le rendu) ---
  const rootRef = useRef<HTMLElement>(null);
  const quitOpenRef = useRef(false);
  const progressRef = useRef(progress);
  const recordedRunRef = useRef<number | null>(null);
  const primedRef = useRef(false);

  useEffect(() => {
    quitOpenRef.current = quitOpen;
  }, [quitOpen]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Focus posé UNE SEULE FOIS au montage (le pavé ne remonte jamais ensuite).
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  // --- Question affichée ---
  // Pendant le feedback, `engine.index` pointe déjà sur la question suivante :
  // on affiche donc celle qui vient d'être jouée.
  const displayedIndex = phase === "feedback" ? engine.index - 1 : engine.index;
  const question: Question | null = engine.queue[displayedIndex] ?? null;
  const total = engine.queue.length;

  // --- Minuteur ---
  const limitMs = TIME_LIMITS_MS[config.difficulty];
  const isVisible = useDocumentVisible();
  const runKey = `${state.runId}:${engine.index}`;
  const timerRunning = phase === "running" && limitMs !== null && isVisible && !quitOpen;

  const handleExpire = useCallback(() => {
    dispatch({ type: "timeout", now: Date.now() });
  }, []);

  useCountdown({ durationMs: limitMs, runKey, running: timerRunning, onExpire: handleExpire });

  // --- Avancement automatique après le feedback ---
  useEffect(() => {
    if (phase !== "feedback" || !feedback) return;
    const delay = feedback.status === "correct" ? FEEDBACK_CORRECT_MS : FEEDBACK_WRONG_MS;
    const id = setTimeout(() => dispatch({ type: "advance", now: Date.now() }), delay);
    return () => clearTimeout(id);
  }, [phase, feedback]);

  // --- Son de bonne réponse (jamais de son sur erreur ni sur temps écoulé) ---
  useEffect(() => {
    if (feedback?.status === "correct") play("correct");
  }, [feedback, play]);

  // --- Clavier physique : un seul écouteur, dépendance sur la phase ---
  useEffect(() => {
    if (phase === "summary") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // La modale gère elle-même Échap et son piège de focus.
      if (quitOpenRef.current) return;
      if (isEditableTarget(event.target)) return;
      // Entrée / Espace appartient au bouton focalisé : sans cette garde,
      // `preventDefault` annulerait son activation et « Espace » sur la touche
      // « 7 » validerait au lieu de saisir 7. Exception : pendant le feedback,
      // le pavé est inerte — on laisse alors la touche faire avancer.
      if (isActivationKey(event.key)) {
        const inNumpad = isNumpadTarget(event.target);
        if (inNumpad && phase === "running") return;
        if (!inNumpad && isButtonTarget(event.target)) return;
      }

      const action = mapKeyToAction(event.key, phase, Date.now());
      if (!action) return;
      event.preventDefault();

      if (action.type === "quit") {
        setQuitOpen(true);
        return;
      }

      if (!primedRef.current) {
        primedRef.current = true;
        prime();
      }
      dispatch(action);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, prime]);

  // --- Actions du pavé tactile : exactement les mêmes que le clavier ---
  const primeOnce = useCallback(() => {
    if (primedRef.current) return;
    primedRef.current = true;
    prime();
  }, [prime]);

  const handleDigit = useCallback(
    (digit: number) => {
      primeOnce();
      dispatch({ type: "digit", digit, now: Date.now() });
    },
    [primeOnce],
  );

  const handleErase = useCallback(() => {
    dispatch({ type: "erase", now: Date.now() });
  }, []);

  const handleSubmit = useCallback(() => {
    primeOnce();
    dispatch({ type: "submit", now: Date.now() });
  }, [primeOnce]);

  const handleContinue = useCallback(() => {
    dispatch({ type: "advance", now: Date.now() });
  }, []);

  const handleReplay = useCallback(() => {
    dispatch({
      type: "restart",
      engine: generateSession(config, progressRef.current, { rng: Math.random, now: Date.now() }),
      now: Date.now(),
    });
  }, [config]);

  const handleQuitConfirm = useCallback(() => {
    router.push(SETUP_HREF);
  }, [router]);

  // --- Bilan (pur : rng déterministe, aucun Math.random au rendu) ---
  const summary: Summary | null = useMemo(() => {
    if (phase !== "summary") return null;
    return computeSummary(engine, {
      rng: stableRng(engine.startedAt),
      now: engine.finishedAt ?? engine.startedAt,
    });
  }, [phase, engine]);

  const fallbackStars = useMemo(() => computeAllTableStars(progress), [progress]);

  // --- Enregistrement : exactement une fois par run (StrictMode-safe) ---
  // La garde est portée par une REF, qui survit au double-invoke des effets en
  // développement. On n'ajoute volontairement PAS de drapeau `cancelled` :
  // il annulerait la publication du résultat du premier invoke (le seul qui
  // écrit réellement en base), laissant le résumé bloqué sur « pending ».
  // Un `setRecord` après démontage est un no-op inoffensif en React 19.
  useEffect(() => {
    if (phase !== "summary" || !summary) return;
    if (recordedRunRef.current === state.runId) return;
    recordedRunRef.current = state.runId;
    const runId = state.runId;

    recordSession(summary)
      .then((result) => {
        setRecord({ runId, status: "done", result });
        onProgressChange();
      })
      .catch(() => {
        setRecord({ runId, status: "error", result: null });
      });
  }, [phase, summary, state.runId, recordSession, onProgressChange]);

  const recordState: SessionRecordState =
    record && record.runId === state.runId
      ? { status: record.status, result: record.result }
      : { status: "pending", result: null };

  // --- Son de trophée, une fois l'enregistrement résolu ---
  useEffect(() => {
    if (record?.status === "done" && (record.result?.newBadgeIds.length ?? 0) > 0) {
      play("badge");
    }
  }, [record, play]);

  // --- Région live unique ---
  const announcement = useMemo(() => {
    if (phase === "summary" && summary) {
      return `Session terminée. Tu as réussi ${summary.correctCount} ${
        summary.correctCount === 1 ? "question" : "questions"
      } sur ${summary.askedCount}.`;
    }
    if (phase === "feedback" && feedback) {
      return feedback.celebration ? `${feedback.message} ${feedback.celebration}` : feedback.message;
    }
    if (question) {
      return `Question ${displayedIndex + 1} sur ${total}. ${spellQuestion(question)}`;
    }
    return "";
  }, [phase, summary, feedback, question, displayedIndex, total]);

  // Publication DIFFÉRÉE dans la région live : une région dont le contenu est
  // présent dès le montage n'est pas annoncée de façon fiable. Le petit délai
  // garantit un changement de contenu observable par le lecteur d'écran, et
  // évite les annonces en rafale.
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setLiveMessage(announcement), 150);
    return () => clearTimeout(id);
  }, [announcement]);

  const timedNote =
    limitMs === null
      ? null
      : `Mode ${DIFFICULTY_LABELS[config.difficulty]} : tu as ${Math.round(
          limitMs / 1000,
        )} secondes par question. Le temps restant est affiché par une barre.`;

  const questionState = phase === "feedback" && feedback
    ? feedback.status === "correct"
      ? "correct"
      : "wrong"
    : "idle";

  return (
    <section
      ref={rootRef}
      tabIndex={-1}
      aria-label={ROOT_LABEL}
      className="flex min-h-[calc(100dvh-6.5rem)] flex-col gap-4 outline-none"
    >
      {/* Région live UNIQUE, toujours montée. */}
      <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </p>
      {timedNote && <p className="sr-only">{timedNote}</p>}

      {phase === "summary" && summary ? (
        <SessionSummary
          summary={summary}
          recordState={recordState}
          config={config}
          fallbackStars={fallbackStars}
          onReplay={handleReplay}
        />
      ) : (
        <>
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <SessionProgress current={displayedIndex + 1} total={total} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 shrink-0"
              aria-label={QUIT_LABEL}
              onClick={() => setQuitOpen(true)}
            >
              <X className="size-5" />
            </Button>
          </div>

          <TimerBar key={runKey} durationMs={limitMs} paused={!timerRunning} />

          <div className="flex min-h-9 items-center justify-center">
            <StreakBadge streak={engine.streak} />
          </div>

          {question && <QuestionDisplay question={question} input={input} state={questionState} />}

          {phase === "feedback" && feedback && (
            <FeedbackBanner outcome={feedback} onContinue={handleContinue} />
          )}

          <div className="mx-auto mt-auto w-full max-w-sm pb-[env(safe-area-inset-bottom)]">
            <Numpad
              onDigit={handleDigit}
              onErase={handleErase}
              onSubmit={handleSubmit}
              canSubmit={input !== ""}
              disabled={phase !== "running"}
            />
          </div>
        </>
      )}

      <QuitSessionDialog open={quitOpen} onOpenChange={setQuitOpen} onConfirm={handleQuitConfirm} />
    </section>
  );
}

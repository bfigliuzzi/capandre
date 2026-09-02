"use client";

import { useEffect, useRef } from "react";

export interface UseCountdownOptions {
  /** Durée totale du compte à rebours en ms, ou null pour désactiver le minuteur. */
  durationMs: number | null;
  /** Change ⇒ remise à zéro du temps restant. */
  runKey: string;
  /** false ⇒ pause (le temps restant est conservé). */
  running: boolean;
  /** Appelé à l'expiration du délai. Toujours la dernière version passée. */
  onExpire: () => void;
}

/**
 * Minuteur à un seul setTimeout : le temps restant est suivi en ref (pas de
 * re-render par tick), la pause se fait en annulant le timeout et en
 * décrémentant le temps restant dans le cleanup. `onExpire` passe par une ref
 * pour ne jamais capturer une closure obsolète.
 */
export function useCountdown({ durationMs, runKey, running, onExpire }: UseCountdownOptions): void {
  const remainingRef = useRef(durationMs ?? Infinity);
  const startedAtRef = useRef(0);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // 1) Réinitialisation du temps restant quand runKey ou durationMs change.
  useEffect(() => {
    remainingRef.current = durationMs ?? Infinity;
  }, [runKey, durationMs]);

  // 2) Démarrage / pause.
  useEffect(() => {
    if (!running || durationMs == null) return;
    startedAtRef.current = performance.now();
    const id = setTimeout(() => onExpireRef.current(), Math.max(0, remainingRef.current));
    return () => {
      clearTimeout(id);
      remainingRef.current -= performance.now() - startedAtRef.current;
    };
  }, [running, runKey, durationMs]);
}

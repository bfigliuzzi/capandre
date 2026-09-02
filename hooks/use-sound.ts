"use client";

import { useCallback, useEffect, useRef } from "react";

export type SoundName = "correct" | "badge";

// Singleton module : un seul AudioContext partagé par toute l'application,
// créé paresseusement au premier geste utilisateur (jamais au rendu).
let sharedContext: AudioContext | null = null;

type AudioContextConstructor = typeof AudioContext;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startAt: number, durationSec: number, type: OscillatorType) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  // Enveloppe douce : jamais de coupure franche (qui « clique »).
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSec);
}

/**
 * Sons discrets du module Tables. `enabled` vient des réglages de
 * l'appelant : ce hook ne lit jamais lui-même les settings.
 */
export function useSound(enabled: boolean): { play: (name: SoundName) => void; prime: () => void } {
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const prime = useCallback(() => {
    if (!enabledRef.current) return;
    getAudioContext();
  }, []);

  const play = useCallback((name: SoundName) => {
    if (!enabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (name === "correct") {
      playTone(ctx, 660, now, 0.09, "sine");
      playTone(ctx, 880, now + 0.09, 0.09, "sine");
    } else {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((frequency, index) => {
        playTone(ctx, frequency, now + index * 0.09, 0.1, "triangle");
      });
    }
  }, []);

  return { play, prime };
}

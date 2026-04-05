"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function useTTS() {
  const [isAvailable] = useState(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!isAvailable || isCooldown) return;
      if (!("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.85;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);

      // Cooldown 500ms
      setIsCooldown(true);
      cooldownRef.current = setTimeout(() => {
        setIsCooldown(false);
      }, 500);
    },
    [isAvailable, isCooldown],
  );

  return { speak, isAvailable, isSpeaking, isCooldown };
}

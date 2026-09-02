"use client";

import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

interface ConfettiProps {
  active: boolean;
  pieceCount?: number;
  durationMs?: number;
}

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  duration: number;
  delay: number;
  x: number;
  rotation: number;
}

const COLORS = [
  "var(--primary)",
  "var(--secondary)",
  "var(--success)",
  "var(--warning)",
  "var(--info)",
];

/** Confettis CSS purs, générés côté client seulement (jamais au rendu). */
export function Confetti({ active, pieceCount = 60, durationMs = 2200 }: ConfettiProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (!active || prefersReducedMotion) return;

    // Génération différée (callback, pas synchrone dans le corps de l'effet)
    // pour rester compatible avec la génération des pièces après le rendu.
    const generateId = setTimeout(() => {
      setPieces(
        Array.from({ length: pieceCount }, (_, id) => ({
          id,
          left: Math.random() * 100,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          duration: durationMs * (0.75 + Math.random() * 0.5),
          delay: Math.random() * 300,
          x: (Math.random() - 0.5) * 160,
          rotation: 360 + Math.random() * 540,
        })),
      );
    }, 0);

    const clearId = setTimeout(() => setPieces([]), durationMs + 400);
    return () => {
      clearTimeout(generateId);
      clearTimeout(clearId);
      setPieces([]);
    };
  }, [active, prefersReducedMotion, pieceCount, durationMs]);

  if (prefersReducedMotion || !active || pieces.length === 0) return null;

  return (
    <div className="mult-confetti" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="mult-confetti-piece"
          style={
            {
              left: `${piece.left}%`,
              backgroundColor: piece.color,
              "--confetti-duration": `${piece.duration}ms`,
              "--confetti-delay": `${piece.delay}ms`,
              "--confetti-x": `${piece.x}px`,
              "--confetti-rot": `${piece.rotation}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

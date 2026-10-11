"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";

interface OrderWordsProps {
  readonly words: readonly string[];
  readonly onMove: (from: number, to: number) => void;
  readonly onSubmit: () => void;
}

type Direction = "up" | "down";

/**
 * Ranger (R16) : boutons « Monter » et « Descendre », chaque déplacement annoncé.
 * Le glisser-déposer n'est qu'un raccourci. Le bouton du mot déplacé garde le focus.
 */
export function OrderWords({ words, onMove, onSubmit }: OrderWordsProps) {
  const [announcement, setAnnouncement] = useState("");
  const dragged = useRef<number | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingFocus.current) return;
    buttons.current.get(pendingFocus.current)?.focus();
    pendingFocus.current = null;
  }, [words]);

  function move(from: number, to: number, direction?: Direction) {
    if (to < 0 || to >= words.length) return;
    const word = words[from];
    onMove(from, to);
    setAnnouncement(`${word} en position ${to + 1} sur ${words.length}`);
    if (direction) pendingFocus.current = `${direction}:${word}`;
  }

  function drop(event: DragEvent, to: number) {
    event.preventDefault();
    if (dragged.current !== null && dragged.current !== to) move(dragged.current, to);
    dragged.current = null;
  }

  function arrow(word: string, index: number, direction: Direction) {
    const atEdge = direction === "up" ? index === 0 : index === words.length - 1;
    const Icon = direction === "up" ? ArrowUp : ArrowDown;
    return (
      <Button
        ref={(el: HTMLButtonElement | null) => {
          buttons.current.set(`${direction}:${word}`, el);
        }}
        variant="ghost"
        size="icon-lg"
        aria-label={`${direction === "up" ? "Monter" : "Descendre"} ${word}`}
        aria-disabled={atEdge}
        className="aria-disabled:opacity-50"
        onClick={() => {
          if (!atEdge) move(index, direction === "up" ? index - 1 : index + 1, direction);
        }}
      >
        <Icon aria-hidden="true" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="font-heading text-lg font-bold">Range ces mots dans l&apos;ordre alphabétique.</p>
      <ol aria-label="Mots à ranger" className="flex flex-col gap-2">
        {words.map((word, index) => (
          <li
            key={word}
            draggable
            onDragStart={() => (dragged.current = index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => drop(e, index)}
            className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-1"
          >
            <span className="flex-1 text-lg font-bold">{word}</span>
            {arrow(word, index, "up")}
            {arrow(word, index, "down")}
          </li>
        ))}
      </ol>
      <p role="status" aria-label="Position" className="sr-only">
        {announcement}
      </p>
      <Button onClick={onSubmit} className="self-start">
        Valider
      </Button>
    </div>
  );
}

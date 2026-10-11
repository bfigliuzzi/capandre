"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
/** Après un déplacement au clavier, rend le focus au bouton du mot déplacé (WCAG 2.4.3). */
function useFocusAfterMove(words: readonly string[]) {
  const buttons = useRef(new Map<string, HTMLButtonElement | null>());
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (!pending.current) return;
    buttons.current.get(pending.current)?.focus();
    pending.current = null;
  }, [words]);
  return {
    register: (key: string) => (el: HTMLButtonElement | null) => {
      buttons.current.set(key, el);
    },
    focusLater: (key: string) => {
      pending.current = key;
    },
  };
}

interface ArrowProps {
  readonly word: string;
  readonly direction: Direction;
  readonly atEdge: boolean;
  readonly buttonRef: (el: HTMLButtonElement | null) => void;
  readonly onMove: () => void;
}

/** `aria-disabled` plutôt que `disabled` : un bouton désactivé perdrait le focus. */
function ArrowButton({ word, direction, atEdge, buttonRef, onMove }: ArrowProps) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      size="icon-lg"
      aria-label={`${direction === "up" ? "Monter" : "Descendre"} ${word}`}
      aria-disabled={atEdge}
      className="aria-disabled:opacity-50"
      onClick={() => !atEdge && onMove()}
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

/**
 * Ranger (R16) : boutons « Monter » et « Descendre », chaque déplacement annoncé.
 * Le glisser-déposer n'est qu'un raccourci.
 */
export function OrderWords({ words, onMove, onSubmit }: OrderWordsProps) {
  const [announcement, setAnnouncement] = useState("");
  const dragged = useRef<number | null>(null);
  const focus = useFocusAfterMove(words);

  function move(from: number, to: number, direction?: Direction) {
    onMove(from, to);
    setAnnouncement(`${words[from]} en position ${to + 1} sur ${words.length}`);
    if (direction) focus.focusLater(`${direction}:${words[from]}`);
  }

  function arrow(word: string, index: number, direction: Direction) {
    const to = direction === "up" ? index - 1 : index + 1;
    const key = `${direction}:${word}`;
    const atEdge = to < 0 || to >= words.length;
    return <ArrowButton word={word} direction={direction} atEdge={atEdge} buttonRef={focus.register(key)} onMove={() => move(index, to, direction)} />;
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
            onDrop={(e) => {
              e.preventDefault();
              if (dragged.current !== null && dragged.current !== index) move(dragged.current, index);
              dragged.current = null;
            }}
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

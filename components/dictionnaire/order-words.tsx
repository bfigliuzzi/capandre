"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";

interface OrderWordsProps {
  readonly words: readonly string[];
  readonly onMove: (from: number, to: number) => void;
  readonly onSubmit: () => void;
}

/**
 * Ranger (R16) : boutons « Monter » et « Descendre », chaque déplacement annoncé.
 * Le glisser-déposer n'est qu'un raccourci.
 */
export function OrderWords({ words, onMove, onSubmit }: OrderWordsProps) {
  const [announcement, setAnnouncement] = useState("");
  const dragged = useRef<number | null>(null);

  function move(from: number, to: number) {
    onMove(from, to);
    setAnnouncement(`${words[from]} en position ${to + 1} sur ${words.length}`);
  }

  function drop(event: DragEvent, to: number) {
    event.preventDefault();
    if (dragged.current !== null && dragged.current !== to) move(dragged.current, to);
    dragged.current = null;
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
            <Button variant="ghost" size="icon-lg" aria-label={`Monter ${word}`} disabled={index === 0} onClick={() => move(index, index - 1)}>
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label={`Descendre ${word}`} disabled={index === words.length - 1} onClick={() => move(index, index + 1)}>
              <ArrowDown aria-hidden="true" />
            </Button>
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

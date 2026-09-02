"use client";

import { Button } from "@/components/ui/button";

interface NumpadProps {
  onDigit: (digit: number) => void;
  onErase: () => void;
  onSubmit: () => void;
  /** Faux quand la saisie est vide : « Valider » reste focalisable. */
  canSubmit: boolean;
  /** Vrai pendant le feedback : le pavé n'accepte plus rien. */
  disabled: boolean;
}

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

const KEY_CLASS = "h-16 font-heading text-3xl font-extrabold tabular-nums";
const ACTION_CLASS = "h-16 font-heading text-base font-bold";

/**
 * Pavé numérique tactile. Aucun `<input>` : le clavier système ne s'ouvre
 * jamais, et le chemin tactile dispatche exactement les mêmes actions que le
 * clavier physique.
 *
 * IMPORTANT : ce composant ne doit JAMAIS recevoir de `key` liée à la
 * question — ses boutons restent les mêmes nœuds DOM d'une question à
 * l'autre, ce qui préserve le focus clavier après chaque appui.
 * On utilise `aria-disabled` et non `disabled` : un bouton qui devient
 * `disabled` alors qu'il a le focus renvoie le focus au `<body>`.
 */
export function Numpad({ onDigit, onErase, onSubmit, canSubmit, disabled }: NumpadProps) {
  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Pavé numérique"
        data-numpad=""
        className="grid grid-cols-3 gap-2"
      >
        {DIGITS.map((digit) => (
          <Button
            key={digit}
            variant="outline"
            className={KEY_CLASS}
            aria-disabled={disabled}
            onClick={() => {
              if (disabled) return;
              onDigit(digit);
            }}
          >
            {digit}
          </Button>
        ))}

        <Button
          variant="ghost"
          className={ACTION_CLASS}
          aria-keyshortcuts="Backspace"
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onErase();
          }}
        >
          Effacer
        </Button>

        <Button
          variant="outline"
          className={KEY_CLASS}
          aria-disabled={disabled}
          onClick={() => {
            if (disabled) return;
            onDigit(0);
          }}
        >
          0
        </Button>

        <Button
          className={ACTION_CLASS}
          aria-keyshortcuts="Enter"
          aria-disabled={disabled || !canSubmit}
          onClick={() => {
            if (disabled || !canSubmit) return;
            onSubmit();
          }}
        >
          Valider
        </Button>
      </div>

      <p className="hidden text-center text-sm text-muted-foreground sm:block">
        Tu peux aussi taper les chiffres sur ton clavier.
      </p>
    </div>
  );
}

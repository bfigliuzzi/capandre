"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { parseGoToPage } from "@/lib/dictionnaire";

interface GoToPageProps {
  readonly totalPages: number;
  readonly onGo: (page: number) => void;
}

/** « Aller à la page » (R7) : un numéro hors bornes affiche une erreur sans changer de page. */
export function GoToPage({ totalPages, onGo }: GoToPageProps) {
  const inputId = useId();
  const errorId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = parseGoToPage(value, totalPages);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onGo(result.page);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <label htmlFor={inputId} className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
        Aller à la page
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 w-24 rounded-xl border-2 border-input bg-background px-3 text-base aria-invalid:border-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        />
        <Button type="submit" variant="outline">
          Aller
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

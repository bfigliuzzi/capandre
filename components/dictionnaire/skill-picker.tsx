"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { SKILL_LABELS, SKILLS, type Skill } from "@/lib/dictionnaire";

interface SkillPickerProps {
  readonly onStart: (skills: readonly Skill[]) => void;
}

/** Choix des compétences, toutes cochées par défaut ; au moins une pour commencer (R14). */
export function SkillPicker({ onStart }: SkillPickerProps) {
  const errorId = useId();
  const [selected, setSelected] = useState<ReadonlySet<Skill>>(() => new Set(SKILLS));
  const [error, setError] = useState(false);

  function toggle(skill: Skill) {
    const next = new Set(selected);
    if (next.has(skill)) next.delete(skill);
    else next.add(skill);
    setSelected(next);
    setError(false);
  }

  function start() {
    if (selected.size === 0) {
      setError(true);
      return;
    }
    onStart(SKILLS.filter((s) => selected.has(s)));
  }

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-6">
      <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Compétences à travailler
        </legend>
        {SKILLS.map((skill) => (
          <label key={skill} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border-2 border-border px-4 py-2 text-base hover:bg-muted">
            <input type="checkbox" checked={selected.has(skill)} onChange={() => toggle(skill)} className="size-5 accent-primary" />
            {SKILL_LABELS[skill]}
          </label>
        ))}
      </fieldset>
      {error && (
        <p id={errorId} role="alert" className="text-base text-destructive">
          Coche au moins une compétence.
        </p>
      )}
      <Button size="lg" onClick={start}>
        Commencer
      </Button>
    </div>
  );
}

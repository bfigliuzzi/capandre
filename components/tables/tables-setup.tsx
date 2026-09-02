"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SoundToggle } from "@/components/tables/sound-toggle";
import { TableChips } from "@/components/tables/table-chips";
import { DifficultyCards } from "@/components/tables/difficulty-cards";
import { SessionLengthPicker } from "@/components/tables/session-length-picker";
import { useSound } from "@/hooks/use-sound";
import { useSettings } from "@/lib/db";
import { encodeSessionConfig } from "@/lib/multiplication";
import type { Difficulty, SessionConfig, SessionLength } from "@/lib/multiplication";

export interface TablesSetupProps {
  initialConfig: SessionConfig;
}

/** Écran de réglages de l'exercice : tables, difficulté, longueur, lancement. */
export function TablesSetup({ initialConfig }: TablesSetupProps) {
  const [tables, setTables] = useState<number[]>(initialConfig.tables);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialConfig.difficulty);
  const [length, setLength] = useState<SessionLength>(initialConfig.length);
  const [invalid, setInvalid] = useState(false);

  const tablesGroupRef = useRef<HTMLDivElement>(null);
  const { settings, setLastSessionConfig } = useSettings();
  const { prime } = useSound(settings.soundEnabled);

  const config: SessionConfig = { tables, difficulty, length };
  const sessionHref = `/tables/exercice/session?${encodeSessionConfig(config)}`;

  function handleStartClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (config.tables.length === 0) {
      e.preventDefault();
      setInvalid(true);
      tablesGroupRef.current?.focus();
      return;
    }
    setInvalid(false);
    void setLastSessionConfig(config);
    prime();
  }

  return (
    <div className="flex flex-col gap-6">
      <div ref={tablesGroupRef} tabIndex={-1}>
        <h3
          id="tables-setup-tables-label"
          className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Quelles tables veux-tu réviser ?
        </h3>
        <TableChips
          value={tables}
          onChange={(next) => {
            setTables(next);
            if (next.length > 0) setInvalid(false);
          }}
          invalid={invalid}
          labelId="tables-setup-tables-label"
        />
      </div>

      <div>
        <h3
          id="tables-setup-difficulty-label"
          className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Comment veux-tu jouer ?
        </h3>
        <DifficultyCards value={difficulty} onChange={setDifficulty} labelId="tables-setup-difficulty-label" />
      </div>

      <div>
        <h3
          id="tables-setup-length-label"
          className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3"
        >
          Combien de questions ?
        </h3>
        <SessionLengthPicker value={length} onChange={setLength} labelId="tables-setup-length-label" />
      </div>

      <Button
        className="w-full"
        render={<Link href={sessionHref} transitionTypes={["nav-forward"]} onClick={handleStartClick} />}
      >
        Commencer
      </Button>

      <SoundToggle className="self-center" />
    </div>
  );
}

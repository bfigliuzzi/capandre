"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiplicationSession } from "@/components/tables/multiplication-session";
import { TablesLoader } from "@/components/tables/tables-loader";
import { useMultiplicationProgress, useSettings } from "@/lib/db";
import { parseSessionConfig } from "@/lib/multiplication";

const SETUP_HREF = "/tables/exercice";

/**
 * Lit les réglages dans l'URL puis attend le chargement de la progression et
 * des préférences avant de monter la session.
 *
 * Ce gating est la clé anti-hydratation du module : `generateSession`
 * (Math.random) n'est appelé que dans l'initialiseur de `useReducer` de
 * `MultiplicationSession`, qui n'est monté qu'une fois les données chargées
 * — donc jamais pendant un rendu serveur.
 */
export function MultiplicationSessionRoute() {
  const params = useSearchParams();
  const router = useRouter();

  const config = useMemo(() => {
    const parsed = parseSessionConfig(params);
    if (!parsed || parsed.tables.length === 0) return null;
    return parsed;
  }, [params]);

  const { progress, isLoading: progressLoading, refetch } = useMultiplicationProgress();
  const { settings, isLoading: settingsLoading } = useSettings();

  // `started` est MONOTONE : une fois la session lancée, un rafraîchissement
  // de la progression (déclenché par l'enregistrement en fin de partie)
  // remet `isLoading` à vrai un instant — sans ce verrou, la session serait
  // démontée et le résumé perdu.
  // Le passage par `setTimeout` évite un setState synchrone dans le corps de
  // l'effet (règle react-hooks/set-state-in-effect) ; le coût est une frame
  // de spinner supplémentaire au démarrage.
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started || !config || progressLoading || settingsLoading) return;
    const id = setTimeout(() => setStarted(true), 0);
    return () => clearTimeout(id);
  }, [started, config, progressLoading, settingsLoading]);

  useEffect(() => {
    if (!config) router.replace(SETUP_HREF);
  }, [config, router]);

  if (!config || !started) {
    return <TablesLoader label="Préparation de l'exercice" />;
  }

  return (
    <MultiplicationSession
      config={config}
      progress={progress}
      soundEnabled={settings.soundEnabled}
      onProgressChange={refetch}
    />
  );
}

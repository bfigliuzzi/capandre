"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiplicationSession } from "@/components/tables/multiplication-session";
import { TablesLoader } from "@/components/tables/tables-loader";
import { useMultiplicationProgress, useSettings } from "@/lib/db";
import { parseSessionConfig } from "@/lib/multiplication";

const SETUP_HREF = "/tables/exercice";

/**
 * Lit les réglages dans l'URL puis attend le chargement INITIAL de la
 * progression et des préférences avant de monter la session.
 *
 * Ce gating est la clé anti-hydratation du module : `generateSession`
 * (Math.random) n'est appelé que dans l'initialiseur de `useReducer` de
 * `MultiplicationSession`, qui n'est monté qu'une fois les données chargées
 * — donc jamais pendant un rendu serveur.
 *
 * `useMultiplicationProgress().isLoading` ne redevient PAS vrai après le
 * chargement initial (voir lib/db/multiplication-hooks.ts) : un `refetch()`
 * déclenché en fin de partie ne démonte donc plus la session en cours, et
 * aucun verrou supplémentaire n'est nécessaire ici.
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

  useEffect(() => {
    if (!config) router.replace(SETUP_HREF);
  }, [config, router]);

  if (!config || progressLoading || settingsLoading) {
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

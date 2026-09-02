"use client";

import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { TablesLoader } from "@/components/tables/tables-loader";
import { TablesSetup } from "@/components/tables/tables-setup";
import { useSettings } from "@/lib/db";
import { DEFAULT_CONFIG } from "@/lib/multiplication";

export default function TablesExercicePage() {
  useSetHeader("Exercice", "/tables");

  const { settings, isLoading } = useSettings();

  return (
    <PageTransition>
      {isLoading ? (
        <TablesLoader />
      ) : (
        <TablesSetup initialConfig={settings.lastSessionConfig ?? DEFAULT_CONFIG} />
      )}
    </PageTransition>
  );
}

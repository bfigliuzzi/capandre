"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useDB } from "@/lib/db";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isReady, error } = useDB();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" aria-live="polite">
        <p className="text-destructive text-center">
          Une erreur est survenue lors du chargement de l&apos;application.
          Essayez de recharger la page.
        </p>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Chargement en cours">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden="true" />
        <span className="sr-only">Chargement en cours…</span>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}

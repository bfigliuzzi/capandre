"use client";

import type { ReactNode } from "react";
import { useDictionary } from "@/lib/db";
import type { DictionaryFile } from "@/lib/dictionnaire";

interface DictionaryLoaderProps {
  readonly children: (dictionary: DictionaryFile) => ReactNode;
}

/** États du module : copie en cours, erreur à la première ouverture, prêt (R31, R32). */
export function DictionaryLoader({ children }: DictionaryLoaderProps) {
  const state = useDictionary();

  if (state.status === "pret") return <>{children(state.dictionary)}</>;

  if (state.status === "chargement") {
    // Balisage repris de components/tables/tables-loader.tsx.
    return (
      <div className="flex flex-col items-center gap-3 py-12" role="status">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-hidden="true" />
        <p className="text-base text-muted-foreground">Préparation du dictionnaire…</p>
      </div>
    );
  }

  return (
    <div role="alert" className="mx-auto flex max-w-prose flex-col gap-2 rounded-xl border-2 border-border p-5">
      {state.status === "erreur-reseau" ? (
        <>
          <p className="font-heading text-lg font-bold">Le dictionnaire n&apos;est pas encore sur cet appareil.</p>
          <p className="text-base">
            Pour le télécharger, il faut être connecté à internet une première fois. Ensuite, il marchera
            sans connexion.
          </p>
        </>
      ) : (
        <p className="text-base">Le dictionnaire n&apos;a pas pu être préparé. Recharge la page pour réessayer.</p>
      )}
    </div>
  );
}

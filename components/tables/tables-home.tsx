"use client";

import Link from "next/link";
import { ModuleCard } from "@/components/module-card";
import { TableOverview } from "@/components/tables/table-overview";
import { SoundToggle } from "@/components/tables/sound-toggle";
import { useMultiplicationProgress, useUnlockedBadges } from "@/lib/db";

const TOTAL_STARS = 30;

/** Orchestre /tables : intro, cartes d'entrée, aperçu des étoiles, encart trophées. */
export function TablesHome() {
  const { stars, isLoading: starsLoading } = useMultiplicationProgress();
  const { earned, locked, isLoading: badgesLoading } = useUnlockedBadges();

  const totalStars = Object.values(stars).reduce((sum, value) => sum + value, 0);
  const totalBadges = earned.length + locked.length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-bold">Tables de multiplication</h2>
        <p className="text-muted-foreground">Choisis : réviser tranquillement, ou t&apos;entraîner pour de vrai.</p>
      </div>

      <div className="flex flex-col gap-3">
        <ModuleCard
          href="/tables/revision"
          icon="📚"
          title="Révision"
          description="Regarde et apprends les tables, une par une."
          variant="secondary"
        />
        <ModuleCard
          href="/tables/exercice"
          icon="🎯"
          title="Exercice"
          description="Réponds aux questions et gagne des étoiles."
          variant="primary"
        />
      </div>

      <section aria-labelledby="tables-stars-title">
        <h3 id="tables-stars-title" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Tes étoiles
        </h3>
        <div className="mt-3">
          <TableOverview stars={stars} isLoading={starsLoading} />
        </div>
        {!starsLoading && (
          <p className="mt-3 text-muted-foreground">Tu as {totalStars} étoiles sur {TOTAL_STARS} !</p>
        )}
      </section>

      <section aria-labelledby="tables-badges-title" className="flex flex-col gap-2">
        <h3 id="tables-badges-title" className="font-heading text-sm font-bold text-muted-foreground uppercase tracking-wider">
          Mes trophées
        </h3>
        {!badgesLoading && (
          <p className="text-muted-foreground">
            {earned.length} trophée{earned.length > 1 ? "s" : ""} débloqué{earned.length > 1 ? "s" : ""} sur {totalBadges}
          </p>
        )}
        <Link href="/tables/trophees" transitionTypes={["nav-forward"]} className="font-bold text-primary underline-offset-4 hover:underline w-fit">
          Voir mes trophées
        </Link>
      </section>

      <SoundToggle className="self-start" />
    </div>
  );
}

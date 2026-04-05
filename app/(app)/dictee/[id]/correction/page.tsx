"use client";

import { use } from "react";
import { DicteeCorrection } from "@/components/dictee-correction";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";

export default function DicteeCorrectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  useSetHeader("Correction", `/dictee/${id}`);

  return (
    <PageTransition>
      <DicteeCorrection dictationId={id} />
    </PageTransition>
  );
}

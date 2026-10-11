"use client";

import { useSearchParams } from "next/navigation";
import { SKILLS_PARAM, parseSkills } from "@/lib/dictionnaire";
import { DictionaryReader } from "./dictionary-book";
import { DictionaryLoader } from "./dictionary-loader";
import { TrainingSession } from "./training-session";

export function DictionaryBookRoute() {
  return <DictionaryLoader>{(dictionary) => <DictionaryReader dictionary={dictionary} />}</DictionaryLoader>;
}

/** Lit les compétences dans l'URL ; doit être sous un <Suspense> (useSearchParams). */
export function TrainingSessionRoute() {
  const skills = parseSkills(useSearchParams().get(SKILLS_PARAM));
  return (
    <DictionaryLoader>
      {(dictionary) => <TrainingSession dictionary={dictionary} skills={skills} rng={Math.random} />}
    </DictionaryLoader>
  );
}


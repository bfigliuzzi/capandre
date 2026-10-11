"use client";

import { useRouter } from "next/navigation";
import { SkillPicker } from "@/components/dictionnaire/skill-picker";
import { useSetHeader } from "@/components/layout/use-set-header";
import { PageTransition } from "@/components/page-transition";
import { SKILLS_PARAM, encodeSkills } from "@/lib/dictionnaire";

export default function DictionnaireEntrainementPage() {
  useSetHeader("Entraînement", "/dictionnaire");
  const router = useRouter();

  return (
    <PageTransition>
      <SkillPicker
        onStart={(skills) =>
          router.push(`/dictionnaire/entrainement/session?${SKILLS_PARAM}=${encodeSkills(skills)}`, {
            transitionTypes: ["nav-forward"],
          })
        }
      />
    </PageTransition>
  );
}

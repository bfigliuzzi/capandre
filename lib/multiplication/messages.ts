// Messages français du moteur (CE1–CM2, tutoiement, JAMAIS punitif).
//
// Règle absolue, vérifiée par un test : aucun message ne contient
// « faux », « erreur », « mauvais », « raté », « perdu », « nul »,
// « échec », ni « X » comme marqueur. Il n'y a pas de compteur d'erreurs :
// le bilan présente les réussites, et le reste sous « À retravailler ».
import { formatFactLine } from "./facts";
import type { Question, Rng } from "./types";

export const STREAK_THRESHOLDS = [3, 5, 10, 15, 20, 30] as const;

export const CORRECT_MESSAGES: readonly string[] = [
  "Bravo !",
  "Exact !",
  "Tu l'as !",
  "Super !",
  "Parfait !",
  "Oui, c'est ça !",
  "Bien joué !",
];

export const RETRY_INTRO_MESSAGES: readonly string[] = [
  "Presque !",
  "Pas encore, regarde bien :",
  "On la revoit ensemble :",
  "Celle-ci est coriace :",
  "Tu y es presque :",
];

export const TIMEOUT_INTRO_MESSAGES: readonly string[] = [
  "Le temps est écoulé !",
  "Juste un peu trop long !",
  "On y retourne :",
  "Le chrono a été plus vite :",
];

export const STREAK_MESSAGES: Record<number, readonly string[]> = {
  3: ["3 d'affilée, tu chauffes !", "Trois de suite, bravo !"],
  5: ["5 d'affilée, tu es lancé !", "Cinq de suite, quelle forme !"],
  10: ["10 d'affilée, incroyable !", "Dix de suite, chapeau !"],
  15: ["15 sans t'arrêter, quelle mémoire !"],
  20: ["20 d'affilée, c'est énorme !"],
  30: ["30 d'affilée… tu es imbattable !"],
};

export const SUMMARY_MESSAGES: readonly {
  minRatio: number;
  messages: readonly string[];
}[] = [
  { minRatio: 1, messages: ["Session parfaite, chapeau !", "Tout juste, bravo !"] },
  { minRatio: 0.8, messages: ["Très belle session !", "Beau travail, continue !"] },
  { minRatio: 0.5, messages: ["Bon travail, ça progresse !", "Tu avances bien !"] },
  {
    minRatio: 0,
    messages: [
      "Tu t'es entraîné, c'est déjà une victoire !",
      "Chaque essai te fait progresser, on recommence quand tu veux !",
    ],
  },
];

/** Choisit un élément du pool ; déterministe avec un rng injecté. */
export function pickMessage(pool: readonly string[], rng: Rng = Math.random): string {
  if (pool.length === 0) return "";
  const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
  return pool[index];
}

/**
 * Message de palier de série. Le palier doit être atteint EXACTEMENT, pour
 * que le message ne se déclenche qu'une fois. Au-delà de 30, tout multiple
 * de 10 déclenche un message générique.
 */
export function streakMessage(streak: number, rng: Rng = Math.random): string | null {
  if (STREAK_THRESHOLDS.includes(streak as (typeof STREAK_THRESHOLDS)[number])) {
    return pickMessage(STREAK_MESSAGES[streak] ?? [], rng);
  }
  if (streak > 30 && streak % 10 === 0) {
    return `${streak} d'affilée, tu es en feu !`;
  }
  return null;
}

/** « Presque ! 7 × 8 = 56 » — la bonne réponse est toujours montrée. */
export function correctionMessage(q: Question, rng: Rng = Math.random): string {
  return `${pickMessage(RETRY_INTRO_MESSAGES, rng)} ${formatFactLine(q.fact)}`;
}

/** « Le temps est écoulé ! 7 × 8 = 56 » — neutre, sans reproche. */
export function timeoutMessage(q: Question, rng: Rng = Math.random): string {
  return `${pickMessage(TIMEOUT_INTRO_MESSAGES, rng)} ${formatFactLine(q.fact)}`;
}

export function summaryMessage(ratio: number, rng: Rng = Math.random): string {
  const tier =
    SUMMARY_MESSAGES.find((entry) => ratio >= entry.minRatio) ??
    SUMMARY_MESSAGES[SUMMARY_MESSAGES.length - 1];
  return pickMessage(tier.messages, rng);
}

/** Une baisse d'étoiles n'est jamais présentée comme une sanction. */
export function starsMessage(delta: {
  table: number;
  from: number;
  to: number;
}): string {
  if (delta.to > delta.from) {
    const gained = delta.to - delta.from;
    return gained === 1
      ? `Table de ${delta.table} : +1 étoile !`
      : `Table de ${delta.table} : +${gained} étoiles !`;
  }
  return `Table de ${delta.table} : à retravailler un peu.`;
}

// Catalogue de trophées. Un badge débloqué n'est JAMAIS retiré, même si les
// étoiles rebaissent ensuite : règle non punitive.
import type { MultiplicationFactProgress, UnlockedBadge } from "../db/schema";
import type { SessionSummary } from "./types";

export interface BadgeContext {
  summary: SessionSummary;
  /** APRÈS mise à jour de la maîtrise. */
  progress: readonly MultiplicationFactProgress[];
  /** APRÈS mise à jour. */
  stars: Record<string, number>;
  /** Y compris la session qui vient de se terminer. */
  sessionCount: number;
  /** Idem, pour les sessions en mode Défi. */
  challengeSessionCount: number;
  /** Cumul de vie des bonnes réponses (Σ progress.correct). */
  totalCorrectCount: number;
}

/**
 * Nom sémantique de l'icône du trophée. La couche présentation le résout en
 * composant `lucide-react` ; `lib/` reste du TypeScript pur, sans dépendance React.
 */
export type BadgeIconName =
  | "sprout"
  | "flame"
  | "zap"
  | "target"
  | "calendar-check"
  | "footprints"
  | "calculator"
  | "percent"
  | "timer"
  | "sparkles"
  | "library"
  | "brain"
  | "star"
  | "crown";

export interface BadgeDefinition {
  id: string;
  title: string;
  /** Décrit la condition ; sert aussi d'indice quand le trophée est verrouillé. */
  description: string;
  icon: BadgeIconName;
  isUnlocked: (ctx: BadgeContext) => boolean;
}

function masteredTableCount(stars: Record<string, number>): number {
  return Object.values(stars).filter((value) => value === 3).length;
}

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: "first-session",
    title: "Premier pas",
    description: "Tu as terminé ta première session",
    icon: "sprout",
    isUnlocked: (ctx) => ctx.sessionCount >= 1,
  },
  {
    id: "streak-10",
    title: "Série de 10",
    description: "10 bonnes réponses d'affilée",
    icon: "flame",
    isUnlocked: (ctx) => ctx.summary.bestStreak >= 10,
  },
  {
    id: "streak-20",
    title: "Série de 20",
    description: "20 bonnes réponses d'affilée",
    icon: "zap",
    isUnlocked: (ctx) => ctx.summary.bestStreak >= 20,
  },
  {
    id: "perfect-session",
    title: "Sans faute",
    description: "Une session entière réussie du premier coup",
    icon: "target",
    isUnlocked: (ctx) => ctx.summary.isPerfect,
  },
  {
    id: "five-sessions",
    title: "Habitué",
    description: "5 sessions terminées",
    icon: "calendar-check",
    isUnlocked: (ctx) => ctx.sessionCount >= 5,
  },
  {
    id: "twenty-sessions",
    title: "Marathon",
    description: "20 sessions terminées",
    icon: "footprints",
    isUnlocked: (ctx) => ctx.sessionCount >= 20,
  },
  {
    id: "fifty-correct",
    title: "Cinquante",
    description: "50 bonnes réponses au total",
    icon: "calculator",
    isUnlocked: (ctx) => ctx.totalCorrectCount >= 50,
  },
  {
    id: "five-hundred-correct",
    title: "Cinq cents",
    description: "500 bonnes réponses au total",
    icon: "percent",
    isUnlocked: (ctx) => ctx.totalCorrectCount >= 500,
  },
  {
    id: "first-challenge",
    title: "Chrono lancé",
    description: "Ta première session en mode Défi",
    icon: "timer",
    isUnlocked: (ctx) => ctx.summary.config.difficulty === "challenge",
  },
  {
    id: "challenge-perfect",
    title: "Éclair",
    description: "Une session Défi réussie sans faute",
    icon: "sparkles",
    isUnlocked: (ctx) =>
      ctx.summary.config.difficulty === "challenge" && ctx.summary.isPerfect,
  },
  {
    id: "long-session",
    title: "Grande session",
    description: "Une session de 30 questions",
    icon: "library",
    isUnlocked: (ctx) => ctx.summary.config.length === 30,
  },
  {
    id: "table-7-mastered",
    title: "La table de 7",
    description: "3 étoiles sur la table de 7",
    icon: "brain",
    isUnlocked: (ctx) => ctx.stars["7"] === 3,
  },
  {
    id: "three-tables-mastered",
    title: "Trois tables",
    description: "3 étoiles sur trois tables",
    icon: "star",
    isUnlocked: (ctx) => masteredTableCount(ctx.stars) >= 3,
  },
  {
    id: "all-tables-mastered",
    title: "Toutes les tables",
    description: "3 étoiles sur les 10 tables",
    icon: "crown",
    isUnlocked: (ctx) => masteredTableCount(ctx.stars) === 10,
  },
];

export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.id === id);
}

/**
 * Trophées nouvellement débloqués, dans l'ordre du catalogue (affichage
 * stable). Un trophée déjà obtenu n'est jamais renvoyé une seconde fois.
 */
export function evaluateBadges(
  ctx: BadgeContext,
  unlocked: readonly UnlockedBadge[],
): BadgeDefinition[] {
  const already = new Set(unlocked.map((entry) => entry.id));
  return BADGES.filter((badge) => !already.has(badge.id) && badge.isUnlocked(ctx));
}

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

export interface BadgeDefinition {
  id: string;
  title: string;
  /** Décrit la condition ; sert aussi d'indice quand le trophée est verrouillé. */
  description: string;
  emoji: string;
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
    emoji: "🌱",
    isUnlocked: (ctx) => ctx.sessionCount >= 1,
  },
  {
    id: "streak-10",
    title: "Série de 10",
    description: "10 bonnes réponses d'affilée",
    emoji: "🔥",
    isUnlocked: (ctx) => ctx.summary.bestStreak >= 10,
  },
  {
    id: "streak-20",
    title: "Série de 20",
    description: "20 bonnes réponses d'affilée",
    emoji: "⚡",
    isUnlocked: (ctx) => ctx.summary.bestStreak >= 20,
  },
  {
    id: "perfect-session",
    title: "Sans faute",
    description: "Une session entière réussie du premier coup",
    emoji: "🎯",
    isUnlocked: (ctx) => ctx.summary.isPerfect,
  },
  {
    id: "five-sessions",
    title: "Habitué",
    description: "5 sessions terminées",
    emoji: "📅",
    isUnlocked: (ctx) => ctx.sessionCount >= 5,
  },
  {
    id: "twenty-sessions",
    title: "Marathon",
    description: "20 sessions terminées",
    emoji: "🏃",
    isUnlocked: (ctx) => ctx.sessionCount >= 20,
  },
  {
    id: "fifty-correct",
    title: "Cinquante",
    description: "50 bonnes réponses au total",
    emoji: "🧮",
    isUnlocked: (ctx) => ctx.totalCorrectCount >= 50,
  },
  {
    id: "five-hundred-correct",
    title: "Cinq cents",
    description: "500 bonnes réponses au total",
    emoji: "💯",
    isUnlocked: (ctx) => ctx.totalCorrectCount >= 500,
  },
  {
    id: "first-challenge",
    title: "Chrono lancé",
    description: "Ta première session en mode Défi",
    emoji: "⏱️",
    isUnlocked: (ctx) => ctx.summary.config.difficulty === "challenge",
  },
  {
    id: "challenge-perfect",
    title: "Éclair",
    description: "Une session Défi réussie sans faute",
    emoji: "✨",
    isUnlocked: (ctx) =>
      ctx.summary.config.difficulty === "challenge" && ctx.summary.isPerfect,
  },
  {
    id: "long-session",
    title: "Grande session",
    description: "Une session de 30 questions",
    emoji: "📚",
    isUnlocked: (ctx) => ctx.summary.config.length === 30,
  },
  {
    id: "table-7-mastered",
    title: "La table de 7",
    description: "3 étoiles sur la table de 7",
    emoji: "🧠",
    isUnlocked: (ctx) => ctx.stars["7"] === 3,
  },
  {
    id: "three-tables-mastered",
    title: "Trois tables",
    description: "3 étoiles sur trois tables",
    emoji: "🌟",
    isUnlocked: (ctx) => masteredTableCount(ctx.stars) >= 3,
  },
  {
    id: "all-tables-mastered",
    title: "Toutes les tables",
    description: "3 étoiles sur les 10 tables",
    emoji: "👑",
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

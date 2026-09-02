// Génération et déroulé d'une session d'exercice. Fonctions pures :
// l'aléatoire et le temps sont toujours injectables.
import type {
  MultiplicationFactProgress,
  MultiplicationSessionRecord,
} from "../db/schema";
import {
  DEFAULT_SESSION_LENGTH,
  MAX_FACTS_TO_REVISIT,
  MAX_QUESTION_FACTOR,
  MAX_RETRY_DEPTH,
  MISSING_FACTOR_SHARE,
  MISSING_FACTOR_START_INDEX,
  RETRY_MAX_GAP,
  RETRY_MIN_GAP,
  SESSION_LENGTHS,
  TIME_LIMITS_MS,
} from "./constants";
import { buildFacts, factKey, formatFactLine } from "./facts";
import {
  correctionMessage,
  pickMessage,
  streakMessage,
  summaryMessage,
  timeoutMessage,
  CORRECT_MESSAGES,
} from "./messages";
import { factWeight, toProgressMap } from "./progress";
import { pickWeightedIndex, randomInt, shuffleWithRng } from "./random";
import type {
  AnswerInput,
  AnswerOutcome,
  AnswerStatus,
  Fact,
  FactSummary,
  Question,
  QuestionKind,
  Rng,
  SessionConfig,
  SessionLength,
  SessionState,
  SessionSummary,
} from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Choisit la forme d'une question à facteur manquant en évitant les énoncés
 * dégénérés : le facteur VISIBLE ne doit pas être 1 (« ? × 1 = 7 » est un
 * cadeau). 1 × 1 retombe sur le produit.
 *
 * Aucune ambiguïté mathématique n'est possible : facteurs dans 1..10, jamais
 * de zéro, donc « ? × b = c » a l'unique solution c / b.
 */
export function resolveMissingKind(fact: Fact, r: number): QuestionKind {
  if (fact.a === 1 && fact.b === 1) return "product";
  if (r < 0.5) return fact.a === 1 ? "missingLeft" : "missingRight";
  return fact.b === 1 ? "missingRight" : "missingLeft";
}

function answerFor(fact: Fact, kind: QuestionKind): number {
  if (kind === "missingRight") return fact.b;
  if (kind === "missingLeft") return fact.a;
  return fact.a * fact.b;
}

export function generateSession(
  config: SessionConfig,
  progress: readonly MultiplicationFactProgress[],
  options?: { rng?: Rng; now?: number },
): SessionState {
  const rng = options?.rng ?? Math.random;
  const now = options?.now ?? Date.now();

  const facts = buildFacts(config.tables);
  if (facts.length === 0) {
    throw new Error("Aucune table sélectionnée");
  }

  const length: SessionLength = (
    SESSION_LENGTHS as readonly number[]
  ).includes(config.length)
    ? config.length
    : DEFAULT_SESSION_LENGTH;

  const map = toProgressMap(progress);
  const base = facts.map((fact) => factWeight(fact, map));
  const used = facts.map(() => 0);

  // Fenêtre anti-répétition : ne peut jamais saturer le pool (1 seule table
  // pour 30 questions → répétitions normales et attendues).
  const recentWindow = Math.max(0, Math.min(3, facts.length - 1));
  const recent: number[] = [];
  const picked: number[] = [];

  for (let slot = 0; slot < length; slot++) {
    const weights = facts.map((_, i) =>
      recent.includes(i) ? 0 : Math.max(1, Math.round(base[i] / (1 + used[i]))),
    );
    let i = pickWeightedIndex(weights, rng());
    if (i < 0) {
      // Pool minuscule : on relâche la contrainte anti-répétition.
      i = Math.min(facts.length - 1, Math.floor(rng() * facts.length));
    }
    picked.push(i);
    used[i] += 1;
    recent.push(i);
    if (recent.length > recentWindow) recent.shift();
  }

  // Affectation des questions à facteur manquant.
  const missingTarget = Math.round(length * MISSING_FACTOR_SHARE[config.difficulty]);
  const eligible: number[] = [];
  for (let slot = MISSING_FACTOR_START_INDEX; slot < length; slot++) {
    eligible.push(slot);
  }
  const order = shuffleWithRng(eligible, rng);
  const chosen = new Set<number>();
  // Passe 1 : jamais deux facteurs manquants d'affilée.
  for (const slot of order) {
    if (chosen.size >= missingTarget) break;
    if (chosen.has(slot - 1) || chosen.has(slot + 1)) continue;
    chosen.add(slot);
  }
  // Passe 2 : petites sessions, on complète quand même la cible.
  for (const slot of order) {
    if (chosen.size >= missingTarget) break;
    chosen.add(slot);
  }

  const queue: Question[] = picked.map((factIndex, slot) => {
    const fact = facts[factIndex];
    const product = fact.a * fact.b;
    const kind = chosen.has(slot) ? resolveMissingKind(fact, rng()) : "product";
    return {
      id: `q${slot}`,
      fact,
      kind,
      product,
      answer: answerFor(fact, kind),
      isRetry: false,
      retryOf: null,
      retryDepth: 0,
    };
  });

  return {
    config: { ...config, length },
    queue,
    index: 0,
    outcomes: [],
    streak: 0,
    bestStreak: 0,
    maxQuestions: Math.ceil(length * MAX_QUESTION_FACTOR),
    startedAt: now,
    finishedAt: null,
  };
}

// ---------------------------------------------------------------------------
// Accesseurs
// ---------------------------------------------------------------------------

export function currentQuestion(state: SessionState): Question | null {
  return state.queue[state.index] ?? null;
}

export function isSessionFinished(state: SessionState): boolean {
  return state.index >= state.queue.length;
}

/**
 * Avancement. ATTENTION : `queue.length` CROÎT en cours de session (reprises)
 * et ne décroît jamais. L'UI affiche « index + 1 / queue.length » : la barre
 * peut ralentir, jamais reculer.
 */
export function progressRatio(state: SessionState): number {
  if (state.queue.length === 0) return 0;
  return state.index / state.queue.length;
}

/** `null` en mode De base : l'UI ne démarre alors aucun minuteur. */
export function timeLimitMs(state: SessionState): number | null {
  return TIME_LIMITS_MS[state.config.difficulty];
}

export function formatQuestion(q: Question): string {
  if (q.kind === "missingRight") return `${q.fact.a} × ? = ${q.product}`;
  if (q.kind === "missingLeft") return `? × ${q.fact.b} = ${q.product}`;
  return `${q.fact.a} × ${q.fact.b} = ?`;
}

/** Toute la mise en forme de l'énoncé vit ici, jamais dans le composant. */
export function questionParts(q: Question): {
  left: string;
  operator: "×";
  right: string;
  result: string;
  hidden: "left" | "right" | "result";
} {
  if (q.kind === "missingRight") {
    return {
      left: String(q.fact.a),
      operator: "×",
      right: "",
      result: String(q.product),
      hidden: "right",
    };
  }
  if (q.kind === "missingLeft") {
    return {
      left: "",
      operator: "×",
      right: String(q.fact.b),
      result: String(q.product),
      hidden: "left",
    };
  }
  return {
    left: String(q.fact.a),
    operator: "×",
    right: String(q.fact.b),
    result: "",
    hidden: "result",
  };
}

// ---------------------------------------------------------------------------
// Réponse
// ---------------------------------------------------------------------------

/**
 * Planifie une reprise du fait 3 à 5 questions plus loin.
 *
 * Stratégie : insertion en priorité (préserve la couverture des `length`
 * faits nouveaux et l'espacement mémoriel), puis écrasement d'un créneau NON
 * ENCORE POSÉ une fois le plafond `maxQuestions` atteint, et enfin abandon
 * silencieux. La session ne s'allonge donc jamais au-delà du plafond.
 *
 * La reprise est TOUJOURS de type `product` : c'est une occasion de réussir,
 * pas une punition.
 */
export function scheduleRetry(
  queue: readonly Question[],
  currentIndex: number,
  question: Question,
  options?: { rng?: Rng; maxQuestions?: number },
): Question[] {
  const rng = options?.rng ?? Math.random;
  const maxQuestions = options?.maxQuestions ?? Number.POSITIVE_INFINITY;

  const key = factKey(question.fact.a, question.fact.b);
  const product = question.fact.a * question.fact.b;
  const retry: Question = {
    id: `r${queue.length}`,
    fact: question.fact,
    kind: "product",
    product,
    answer: product,
    isRetry: true,
    retryOf: question.id,
    retryDepth: question.retryDepth + 1,
  };

  const gap = randomInt(RETRY_MIN_GAP, RETRY_MAX_GAP, rng);
  let placement = clamp(currentIndex + gap, currentIndex + 1, queue.length);

  // Pas d'occurrence du même fait en voisin immédiat.
  const keyOf = (q: Question | undefined): string | null =>
    q ? factKey(q.fact.a, q.fact.b) : null;
  while (
    placement < queue.length &&
    (keyOf(queue[placement - 1]) === key || keyOf(queue[placement]) === key)
  ) {
    placement += 1;
  }

  if (queue.length < maxQuestions) {
    const next = [...queue];
    next.splice(placement, 0, retry);
    return next;
  }

  // Plafond atteint : on écrase un créneau non encore posé.
  const from = Math.max(placement, currentIndex + 1);
  for (let p = from; p < queue.length; p++) {
    const candidate = queue[p];
    if (candidate.isRetry) continue;
    if (keyOf(candidate) === key) continue;
    const next = [...queue];
    next[p] = retry;
    return next;
  }

  // Aucun créneau disponible : reprise abandonnée, la file reste intacte.
  return [...queue];
}

export function answerQuestion(
  state: SessionState,
  input: AnswerInput,
  options?: { rng?: Rng; now?: number },
): { state: SessionState; outcome: AnswerOutcome } {
  if (isSessionFinished(state)) {
    throw new Error("Session terminée");
  }
  const rng = options?.rng ?? Math.random;
  const now = options?.now ?? Date.now();

  const q = state.queue[state.index];

  let status: AnswerStatus;
  if (input.type === "timeout") {
    status = "timeout";
  } else if (Number.isInteger(input.value) && input.value === q.answer) {
    status = "correct";
  } else {
    status = "incorrect";
  }

  const streak = status === "correct" ? state.streak + 1 : 0;
  const bestStreak = Math.max(state.bestStreak, streak);

  const message =
    status === "correct"
      ? pickMessage(CORRECT_MESSAGES, rng)
      : status === "timeout"
        ? timeoutMessage(q, rng)
        : correctionMessage(q, rng);

  const outcome: AnswerOutcome = {
    questionId: q.id,
    factKey: factKey(q.fact.a, q.fact.b),
    kind: q.kind,
    status,
    given: input.type === "answer" ? input.value : null,
    expected: q.answer,
    isRetry: q.isRetry,
    streakAfter: streak,
    message,
    celebration: streakMessage(streak, rng),
  };

  let queue = state.queue;
  if (status !== "correct" && q.retryDepth < MAX_RETRY_DEPTH) {
    queue = scheduleRetry(state.queue, state.index, q, {
      rng,
      maxQuestions: state.maxQuestions,
    });
  } else {
    queue = [...state.queue];
  }

  const index = state.index + 1;

  return {
    state: {
      ...state,
      queue,
      index,
      outcomes: [...state.outcomes, outcome],
      streak,
      bestStreak,
      finishedAt: index >= queue.length ? now : null,
    },
    outcome,
  };
}

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------

export function computeSummary(
  state: SessionState,
  options?: { rng?: Rng; now?: number },
): SessionSummary {
  const rng = options?.rng ?? Math.random;
  const now = options?.now ?? Date.now();
  const completedAt = new Date(state.finishedAt ?? now).toISOString();

  const askedCount = state.outcomes.length;
  const correctCount = state.outcomes.filter((o) => o.status === "correct").length;
  const firstTryCorrectCount = state.outcomes.filter(
    (o) => o.status === "correct" && !o.isRetry,
  ).length;
  const timeoutCount = state.outcomes.filter((o) => o.status === "timeout").length;

  // Une reprise programmée allonge la file : la session n'est parfaite que si
  // la file est restée à sa taille nominale et que tout est réussi.
  const isPerfect =
    state.queue.length === state.config.length &&
    askedCount === state.queue.length &&
    correctCount === askedCount;

  const misses = new Map<string, FactSummary>();
  for (const outcome of state.outcomes) {
    if (outcome.status === "correct") continue;
    const existing = misses.get(outcome.factKey);
    if (existing) {
      existing.missCount += 1;
      continue;
    }
    const [a, b] = outcome.factKey.split("-").map(Number);
    misses.set(outcome.factKey, {
      key: outcome.factKey,
      a,
      b,
      product: a * b,
      label: formatFactLine({ a, b }),
      missCount: 1,
    });
  }

  // Un fait rattrapé en reprise reste listé : une réussite unique ne prouve
  // pas la maîtrise, et « À retravailler » n'a rien de punitif.
  const factsToRevisit = [...misses.values()]
    .sort((x, y) => y.missCount - x.missCount || x.a - y.a || x.b - y.b)
    .slice(0, MAX_FACTS_TO_REVISIT);

  return {
    startedAt: new Date(state.startedAt).toISOString(),
    completedAt,
    config: { ...state.config, tables: [...state.config.tables] },
    nominalCount: state.config.length,
    askedCount,
    correctCount,
    firstTryCorrectCount,
    timeoutCount,
    bestStreak: state.bestStreak,
    isPerfect,
    factsToRevisit,
    outcomes: state.outcomes.map((o) => ({ ...o })),
    encouragement: summaryMessage(correctCount / Math.max(1, askedCount), rng),
  };
}

export function toSessionRecord(
  summary: SessionSummary,
  opts: {
    id: string;
    starsByTable: Record<string, number>;
    newBadgeIds: string[];
  },
): MultiplicationSessionRecord {
  return {
    id: opts.id,
    startedAt: summary.startedAt,
    completedAt: summary.completedAt,
    tables: [...summary.config.tables],
    difficulty: summary.config.difficulty,
    requestedLength: summary.config.length,
    askedCount: summary.askedCount,
    correctCount: summary.correctCount,
    firstTryCorrectCount: summary.firstTryCorrectCount,
    timeoutCount: summary.timeoutCount,
    bestStreak: summary.bestStreak,
    factsToRevisit: summary.factsToRevisit.map((f) => f.key),
    starsByTable: { ...opts.starsByTable },
    newBadgeIds: [...opts.newBadgeIds],
  };
}

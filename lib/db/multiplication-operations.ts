// Persistance du module « Tables de multiplication ».
//
// `lib/db/operations.ts` est un CRUD mono-store : il ne peut pas exprimer la
// transaction multi-stores dont `recordSession` a besoin. Ce fichier utilise
// donc `getDB()` directement (même approche que `useHasContent`).
import { getDB } from "./database";
import type {
  AppSettings,
  MultiplicationFactProgress,
  MultiplicationSessionRecord,
  UnlockedBadge,
} from "./schema";
import {
  computeAllTableStars,
  evaluateBadges,
  mergeProgress,
  toSessionRecord,
  updateProgress,
} from "../multiplication";
import type { SessionSummary } from "../multiplication";

const SETTINGS_ID = "app";

function defaultSettings(): AppSettings {
  return { id: SETTINGS_ID, soundEnabled: true, lastSessionConfig: null };
}

/** Tous les faits suivis (≤ 100 enregistrements par construction). */
export async function getFactProgress(): Promise<MultiplicationFactProgress[]> {
  const db = await getDB();
  return db.getAll("multiplicationFacts");
}

/** Les `limit` sessions les plus récentes, du plus récent au plus ancien. */
export async function getRecentSessions(
  limit = 20,
): Promise<MultiplicationSessionRecord[]> {
  const db = await getDB();
  const results: MultiplicationSessionRecord[] = [];
  let cursor = await db
    .transaction("multiplicationSessions")
    .store.index("by-date")
    .openCursor(null, "prev");

  while (cursor && results.length < limit) {
    results.push(cursor.value);
    cursor = await cursor.continue();
  }

  return results;
}

export async function getUnlockedBadges(): Promise<UnlockedBadge[]> {
  const db = await getDB();
  return db.getAll("multiplicationBadges");
}

/** Réglages appareil ; retourne le défaut si aucun enregistrement n'existe encore. */
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const existing = await db.get("settings", SETTINGS_ID);
  return existing ?? defaultSettings();
}

/** Fusionne `patch` avec les réglages existants (ou le défaut) et les enregistre. */
export async function putSettings(
  patch: Partial<Omit<AppSettings, "id">>,
): Promise<AppSettings> {
  const db = await getDB();
  const existing = await db.get("settings", SETTINGS_ID);
  const updated: AppSettings = { ...(existing ?? defaultSettings()), ...patch, id: SETTINGS_ID };
  await db.put("settings", updated);
  return updated;
}

export interface RecordSessionResult {
  sessionId: string;
  starsBefore: Record<string, number>;
  starsAfter: Record<string, number>;
  starsDelta: { table: number; from: number; to: number }[];
  newBadgeIds: string[];
  record: MultiplicationSessionRecord;
}

/**
 * Enregistre le bilan d'une session : progression des faits, historique,
 * trophées débloqués. Une seule transaction readwrite sur les trois stores
 * concernés — toute la logique métier vient de fonctions pures ; le wrapper
 * ne contient aucune règle testable.
 */
export async function recordSession(
  summary: SessionSummary,
  now: number = Date.now(),
): Promise<RecordSessionResult> {
  const db = await getDB();
  const sessionId = crypto.randomUUID();

  const tx = db.transaction(
    ["multiplicationFacts", "multiplicationSessions", "multiplicationBadges"],
    "readwrite",
  );
  const factsStore = tx.objectStore("multiplicationFacts");
  const sessionsStore = tx.objectStore("multiplicationSessions");
  const badgesStore = tx.objectStore("multiplicationBadges");

  const existing = await factsStore.getAll();
  const starsBefore = computeAllTableStars(existing);

  const updates = updateProgress(existing, summary, { now });
  for (const record of updates) {
    await factsStore.put(record);
  }

  const after = mergeProgress(existing, updates);
  const starsAfter = computeAllTableStars(after);
  const starsDelta: { table: number; from: number; to: number }[] = [];
  for (const key of Object.keys(starsAfter)) {
    const from = starsBefore[key] ?? 0;
    const to = starsAfter[key] ?? 0;
    if (from !== to) starsDelta.push({ table: Number(key), from, to });
  }

  // Jamais de getAll() sur l'historique de sessions : count() borné.
  const sessionCount = (await sessionsStore.count()) + 1;
  const challengeSessionCount =
    (await sessionsStore
      .index("by-difficulty")
      .count(IDBKeyRange.only("challenge"))) +
    (summary.config.difficulty === "challenge" ? 1 : 0);
  const totalCorrectCount = after.reduce((sum, record) => sum + record.correct, 0);

  const unlockedBefore = await badgesStore.getAll();
  const newBadges = evaluateBadges(
    {
      summary,
      progress: after,
      stars: starsAfter,
      sessionCount,
      challengeSessionCount,
      totalCorrectCount,
    },
    unlockedBefore,
  );
  const newBadgeIds = newBadges.map((badge) => badge.id);
  for (const badge of newBadges) {
    await badgesStore.put({
      id: badge.id,
      unlockedAt: new Date(now).toISOString(),
      sessionId,
    });
  }

  const record = toSessionRecord(summary, {
    id: sessionId,
    starsByTable: starsAfter,
    newBadgeIds,
  });
  await sessionsStore.put(record);

  await tx.done;

  return { sessionId, starsBefore, starsAfter, starsDelta, newBadgeIds, record };
}

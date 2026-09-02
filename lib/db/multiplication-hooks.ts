"use client";

// Hooks React pour le module « Tables de multiplication ».
// Fichier séparé de `hooks.ts` (déjà volumineux) ; mêmes patterns :
// useReducer pour les listes, useState pour l'enregistrement unique,
// useCallback pour les mutations, garde `cancelled` dans chaque effet.
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  getFactProgress,
  getRecentSessions,
  getSettings,
  getUnlockedBadges,
  putSettings,
  recordSession as recordSessionOp,
} from "./multiplication-operations";
import type { RecordSessionResult } from "./multiplication-operations";
import type {
  AppSettings,
  MultiplicationFactProgress,
  MultiplicationSessionConfig,
  MultiplicationSessionRecord,
  UnlockedBadge,
} from "./schema";
import type { BadgeDefinition, SessionSummary } from "../multiplication";
import { BADGES, computeAllTableStars } from "../multiplication";

// --- useMultiplicationProgress ---

interface UseMultiplicationProgressResult {
  progress: MultiplicationFactProgress[];
  stars: Record<string, number>;
  isLoading: boolean;
  refetch: () => void;
}

type ProgressState = { progress: MultiplicationFactProgress[]; isLoading: boolean };
type ProgressAction =
  | { type: "fetch" }
  | { type: "success"; data: MultiplicationFactProgress[] }
  | { type: "error" };

function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true };
    case "success":
      return { progress: action.data, isLoading: false };
    case "error":
      return { ...state, isLoading: false };
  }
}

export function useMultiplicationProgress(): UseMultiplicationProgressResult {
  const [state, dispatch] = useReducer(progressReducer, { progress: [], isLoading: true });
  const [fetchKey, setFetchKey] = useState(0);
  // `isLoading` ne doit être vrai que pour le chargement INITIAL : ce ref
  // (jamais écrit pendant le rendu) mémorise si un premier chargement a déjà
  // abouti, pour que les `refetch` suivants ne remettent pas l'UI en état de
  // chargement (l'appelant ne doit plus contourner ça avec un état maison).
  const hasLoadedRef = useRef(false);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedRef.current) dispatch({ type: "fetch" });
    getFactProgress()
      .then((data) => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const stars = useMemo(() => computeAllTableStars(state.progress), [state.progress]);

  return { progress: state.progress, stars, isLoading: state.isLoading, refetch };
}

// --- useMultiplicationSessions ---

interface UseMultiplicationSessionsResult {
  sessions: MultiplicationSessionRecord[];
  isLoading: boolean;
  refetch: () => void;
}

type SessionsState = { sessions: MultiplicationSessionRecord[]; isLoading: boolean };
type SessionsAction =
  | { type: "fetch" }
  | { type: "success"; data: MultiplicationSessionRecord[] }
  | { type: "error" };

function sessionsReducer(state: SessionsState, action: SessionsAction): SessionsState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true };
    case "success":
      return { sessions: action.data, isLoading: false };
    case "error":
      return { ...state, isLoading: false };
  }
}

export function useMultiplicationSessions(limit = 20): UseMultiplicationSessionsResult {
  const [state, dispatch] = useReducer(sessionsReducer, { sessions: [], isLoading: true });
  const [fetchKey, setFetchKey] = useState(0);
  // Cf. useMultiplicationProgress : isLoading réservé au chargement initial.
  const hasLoadedRef = useRef(false);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedRef.current) dispatch({ type: "fetch" });
    getRecentSessions(limit)
      .then((data) => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, limit]);

  return { sessions: state.sessions, isLoading: state.isLoading, refetch };
}

// --- useUnlockedBadges ---

interface UseUnlockedBadgesResult {
  unlocked: UnlockedBadge[];
  earned: BadgeDefinition[];
  locked: BadgeDefinition[];
  isLoading: boolean;
  refetch: () => void;
}

type BadgesState = { unlocked: UnlockedBadge[]; isLoading: boolean };
type BadgesAction =
  | { type: "fetch" }
  | { type: "success"; data: UnlockedBadge[] }
  | { type: "error" };

function badgesReducer(state: BadgesState, action: BadgesAction): BadgesState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true };
    case "success":
      return { unlocked: action.data, isLoading: false };
    case "error":
      return { ...state, isLoading: false };
  }
}

export function useUnlockedBadges(): UseUnlockedBadgesResult {
  const [state, dispatch] = useReducer(badgesReducer, { unlocked: [], isLoading: true });
  const [fetchKey, setFetchKey] = useState(0);
  // Cf. useMultiplicationProgress : isLoading réservé au chargement initial.
  const hasLoadedRef = useRef(false);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!hasLoadedRef.current) dispatch({ type: "fetch" });
    getUnlockedBadges()
      .then((data) => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "success", data });
      })
      .catch(() => {
        if (cancelled) return;
        hasLoadedRef.current = true;
        dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const { earned, locked } = useMemo(() => {
    const ids = new Set(state.unlocked.map((entry) => entry.id));
    const earnedList: BadgeDefinition[] = [];
    const lockedList: BadgeDefinition[] = [];
    for (const badge of BADGES) {
      (ids.has(badge.id) ? earnedList : lockedList).push(badge);
    }
    return { earned: earnedList, locked: lockedList };
  }, [state.unlocked]);

  return { unlocked: state.unlocked, earned, locked, isLoading: state.isLoading, refetch };
}

// --- useMultiplicationMutations ---

interface UseMultiplicationMutationsResult {
  recordSession: (summary: SessionSummary) => Promise<RecordSessionResult>;
}

export function useMultiplicationMutations(): UseMultiplicationMutationsResult {
  const recordSession = useCallback(
    (summary: SessionSummary) => recordSessionOp(summary),
    [],
  );

  return { recordSession };
}

// --- useSettings ---

const DEFAULT_SETTINGS: AppSettings = {
  id: "app",
  soundEnabled: true,
  lastSessionConfig: null,
};

interface UseSettingsResult {
  settings: AppSettings;
  isLoading: boolean;
  setSoundEnabled: (value: boolean) => Promise<void>;
  setLastSessionConfig: (config: MultiplicationSessionConfig | null) => Promise<void>;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((data) => {
        if (!cancelled) {
          setSettings(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setSoundEnabled = useCallback(async (value: boolean) => {
    setSettings((prev) => ({ ...prev, soundEnabled: value }));
    await putSettings({ soundEnabled: value });
  }, []);

  const setLastSessionConfig = useCallback(
    async (config: MultiplicationSessionConfig | null) => {
      setSettings((prev) => ({ ...prev, lastSessionConfig: config }));
      await putSettings({ lastSessionConfig: config });
    },
    [],
  );

  return { settings, isLoading, setSoundEnabled, setLastSessionConfig };
}

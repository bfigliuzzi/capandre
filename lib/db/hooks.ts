"use client";

import { useState, useEffect, useCallback, useReducer } from "react";
import { getDB } from "./database";
import { getAll, getAllByIndex, getById, create, update, remove } from "./operations";
import type { Module, Level, Dictation, Poem } from "./schema";

// --- useDB ---

interface UseDBResult {
  isReady: boolean;
  error: Error | null;
}

export function useDB(): UseDBResult {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    getDB()
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { isReady, error };
}

// --- useModules ---

interface UseModulesResult {
  modules: Module[];
  isLoading: boolean;
}

export function useModules(): UseModulesResult {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAll("modules")
      .then((data) => {
        if (!cancelled) {
          setModules(data);
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

  return { modules, isLoading };
}

// --- useLevels ---

interface UseLevelsResult {
  levels: Level[];
  isLoading: boolean;
}

export function useLevels(moduleId: string): UseLevelsResult {
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAllByIndex("levels", "by-module", moduleId)
      .then((data) => {
        if (!cancelled) {
          setLevels(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [moduleId]);

  return { levels, isLoading };
}

// --- useDictations ---

interface UseDictationsResult {
  dictations: Dictation[];
  isLoading: boolean;
  refetch: () => void;
}

type DictationsState = { dictations: Dictation[]; isLoading: boolean };
type DictationsAction =
  | { type: "fetch" }
  | { type: "success"; data: Dictation[] }
  | { type: "error" };

function dictationsReducer(state: DictationsState, action: DictationsAction): DictationsState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true };
    case "success":
      return { dictations: action.data, isLoading: false };
    case "error":
      return { ...state, isLoading: false };
  }
}

export function useDictations(moduleId = "mod-dictation"): UseDictationsResult {
  const [state, dispatch] = useReducer(dictationsReducer, {
    dictations: [],
    isLoading: true,
  });
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "fetch" });
    getAllByIndex("dictations", "by-module", moduleId)
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", data });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, moduleId]);

  return { dictations: state.dictations, isLoading: state.isLoading, refetch };
}

// --- usePoems ---

interface UsePoemsResult {
  poems: Poem[];
  isLoading: boolean;
  refetch: () => void;
}

type PoemsState = { poems: Poem[]; isLoading: boolean };
type PoemsAction =
  | { type: "fetch" }
  | { type: "success"; data: Poem[] }
  | { type: "error" };

function poemsReducer(state: PoemsState, action: PoemsAction): PoemsState {
  switch (action.type) {
    case "fetch":
      return { ...state, isLoading: true };
    case "success":
      return { poems: action.data, isLoading: false };
    case "error":
      return { ...state, isLoading: false };
  }
}

export function usePoems(moduleId = "mod-poem"): UsePoemsResult {
  const [state, dispatch] = useReducer(poemsReducer, {
    poems: [],
    isLoading: true,
  });
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: "fetch" });
    getAllByIndex("poems", "by-module", moduleId)
      .then((data) => {
        if (!cancelled) dispatch({ type: "success", data });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchKey, moduleId]);

  return { poems: state.poems, isLoading: state.isLoading, refetch };
}

// --- useHasContent ---

interface UseHasContentResult {
  hasContent: boolean;
  isLoading: boolean;
}

export function useHasContent(): UseHasContentResult {
  const [hasContent, setHasContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const db = await getDB();
        const [dictationCount, poemCount] = await Promise.all([
          db.count("dictations"),
          db.count("poems"),
        ]);
        if (!cancelled) {
          setHasContent(dictationCount > 0 || poemCount > 0);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) setIsLoading(false);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return { hasContent, isLoading };
}

// --- useDictation (single item) ---

interface UseDictationResult {
  dictation: Dictation | undefined;
  isLoading: boolean;
}

export function useDictation(id: string): UseDictationResult {
  const [dictation, setDictation] = useState<Dictation | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getById("dictations", id)
      .then((data) => {
        if (!cancelled) {
          setDictation(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { dictation, isLoading };
}

// --- usePoem (single item) ---

interface UsePoemResult {
  poem: Poem | undefined;
  isLoading: boolean;
}

export function usePoem(id: string): UsePoemResult {
  const [poem, setPoem] = useState<Poem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getById("poems", id)
      .then((data) => {
        if (!cancelled) {
          setPoem(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { poem, isLoading };
}

// --- useDictationMutations ---

export function useDictationMutations() {
  const createDictation = useCallback(
    (data: Omit<Dictation, "id">) => create("dictations", { ...data, id: crypto.randomUUID() } as Dictation),
    []
  );

  const updateDictation = useCallback(
    (id: string, data: Partial<Dictation>) => update("dictations", id, data),
    []
  );

  const deleteDictation = useCallback(
    (id: string) => remove("dictations", id),
    []
  );

  return { createDictation, updateDictation, deleteDictation };
}

// --- usePoemMutations ---

export function usePoemMutations() {
  const createPoem = useCallback(
    (data: Omit<Poem, "id">) => create("poems", { ...data, id: crypto.randomUUID() } as Poem),
    []
  );

  const updatePoem = useCallback(
    (id: string, data: Partial<Poem>) => update("poems", id, data),
    []
  );

  const deletePoem = useCallback(
    (id: string) => remove("poems", id),
    []
  );

  return { createPoem, updatePoem, deletePoem };
}

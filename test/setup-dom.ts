// Setup des tests d'écran (`*.test.tsx`, environnement jsdom).
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, vi } from "vitest";
import { closeDB } from "@/lib/db/database";
import { resetMatchMedia } from "./match-media";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetMatchMedia();
});

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await closeDB();
});

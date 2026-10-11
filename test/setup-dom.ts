// Setup des tests d'écran (`*.test.tsx`, environnement jsdom).
import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach } from "vitest";
import { resetMatchMedia } from "./match-media";

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetMatchMedia();
});

afterEach(() => {
  cleanup();
});

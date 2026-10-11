// Point d'entrée unique des tests d'écran : rend un écran avec les providers de l'app.
import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { vi } from "vitest";
import { HeaderProvider } from "@/components/layout/header-context";
import { FIXTURE_DICTIONARY } from "@/lib/dictionnaire/__tests__/fixtures";
import { getDB } from "@/lib/db/database";
import { installDictionary } from "@/lib/db/dictionary-operations";

export interface RenderAppResult extends RenderResult {
  readonly user: UserEvent;
}

export function renderApp(screen: ReactElement): RenderAppResult {
  const user = userEvent.setup();
  return { user, ...render(<HeaderProvider>{screen}</HeaderProvider>) };
}

/** Base en mémoire déjà remplie avec le dictionnaire de test : aucun téléchargement. */
export async function seedDictionary(): Promise<void> {
  await installDictionary(await getDB(), FIXTURE_DICTIONARY);
}

/** Simule le serveur qui sert le fichier du dictionnaire ; renvoie l'espion de `fetch`. */
export function serveDictionary(body: unknown = FIXTURE_DICTIONARY) {
  const fetchSpy = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

/** Simule l'absence de réseau. */
export function offline() {
  const fetchSpy = vi.fn(async () => {
    throw new TypeError("Failed to fetch");
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

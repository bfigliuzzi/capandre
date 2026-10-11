// Point d'entrée unique des tests d'écran : rend un écran avec les providers de l'app.
import type { ReactElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { HeaderProvider } from "@/components/layout/header-context";

export interface RenderAppResult extends RenderResult {
  readonly user: UserEvent;
}

export function renderApp(screen: ReactElement): RenderAppResult {
  const user = userEvent.setup();
  return { user, ...render(<HeaderProvider>{screen}</HeaderProvider>) };
}

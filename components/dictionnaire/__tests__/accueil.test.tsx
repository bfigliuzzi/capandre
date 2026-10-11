import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import HomePage from "@/app/(app)/page";
import { AppShell } from "@/components/layout/app-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
// `ViewTransition` n'existe que dans le React embarqué par Next, pas dans celui de vitest.
vi.mock("@/components/page-transition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("le module sur l'accueil et dans le menu (R34)", () => {
  it("affiche une carte Dictionnaire sur l'accueil et une entrée dans le menu", () => {
    render(
      <AppShell>
        <HomePage />
      </AppShell>,
    );

    expect(screen.getByRole("link", { name: /^Dictionnaire Apprends à chercher un mot/ })).toHaveAttribute("href", "/dictionnaire");
    const menu = screen.getByRole("navigation", { name: "Navigation principale" });
    expect(within(menu).getByRole("link", { name: "Dictionnaire" })).toHaveAttribute("href", "/dictionnaire");
  });
});

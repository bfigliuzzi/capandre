import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DictionaryReader } from "@/components/dictionnaire/dictionary-book";
import { FIXTURE_DICTIONARY } from "@/lib/dictionnaire/__tests__/fixtures";
import { simulateMediaQueries } from "@/test/match-media";
import { renderApp } from "@/test/render-app";

function openBook() {
  return renderApp(<DictionaryReader dictionary={FIXTURE_DICTIONARY} />);
}

function shownPage() {
  return screen.getByRole("region", { name: /^Page \d+/ });
}

describe("le dictionnaire", () => {
  it("s'ouvre sur sa couverture : titre, nombre de pages, sources (R1)", () => {
    openBook();

    const cover = screen.getByRole("region", { name: "Couverture du dictionnaire" });
    expect(within(cover).getByText("9 pages")).toBeInTheDocument();
    expect(within(cover).getByText(/Dico des Ados/)).toBeInTheDocument();
    expect(within(cover).getByText(/Wiktionnaire/)).toBeInTheDocument();
  });

  it("tourne les pages au bouton et aux flèches du clavier, et l'annonce (R8)", async () => {
    const { user } = openBook();

    await user.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(shownPage()).toHaveAccessibleName("Page 1, de abeille à ballon");

    await user.keyboard("{ArrowRight}");
    expect(shownPage()).toHaveAccessibleName("Page 2, de banane à chat");
    expect(screen.getByRole("status")).toHaveTextContent("Page 2 sur 9, de banane à chat");
    expect(document.title).toBe("Page 2 — Dictionnaire — Capandre");

    await user.click(screen.getByRole("button", { name: "Page précédente" }));
    expect(shownPage()).toHaveAccessibleName("Page 1, de abeille à ballon");
  });

  it("ouvre la première page d'une lettre avec son onglet ; une lettre sans article est désactivée (R6)", async () => {
    const { user } = openBook();
    const letters = screen.getByRole("navigation", { name: "Lettres" });

    await user.click(within(letters).getByRole("button", { name: "Lettre M" }));
    expect(shownPage()).toHaveAccessibleName("Page 5, de grand à manger");
    expect(within(letters).getByRole("button", { name: "Lettre K" })).toHaveAttribute("aria-disabled", "true");
  });

  it("va à la page demandée, et refuse un numéro hors bornes sans changer de page (R7)", async () => {
    const { user } = openBook();
    const field = screen.getByLabelText("Aller à la page");

    await user.type(field, "8");
    await user.click(screen.getByRole("button", { name: "Aller" }));
    expect(shownPage()).toHaveAccessibleName("Page 8, de rapide à table");

    await user.clear(field);
    await user.type(field, "12");
    await user.click(screen.getByRole("button", { name: "Aller" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Choisis une page entre 1 et 9.");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(shownPage()).toHaveAccessibleName("Page 8, de rapide à table");
  });

  it("affiche un article complet : mot d'entrée, nature et genre abrégés, sens, exemples, synonymes (R12)", async () => {
    const { user } = openBook();
    await user.type(screen.getByLabelText("Aller à la page"), "8");
    await user.click(screen.getByRole("button", { name: "Aller" }));

    const renard = screen.getByRole("article", { name: "renard" });
    expect(within(renard).getByRole("heading", { level: 3, name: "renard" })).toBeInTheDocument();
    expect(within(renard).getByText("n. m.")).toBeInTheDocument();
    expect(within(renard).getByText("nom masculin")).toHaveClass("sr-only");
    const senses = within(renard).getAllByRole("listitem");
    expect(senses).toHaveLength(2);
    expect(within(senses[1]).getByText("personne rusée")).toBeInTheDocument();
    expect(within(senses[0]).getByText("Le renard guette les poules.").tagName).toBe("EM");
    expect(within(renard).getByText(/goupil/)).toBeInTheDocument();
    expect(renard).not.toHaveTextContent("Un renard a traversé la route");
  });

  it("anime la page tournée, sauf si l'appareil demande moins d'animations (R9)", async () => {
    const first = openBook();
    await first.user.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(shownPage()).toHaveClass("dico-page-turn");
    first.unmount();

    simulateMediaQueries(["(prefers-reduced-motion: reduce)"]);
    const second = openBook();
    await second.user.click(screen.getByRole("button", { name: "Page suivante" }));
    expect(shownPage()).not.toHaveClass("dico-page-turn");
  });

  it("garde les mêmes pages quand deux pages se font face (R5, R10)", async () => {
    simulateMediaQueries(["(min-width: 64rem) and (orientation: landscape)"]);
    const { user } = openBook();

    await user.type(screen.getByLabelText("Aller à la page"), "3");
    await user.click(screen.getByRole("button", { name: "Aller" }));
    const pages = screen.getAllByRole("region", { name: /^Page \d+/ });
    expect(pages.map((p) => within(p).getByRole("heading", { level: 2 }).textContent)).toEqual([
      "Page 2, de banane à chat",
      "Page 3, de chaton à dormir",
    ]);
  });
});

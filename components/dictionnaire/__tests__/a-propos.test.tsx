import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DictionaryAbout } from "@/components/dictionnaire/dictionary-about";
import { renderApp } from "@/test/render-app";

describe("à propos (R33)", () => {
  it("cite les sources et la licence des données", () => {
    renderApp(<DictionaryAbout />);

    expect(screen.getByRole("link", { name: "Le Dico des Ados" })).toHaveAttribute("href", "https://fr.dicoado.org");
    expect(screen.getByRole("link", { name: "Wiktionnaire" })).toHaveAttribute("href", "https://fr.wiktionary.org");
    expect(screen.getByText(/Manulex/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /CC BY-SA 4\.0/ })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/deed.fr",
    );
  });
});

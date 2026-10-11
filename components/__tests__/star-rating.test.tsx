import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StarRating } from "@/components/star-rating";
import { renderApp } from "@/test/render-app";

describe("StarRating", () => {
  it("donne son nom accessible en français", () => {
    renderApp(<StarRating value={2} label="2 étoiles sur 3" />);

    expect(screen.getByRole("img", { name: "2 étoiles sur 3" })).toBeInTheDocument();
  });

  it("rend autant d'étoiles que le maximum, pleines ou vides", () => {
    renderApp(<StarRating value={1} max={3} label="1 étoile sur 3" />);

    const stars = screen.getByRole("img").querySelectorAll("svg");
    expect(stars).toHaveLength(3);
  });
});

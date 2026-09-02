import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import {
  COMPARISON_HUB_PATH,
  comparisonPath,
  comparisons,
} from "@/content/comparisons";
import Footer from "./Footer";

afterEach(cleanup);

describe("Footer", () => {
  it("links to the comparison hub and every competitor page", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("link", { name: "Compare all tools" }).getAttribute("href")
    ).toBe(COMPARISON_HUB_PATH);

    for (const comparison of comparisons) {
      expect(
        screen
          .getByRole("link", {
            name: `YT Playlist Report vs ${comparison.competitorName}`,
          })
          .getAttribute("href")
      ).toBe(comparisonPath(comparison));
    }
  });
});

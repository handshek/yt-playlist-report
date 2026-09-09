import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import {
  COMPARISON_HUB_PATH,
  comparisonPath,
  comparisons,
} from "@/content/comparisons";
import Compare from "./Compare";
import CompareIndex from "./CompareIndex";
import { trackSeoEvent } from "@/lib/seo-events";

vi.mock("@/lib/seo-events", () => ({
  isSeoContentSlug: (slug: string) =>
    slug === "yt-playlist-report-vs-ytpla",
  trackSeoEvent: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("comparison pages", () => {
  it("presents all five alternatives and recommends YT Playlist Report on the hub", async () => {
    const router = createMemoryRouter(
      [{ path: "/compare", element: <CompareIndex /> }],
      { initialEntries: [COMPARISON_HUB_PATH] }
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /best youtube playlist analyzers/i,
      })
    ).toBeTruthy();
    expect(screen.getAllByRole("article")).toHaveLength(5);
    expect(screen.getByText(/our recommendation: yt playlist report/i)).toBeTruthy();
  });

  it("renders a complete, accessible competitor comparison", async () => {
    const comparison = comparisons[0];
    const router = createMemoryRouter(
      [{ path: "/compare/:comparisonSlug", element: <Compare /> }],
      { initialEntries: [comparisonPath(comparison)] }
    );

    const { container } = render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /yt playlist report vs ytpla/i,
      })
    ).toBeTruthy();
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByLabelText("Breadcrumb")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /honest drawbacks/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /frequently asked questions/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /sources and methodology/i })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /analyze a playlist free/i })).toHaveLength(2);
    expect(screen.getAllByTestId("related-comparison")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Comparisons" }).getAttribute("href")
    ).toBe(COMPARISON_HUB_PATH);
    expect(
      screen
        .getAllByTestId("related-comparison")
        .every((link) => link.getAttribute("href")?.endsWith("/"))
    ).toBe(true);
  });

  it("attributes a comparison CTA using only its known content slug", async () => {
    const comparison = comparisons[0];
    const router = createMemoryRouter(
      [
        { path: "/", element: <div>Home</div> },
        { path: "/compare/:comparisonSlug", element: <Compare /> },
      ],
      { initialEntries: [comparisonPath(comparison)] }
    );

    render(<RouterProvider router={router} />);

    const ctas = await screen.findAllByRole("link", {
      name: /analyze a playlist free/i,
    });
    fireEvent.click(ctas[0]);

    expect(trackSeoEvent).toHaveBeenCalledWith({
      name: "content_cta_click",
      slug: comparison.slug,
    });
    expect(trackSeoEvent).toHaveBeenCalledTimes(1);
  });

  it("returns a normal not-found response for an unknown comparison", async () => {
    const router = createMemoryRouter(
      [{ path: "/compare/:comparisonSlug", element: <Compare /> }],
      { initialEntries: ["/compare/not-a-real-tool"] }
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("heading", { name: /comparison not found/i })).toBeTruthy();
  });
});

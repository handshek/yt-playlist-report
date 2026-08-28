import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import Compare from "./Compare";
import CompareIndex from "./CompareIndex";

afterEach(cleanup);

describe("comparison pages", () => {
  it("presents all five alternatives and recommends YT Playlist Report on the hub", async () => {
    const router = createMemoryRouter(
      [{ path: "/compare", element: <CompareIndex /> }],
      { initialEntries: ["/compare"] }
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
    const router = createMemoryRouter(
      [{ path: "/compare/:comparisonSlug", element: <Compare /> }],
      { initialEntries: ["/compare/yt-playlist-report-vs-ytpla"] }
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

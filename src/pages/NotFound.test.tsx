import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ErrorBoundary } from "@/root";
import NotFound, { getNotFoundMeta } from "./NotFound";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("not-found handling", () => {
  it("renders the branded page for an unmatched route", async () => {
    const router = createMemoryRouter(
      [{ path: "*", element: <NotFound /> }],
      { initialEntries: ["/definitely-not-a-route"] }
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Page not found" })
    ).toBeTruthy();
    expect(
      screen.getByRole("link", {
        name: /browse playlist tool comparisons/i,
      })
    ).toBeTruthy();
  });

  it("uses the branded page when a route throws a 404 response", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/missing-data",
          loader: () => {
            throw new Response("Not Found", { status: 404 });
          },
          element: <div>Never rendered</div>,
          errorElement: <ErrorBoundary />,
          hydrateFallbackElement: <div>Loading test route</div>,
        },
      ],
      { initialEntries: ["/missing-data"] }
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", { name: "Page not found" })
    ).toBeTruthy();
  });

  it("marks the catch-all page as noindex", () => {
    const descriptors = getNotFoundMeta();

    expect(descriptors).toContainEqual({
      name: "robots",
      content: "noindex, follow",
    });
  });
});

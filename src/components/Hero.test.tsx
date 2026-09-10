import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it } from "vitest";
import Hero from "./Hero";

const renderHero = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <QueryClientProvider client={queryClient}>
            <Hero />
          </QueryClientProvider>
        ),
      },
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />);
};

describe("Hero", () => {
  it("renders stable copy and prioritizes a responsive demo image", async () => {
    const { container } = renderHero();

    expect(
      await screen.findByText(
        "See total duration, adjust playback speed, and explore every video."
      )
    ).toBeTruthy();

    const image = screen.getByRole("img", {
      name: /yt playlist report showing playlist duration, statistics, and video details/i,
    });

    expect(image.getAttribute("width")).toBe("1920");
    expect(image.getAttribute("height")).toBe("1080");
    expect(image.getAttribute("fetchpriority")).toBe("high");
    expect(image.getAttribute("decoding")).toBe("async");
    expect(image.getAttribute("loading")).toBeNull();

    const sources = [...container.querySelectorAll("picture source")];
    expect(sources.map((source) => source.getAttribute("type"))).toEqual([
      "image/avif",
      "image/webp",
    ]);
    expect(sources.every((source) => source.getAttribute("srcset")?.includes("640w"))).toBe(true);
    expect(sources.every((source) => source.getAttribute("srcset")?.includes("1920w"))).toBe(true);
    expect(sources.map((source) => source.getAttribute("sizes"))).toEqual([
      "(min-width: 1280px) 1024px, (min-width: 1024px) calc(100vw - 14rem), (min-width: 768px) calc(100vw - 8rem), calc(100vw - 4rem)",
      "(min-width: 1280px) 1024px, (min-width: 1024px) calc(100vw - 14rem), (min-width: 768px) calc(100vw - 8rem), calc(100vw - 4rem)",
    ]);
  });
});

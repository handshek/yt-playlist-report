import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HydrateFallback, links } from "./root";

describe("root route", () => {
  it("does not connect to third-party font hosts during startup", () => {
    const hrefs = links().map((link) =>
      "href" in link && typeof link.href === "string" ? link.href : ""
    );

    expect(hrefs.some((href) => href.includes("fonts.googleapis.com"))).toBe(false);
    expect(hrefs.some((href) => href.includes("fonts.gstatic.com"))).toBe(false);
  });

  it("provides the SPA document with a hydration fallback", () => {
    render(<HydrateFallback />);

    expect(screen.getByText("Loading YT Playlist Report…")).toBeTruthy();
  });
});

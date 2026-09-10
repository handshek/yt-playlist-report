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

  it("declares crawlable favicon sizes with an ICO fallback", () => {
    expect(links()).toEqual(
      expect.arrayContaining([
        { rel: "icon", href: "/favicon-48.png", type: "image/png", sizes: "48x48" },
        { rel: "icon", href: "/favicon-96.png", type: "image/png", sizes: "96x96" },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ])
    );
  });

  it("provides the SPA document with a hydration fallback", () => {
    render(<HydrateFallback />);

    expect(screen.getByText("Loading YT Playlist Report…")).toBeTruthy();
  });
});

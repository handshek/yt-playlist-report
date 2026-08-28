import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HydrateFallback } from "./root";

describe("root route", () => {
  it("provides the SPA document with a hydration fallback", () => {
    render(<HydrateFallback />);

    expect(screen.getByText("Loading YT Playlist Report…")).toBeTruthy();
  });
});

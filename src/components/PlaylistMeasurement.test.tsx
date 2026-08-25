import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { trackPageview } from "@/lib/counterscale";
import PlaylistMeasurement from "./PlaylistMeasurement";

vi.mock("@/lib/counterscale", () => ({
  trackPageview: vi.fn(),
}));

describe("PlaylistMeasurement", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("records the exact playlist ID once for a completed report", () => {
    const { rerender } = render(
      <StrictMode>
        <PlaylistMeasurement playlistId="PLabc_123-xyz" />
      </StrictMode>
    );

    rerender(
      <StrictMode>
        <PlaylistMeasurement playlistId="PLabc_123-xyz" />
      </StrictMode>
    );

    expect(trackPageview).toHaveBeenCalledTimes(1);
    expect(trackPageview).toHaveBeenCalledWith("/playlist/PLabc_123-xyz");
  });
});

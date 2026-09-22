import * as Counterscale from "@counterscale/tracker";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackPageview } from "./counterscale";

vi.mock("@counterscale/tracker", () => ({
  init: vi.fn(),
  isInitialized: vi.fn(),
  trackPageview: vi.fn(),
}));

describe("trackPageview", () => {
  beforeEach(() => {
    vi.stubEnv(
      "VITE_COUNTERSCALE_REPORTER_URL",
      "https://ytpr-data.example.workers.dev/collect"
    );
    vi.stubEnv("VITE_COUNTERSCALE_SITE_ID", "ytpr-production");
    vi.mocked(Counterscale.isInitialized).mockReturnValue(true);
  });

  afterEach(() => {
    window.history.replaceState({}, "", "/");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "",
    });
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("prevents the tracker from deriving a referrer from user-controlled query values", () => {
    window.history.replaceState(
      {},
      "",
      "/playlist/PLprivate_123?source=PLprivate_123&referrer=https%3A%2F%2Fprivate.example"
    );

    trackPageview("/events/report-success");

    expect(Counterscale.trackPageview).toHaveBeenCalledWith({
      url: "/events/report-success",
      referrer: window.location.origin,
    });
    expect(
      JSON.stringify(vi.mocked(Counterscale.trackPageview).mock.calls)
    ).not.toContain("PLprivate_123");
    expect(
      JSON.stringify(vi.mocked(Counterscale.trackPageview).mock.calls)
    ).not.toContain("private.example");
  });

  it("keeps only the origin of a legitimate external referrer", () => {
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.google.com/search?q=private-query",
    });

    trackPageview("/");

    expect(Counterscale.trackPageview).toHaveBeenCalledWith({
      url: "/",
      referrer: "https://www.google.com",
    });
    expect(
      JSON.stringify(vi.mocked(Counterscale.trackPageview).mock.calls)
    ).not.toContain("private-query");
  });
});

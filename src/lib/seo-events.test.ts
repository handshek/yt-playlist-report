import { afterEach, describe, expect, it, vi } from "vitest";
import { trackPageview } from "./counterscale";
import { trackSeoEvent } from "./seo-events";

vi.mock("./counterscale", () => ({
  trackPageview: vi.fn(),
}));

describe("trackSeoEvent", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("maps the fixed report funnel to reserved, privacy-safe paths", () => {
    trackSeoEvent({ name: "report_submit" });
    trackSeoEvent({ name: "report_success" });
    trackSeoEvent({ name: "report_error", reason: "invalid_url" });
    trackSeoEvent({ name: "report_error", reason: "fetch_failed" });

    expect(vi.mocked(trackPageview).mock.calls).toEqual([
      ["/events/report-submit"],
      ["/events/report-success"],
      ["/events/report-error/invalid-url"],
      ["/events/report-error/fetch-failed"],
    ]);
  });

  it("accepts only known content slugs at runtime", () => {
    trackSeoEvent({
      name: "content_cta_click",
      slug: "yt-playlist-report-vs-ytpla",
    });
    trackSeoEvent({
      name: "content_cta_click",
      slug: "user-supplied-playlist-url" as never,
    });

    expect(trackPageview).toHaveBeenCalledTimes(1);
    expect(trackPageview).toHaveBeenCalledWith(
      "/events/content-cta/yt-playlist-report-vs-ytpla"
    );
  });
});

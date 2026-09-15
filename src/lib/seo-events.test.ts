import { afterEach, describe, expect, it, vi } from "vitest";
import { trackPageview } from "./counterscale";
import {
  captureAcquisitionSource,
  trackSeoEvent,
} from "./seo-events";

vi.mock("./counterscale", () => ({
  trackPageview: vi.fn(),
}));

describe("trackSeoEvent", () => {
  afterEach(() => {
    window.sessionStorage.clear();
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

  it("records only allowlisted campaign sources for the current session", () => {
    captureAcquisitionSource("?utm_source=producthunt&utm_campaign=launch");
    captureAcquisitionSource("?utm_source=user-supplied-value");
    trackSeoEvent({ name: "report_success" });

    expect(trackPageview).toHaveBeenCalledWith(
      "/events/report-success/source/producthunt"
    );
  });

  it("maps feedback categories to fixed event paths without form text", () => {
    captureAcquisitionSource("?utm_source=alternativeto");
    trackSeoEvent({ name: "feedback_open" });
    trackSeoEvent({ name: "offer_view" });
    trackSeoEvent({
      name: "feedback_submit",
      sentiment: "yes",
      useCase: "study-course",
      helpful: ["duration-speed", "search-sort"],
      missing: ["schedule-calendar"],
    });
    trackSeoEvent({ name: "offer_response", response: "maybe" });

    expect(vi.mocked(trackPageview).mock.calls).toEqual([
      ["/events/feedback-open/source/alternativeto"],
      ["/events/offer-view/source/alternativeto"],
      ["/events/feedback-submit/yes/source/alternativeto"],
      ["/events/feedback-use-case/study-course/source/alternativeto"],
      ["/events/feedback-helpful/duration-speed/source/alternativeto"],
      ["/events/feedback-helpful/search-sort/source/alternativeto"],
      ["/events/feedback-missing/schedule-calendar/source/alternativeto"],
      ["/events/offer-response/maybe/source/alternativeto"],
    ]);
  });

  it("drops unknown feedback values at runtime", () => {
    trackSeoEvent({
      name: "feedback_submit",
      sentiment: "yes",
      useCase: "playlist-url" as never,
      helpful: ["duration-speed", "private value" as never],
      missing: ["schedule-calendar"],
    });

    expect(vi.mocked(trackPageview).mock.calls).toEqual([
      ["/events/feedback-submit/yes"],
      ["/events/feedback-helpful/duration-speed"],
      ["/events/feedback-missing/schedule-calendar"],
    ]);
  });

  it("deduplicates the same analytics path for the browser session", () => {
    trackSeoEvent({ name: "report_success" });
    trackSeoEvent({ name: "report_success" });
    trackSeoEvent({ name: "offer_view" });
    trackSeoEvent({ name: "offer_view" });

    expect(vi.mocked(trackPageview).mock.calls).toEqual([
      ["/events/report-success"],
      ["/events/offer-view"],
    ]);
  });
});

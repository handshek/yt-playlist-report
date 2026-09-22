import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { submitFeedback } from "@/lib/feedback";
import { trackSeoEvent } from "@/lib/seo-events";
import FeedbackFormDefinition from "./FeedbackFormDefinition";
import ReportFeedback from "./ReportFeedback";

vi.mock("@/lib/feedback", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/feedback")>()),
  submitFeedback: vi.fn(),
}));

vi.mock("@/lib/seo-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/seo-events")>()),
  trackSeoEvent: vi.fn(),
}));

describe("ReportFeedback", () => {
  afterEach(() => {
    cleanup();
    window.sessionStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders the static Netlify form definition without personal fields", () => {
    const { container } = render(<FeedbackFormDefinition />);
    const form = container.querySelector('form[name="ytpr-feedback"]');
    const fieldNames = [...container.querySelectorAll("input, textarea")].map(
      (field) => field.getAttribute("name")
    );

    expect(form?.getAttribute("data-netlify")).toBe("true");
    expect(form?.getAttribute("data-netlify-honeypot")).toBe("bot-field");
    expect(fieldNames).toEqual([
      "form-name",
      "bot-field",
      "sentiment",
      "use-case",
      "helpful",
      "missing",
      "offer-response",
      "comment",
      "source",
    ]);
    expect(fieldNames).not.toContain("email");
    expect(fieldNames).not.toContain("playlist-id");
  });

  it("opens a non-blocking accessible dialog from a yes or no answer", () => {
    render(<ReportFeedback />);

    expect(screen.getByText("Was this report useful?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Yes, this was useful" }));

    expect(screen.getByRole("dialog", { name: "Help shape what comes next" })).toBeTruthy();
    expect(trackSeoEvent).toHaveBeenCalledTimes(1);
    expect(trackSeoEvent).toHaveBeenCalledWith({ name: "feedback_open" });
    expect(trackSeoEvent).not.toHaveBeenCalledWith({ name: "offer_view" });
  });

  it("counts an offer view only after at least half the offer is visible", () => {
    let observerCallback: IntersectionObserverCallback = () => undefined;
    const disconnect = vi.fn();
    const observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback;
        }
        observe = observe;
        disconnect = disconnect;
        unobserve = vi.fn();
        takeRecords = () => [];
        root = null;
        rootMargin = "0px";
        thresholds = [0.5];
      }
    );
    render(<ReportFeedback />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, this was useful" }));
    expect(trackSeoEvent).not.toHaveBeenCalledWith({ name: "offer_view" });

    observerCallback(
      [{ isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );

    expect(trackSeoEvent).toHaveBeenCalledWith({ name: "offer_view" });
    expect(disconnect).toHaveBeenCalled();
  });

  it("submits selected chips and the price response without a playlist identifier", async () => {
    vi.mocked(submitFeedback).mockResolvedValue();
    render(<ReportFeedback />);

    fireEvent.click(screen.getByRole("button", { name: "Yes, this was useful" }));
    fireEvent.click(screen.getByRole("button", { name: "Study or course" }));
    fireEvent.click(screen.getByRole("button", { name: "Duration and playback speed" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule or calendar" }));
    fireEvent.click(screen.getByRole("button", { name: "Maybe, I might pay $7.99" }));
    fireEvent.change(screen.getByLabelText("Anything else? (optional)"), {
      target: { value: "A weekly study plan would help." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));
    const submission = vi.mocked(submitFeedback).mock.calls[0][0];
    expect(submission).toMatchObject({
      sentiment: "yes",
      useCase: "study-course",
      helpful: ["duration-speed"],
      missing: ["schedule-calendar"],
      offerResponse: "maybe",
      comment: "A weekly study plan would help.",
    });
    expect(JSON.stringify(submission)).not.toContain("playlist");
    expect(trackSeoEvent).toHaveBeenCalledWith({
      name: "feedback_submit",
      sentiment: "yes",
      useCase: "study-course",
      helpful: ["duration-speed"],
      missing: ["schedule-calendar"],
    });
    expect(trackSeoEvent).toHaveBeenCalledWith({
      name: "offer_response",
      response: "maybe",
    });
    expect(await screen.findByText("Thanks — that helps shape YTPR.")).toBeTruthy();
  });

  it("does not submit twice during the same browser session", () => {
    window.sessionStorage.setItem("ytpr:feedback-submitted", "true");
    render(<ReportFeedback />);

    expect(screen.getByText("Thanks — that helps shape YTPR.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Yes, this was useful" })).toBeNull();
  });
});

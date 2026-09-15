import { afterEach, describe, expect, it, vi } from "vitest";
import { submitFeedback } from "./feedback";

describe("feedback submission", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts only fixed responses, optional text, and an allowlisted source", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 })
    );

    await submitFeedback({
      sentiment: "yes",
      useCase: "study-course",
      helpful: ["duration-speed", "search-sort"],
      missing: ["schedule-calendar"],
      offerResponse: "maybe",
      comment: "A calendar export would help.",
      source: "producthunt",
      honeypot: "",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/feedback");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      sentiment: "yes",
      useCase: "study-course",
      helpful: ["duration-speed", "search-sort"],
      missing: ["schedule-calendar"],
      offerResponse: "maybe",
      comment: "A calendar export would help.",
      source: "producthunt",
      honeypot: "",
    });
    expect(String(options?.body)).not.toContain("playlist");
  });

  it("rejects oversized text before making a request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(
      submitFeedback({
        sentiment: "no",
        useCase: "other",
        helpful: [],
        missing: [],
        offerResponse: "no",
        comment: "x".repeat(501),
        source: null,
        honeypot: "",
      })
    ).rejects.toThrow("invalid_feedback");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

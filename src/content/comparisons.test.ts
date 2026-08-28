import { describe, expect, it } from "vitest";
import { comparisons } from "./comparisons";

describe("comparison content", () => {
  it("defines five complete, uniquely addressable comparisons", () => {
    expect(comparisons).toHaveLength(5);
    expect(new Set(comparisons.map(({ slug }) => slug)).size).toBe(5);
    expect(new Set(comparisons.map(({ seo }) => seo.title)).size).toBe(5);
    expect(new Set(comparisons.map(({ seo }) => seo.description)).size).toBe(5);

    for (const comparison of comparisons) {
      expect(comparison.lastReviewed).toBe("August 27, 2026");
      expect(comparison.summary.length).toBeGreaterThan(120);
      expect(comparison.featureRows.length).toBeGreaterThanOrEqual(6);
      expect(comparison.strengths.length).toBeGreaterThanOrEqual(3);
      expect(comparison.concessions.length).toBeGreaterThanOrEqual(1);
      expect(comparison.faqs.length).toBeGreaterThanOrEqual(3);
      expect(comparison.sources.length).toBeGreaterThanOrEqual(1);
      expect(comparison.seo.description.length).toBeGreaterThanOrEqual(140);
      expect(comparison.seo.description.length).toBeLessThanOrEqual(160);
    }
  });
});

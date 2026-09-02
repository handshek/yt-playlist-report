import { describe, expect, it } from "vitest";
import {
  COMPARISON_HUB_PATH,
  comparisonPath,
  comparisons,
} from "@/content/comparisons";
import { SITE_URL } from "@/lib/site";
import { getCompareMeta } from "./Compare";
import { getCompareIndexMeta } from "./CompareIndex";
import { getLandingMeta } from "./Landing";
import { getReportMeta } from "./Report";

type MetaDescriptors = ReturnType<typeof getLandingMeta>;

const findMeta = (
  descriptors: MetaDescriptors,
  name: string
) => descriptors.find((descriptor) => "name" in descriptor && descriptor.name === name);

const findProperty = (descriptors: MetaDescriptors, property: string) =>
  descriptors.find(
    (descriptor) =>
      "property" in descriptor && descriptor.property === property
  );

const findCanonical = (descriptors: MetaDescriptors) =>
  descriptors.find(
    (descriptor) =>
      "tagName" in descriptor &&
      descriptor.tagName === "link" &&
      "rel" in descriptor &&
      descriptor.rel === "canonical"
  );

describe("route metadata", () => {
  it("targets playlist calculator and analyzer searches on the homepage", () => {
    const descriptors = getLandingMeta();
    const title = descriptors.find((descriptor) => "title" in descriptor);

    expect(title).toEqual({
      title: "Free YouTube Playlist Length Calculator & Analyzer | YTPR",
    });
    expect(findMeta(descriptors, "description")).toBeTruthy();
    expect(findMeta(descriptors, "robots")).toEqual({
      name: "robots",
      content: "index, follow",
    });
  });

  it("keeps generated playlist reports shareable but out of search results", () => {
    expect(findMeta(getReportMeta(), "robots")).toEqual({
      name: "robots",
      content: "noindex, follow",
    });
  });

  it("uses trailing-slash paths for the comparison hub and articles", () => {
    expect(COMPARISON_HUB_PATH).toBe("/compare/");

    for (const comparison of comparisons) {
      expect(comparisonPath(comparison)).toBe(
        `/compare/${comparison.slug}/`
      );
    }
  });

  it("aligns comparison canonical and Open Graph URLs", () => {
    const hubUrl = `${SITE_URL}${COMPARISON_HUB_PATH}`;
    const comparison = comparisons[0];
    const comparisonUrl = `${SITE_URL}${comparisonPath(comparison)}`;

    expect(findCanonical(getCompareIndexMeta())).toEqual({
      tagName: "link",
      rel: "canonical",
      href: hubUrl,
    });
    expect(findProperty(getCompareIndexMeta(), "og:url")).toEqual({
      property: "og:url",
      content: hubUrl,
    });
    expect(findCanonical(getCompareMeta(comparison.slug))).toEqual({
      tagName: "link",
      rel: "canonical",
      href: comparisonUrl,
    });
    expect(findProperty(getCompareMeta(comparison.slug), "og:url")).toEqual({
      property: "og:url",
      content: comparisonUrl,
    });
  });
});

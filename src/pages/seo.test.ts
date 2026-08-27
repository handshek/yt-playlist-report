import { describe, expect, it } from "vitest";
import { getLandingMeta } from "./Landing";
import { getReportMeta } from "./Report";

const findMeta = (
  descriptors: ReturnType<typeof getLandingMeta>,
  name: string
) => descriptors.find((descriptor) => "name" in descriptor && descriptor.name === name);

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
});

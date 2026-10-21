import { describe, expect, it } from "vitest";
import { summarizePlaylist } from "./playlist-report";

const video = (title: string, duration: string) => ({
  contentDetails: { duration },
  title,
});

const videos = [
  video("one", "PT1M"),
  video("two", "PT2M"),
  video("three", "PT3M"),
  video("four", "PT4M"),
];

describe("playlist summary", () => {
  it("summarizes the full playlist at normal speed", () => {
    const summary = summarizePlaylist(videos, {
      range: { start: 1, end: 4 },
      speed: 1,
    });

    expect(summary.range).toEqual({ start: 1, end: 4 });
    expect(summary.videoCount).toBe(4);
    expect(summary.totalSeconds).toBe(600);
    expect(summary.averageSeconds).toBe(150);
    expect(summary.selectedVideos.map(({ title }) => title)).toEqual([
      "one",
      "two",
      "three",
      "four",
    ]);
  });

  it("applies the selected range before dividing by playback speed", () => {
    const summary = summarizePlaylist(videos, {
      range: { start: 2, end: 4 },
      speed: 2,
    });

    expect(summary.videoCount).toBe(3);
    expect(summary.totalSeconds).toBe(270);
    expect(summary.averageSeconds).toBe(90);
    expect(summary.selectedVideos.map(({ title }) => title)).toEqual([
      "two",
      "three",
      "four",
    ]);
  });

  it("clamps a range that extends past both ends", () => {
    const summary = summarizePlaylist(videos, {
      range: { start: 0, end: 99 },
      speed: 1,
    });

    expect(summary.range).toEqual({ start: 1, end: 4 });
    expect(summary.videoCount).toBe(4);
  });

  it("swaps a reversed range", () => {
    const summary = summarizePlaylist(videos, {
      range: { start: 4, end: 2 },
      speed: 1,
    });

    expect(summary.range).toEqual({ start: 2, end: 4 });
    expect(summary.videoCount).toBe(3);
    expect(summary.totalSeconds).toBe(540);
  });

  it("rounds down the average of a fractional total", () => {
    const summary = summarizePlaylist(
      [video("one", "PT1S"), video("two", "PT2S")],
      { range: { start: 1, end: 2 }, speed: 1 }
    );

    expect(summary.totalSeconds).toBe(3);
    expect(summary.averageSeconds).toBe(1);
  });

  it("returns an empty summary for an empty playlist", () => {
    const summary = summarizePlaylist([], {
      range: { start: 1, end: 1 },
      speed: 1,
    });

    expect(summary.range).toEqual({ start: 1, end: 1 });
    expect(summary.videoCount).toBe(0);
    expect(summary.totalSeconds).toBe(0);
    expect(summary.averageSeconds).toBe(0);
    expect(summary.selectedVideos).toEqual([]);
  });

  it("expands the time at a slower playback speed", () => {
    const summary = summarizePlaylist(videos, {
      range: { start: 1, end: 4 },
      speed: 0.25,
    });

    expect(summary.totalSeconds).toBe(2400);
    expect(summary.averageSeconds).toBe(600);
  });
});

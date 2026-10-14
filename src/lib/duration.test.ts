import { describe, expect, it } from "vitest";
import { formatDuration, parseDuration } from "./duration";

describe("playlist durations", () => {
  it.each([
    ["PT0S", 0],
    ["PT1M30S", 90],
    ["PT25H", 90_000],
    ["P1DT2H3M4S", 93_784],
    ["P2D", 172_800],
    ["", 0],
    ["invalid", 0],
  ])("parses %s into seconds", (duration, seconds) => {
    expect(parseDuration(duration)).toBe(seconds);
  });

  it.each([
    [0, "0s"],
    [75, "1m 15s"],
    [93_784, "1d 2h 3m 4s"],
    [46_892, "13h 1m 32s"],
  ])("formats %s seconds explicitly", (seconds, duration) => {
    expect(formatDuration(seconds)).toBe(duration);
  });
});

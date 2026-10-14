import { describe, expect, it } from "vitest";
import { isPlaylistId } from "./playlist-id";

describe("playlist IDs", () => {
  it.each(["PLabc_12345", "PL_-abc12345", "a".repeat(150)])("accepts %s", (value) => {
    expect(isPlaylistId(value)).toBe(true);
  });

  it.each([undefined, null, 1234567890, "", "abc", "a".repeat(151), "PLabc 12345", "PLabc/12345"])("rejects %s", (value) => {
    expect(isPlaylistId(value)).toBe(false);
  });
});

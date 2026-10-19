import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PLAYLIST_CACHE_MAX_ENTRIES,
  PLAYLIST_CACHE_TTL_MS,
  clearAllPlaylistCache,
  clearPlaylistCache,
  getPlaylistReportSavedAt,
  readPlaylistCache,
  writePlaylistCache,
} from "./playlist-cache";

const detailsKey = "ytpr:playlist-details:PLabc_12345";
const reportKey = "ytpr:playlist-report:PLabc_12345";

describe("playlist cache", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("round-trips details and report data independently", () => {
    writePlaylistCache("details", "PLabc_12345", { title: "Details" });
    writePlaylistCache("report", "PLabc_12345", { videos: [1, 2, 3] });

    expect(readPlaylistCache("details", "PLabc_12345")).toEqual({
      title: "Details",
    });
    expect(readPlaylistCache("report", "PLabc_12345")).toEqual({
      videos: [1, 2, 3],
    });
  });

  it("treats expired entries as missing and removes them", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    writePlaylistCache("details", "PLabc_12345", { title: "Details" });

    vi.setSystemTime(Date.now() + PLAYLIST_CACHE_TTL_MS);

    expect(readPlaylistCache("details", "PLabc_12345")).toBeNull();
    expect(window.localStorage.getItem(detailsKey)).toBeNull();
  });

  it("drops entries from an older schema version", () => {
    window.localStorage.setItem(
      reportKey,
      JSON.stringify({ schemaVersion: 0, savedAt: Date.now(), data: {} })
    );

    expect(readPlaylistCache("report", "PLabc_12345")).toBeNull();
    expect(window.localStorage.getItem(reportKey)).toBeNull();
  });

  it("drops corrupt entries instead of throwing", () => {
    window.localStorage.setItem(reportKey, "{not-json");

    expect(readPlaylistCache("report", "PLabc_12345")).toBeNull();
    expect(window.localStorage.getItem(reportKey)).toBeNull();
  });

  it("evicts the oldest entries when the cache grows past its limit", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    for (let index = 0; index < PLAYLIST_CACHE_MAX_ENTRIES + 3; index += 1) {
      writePlaylistCache("report", `PLid_${String(index).padStart(5, "0")}`, {
        index,
      });
      vi.advanceTimersByTime(1_000);
    }

    expect(window.localStorage.length).toBe(PLAYLIST_CACHE_MAX_ENTRIES);
    expect(readPlaylistCache("report", "PLid_00000")).toBeNull();
    expect(readPlaylistCache("report", "PLid_00001")).toBeNull();
    expect(readPlaylistCache("report", "PLid_00002")).toBeNull();
    expect(
      readPlaylistCache(
        "report",
        `PLid_${String(PLAYLIST_CACHE_MAX_ENTRIES + 2).padStart(5, "0")}`
      )
    ).not.toBeNull();
  });

  it("clears one playlist without touching another", () => {
    writePlaylistCache("details", "PLabc_12345", { title: "A" });
    writePlaylistCache("report", "PLabc_12345", { videos: [] });
    writePlaylistCache("details", "PLother_1234", { title: "B" });

    clearPlaylistCache("PLabc_12345");

    expect(readPlaylistCache("details", "PLabc_12345")).toBeNull();
    expect(readPlaylistCache("report", "PLabc_12345")).toBeNull();
    expect(readPlaylistCache("details", "PLother_1234")).toEqual({
      title: "B",
    });
  });

  it("clears every cached playlist at once", () => {
    writePlaylistCache("details", "PLabc_12345", { title: "A" });
    writePlaylistCache("report", "PLother_1234", { videos: [] });

    clearAllPlaylistCache();

    expect(window.localStorage.length).toBe(0);
  });

  it("reports the report's own write time, ignoring fresher details", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    writePlaylistCache("report", "PLabc_12345", { videos: [] });

    vi.advanceTimersByTime(5_000);
    writePlaylistCache("details", "PLabc_12345", { title: "A" });
    writePlaylistCache("details", "PLdetailsOnly_1", { title: "B" });

    expect(getPlaylistReportSavedAt("PLabc_12345")).toBe(Date.now() - 5_000);
    expect(getPlaylistReportSavedAt("PLmissing_123")).toBeNull();
    expect(getPlaylistReportSavedAt("PLdetailsOnly_1")).toBeNull();
  });

  it("does not throw when storage rejects a write", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(writePlaylistCache("details", "PLabc_12345", { title: "A" })).toBe(
      false
    );
  });

  it("frees stored entries and retries when storage is full", () => {
    writePlaylistCache("details", "PLabc_12345", { title: "A" });

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(
      (key: string, value: string) => {
        if (window.localStorage.length >= 1) {
          throw new Error("QuotaExceededError");
        }

        originalSetItem.call(window.localStorage, key, value);
      }
    );

    expect(writePlaylistCache("report", "PLother_1234", { videos: [] })).toBe(
      true
    );
    expect(readPlaylistCache("report", "PLother_1234")).toEqual({ videos: [] });
    expect(readPlaylistCache("details", "PLabc_12345")).toBeNull();
  });
});

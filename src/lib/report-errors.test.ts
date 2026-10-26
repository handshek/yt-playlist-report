import { describe, expect, it } from "vitest";
import {
  PlaylistRequestError,
  getReportErrorReason,
  isReportErrorReason,
} from "./report-errors";

describe("report errors", () => {
  it("keeps the stable reason carried by a request error", () => {
    expect(
      getReportErrorReason(new PlaylistRequestError("playlist_unavailable"))
    ).toBe("playlist_unavailable");
  });

  it("falls back to a public error for unknown failures", () => {
    expect(getReportErrorReason(new Error("playlist_unavailable"))).toBe(
      "service_unavailable"
    );
    expect(getReportErrorReason("invalid_request")).toBe(
      "service_unavailable"
    );
  });

  it("accepts only the public endpoint reason vocabulary", () => {
    expect(isReportErrorReason("upstream_unavailable")).toBe(true);
    expect(isReportErrorReason("private_upstream_detail")).toBe(false);
    expect(isReportErrorReason(undefined)).toBe(false);
  });
});

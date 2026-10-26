export const REPORT_ERROR_REASONS = [
  "forbidden",
  "invalid_request",
  "method_not_allowed",
  "playlist_unavailable",
  "service_unavailable",
  "upstream_unavailable",
] as const;

export type ReportErrorReason = (typeof REPORT_ERROR_REASONS)[number];

const reportErrorReasons = new Set<string>(REPORT_ERROR_REASONS);

export class PlaylistRequestError extends Error {
  readonly reason: ReportErrorReason;

  constructor(reason: ReportErrorReason) {
    super(reason);
    this.name = "PlaylistRequestError";
    this.reason = reason;
  }
}

export const isReportErrorReason = (
  value: unknown
): value is ReportErrorReason =>
  typeof value === "string" && reportErrorReasons.has(value);

export const getReportErrorReason = (error: unknown): ReportErrorReason =>
  error instanceof PlaylistRequestError ? error.reason : "service_unavailable";

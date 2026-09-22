export const ACQUISITION_SOURCES = [
  "producthunt",
  "alternativeto",
  "uneed",
  "youquhome",
] as const;

export const FEEDBACK_SENTIMENTS = ["yes", "no"] as const;
export const FEEDBACK_USE_CASES = [
  "study-course",
  "teaching-training",
  "creator-marketing",
  "music",
  "research",
  "other",
] as const;
export const FEEDBACK_HELPFUL_REASONS = [
  "duration-speed",
  "detailed-stats",
  "search-sort",
  "video-range",
  "sharing",
] as const;
export const FEEDBACK_MISSING_REASONS = [
  "export-download",
  "schedule-calendar",
  "monitoring-alerts",
  "private-unlisted",
  "playlist-comparison",
  "other",
] as const;
export const OFFER_RESPONSES = ["yes", "maybe", "no"] as const;

export const FEEDBACK_COMMENT_MAX_LENGTH = 500;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];
export type FeedbackSentiment = (typeof FEEDBACK_SENTIMENTS)[number];
export type FeedbackUseCase = (typeof FEEDBACK_USE_CASES)[number];
export type FeedbackHelpfulReason =
  (typeof FEEDBACK_HELPFUL_REASONS)[number];
export type FeedbackMissingReason =
  (typeof FEEDBACK_MISSING_REASONS)[number];
export type OfferResponse = (typeof OFFER_RESPONSES)[number];

export interface FeedbackSubmission {
  sentiment: FeedbackSentiment;
  useCase: FeedbackUseCase;
  helpful: FeedbackHelpfulReason[];
  missing: FeedbackMissingReason[];
  offerResponse: OfferResponse;
  comment: string;
  source: AcquisitionSource | null;
  honeypot: string;
}

const allowedSources = new Set<string>(ACQUISITION_SOURCES);
const allowedSentiments = new Set<string>(FEEDBACK_SENTIMENTS);
const allowedUseCases = new Set<string>(FEEDBACK_USE_CASES);
const allowedHelpful = new Set<string>(FEEDBACK_HELPFUL_REASONS);
const allowedMissing = new Set<string>(FEEDBACK_MISSING_REASONS);
const allowedOfferResponses = new Set<string>(OFFER_RESPONSES);
const submissionKeys = new Set([
  "sentiment",
  "useCase",
  "helpful",
  "missing",
  "offerResponse",
  "comment",
  "source",
  "honeypot",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const isAllowedArray = (value: unknown, allowed: Set<string>) =>
  Array.isArray(value) &&
  value.length <= allowed.size &&
  new Set(value).size === value.length &&
  value.every((item) => typeof item === "string" && allowed.has(item));

export const isAcquisitionSource = (
  value: string
): value is AcquisitionSource => allowedSources.has(value);

export const isFeedbackSubmission = (
  value: unknown
): value is FeedbackSubmission =>
  isRecord(value) &&
  Object.keys(value).length === submissionKeys.size &&
  Object.keys(value).every((key) => submissionKeys.has(key)) &&
  typeof value.sentiment === "string" &&
  allowedSentiments.has(value.sentiment) &&
  typeof value.useCase === "string" &&
  allowedUseCases.has(value.useCase) &&
  isAllowedArray(value.helpful, allowedHelpful) &&
  isAllowedArray(value.missing, allowedMissing) &&
  typeof value.offerResponse === "string" &&
  allowedOfferResponses.has(value.offerResponse) &&
  typeof value.comment === "string" &&
  value.comment.length <= FEEDBACK_COMMENT_MAX_LENGTH &&
  (value.source === null ||
    (typeof value.source === "string" && isAcquisitionSource(value.source))) &&
  typeof value.honeypot === "string" &&
  value.honeypot.length <= 200;

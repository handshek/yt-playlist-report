import { trackPageview } from "./counterscale";

export const SEO_CONTENT_SLUGS = [
  "yt-playlist-report-vs-ytpla",
  "yt-playlist-report-vs-youtube-playlist-analyzer",
  "yt-playlist-report-vs-playlistlength-app",
  "yt-playlist-report-vs-youtubeplaylistlength-org",
  "yt-playlist-report-vs-tunepocket",
  "youtube-playlist-length-playback-speed",
  "youtube-playlist-statistics",
  "sort-youtube-playlist-by-length",
] as const;

export type SeoContentSlug = (typeof SEO_CONTENT_SLUGS)[number];

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

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];
export type FeedbackSentiment = (typeof FEEDBACK_SENTIMENTS)[number];
export type FeedbackUseCase = (typeof FEEDBACK_USE_CASES)[number];
export type FeedbackHelpfulReason =
  (typeof FEEDBACK_HELPFUL_REASONS)[number];
export type FeedbackMissingReason =
  (typeof FEEDBACK_MISSING_REASONS)[number];
export type OfferResponse = (typeof OFFER_RESPONSES)[number];

export type SeoEvent =
  | { name: "report_submit" }
  | { name: "report_success" }
  | {
      name: "report_error";
      reason: "invalid_url" | "fetch_failed";
    }
  | {
      name: "content_cta_click";
      slug: SeoContentSlug;
    }
  | { name: "feedback_open" }
  | { name: "offer_view" }
  | {
      name: "feedback_submit";
      sentiment: FeedbackSentiment;
      useCase: FeedbackUseCase;
      helpful: FeedbackHelpfulReason[];
      missing: FeedbackMissingReason[];
    }
  | { name: "offer_response"; response: OfferResponse };

const contentSlugs = new Set<string>(SEO_CONTENT_SLUGS);
const acquisitionSources = new Set<string>(ACQUISITION_SOURCES);
const feedbackSentiments = new Set<string>(FEEDBACK_SENTIMENTS);
const feedbackUseCases = new Set<string>(FEEDBACK_USE_CASES);
const feedbackHelpfulReasons = new Set<string>(FEEDBACK_HELPFUL_REASONS);
const feedbackMissingReasons = new Set<string>(FEEDBACK_MISSING_REASONS);
const offerResponses = new Set<string>(OFFER_RESPONSES);
const ACQUISITION_SOURCE_KEY = "ytpr:acquisition-source";

export const isSeoContentSlug = (value: string): value is SeoContentSlug =>
  contentSlugs.has(value);

export const isAcquisitionSource = (
  value: string
): value is AcquisitionSource => acquisitionSources.has(value);

export const getAcquisitionSource = (): AcquisitionSource | null => {
  try {
    if (typeof window === "undefined") return null;
    const source = window.sessionStorage.getItem(ACQUISITION_SOURCE_KEY);
    return source && isAcquisitionSource(source) ? source : null;
  } catch {
    return null;
  }
};

export const captureAcquisitionSource = (search: string) => {
  try {
    if (typeof window === "undefined" || getAcquisitionSource()) return;
    const source = new URLSearchParams(search).get("utm_source");
    if (source && isAcquisitionSource(source)) {
      // First-touch session attribution prevents later internal URLs rewriting it.
      window.sessionStorage.setItem(ACQUISITION_SOURCE_KEY, source);
    }
  } catch {
    // Storage and malformed query strings must never affect report generation.
  }
};

const trackEventPath = (path: string) => {
  const source = getAcquisitionSource();
  trackPageview(source ? `${path}/source/${source}` : path);
};

const trackAllowedValues = (
  prefix: string,
  values: readonly string[],
  allowedValues: Set<string>
) => {
  [...new Set(values)]
    .filter((value) => allowedValues.has(value))
    .forEach((value) => trackEventPath(`${prefix}/${value}`));
};

export const trackSeoEvent = (event: SeoEvent) => {
  // The reserved namespace keeps funnel signals out of ordinary page totals.
  switch (event.name) {
    case "report_submit":
      trackEventPath("/events/report-submit");
      break;
    case "report_success":
      trackEventPath("/events/report-success");
      break;
    case "report_error":
      trackEventPath(`/events/report-error/${event.reason.replace("_", "-")}`);
      break;
    case "content_cta_click":
      if (isSeoContentSlug(event.slug)) {
        trackEventPath(`/events/content-cta/${event.slug}`);
      }
      break;
    case "feedback_open":
      trackEventPath("/events/feedback-open");
      break;
    case "offer_view":
      trackEventPath("/events/offer-view");
      break;
    case "feedback_submit":
      if (feedbackSentiments.has(event.sentiment)) {
        trackEventPath(`/events/feedback-submit/${event.sentiment}`);
      }
      if (feedbackUseCases.has(event.useCase)) {
        trackEventPath(`/events/feedback-use-case/${event.useCase}`);
      }
      trackAllowedValues(
        "/events/feedback-helpful",
        event.helpful,
        feedbackHelpfulReasons
      );
      trackAllowedValues(
        "/events/feedback-missing",
        event.missing,
        feedbackMissingReasons
      );
      break;
    case "offer_response":
      if (offerResponses.has(event.response)) {
        trackEventPath(`/events/offer-response/${event.response}`);
      }
      break;
  }
};

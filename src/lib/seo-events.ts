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
    };

const contentSlugs = new Set<string>(SEO_CONTENT_SLUGS);

export const isSeoContentSlug = (value: string): value is SeoContentSlug =>
  contentSlugs.has(value);

export const trackSeoEvent = (event: SeoEvent) => {
  // The reserved namespace keeps funnel signals out of ordinary page totals.
  switch (event.name) {
    case "report_submit":
      trackPageview("/events/report-submit");
      break;
    case "report_success":
      trackPageview("/events/report-success");
      break;
    case "report_error":
      trackPageview(`/events/report-error/${event.reason.replace("_", "-")}`);
      break;
    case "content_cta_click":
      if (isSeoContentSlug(event.slug)) {
        trackPageview(`/events/content-cta/${event.slug}`);
      }
      break;
  }
};

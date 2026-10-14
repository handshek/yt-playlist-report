import { test as base, expect, type Page } from "@playwright/test";
import type { VideoItem } from "../src/api/PlaylistApi";

export const playlistId = "PLfixture12345";
export const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

export const videos: VideoItem[] = [1, 2, 3, 4].map((minutes) => ({
  kind: "youtube#video",
  etag: `video-${minutes}`,
  id: `video00000${minutes}`,
  snippet: {
    publishedAt: "2026-01-01T00:00:00Z",
    channelId: "fixture",
    title: `Lesson ${minutes}`,
    description: "",
    thumbnails: Object.fromEntries(
      ["default", "medium", "high"].map((size) => [
        size,
        { url: "/favicon-96.png", width: 96, height: 96 },
      ])
    ) as VideoItem["snippet"]["thumbnails"],
    channelTitle: "Fixture channel",
    categoryId: "27",
    liveBroadcastContent: "none",
    localized: { title: `Lesson ${minutes}`, description: "" },
  },
  statistics: {
    viewCount: String(minutes * 10),
    likeCount: String(minutes),
    favoriteCount: "0",
    commentCount: "0",
  },
  contentDetails: { duration: `PT${minutes}M` },
}));

type ApiRequest = { playlistId: string; resource: "details" | "report" };

export type PlaylistApi = {
  requests: ApiRequest[];
  detailsError: string | null;
  reportError: string | null;
  reportVideos: VideoItem[];
  holdReport: Promise<void> | null;
};

export const test = base.extend<{ api: PlaylistApi }>({
  api: [async ({ page }, use) => {
    const api: PlaylistApi = {
      requests: [],
      detailsError: null,
      reportError: null,
      reportVideos: structuredClone(videos),
      holdReport: null,
    };
    await page.route("**/api/github-stars", (route) =>
      route.fulfill({ json: { count: 0 } })
    );
    await page.route("**/api/youtube-playlist", async (route) => {
      expect(route.request().method()).toBe("POST");
      const request = route.request().postDataJSON() as ApiRequest;
      expect(request.playlistId).toBe(playlistId);
      expect(["details", "report"]).toContain(request.resource);
      api.requests.push(request);
      if (request.resource === "report") await api.holdReport;
      const error = request.resource === "details" ? api.detailsError : api.reportError;
      if (error) {
        await route.fulfill({
          status: error === "playlist_unavailable" ? 404 : 502,
          json: { error },
        });
        return;
      }
      await route.fulfill({
        json: request.resource === "details"
          ? { id: request.playlistId, title: "Fixture playlist", description: "", thumbnails: {} }
          : { videos: api.reportVideos, duration: "10m", avgDuration: "2m 30s" },
      });
    });
    await use(api);
  }, { auto: true }],
});

export { expect };

export async function generateReport(page: Page, url = playlistUrl) {
  await page.goto("/");
  await page.getByPlaceholder("Enter YouTube playlist URL").fill(url);
  await page.getByRole("button", { name: "Generate", exact: true }).click();
}

export function summary(page: Page, name: string) {
  return page.getByRole("heading", { name, exact: true }).locator("xpath=ancestor::div[p][1]/p");
}

export async function expectSummary(page: Page, total: string, average: string, count: string) {
  await expect(summary(page, "Total Duration")).toHaveText(total);
  await expect(summary(page, "Average Duration")).toHaveText(average);
  await expect(summary(page, "Total Videos")).toHaveText(count);
}

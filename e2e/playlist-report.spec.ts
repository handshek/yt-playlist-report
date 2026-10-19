import { test, expect, playlistId, playlistUrl, generateReport, expectSummary } from "./fixtures";

test("generates a report, adjusts playback speed and reuses the report on reload", async ({ page, api }, testInfo) => {
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "2.0", exact: true }).click();
  await expectSummary(page, "5m", "1m 15s", "4");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "0.25", exact: true }).click();
  await expectSummary(page, "40m", "10m", "4");
  await page.screenshot({ path: testInfo.outputPath("report.png"), fullPage: true });
  await page.reload();
  await expectSummary(page, "10m", "2m 30s", "4");
  expect(api.requests.filter((request) => request.resource === "report")).toHaveLength(1);
});

test("refreshes a cached report on demand", async ({ page, api }) => {
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  expect(api.requests.filter((request) => request.resource === "details")).toHaveLength(1);
  expect(api.requests.filter((request) => request.resource === "report")).toHaveLength(1);
  await page.reload();
  await expectSummary(page, "10m", "2m 30s", "4");
  expect(api.requests.filter((request) => request.resource === "details")).toHaveLength(1);
  expect(api.requests.filter((request) => request.resource === "report")).toHaveLength(1);

  api.reportVideos[0].contentDetails.duration = "PT5M";
  await page.getByRole("button", { name: "Refresh playlist report" }).click();
  await expectSummary(page, "14m", "3m 30s", "4");
  expect(api.requests.filter((request) => request.resource === "details")).toHaveLength(2);
  expect(api.requests.filter((request) => request.resource === "report")).toHaveLength(2);
});

test("commits the first keyboard range change and keeps the selected positions", async ({ page }) => {
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  await page.getByRole("button", { name: "Select Range" }).click();
  await page.getByRole("slider").first().focus();
  await page.getByRole("slider").first().press("ArrowRight");
  await expectSummary(page, "9m", "3m", "3");
  await page.keyboard.press("Escape");
  await expect(page.locator("tbody tr").first().locator("td").first()).toHaveText("2");
  await expect(page.locator("tbody tr")).toHaveCount(3);
  await expect(page.getByRole("link", { name: "Lesson 1", exact: true })).toHaveCount(0);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "2.0", exact: true }).click();
  await expectSummary(page, "4m 30s", "1m 30s", "3");
  await page.getByRole("button", { name: "Select Range" }).click();
  await expect(page.getByRole("slider").first()).toHaveAttribute("aria-valuenow", "2");
  await expect(page.getByRole("slider").last()).toHaveAttribute("aria-valuenow", "4");
});

test("allows selecting exactly one video", async ({ page }) => {
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  await page.getByRole("button", { name: "Select Range" }).click();
  await page.getByRole("slider").first().focus();
  await page.getByRole("slider").first().press("ArrowRight");
  await page.getByRole("slider").first().press("ArrowRight");
  await page.getByRole("slider").first().press("ArrowRight");
  await expectSummary(page, "4m", "4m", "1");
});

test("keeps range controls inside the viewport", async ({ page }, testInfo) => {
  await generateReport(page);
  await page.getByRole("button", { name: "Select Range" }).click();
  const popup = page.getByRole("dialog");
  await expect(popup).toBeVisible();
  await popup.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)).then(() => undefined));
  const box = await popup.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.screenshot({ path: testInfo.outputPath("range.png"), animations: "disabled" });
});

for (const [name, url] of [
  ["missing playlist ID", "https://www.youtube.com/watch?v=no-playlist"],
  ["foreign host", `https://example.com/?list=${playlistId}`],
  ["malformed playlist ID", "https://www.youtube.com/playlist?list=x"],
]) {
  test(`rejects ${name} before making API requests`, async ({ page, api }) => {
    await page.goto("/");
    await page.getByPlaceholder("Enter YouTube playlist URL").fill(url);
    await page.getByRole("button", { name: "Generate", exact: true }).click();
    await expect(page.getByText("Invalid playlist URL", { exact: true })).toBeVisible();
    await expect(page).toHaveURL("/");
    expect(api.requests).toHaveLength(0);
  });
}

test("shows the pending report before its videos arrive", async ({ page, api }) => {
  let releaseReport!: () => void;
  api.holdReport = new Promise<void>((resolve) => { releaseReport = resolve; });
  try {
    await generateReport(page);
    await expect(page.getByText("Fixture playlist", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Total Duration", exact: true })).toHaveCount(0);
  } finally {
    releaseReport();
  }
  await expectSummary(page, "10m", "2m 30s", "4");
});

test("commits a range selected by touch", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Touch interaction is covered by the mobile project");
  await generateReport(page);
  await page.getByRole("button", { name: "Select Range" }).click();
  await page.getByRole("dialog").evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)).then(() => undefined));
  const first = await page.getByRole("slider").first().boundingBox();
  const last = await page.getByRole("slider").last().boundingBox();
  await page.touchscreen.tap(first!.x + first!.width / 2 + (last!.x - first!.x) / 3, first!.y + first!.height / 2);
  await expectSummary(page, "9m", "3m", "3");
});

test("includes days when calculating video duration", async ({ page, api }) => {
  api.reportVideos = [api.reportVideos[0]];
  api.reportVideos[0].contentDetails.duration = "P1DT2H3M4S";
  await generateReport(page);
  await expectSummary(page, "1d 2h 3m 4s", "1d 2h 3m 4s", "1");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "2.0", exact: true }).click();
  await expectSummary(page, "13h 1m 32s", "13h 1m 32s", "1");
});

test("preserves a private playlist URL so the user can retry", async ({ page, api }) => {
  api.detailsError = "playlist_unavailable";
  await generateReport(page);
  await expect(page.getByText("Error generating report", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Enter YouTube playlist URL")).toHaveValue(playlistUrl);
  api.detailsError = null;
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expectSummary(page, "10m", "2m 30s", "4");
});

test("recovers a failed report request without re-entering the URL", async ({ page, api }, testInfo) => {
  api.reportError = "upstream_unavailable";
  await generateReport(page);
  const retry = page.getByRole("button", { name: "Try again", exact: true });
  await expect(retry).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: testInfo.outputPath("report-error.png"), fullPage: true });
  api.reportError = null;
  await retry.click();
  await expectSummary(page, "10m", "2m 30s", "4");
});

test("recovers from an unavailable direct report link", async ({ page, api }) => {
  api.detailsError = "playlist_unavailable";
  await page.goto(`/playlist/${playlistId}`);
  await expect(page.getByRole("link", { name: "Try another playlist" })).toBeVisible({ timeout: 15_000 });
  api.detailsError = null;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expectSummary(page, "10m", "2m 30s", "4");
});

test("shows an explicit empty report and disables range selection", async ({ page, api }) => {
  api.reportVideos = [];
  await generateReport(page);
  await expectSummary(page, "0s", "0s", "0");
  await expect(page.getByRole("button", { name: "Select Range" })).toBeDisabled();
});

test("renders videos that have no thumbnail", async ({ page, api }) => {
  api.reportVideos[0].snippet.thumbnails = {} as typeof api.reportVideos[0]["snippet"]["thumbnails"];
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  await expect(page.getByRole("link", { name: "Lesson 1", exact: true })).toBeVisible();
});

test("uses one metadata request per submission", async ({ page, api }) => {
  await generateReport(page);
  await expectSummary(page, "10m", "2m 30s", "4");
  expect(api.requests.filter((request) => request.resource === "details")).toHaveLength(1);
});

for (const host of ["youtube-nocookie.com", "www.youtube-nocookie.com"]) {
  test(`accepts privacy-enhanced embed URLs on ${host}`, async ({ page }) => {
    await generateReport(page, `https://${host}/embed/videoseries?list=${playlistId}`);
    await expectSummary(page, "10m", "2m 30s", "4");
  });
}

test("rejects a malformed direct link without requesting the API or offering retry", async ({ page, api }) => {
  await page.goto("/playlist/abc");
  await expect(page.getByRole("heading", { name: "Invalid playlist link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again", exact: true })).toHaveCount(0);
  expect(api.requests).toHaveLength(0);
  await page.getByRole("link", { name: "Try another playlist" }).click();
  await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeVisible();
});

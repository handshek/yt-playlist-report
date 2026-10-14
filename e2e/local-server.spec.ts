import http from "node:http";
import { test, expect } from "@playwright/test";

test("keeps serving after a client aborts an API request body", async ({ page, baseURL }) => {
  await new Promise<void>((resolve, reject) => {
    const request = http.request(new URL("/api/youtube-playlist", baseURL), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "1000" },
    });
    request.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code !== "ECONNRESET") reject(error);
    });
    request.on("close", resolve);
    request.write("{", () => request.destroy());
  });
  await page.route("**/api/github-stars", (route) => route.fulfill({ json: { count: 0 } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Generate", exact: true })).toBeVisible();
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handler } from "../netlify/functions/github-stars";

const githubResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

describe("github-stars function", () => {
  beforeEach(() => {
    vi.stubEnv("GITHUB_TOKEN", "");
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(githubResponse({ stargazers_count: 16 }))
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns only the numeric star count", async () => {
    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ count: 16 });
  });

  it("sets a 24-hour durable CDN cache only on success", async () => {
    const response = await handler({ httpMethod: "GET" });

    expect(response.headers["Netlify-CDN-Cache-Control"]).toBe(
      "public, durable, s-maxage=86400, stale-while-revalidate=3600"
    );
    expect(response.headers["Cache-Control"]).toBe(
      "public, max-age=0, must-revalidate"
    );
  });

  it("works without a GitHub token and applies an upstream timeout", async () => {
    await handler({ httpMethod: "GET" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/buneeIsSlo/yt-playlist-report",
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
        signal: expect.any(AbortSignal),
      })
    );
  });

  it("uses the optional GitHub token when configured", async () => {
    vi.stubEnv("GITHUB_TOKEN", "secret-token");

    await handler({ httpMethod: "GET" });

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer secret-token",
        }),
      })
    );
  });

  it("returns an uncached server error for upstream failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(githubResponse({}, 503)))
    );

    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(502);
    expect(response.headers["Cache-Control"]).toBe("no-store");
    expect(response.headers).not.toHaveProperty("Netlify-CDN-Cache-Control");
  });

  it("returns an uncached server error for malformed data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(githubResponse({ stargazers_count: "16" }))
      )
    );

    const response = await handler({ httpMethod: "GET" });

    expect(response.statusCode).toBe(502);
    expect(response.headers["Cache-Control"]).toBe("no-store");
  });

  it("rejects methods other than GET without contacting GitHub", async () => {
    const response = await handler({ httpMethod: "POST" });

    expect(response.statusCode).toBe(405);
    expect(response.headers.Allow).toBe("GET");
    expect(fetch).not.toHaveBeenCalled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config, handler } from "./youtube-playlist";

const allowedRequest = (body: unknown) => ({
  httpMethod: "POST",
  headers: { origin: "https://ytpr.netlify.app" },
  body: JSON.stringify(body),
});

const jsonBody = (response: Awaited<ReturnType<typeof handler>>) =>
  JSON.parse(response.body) as Record<string, unknown>;

describe("YouTube playlist API", () => {
  beforeEach(() => {
    process.env.YT_API_KEY = "server-only-test-key";
  });

  afterEach(() => {
    delete process.env.YT_API_KEY;
    vi.restoreAllMocks();
  });

  it("declares an IP and domain rate limit for its public path", () => {
    expect(config).toEqual({
      path: "/api/youtube-playlist",
      rateLimit: {
        windowLimit: 30,
        windowSize: 60,
        aggregateBy: ["ip", "domain"],
      },
    });
  });

  it("rejects disallowed browser origins before calling YouTube", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await handler({
      ...allowedRequest({ playlistId: "PLabc_12345", resource: "details" }),
      headers: { origin: "https://example.com" },
    });

    expect(response.statusCode).toBe(403);
    expect(jsonBody(response)).toEqual({ error: "forbidden" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid request bodies without echoing submitted values", async () => {
    const response = await handler(
      allowedRequest({ playlistId: "not a playlist!", resource: "details" })
    );

    expect(response.statusCode).toBe(400);
    expect(jsonBody(response)).toEqual({ error: "invalid_request" });
    expect(response.body).not.toContain("not a playlist");
  });

  it("returns sanitized public playlist details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "PLabc_12345",
              snippet: {
                title: "A public playlist",
                description: "Playlist description",
                thumbnails: {
                  default: { url: "https://i.ytimg.com/default.jpg", width: 120, height: 90 },
                  medium: { url: "https://i.ytimg.com/medium.jpg", width: 320, height: 180 },
                  high: { url: "https://i.ytimg.com/high.jpg", width: 480, height: 360 },
                },
              },
              secretUpstreamField: "must not leak",
            },
          ],
        }),
        { status: 200 }
      )
    );

    const response = await handler(
      allowedRequest({ playlistId: "PLabc_12345", resource: "details" })
    );

    expect(response.statusCode).toBe(200);
    expect(jsonBody(response)).toEqual({
      id: "PLabc_12345",
      title: "A public playlist",
      description: "Playlist description",
      thumbnails: {
        default: { url: "https://i.ytimg.com/default.jpg", width: 120, height: 90 },
        medium: { url: "https://i.ytimg.com/medium.jpg", width: 320, height: 180 },
        high: { url: "https://i.ytimg.com/high.jpg", width: 480, height: 360 },
      },
    });
    expect(response.body).not.toContain("server-only-test-key");
    expect(response.body).not.toContain("secretUpstreamField");
  });

  it("paginates videos and returns the calculated report", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ contentDetails: { videoId: "video-one" } }],
            nextPageToken: "next-page",
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [{ contentDetails: { videoId: "video-two" } }],
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            items: [
              {
                id: "video-one",
                kind: "youtube#video",
                etag: "one",
                snippet: {
                  publishedAt: "2026-01-01T00:00:00Z",
                  channelId: "channel-one",
                  title: "First video",
                  description: "",
                  thumbnails: {},
                  channelTitle: "Channel",
                  categoryId: "27",
                  liveBroadcastContent: "none",
                  localized: { title: "First video", description: "" },
                },
                statistics: { viewCount: "10", likeCount: "2", favoriteCount: "0", commentCount: "1" },
                contentDetails: { duration: "PT1M30S" },
              },
              {
                id: "video-two",
                kind: "youtube#video",
                etag: "two",
                snippet: {
                  publishedAt: "2026-01-02T00:00:00Z",
                  channelId: "channel-one",
                  title: "Second video",
                  description: "",
                  thumbnails: {},
                  channelTitle: "Channel",
                  categoryId: "27",
                  liveBroadcastContent: "none",
                  localized: { title: "Second video", description: "" },
                },
                statistics: { viewCount: "20", likeCount: "3", favoriteCount: "0", commentCount: "2" },
                contentDetails: { duration: "PT2M30S" },
              },
            ],
          })
        )
      );

    const response = await handler(
      allowedRequest({ playlistId: "PLabc_12345", resource: "report" })
    );

    expect(response.statusCode).toBe(200);
    expect(jsonBody(response)).toMatchObject({
      duration: "4m",
      avgDuration: "2m",
      videos: [{ id: "video-one" }, { id: "video-two" }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toContain("key=server-only-test-key");
  });

  it("maps unavailable playlists and upstream failures to stable errors", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: {} }), { status: 403 }));

    const missing = await handler(
      allowedRequest({ playlistId: "PLabc_12345", resource: "details" })
    );
    const upstream = await handler(
      allowedRequest({ playlistId: "PLabc_12345", resource: "details" })
    );

    expect(missing.statusCode).toBe(404);
    expect(jsonBody(missing)).toEqual({ error: "playlist_unavailable" });
    expect(upstream.statusCode).toBe(502);
    expect(jsonBody(upstream)).toEqual({ error: "upstream_unavailable" });
  });
});

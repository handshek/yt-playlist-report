import { afterEach, describe, expect, it, vi } from "vitest";
import netlifyHandler, {
  config,
  handleFeedbackRequest as handler,
} from "../netlify/functions/feedback";

const validBody = {
  sentiment: "yes",
  useCase: "study-course",
  helpful: ["duration-speed", "search-sort"],
  missing: ["schedule-calendar"],
  offerResponse: "maybe",
  comment: "A calendar export would help.",
  source: "producthunt",
  honeypot: "",
};

const allowedRequest = (body: unknown) => ({
  httpMethod: "POST",
  headers: { origin: "https://deploy-preview-11--ytpr.netlify.app" },
  body: JSON.stringify(body),
});

const productionRequest = (body: unknown) => ({
  httpMethod: "POST",
  headers: { origin: "https://ytpr.netlify.app" },
  body: JSON.stringify(body),
});

const jsonBody = (response: Awaited<ReturnType<typeof handler>>) =>
  JSON.parse(response.body) as Record<string, unknown>;

describe("feedback API", () => {
  afterEach(() => {
    delete process.env.DEPLOY_PRIME_URL;
    delete process.env.URL;
    delete process.env.NETLIFY_ACCESS_TOKEN;
    delete process.env.SITE_ID;
    vi.restoreAllMocks();
  });

  it("declares a conservative edge rate limit", () => {
    expect(config).toEqual({
      path: "/api/feedback",
      rateLimit: {
        windowLimit: 10,
        windowSize: 3_600,
        aggregateBy: ["ip", "domain"],
      },
    });
  });

  it("exposes a web-standard handler so Netlify applies the route config", async () => {
    const response = await netlifyHandler(
      new Request("https://ytpr.netlify.app/api/feedback", {
        method: "OPTIONS",
        headers: { Origin: "https://ytpr.netlify.app" },
      })
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://ytpr.netlify.app"
    );
  });

  it("rejects disallowed origins before storing anything", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await handler({
      ...allowedRequest(validBody),
      headers: { origin: "https://example.com" },
    });

    expect(response.statusCode).toBe(403);
    expect(jsonBody(response)).toEqual({ error: "forbidden" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects unknown fields and invalid categories without echoing them", async () => {
    const response = await handler(
      allowedRequest({
        ...validBody,
        useCase: "private-playlist-id",
        playlistId: "PLmust-not-appear",
      })
    );

    expect(response.statusCode).toBe(400);
    expect(jsonBody(response)).toEqual({ error: "invalid_request" });
    expect(response.body).not.toContain("PLmust-not-appear");
  });

  it("silently accepts honeypot submissions without storing them", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const response = await handler(
      allowedRequest({ ...validBody, honeypot: "filled-by-bot" })
    );

    expect(response.statusCode).toBe(202);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards only validated fields to the detected Netlify form", async () => {
    // Netlify preview functions may inherit the production URL; the already
    // allowlisted request origin is the correct form endpoint for that deploy.
    process.env.URL = "https://ytpr.netlify.app";
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    const response = await handler(allowedRequest(validBody));

    expect(response.statusCode).toBe(204);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    const payload = new URLSearchParams(String(options?.body));
    expect(url).toBe("https://deploy-preview-11--ytpr.netlify.app/");
    expect(options).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    expect(Object.fromEntries(payload)).toEqual({
      "form-name": "ytpr-feedback",
      sentiment: "yes",
      "use-case": "study-course",
      helpful: "duration-speed,search-sort",
      missing: "schedule-calendar",
      "offer-response": "maybe",
      comment: "A calendar export would help.",
      source: "producthunt",
      "bot-field": "",
    });
    expect(String(options?.body)).not.toContain("playlistId");
  });

  it("returns a stable error when form storage is unavailable", async () => {
    process.env.URL = "https://ytpr.netlify.app";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 })
    );

    const response = await handler(allowedRequest(validBody));

    expect(response.statusCode).toBe(503);
    expect(jsonBody(response)).toEqual({ error: "feedback_unavailable" });
  });

  it("opportunistically deletes feedback older than 90 days", async () => {
    process.env.URL = "https://ytpr.netlify.app";
    process.env.NETLIFY_ACCESS_TOKEN = "server-only-token";
    process.env.SITE_ID = "site-id";
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: `old-${index + 1}`,
      created_at: "2026-01-01T00:00:00Z",
    }));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input, init) => {
        const url = String(input);
        if (url === "https://ytpr.netlify.app/") {
          return new Response(null, { status: 200 });
        }
        if (url.endsWith("/sites/site-id/forms")) {
          return new Response(
            JSON.stringify([{ id: "form-id", name: "ytpr-feedback" }]),
            { status: 200 }
          );
        }
        if (url.includes("submissions?page=1")) {
          return new Response(JSON.stringify(firstPage), { status: 200 });
        }
        if (url.includes("submissions?page=2")) {
          return new Response(
            JSON.stringify([
              { id: "old-101", created_at: "2026-01-01T00:00:00Z" },
              { id: "new-id", created_at: "2026-09-01T00:00:00Z" },
            ]),
            { status: 200 }
          );
        }
        if (init?.method === "DELETE") {
          return new Response(null, { status: 204 });
        }
        return new Response(null, { status: 500 });
      }
    );

    const response = await handler(productionRequest(validBody));

    expect(response.statusCode).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.netlify.com/api/v1/submissions/old-1",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer server-only-token" },
      })
    );
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).endsWith("/new-id"))
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.netlify.com/api/v1/submissions/old-101",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

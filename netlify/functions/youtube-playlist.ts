const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const PRODUCTION_ORIGIN = "https://ytpr.netlify.app";
const LOCAL_ORIGINS = new Set([
  "http://127.0.0.1:5001",
  "http://localhost:5001",
]);
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,150}$/;
const UPSTREAM_TIMEOUT_MS = 10_000;

type PlaylistResource = "details" | "report";

export interface FunctionRequest {
  httpMethod?: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
}

export interface FunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface RequestBody {
  playlistId: string;
  resource: PlaylistResource;
}

interface UpstreamPage {
  items?: unknown;
  nextPageToken?: unknown;
}

export const config = {
  path: "/api/youtube-playlist",
  // The edge-enforced limit protects both YouTube quota and free-tier usage.
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
  },
} as const;

const headerValue = (
  headers: FunctionRequest["headers"],
  requestedName: string
) => {
  const match = Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === requestedName.toLowerCase()
  );
  return match?.[1];
};

const isAllowedOrigin = (origin: string | undefined) => {
  if (!origin) {
    return false;
  }

  if (origin === PRODUCTION_ORIGIN || LOCAL_ORIGINS.has(origin)) {
    return true;
  }

  return /^https:\/\/deploy-preview-\d+--ytpr\.netlify\.app$/.test(origin);
};

const responseHeaders = (origin?: string) => ({
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  Vary: "Origin",
  ...(origin && isAllowedOrigin(origin)
    ? { "Access-Control-Allow-Origin": origin }
    : {}),
});

const jsonResponse = (
  statusCode: number,
  body: unknown,
  origin?: string,
  extraHeaders: Record<string, string> = {}
): FunctionResponse => ({
  statusCode,
  headers: { ...responseHeaders(origin), ...extraHeaders },
  body: JSON.stringify(body),
});

const errorResponse = (
  statusCode: number,
  error: string,
  origin?: string,
  extraHeaders: Record<string, string> = {}
) => jsonResponse(statusCode, { error }, origin, extraHeaders);

const parseRequestBody = (body: string | null | undefined): RequestBody | null => {
  if (!body || body.length > 1_024) {
    return null;
  }

  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    const playlistId = parsed.playlistId;
    const resource = parsed.resource;

    if (
      typeof playlistId !== "string" ||
      !PLAYLIST_ID_PATTERN.test(playlistId) ||
      (resource !== "details" && resource !== "report")
    ) {
      return null;
    }

    return { playlistId, resource };
  } catch {
    return null;
  }
};

const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};

const stringValue = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const numberValue = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const sanitizeThumbnails = (value: unknown) =>
  Object.fromEntries(
    Object.entries(record(value))
      .filter(([size]) =>
        ["default", "medium", "high", "standard", "maxres"].includes(size)
      )
      .map(([size, thumbnail]) => {
        const item = record(thumbnail);
        return [
          size,
          {
            url: stringValue(item.url),
            width: numberValue(item.width),
            height: numberValue(item.height),
          },
        ];
      })
  );

const sanitizePlaylist = (value: unknown) => {
  const item = record(value);
  const snippet = record(item.snippet);

  return {
    id: stringValue(item.id),
    title: stringValue(snippet.title),
    description: stringValue(snippet.description),
    thumbnails: sanitizeThumbnails(snippet.thumbnails),
  };
};

const sanitizeVideo = (value: unknown) => {
  const item = record(value);
  const snippet = record(item.snippet);
  const localized = record(snippet.localized);
  const statistics = record(item.statistics);
  const contentDetails = record(item.contentDetails);
  const tags = Array.isArray(snippet.tags)
    ? snippet.tags.filter((tag): tag is string => typeof tag === "string")
    : undefined;

  return {
    kind: stringValue(item.kind),
    etag: stringValue(item.etag),
    id: stringValue(item.id),
    snippet: {
      publishedAt: stringValue(snippet.publishedAt),
      channelId: stringValue(snippet.channelId),
      title: stringValue(snippet.title),
      description: stringValue(snippet.description),
      thumbnails: sanitizeThumbnails(snippet.thumbnails),
      channelTitle: stringValue(snippet.channelTitle),
      ...(tags ? { tags } : {}),
      categoryId: stringValue(snippet.categoryId),
      liveBroadcastContent: stringValue(snippet.liveBroadcastContent, "none"),
      localized: {
        title: stringValue(localized.title, stringValue(snippet.title)),
        description: stringValue(
          localized.description,
          stringValue(snippet.description)
        ),
      },
    },
    statistics: {
      viewCount: stringValue(statistics.viewCount, "0"),
      likeCount: stringValue(statistics.likeCount, "0"),
      favoriteCount: stringValue(statistics.favoriteCount, "0"),
      commentCount: stringValue(statistics.commentCount, "0"),
    },
    contentDetails: {
      duration: stringValue(contentDetails.duration),
    },
  };
};

const parseDuration = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return (
    Number(match?.[1] ?? 0) * 3_600 +
    Number(match?.[2] ?? 0) * 60 +
    Number(match?.[3] ?? 0)
  );
};

const formatDuration = (seconds: number) => {
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
};

const youtubeRequest = async (
  resource: string,
  parameters: Record<string, string>,
  apiKey: string
) => {
  const search = new URLSearchParams({ ...parameters, key: apiKey });
  const response = await fetch(`${YOUTUBE_API_BASE_URL}/${resource}?${search}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error("YouTube request failed");
  }

  return (await response.json()) as UpstreamPage;
};

const fetchPlaylistDetails = async (playlistId: string, apiKey: string) => {
  const data = await youtubeRequest(
    "playlists",
    { part: "snippet", id: playlistId },
    apiKey
  );
  const items = Array.isArray(data.items) ? data.items : [];

  return items.length > 0 ? sanitizePlaylist(items[0]) : null;
};

const fetchPlaylistVideoIds = async (playlistId: string, apiKey: string) => {
  const videoIds: string[] = [];
  let nextPageToken: string | undefined;

  do {
    const data = await youtubeRequest(
      "playlistItems",
      {
        part: "contentDetails",
        playlistId,
        maxResults: "50",
        ...(nextPageToken ? { pageToken: nextPageToken } : {}),
      },
      apiKey
    );
    const items = Array.isArray(data.items) ? data.items : [];

    for (const value of items) {
      const videoId = stringValue(record(record(value).contentDetails).videoId);
      if (videoId) videoIds.push(videoId);
    }

    nextPageToken = stringValue(data.nextPageToken) || undefined;
  } while (nextPageToken);

  return videoIds;
};

const fetchVideoDetails = async (videoIds: string[], apiKey: string) => {
  const chunks: string[][] = [];
  for (let index = 0; index < videoIds.length; index += 50) {
    chunks.push(videoIds.slice(index, index + 50));
  }

  const pages = await Promise.all(
    chunks.map((ids) =>
      youtubeRequest(
        "videos",
        {
          part: "contentDetails,snippet,statistics",
          id: ids.join(","),
        },
        apiKey
      )
    )
  );

  return pages.flatMap((page) =>
    (Array.isArray(page.items) ? page.items : []).map(sanitizeVideo)
  );
};

const fetchPlaylistReport = async (playlistId: string, apiKey: string) => {
  const videoIds = await fetchPlaylistVideoIds(playlistId, apiKey);
  const videos = await fetchVideoDetails(videoIds, apiKey);
  const totalDuration = videos.reduce(
    (total, video) => total + parseDuration(video.contentDetails.duration),
    0
  );

  return {
    videos,
    duration: formatDuration(totalDuration),
    avgDuration: videos.length
      ? formatDuration(Math.round(totalDuration / videos.length))
      : "",
  };
};

export async function handler(
  request: FunctionRequest = {}
): Promise<FunctionResponse> {
  const origin = headerValue(request.headers, "origin");

  if (request.httpMethod === "OPTIONS") {
    if (!isAllowedOrigin(origin)) {
      return errorResponse(403, "forbidden");
    }

    return {
      statusCode: 204,
      headers: {
        ...responseHeaders(origin),
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (request.httpMethod !== "POST") {
    return errorResponse(405, "method_not_allowed", origin, {
      Allow: "POST, OPTIONS",
    });
  }

  if (!isAllowedOrigin(origin)) {
    return errorResponse(403, "forbidden");
  }

  const body = parseRequestBody(request.body);
  if (!body) {
    return errorResponse(400, "invalid_request", origin);
  }

  // Keep the former variable as a temporary server-only migration fallback.
  const apiKey =
    process.env.YT_API_KEY?.trim() || process.env.VITE_YT_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse(503, "service_unavailable", origin);
  }

  try {
    if (body.resource === "details") {
      const details = await fetchPlaylistDetails(body.playlistId, apiKey);
      return details
        ? jsonResponse(200, details, origin)
        : errorResponse(404, "playlist_unavailable", origin);
    }

    return jsonResponse(
      200,
      await fetchPlaylistReport(body.playlistId, apiKey),
      origin
    );
  } catch {
    return errorResponse(502, "upstream_unavailable", origin);
  }
}

const REPOSITORY_OWNER = "buneeIsSlo";
const REPOSITORY_NAME = "yt-playlist-report";
const GITHUB_TIMEOUT_MS = 5_000;
const NETLIFY_CACHE_CONTROL =
  "public, durable, s-maxage=86400, stale-while-revalidate=3600";

export interface FunctionRequest {
  httpMethod?: string;
}

export interface FunctionResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

interface GitHubRepositoryResponse {
  stargazers_count?: unknown;
}

const successResponse = (count: number): FunctionResponse => ({
  statusCode: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=0, must-revalidate",
    "Netlify-CDN-Cache-Control": NETLIFY_CACHE_CONTROL,
  },
  body: JSON.stringify({ count }),
});

const errorResponse = (
  statusCode: number,
  headers: Record<string, string> = {}
): FunctionResponse => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...headers,
  },
  body: JSON.stringify({}),
});

export async function handler(
  request: FunctionRequest = {}
): Promise<FunctionResponse> {
  if (request.httpMethod && request.httpMethod !== "GET") {
    return errorResponse(405, { Allow: "GET" });
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPOSITORY_OWNER}/${REPOSITORY_NAME}`,
      {
        headers,
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      }
    );

    if (!response.ok) {
      return errorResponse(502);
    }

    const repository = (await response.json()) as GitHubRepositoryResponse;
    const count = repository.stargazers_count;

    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return errorResponse(502);
    }

    return successResponse(count);
  } catch {
    return errorResponse(502);
  }
}

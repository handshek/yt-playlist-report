const PRODUCTION_ORIGIN = "https://ytpr.netlify.app";
const LOCAL_ORIGINS = new Set([
  "http://127.0.0.1:5001",
  "http://localhost:5001",
]);

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

export const headerValue = (
  headers: FunctionRequest["headers"],
  requestedName: string
) => {
  const match = Object.entries(headers ?? {}).find(
    ([name]) => name.toLowerCase() === requestedName.toLowerCase()
  );
  return match?.[1];
};

export const isAllowedOrigin = (
  origin: string | undefined
): origin is string => {
  if (!origin) return false;
  if (origin === PRODUCTION_ORIGIN || LOCAL_ORIGINS.has(origin)) return true;

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

export const jsonResponse = (
  statusCode: number,
  body: unknown,
  origin?: string,
  extraHeaders: Record<string, string> = {}
): FunctionResponse => ({
  statusCode,
  headers: { ...responseHeaders(origin), ...extraHeaders },
  body: body === undefined ? "" : JSON.stringify(body),
});

export const errorResponse = (
  statusCode: number,
  error: string,
  origin?: string,
  extraHeaders: Record<string, string> = {}
) => jsonResponse(statusCode, { error }, origin, extraHeaders);

export const preflightResponse = (origin: string) =>
  jsonResponse(204, undefined, origin, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });

export const handleWebRequest = async (
  request: Request,
  functionHandler: (
    request: FunctionRequest
  ) => Promise<FunctionResponse>
) => {
  const result = await functionHandler({
    httpMethod: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.text(),
  });

  return new Response(result.body || null, {
    status: result.statusCode,
    headers: result.headers,
  });
};

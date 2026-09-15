import {
  isFeedbackSubmission,
  type FeedbackSubmission,
} from "../../src/lib/feedback-contract";
import {
  errorResponse,
  handleWebRequest,
  headerValue,
  isAllowedOrigin,
  jsonResponse,
  preflightResponse,
  type FunctionRequest,
  type FunctionResponse,
} from "./shared/http";

const FEEDBACK_FORM_NAME = "ytpr-feedback";
const MAX_REQUEST_LENGTH = 2_048;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1_000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const NETLIFY_API_BASE_URL = "https://api.netlify.com/api/v1";
let lastCleanupAttempt = 0;

export const config = {
  path: "/api/feedback",
  // Feedback is deliberately low-volume; this limits free-tier abuse.
  rateLimit: {
    windowLimit: 10,
    windowSize: 3_600,
    aggregateBy: ["ip", "domain"],
  },
} as const;

const parseBody = (body: string | null | undefined) => {
  if (!body || body.length > MAX_REQUEST_LENGTH) return null;

  try {
    const parsed: unknown = JSON.parse(body);
    return isFeedbackSubmission(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const formBody = (submission: FeedbackSubmission) =>
  new URLSearchParams({
    "form-name": FEEDBACK_FORM_NAME,
    sentiment: submission.sentiment,
    "use-case": submission.useCase,
    helpful: submission.helpful.join(","),
    missing: submission.missing.join(","),
    "offer-response": submission.offerResponse,
    comment: submission.comment.trim(),
    source: submission.source ?? "unattributed",
    "bot-field": "",
  });

const netlifyApiRequest = (
  path: string,
  token: string,
  init: RequestInit = {}
) =>
  fetch(`${NETLIFY_API_BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5_000),
  });

const deleteExpiredFeedback = async () => {
  const token = process.env.NETLIFY_ACCESS_TOKEN?.trim();
  const siteId = process.env.SITE_ID?.trim();
  const now = Date.now();

  if (!token || !siteId || now - lastCleanupAttempt < CLEANUP_INTERVAL_MS) {
    return;
  }
  lastCleanupAttempt = now;

  const formsResponse = await netlifyApiRequest(
    `/sites/${encodeURIComponent(siteId)}/forms`,
    token
  );
  if (!formsResponse.ok) return;

  const forms: unknown = await formsResponse.json();
  const form = Array.isArray(forms)
    ? forms.find(
        (item) =>
          item !== null &&
          typeof item === "object" &&
          "name" in item &&
          item.name === FEEDBACK_FORM_NAME &&
          "id" in item &&
          typeof item.id === "string"
      )
    : null;
  if (!form || !("id" in form) || typeof form.id !== "string") return;

  const cutoff = now - RETENTION_MS;
  const expiredIds: string[] = [];

  for (let page = 1; ; page += 1) {
    const submissionsResponse = await netlifyApiRequest(
      `/forms/${encodeURIComponent(form.id)}/submissions?page=${page}&per_page=100`,
      token
    );
    if (!submissionsResponse.ok) return;

    const submissions: unknown = await submissionsResponse.json();
    if (!Array.isArray(submissions)) return;

    expiredIds.push(...submissions.flatMap((item) => {
      if (
        item === null ||
        typeof item !== "object" ||
        !("id" in item) ||
        typeof item.id !== "string" ||
        !("created_at" in item) ||
        typeof item.created_at !== "string"
      ) {
        return [];
      }

      const createdAt = Date.parse(item.created_at);
      return Number.isFinite(createdAt) && createdAt < cutoff ? [item.id] : [];
    }));

    if (submissions.length < 100) break;
  }

  // Collect before deleting so page shifts cannot skip older submissions.
  await Promise.all(
    expiredIds.map((id) =>
      netlifyApiRequest(`/submissions/${encodeURIComponent(id)}`, token, {
        method: "DELETE",
      })
    )
  );
};

export async function handleFeedbackRequest(
  request: FunctionRequest = {}
): Promise<FunctionResponse> {
  const origin = headerValue(request.headers, "origin");

  if (request.httpMethod === "OPTIONS") {
    return isAllowedOrigin(origin)
      ? preflightResponse(origin)
      : errorResponse(403, "forbidden");
  }

  if (request.httpMethod !== "POST") {
    return errorResponse(405, "method_not_allowed", origin, {
      Allow: "POST, OPTIONS",
    });
  }

  if (!isAllowedOrigin(origin)) {
    return errorResponse(403, "forbidden");
  }

  const submission = parseBody(request.body);
  if (!submission) {
    return errorResponse(400, "invalid_request", origin);
  }

  if (submission.honeypot) {
    return jsonResponse(202, undefined, origin);
  }

  // The strict origin allowlist above makes the current deploy the safe form
  // destination, including previews whose URL env can point at production.
  const destination = origin;

  try {
    const response = await fetch(`${destination}/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody(submission).toString(),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return errorResponse(503, "feedback_unavailable", origin);
    }

    // Cleanup is bounded and opportunistic, so no scheduler is required.
    await deleteExpiredFeedback().catch(() => undefined);
    return jsonResponse(204, undefined, origin);
  } catch {
    return errorResponse(503, "feedback_unavailable", origin);
  }
}

// The default export activates Netlify's path and rate-limit configuration.
export default (request: Request) =>
  handleWebRequest(request, handleFeedbackRequest);

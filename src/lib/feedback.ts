import {
  FEEDBACK_HELPFUL_REASONS,
  FEEDBACK_MISSING_REASONS,
  FEEDBACK_SENTIMENTS,
  FEEDBACK_USE_CASES,
  OFFER_RESPONSES,
  isAcquisitionSource,
  type AcquisitionSource,
  type FeedbackHelpfulReason,
  type FeedbackMissingReason,
  type FeedbackSentiment,
  type FeedbackUseCase,
  type OfferResponse,
} from "./seo-events";

export const FEEDBACK_FORM_NAME = "ytpr-feedback";
export const FEEDBACK_COMMENT_MAX_LENGTH = 500;

export interface FeedbackSubmission {
  sentiment: FeedbackSentiment;
  useCase: FeedbackUseCase;
  helpful: FeedbackHelpfulReason[];
  missing: FeedbackMissingReason[];
  offerResponse: OfferResponse;
  comment: string;
  source: AcquisitionSource | null;
  honeypot: string;
}

const allowedSentiments = new Set<string>(FEEDBACK_SENTIMENTS);
const allowedUseCases = new Set<string>(FEEDBACK_USE_CASES);
const allowedHelpful = new Set<string>(FEEDBACK_HELPFUL_REASONS);
const allowedMissing = new Set<string>(FEEDBACK_MISSING_REASONS);
const allowedOfferResponses = new Set<string>(OFFER_RESPONSES);

const hasOnly = (values: readonly string[], allowed: Set<string>) =>
  values.every((value) => allowed.has(value));

const isValidSubmission = (submission: FeedbackSubmission) =>
  allowedSentiments.has(submission.sentiment) &&
  allowedUseCases.has(submission.useCase) &&
  hasOnly(submission.helpful, allowedHelpful) &&
  hasOnly(submission.missing, allowedMissing) &&
  allowedOfferResponses.has(submission.offerResponse) &&
  submission.comment.length <= FEEDBACK_COMMENT_MAX_LENGTH &&
  (!submission.source || isAcquisitionSource(submission.source)) &&
  submission.honeypot.length === 0;

export const submitFeedback = async (submission: FeedbackSubmission) => {
  if (!isValidSubmission(submission)) {
    throw new Error("invalid_feedback");
  }

  const body = new URLSearchParams({
    "form-name": FEEDBACK_FORM_NAME,
    sentiment: submission.sentiment,
    "use-case": submission.useCase,
    helpful: submission.helpful.join(","),
    missing: submission.missing.join(","),
    "offer-response": submission.offerResponse,
    comment: submission.comment.trim(),
    source: submission.source ?? "unattributed",
    "bot-field": submission.honeypot,
  });

  const response = await fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("feedback_unavailable");
  }
};

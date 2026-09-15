import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  isFeedbackSubmission,
  type FeedbackSubmission,
} from "./feedback-contract";

export const FEEDBACK_FORM_NAME = "ytpr-feedback";
export { FEEDBACK_COMMENT_MAX_LENGTH };
export type { FeedbackSubmission };

export const submitFeedback = async (submission: FeedbackSubmission) => {
  if (!isFeedbackSubmission(submission) || submission.honeypot) {
    throw new Error("invalid_feedback");
  }

  const response = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    throw new Error("feedback_unavailable");
  }
};

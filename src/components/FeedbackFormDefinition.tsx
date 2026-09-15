import { FEEDBACK_FORM_NAME } from "@/lib/feedback";

const FeedbackFormDefinition = () => (
  <form
    name={FEEDBACK_FORM_NAME}
    method="POST"
    data-netlify="true"
    data-netlify-honeypot="bot-field"
    hidden
    aria-hidden="true"
  >
    <input type="hidden" name="form-name" value={FEEDBACK_FORM_NAME} />
    <input name="bot-field" />
    <input name="sentiment" />
    <input name="use-case" />
    <input name="helpful" />
    <input name="missing" />
    <input name="offer-response" />
    <textarea name="comment" />
    <input name="source" />
  </form>
);

export default FeedbackFormDefinition;

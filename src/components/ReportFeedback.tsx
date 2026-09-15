import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { Check, MessageCircle, X } from "lucide-react";
import {
  FEEDBACK_COMMENT_MAX_LENGTH,
  FEEDBACK_FORM_NAME,
  submitFeedback,
} from "@/lib/feedback";
import {
  getAcquisitionSource,
  trackSeoEvent,
  type FeedbackHelpfulReason,
  type FeedbackMissingReason,
  type FeedbackSentiment,
  type FeedbackUseCase,
  type OfferResponse,
} from "@/lib/seo-events";

const FEEDBACK_SUBMITTED_KEY = "ytpr:feedback-submitted";

const USE_CASE_OPTIONS: Array<{ value: FeedbackUseCase; label: string }> = [
  { value: "study-course", label: "Study or course" },
  { value: "teaching-training", label: "Teaching or training" },
  { value: "creator-marketing", label: "Creator or marketing" },
  { value: "music", label: "Music" },
  { value: "research", label: "Research" },
  { value: "other", label: "Other" },
];

const HELPFUL_OPTIONS: Array<{
  value: FeedbackHelpfulReason;
  label: string;
}> = [
  { value: "duration-speed", label: "Duration and playback speed" },
  { value: "detailed-stats", label: "Detailed statistics" },
  { value: "search-sort", label: "Search and sorting" },
  { value: "video-range", label: "Video range" },
  { value: "sharing", label: "Sharing" },
];

const MISSING_OPTIONS: Array<{
  value: FeedbackMissingReason;
  label: string;
}> = [
  { value: "export-download", label: "Export or download" },
  { value: "schedule-calendar", label: "Schedule or calendar" },
  { value: "monitoring-alerts", label: "Monitoring or alerts" },
  { value: "private-unlisted", label: "Private or unlisted playlists" },
  { value: "playlist-comparison", label: "Compare playlists" },
  { value: "other", label: "Something else" },
];

const OFFER_OPTIONS: Array<{ value: OfferResponse; label: string }> = [
  { value: "yes", label: "Yes, I would pay $7.99" },
  { value: "maybe", label: "Maybe, I might pay $7.99" },
  { value: "no", label: "No, I would not pay $7.99" },
];

interface ChoiceButtonProps {
  selected: boolean;
  children: React.ReactNode;
  onClick: () => void;
}

const ChoiceButton = ({ selected, children, onClick }: ChoiceButtonProps) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`min-h-10 rounded-full border px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none ${
      selected
        ? "border-red-600 bg-red-600 text-white"
        : "border-neutral-300 bg-white text-neutral-700 hover:border-red-300 hover:bg-red-50"
    }`}
  >
    {children}
  </button>
);

const ReportFeedback = () => {
  const [sentiment, setSentiment] = useState<FeedbackSentiment | null>(null);
  const [useCase, setUseCase] = useState<FeedbackUseCase | null>(null);
  const [helpful, setHelpful] = useState<FeedbackHelpfulReason[]>([]);
  const [missing, setMissing] = useState<FeedbackMissingReason[]>([]);
  const [offerResponse, setOfferResponse] = useState<OfferResponse | null>(null);
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [hasOpened, setHasOpened] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedOpen = useRef(false);
  const trackedOfferView = useRef(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const offerRef = useRef<HTMLFieldSetElement>(null);
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    try {
      setIsSubmitted(
        window.sessionStorage.getItem(FEEDBACK_SUBMITTED_KEY) === "true"
      );
    } catch {
      // Feedback remains available when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    }
  }, [hasOpened, isOpen]);

  const markOfferViewed = useCallback(() => {
    if (trackedOfferView.current) return;
    trackedOfferView.current = true;
    trackSeoEvent({ name: "offer_view" });
  }, []);

  useEffect(() => {
    const offer = offerRef.current;
    if (
      !isOpen ||
      !offer ||
      trackedOfferView.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5
          )
        ) {
          markOfferViewed();
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(offer);

    return () => observer.disconnect();
  }, [isOpen, markOfferViewed]);

  const openFeedback = (answer: FeedbackSentiment) => {
    setSentiment(answer);
    setHasOpened(true);
    setIsOpen(true);
    setError(null);

    if (!trackedOpen.current) {
      trackedOpen.current = true;
      trackSeoEvent({ name: "feedback_open" });
    }
  };

  const toggleHelpful = (value: FeedbackHelpfulReason) => {
    setHelpful((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const toggleMissing = (value: FeedbackMissingReason) => {
    setMissing((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sentiment || !useCase || !offerResponse) {
      setError("Choose a use case and a price answer before sending.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitFeedback({
        sentiment,
        useCase,
        helpful,
        missing,
        offerResponse,
        comment,
        source: getAcquisitionSource(),
        honeypot,
      });
      trackSeoEvent({
        name: "feedback_submit",
        sentiment,
        useCase,
        helpful,
        missing,
      });
      trackSeoEvent({ name: "offer_response", response: offerResponse });

      try {
        window.sessionStorage.setItem(FEEDBACK_SUBMITTED_KEY, "true");
      } catch {
        // The in-memory submitted state still prevents an immediate duplicate.
      }

      setIsSubmitted(true);
      setIsOpen(false);
    } catch {
      setError("Feedback could not be sent. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) setIsOpen(false);
  };

  if (isSubmitted) {
    return (
      <section className="my-10 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center text-emerald-950">
        <Check className="mx-auto size-5" aria-hidden="true" />
        <p className="mt-2 font-black">Thanks — that helps shape YTPR.</p>
      </section>
    );
  }

  return (
    <>
      <section className="my-10 rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-6 text-center shadow-sm">
        <MessageCircle className="mx-auto size-6 text-red-600" aria-hidden="true" />
        <h2 className="mt-2 text-xl font-black text-neutral-950">
          Was this report useful?
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          Two clicks can help decide what YTPR builds next.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            ref={yesButtonRef}
            type="button"
            onClick={() => openFeedback("yes")}
            className="min-h-11 rounded-full bg-red-600 px-6 font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            Yes, this was useful
          </button>
          <button
            type="button"
            onClick={() => openFeedback("no")}
            className="min-h-11 rounded-full border border-neutral-300 bg-white px-6 font-bold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
          >
            No, not yet
          </button>
        </div>
      </section>

      {hasOpened && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
          onClick={handleBackdropClick}
          className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-left backdrop:bg-neutral-950/55 backdrop:backdrop-blur-[2px] open:block print:hidden"
        >
          <div
            className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] border border-neutral-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(680px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="relative border-b border-neutral-200 px-5 pb-4 pt-5 sm:px-7">
              <h2 id={titleId} className="pr-12 text-2xl font-black text-neutral-950">
                Help shape what comes next
              </h2>
              <p id={descriptionId} className="mt-1 pr-8 text-sm leading-6 text-neutral-600">
                Pick the closest answers. Only the final note requires typing.
              </p>
              <button
                type="button"
                aria-label="Close feedback dialog"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </header>

            <form
              name={FEEDBACK_FORM_NAME}
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              onSubmit={handleSubmit}
              className="overflow-y-auto px-5 py-5 sm:px-7"
            >
              <input type="hidden" name="form-name" value={FEEDBACK_FORM_NAME} />
              <label className="hidden" aria-hidden="true">
                Leave this empty
                <input
                  name="bot-field"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>

              <fieldset>
                <legend className="font-black text-neutral-950">What are you using it for?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {USE_CASE_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={useCase === option.value}
                      onClick={() => setUseCase(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="font-black text-neutral-950">What helped?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {HELPFUL_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={helpful.includes(option.value)}
                      onClick={() => toggleHelpful(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="font-black text-neutral-950">What is missing?</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {MISSING_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={missing.includes(option.value)}
                      onClick={() => toggleMissing(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <fieldset
                ref={offerRef}
                onFocusCapture={markOfferViewed}
                onMouseEnter={markOfferViewed}
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"
              >
                <legend className="px-1 font-black text-neutral-950">
                  Would you pay $7.99 once for a Playlist Planner Pack?
                </legend>
                <p className="mt-1 text-sm leading-6 text-neutral-700">
                  YTPR would automatically generate a PDF summary, spreadsheet,
                  finish-date schedule, calendar file, and printable checklist.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {OFFER_OPTIONS.map((option) => (
                    <ChoiceButton
                      key={option.value}
                      selected={offerResponse === option.value}
                      onClick={() => setOfferResponse(option.value)}
                    >
                      {option.label}
                    </ChoiceButton>
                  ))}
                </div>
              </fieldset>

              <label htmlFor="feedback-comment" className="mt-6 block font-black text-neutral-950">
                Anything else? (optional)
              </label>
              <textarea
                id="feedback-comment"
                name="comment"
                value={comment}
                maxLength={FEEDBACK_COMMENT_MAX_LENGTH}
                onChange={(event) => setComment(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-xl border border-neutral-300 bg-white p-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                placeholder="A short note is plenty."
              />
              <p className="mt-1 text-right text-xs text-neutral-500">
                {comment.length}/{FEEDBACK_COMMENT_MAX_LENGTH}
              </p>

              {error && (
                <p role="alert" className="mt-4 text-sm font-bold text-red-700">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="min-h-11 rounded-full border border-neutral-300 px-5 font-bold text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  Not now
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-11 rounded-full bg-red-600 px-6 font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting ? "Sending…" : "Send feedback"}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </>
  );
};

export default ReportFeedback;

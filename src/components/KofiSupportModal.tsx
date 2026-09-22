import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react";
import { useLocation } from "react-router";
import { ExternalLink, RotateCcw, X } from "lucide-react";
import kofiCup from "@/assets/kofi-cup.svg";
import { trackPageview } from "@/lib/counterscale";

type SupportSource = "landing" | "report";
type PanelStatus = "idle" | "loading" | "ready" | "failed";
type DialogMode = "prompt" | "support";

interface KofiSupportModalProps {
  reportReady?: boolean;
}

const PLAYLIST_REPORT_PATH = /^\/playlist\/[^/]+\/?$/;
const KOFI_PAGE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const KOFI_PANEL_TIMEOUT_MS = 8_000;
const SUPPORT_PROMPT_SUPPRESSED_KEY = "ytpr.supportPrompt.suppressed.v1";

const isSupportPromptSuppressed = () => {
  try {
    return window.localStorage.getItem(SUPPORT_PROMPT_SUPPRESSED_KEY) === "true";
  } catch {
    return false;
  }
};

const setSupportPromptSuppressed = (suppressed: boolean) => {
  try {
    if (suppressed) {
      window.localStorage.setItem(SUPPORT_PROMPT_SUPPRESSED_KEY, "true");
      return;
    }

    window.localStorage.removeItem(SUPPORT_PROMPT_SUPPRESSED_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
};

const supportSourceForPath = (pathname: string): SupportSource | null => {
  if (pathname === "/") {
    return "landing";
  }

  return PLAYLIST_REPORT_PATH.test(pathname) ? "report" : null;
};

const embeddedSupportUrl = (pageId: string, source: SupportSource) => {
  const url = new URL(`/${encodeURIComponent(pageId)}/`, "https://ko-fi.com");

  url.searchParams.set("hidefeed", "true");
  url.searchParams.set("widget", "true");
  url.searchParams.set("embed", "true");
  url.searchParams.set("utm_source", "ytpr");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", "support");
  url.searchParams.set("utm_content", source);

  return url.toString();
};

const hostedSupportUrl = (pageId: string, source: SupportSource) => {
  const url = new URL(`/${encodeURIComponent(pageId)}/`, "https://ko-fi.com");

  url.searchParams.set("utm_source", "ytpr");
  url.searchParams.set("utm_medium", "app");
  url.searchParams.set("utm_campaign", "support");
  url.searchParams.set("utm_content", source);

  return url.toString();
};

const KofiSupportModal = ({ reportReady = false }: KofiSupportModalProps) => {
  const location = useLocation();
  const source = supportSourceForPath(location.pathname);
  const pageId = import.meta.env.VITE_KOFI_PAGE_ID?.trim();
  const hasValidPageId = Boolean(
    pageId && KOFI_PAGE_ID_PATTERN.test(pageId)
  );
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [suppressPrompt, setSuppressPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [panelStatus, setPanelStatus] = useState<PanelStatus>("idle");
  const [panelAttempt, setPanelAttempt] = useState(0);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const activeRoutePath = useRef(location.pathname);
  const lastTrackedRouteView = useRef<string | null>(null);
  const lastTrackedOpen = useRef<string | null>(null);
  const lastPromptedRouteView = useRef<string | null>(null);
  const lastTrackedPromptDismiss = useRef<string | null>(null);
  const lastTrackedPromptCta = useRef<string | null>(null);
  const lastTrackedPromptOptOut = useRef<string | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const promptTitleRef = useRef<HTMLHeadingElement>(null);
  const supportTitleRef = useRef<HTMLHeadingElement>(null);
  const isCurrentRouteView = activeRoutePath.current === location.pathname;
  const isOpen = dialogMode !== null;

  useEffect(() => {
    if (source && !hasValidPageId && import.meta.env.DEV) {
      console.warn(
        "Ko-fi support is disabled: VITE_KOFI_PAGE_ID is missing or invalid"
      );
    }
  }, [hasValidPageId, source]);

  useEffect(() => {
    if (!source) {
      lastTrackedRouteView.current = null;
      lastTrackedOpen.current = null;
      return;
    }

    if (!hasValidPageId || lastTrackedRouteView.current === location.key) {
      return;
    }

    lastTrackedRouteView.current = location.key;
    trackPageview(`/support/ko-fi/widget?source=${source}`);
  }, [hasValidPageId, location.key, source]);

  useEffect(() => {
    if (activeRoutePath.current === location.pathname) {
      return;
    }

    activeRoutePath.current = location.pathname;
    setDialogMode(null);
    setHasPrompted(false);
    setHasOpened(false);
    setPanelStatus("idle");
    setPanelAttempt(0);
  }, [location.pathname]);

  useEffect(() => {
    if (
      source !== "report" ||
      !reportReady ||
      !hasValidPageId ||
      lastPromptedRouteView.current === location.key
    ) {
      return;
    }

    lastPromptedRouteView.current = location.key;
    const suppressed = isSupportPromptSuppressed();
    setSuppressPrompt(suppressed);

    if (suppressed) {
      return;
    }

    setHasPrompted(true);
    setDialogMode("prompt");
    trackPageview("/support/ko-fi/prompt?source=report");
  }, [hasValidPageId, location.key, reportReady, source]);

  useEffect(() => {
    if (!hasOpened || panelStatus !== "loading") {
      return;
    }

    const timeoutId = window.setTimeout(
      () => setPanelStatus("failed"),
      KOFI_PANEL_TIMEOUT_MS
    );

    return () => window.clearTimeout(timeoutId);
  }, [hasOpened, panelAttempt, panelStatus]);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      lastFocusedElement.current =
        document.activeElement instanceof HTMLElement &&
        document.activeElement !== document.body
          ? document.activeElement
          : launcherRef.current;

      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
      return;
    }

    if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }

      if (lastFocusedElement.current?.isConnected) {
        lastFocusedElement.current.focus();
      }
    }
  }, [dialogMode, hasOpened, isOpen]);

  useEffect(() => {
    if (!isOpen || !dialogRef.current?.open) {
      return;
    }

    if (dialogMode === "prompt") {
      promptTitleRef.current?.focus();
      return;
    }

    supportTitleRef.current?.focus();
  }, [dialogMode, isOpen]);

  if (!source || !hasValidPageId) {
    return null;
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setDialogMode(null);
      return;
    }

    setDialogMode("support");
    if (source === "report") {
      lastPromptedRouteView.current = location.key;
    }
    setHasOpened(true);
    setPanelStatus((currentStatus) =>
      currentStatus === "idle" ? "loading" : currentStatus
    );

    if (lastTrackedOpen.current !== location.key) {
      lastTrackedOpen.current = location.key;
      trackPageview(`/support/ko-fi/open?source=${source}`);
    }
  };

  const dismissPrompt = () => {
    if (lastTrackedPromptDismiss.current !== location.key) {
      lastTrackedPromptDismiss.current = location.key;
      trackPageview("/support/ko-fi/prompt-dismiss?source=report");
    }

    setDialogMode(null);
  };

  const supportFromPrompt = () => {
    if (lastTrackedPromptCta.current !== location.key) {
      lastTrackedPromptCta.current = location.key;
      trackPageview("/support/ko-fi/prompt-cta?source=report");
    }

    handleOpenChange(true);
  };

  const handleSuppressPromptChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSuppressed = event.target.checked;

    setSuppressPrompt(nextSuppressed);
    setSupportPromptSuppressed(nextSuppressed);

    if (
      nextSuppressed &&
      lastTrackedPromptOptOut.current !== location.key
    ) {
      lastTrackedPromptOptOut.current = location.key;
      trackPageview("/support/ko-fi/prompt-opt-out?source=report");
    }
  };

  const retryPanel = () => {
    setPanelAttempt((attempt) => attempt + 1);
    setPanelStatus("loading");
  };

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      if (dialogMode === "prompt") {
        dismissPrompt();
      } else {
        handleOpenChange(false);
      }
    }
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        aria-label="Support YTPR on Ko-fi"
        aria-haspopup="dialog"
        aria-expanded={isCurrentRouteView && dialogMode === "support"}
        onClick={() => handleOpenChange(true)}
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 inline-flex min-h-[52px] items-center gap-2.5 rounded-full border border-red-800/25 bg-red-600 px-4 text-sm font-extrabold tracking-tight text-white shadow-[0_14px_32px_-16px_rgba(15,23,42,0.65)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-[0_18px_36px_-16px_rgba(15,23,42,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none print:hidden"
      >
        <img
          src={kofiCup}
          alt=""
          className="h-6 w-auto shrink-0"
          aria-hidden="true"
        />
        <span className="min-[360px]:hidden">Ko-fi</span>
        <span className="hidden min-[360px]:inline">Support on Ko-fi</span>
      </button>
      {isCurrentRouteView && (isOpen || hasPrompted || hasOpened) && (
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          aria-modal="true"
          onCancel={(event) => {
            event.preventDefault();
            if (dialogMode === "prompt") {
              dismissPrompt();
            } else {
              handleOpenChange(false);
            }
          }}
          onClose={() => setDialogMode(null)}
          onClick={handleBackdropClick}
          className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-left backdrop:bg-neutral-950/55 backdrop:backdrop-blur-[2px] open:block motion-reduce:backdrop:backdrop-blur-none print:hidden"
        >
          {dialogMode === "prompt" ? (
            <div
              data-mobile-presentation="sheet"
              data-desktop-presentation="dialog"
              className="fixed inset-x-2 bottom-[env(safe-area-inset-bottom)] z-[60] overflow-hidden rounded-t-[28px] border border-neutral-200 bg-white shadow-[0_30px_100px_-24px_rgba(0,0,0,0.55)] outline-none animate-in fade-in-0 slide-in-from-bottom-5 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:zoom-in-95 motion-reduce:animate-none"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="h-1.5 bg-red-600" aria-hidden="true" />
              <div className="relative px-5 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">
                <button
                  type="button"
                  aria-label="Close support prompt"
                  onClick={dismissPrompt}
                  className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
                <div className="flex items-center gap-3 pr-10">
                  <span className="grid size-12 shrink-0 place-items-center rounded-[18px] bg-red-50 ring-1 ring-red-100">
                    <img
                      src={kofiCup}
                      alt=""
                      aria-hidden="true"
                      className="h-6 w-auto"
                    />
                  </span>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-red-700">
                    A small thank-you
                  </p>
                </div>
                <h2
                  ref={promptTitleRef}
                  id={titleId}
                  tabIndex={-1}
                  className="mt-5 text-2xl font-black tracking-tight text-neutral-950 outline-none sm:text-3xl"
                >
                  Did this report help?
                </h2>
                <p
                  id={descriptionId}
                  className="mt-3 max-w-md text-[15px] leading-6 text-neutral-600 sm:text-base"
                >
                  If YTPR saved you a little time, you can help keep it useful,
                  ad-free, and improving. No pressure—your report is ready
                  either way.
                </p>
              </div>
              <div className="flex flex-col-reverse gap-4 border-t border-neutral-200 bg-neutral-50/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-neutral-600">
                  <input
                    type="checkbox"
                    checked={suppressPrompt}
                    onChange={handleSuppressPromptChange}
                    className="size-4 rounded border-neutral-300 accent-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                  />
                  Don’t show this again in this browser
                </label>
                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-[106px_124px]">
                  <button
                    type="button"
                    onClick={dismissPrompt}
                    className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-neutral-300 bg-white px-4 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                  >
                    Maybe later
                  </button>
                  <button
                    type="button"
                    onClick={supportFromPrompt}
                    className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full bg-red-600 px-4 text-sm font-extrabold text-white shadow-sm transition-[background-color,transform] hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    Support YTPR
                  </button>
                </div>
              </div>
            </div>
          ) : hasOpened ? (
            <div
              className="fixed inset-x-2 bottom-[env(safe-area-inset-bottom)] z-[60] flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] border border-neutral-200 bg-white shadow-[0_30px_100px_-24px_rgba(0,0,0,0.55)] outline-none animate-in fade-in-0 slide-in-from-bottom-5 sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(480px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:zoom-in-95 motion-reduce:animate-none"
              onClick={(event) => event.stopPropagation()}
            >
            <div className="relative border-b border-neutral-200 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-center gap-3 pr-10">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-red-600 shadow-sm">
                  <img
                    src={kofiCup}
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-auto"
                  />
                </span>
                <div>
                  <h2
                    ref={supportTitleRef}
                    id={titleId}
                    tabIndex={-1}
                    className="text-xl font-black tracking-tight text-neutral-950 sm:text-2xl"
                  >
                    Support YTPR
                  </h2>
                  <p
                    id={descriptionId}
                    className="mt-0.5 max-w-sm text-sm leading-5 text-neutral-600"
                  >
                    Hey! I’m the developer behind YTPR. I’m working every day
                    to make it more helpful. Your support means a lot.
                  </p>
                  <a
                    href={hostedSupportUrl(pageId, source)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open Ko-fi directly (opens in a new tab)"
                    onClick={() =>
                      trackPageview(`/outbound/ko-fi?source=${source}`)
                    }
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-red-700 underline decoration-red-200 underline-offset-4 transition-colors hover:text-red-900 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                  >
                    Having trouble? Open Ko-fi directly
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close support dialog"
                onClick={() => handleOpenChange(false)}
                className="absolute right-4 top-4 grid size-10 place-items-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative min-h-[min(610px,calc(92dvh-208px))] flex-1 overflow-hidden bg-neutral-50 sm:min-h-[min(610px,calc(92dvh-152px))]">
              {panelStatus === "loading" && (
                <div className="absolute inset-0 z-10 grid place-content-center bg-neutral-50 text-center">
                  <span
                    className="mx-auto size-8 animate-spin rounded-full border-[3px] border-red-100 border-t-red-600 motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                  <p role="status" className="mt-3 text-sm font-bold text-neutral-700">
                    Loading Ko-fi&hellip;
                  </p>
                </div>
              )}
              {panelStatus === "failed" ? (
                <div
                  role="alert"
                  className="grid h-full min-h-[420px] place-content-center px-8 text-center"
                >
                  <p className="text-lg font-black text-neutral-950">
                    Ko-fi could not load.
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-neutral-600">
                    It may be blocked by a privacy extension or network setting.
                  </p>
                  <div className="mt-6 flex flex-col justify-center gap-3 min-[400px]:flex-row">
                    <button
                      type="button"
                      onClick={retryPanel}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-5 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Retry Ko-fi
                    </button>
                    <a
                      href={hostedSupportUrl(pageId, source)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Continue on Ko-fi (opens in a new tab)"
                      onClick={() =>
                        trackPageview(`/outbound/ko-fi?source=${source}`)
                      }
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-red-600 px-5 text-sm font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 motion-reduce:transition-none"
                    >
                      Continue on Ko-fi
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  key={panelAttempt}
                  title="Support YTPR on Ko-fi"
                  src={embeddedSupportUrl(pageId, source)}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="payment"
                  data-status={panelStatus}
                  onLoad={() => setPanelStatus("ready")}
                  onError={() => setPanelStatus("failed")}
                  className="h-[min(610px,calc(92dvh-208px))] w-full border-0 bg-white sm:h-[min(610px,calc(92dvh-152px))]"
                />
              )}
            </div>
            </div>
          ) : null}
        </dialog>
      )}
    </>
  );
};

export default KofiSupportModal;

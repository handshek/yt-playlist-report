import * as Counterscale from "@counterscale/tracker";

const getAnalyticsConfig = () => ({
  reporterUrl: import.meta.env.VITE_COUNTERSCALE_REPORTER_URL?.trim(),
  siteId: import.meta.env.VITE_COUNTERSCALE_SITE_ID?.trim(),
});

const safeReferrer = () => {
  const sameOriginSentinel = window.location.origin;

  try {
    if (!document.referrer) return sameOriginSentinel;
    const referrer = new URL(document.referrer);

    if (
      (referrer.protocol !== "http:" && referrer.protocol !== "https:") ||
      referrer.origin === sameOriginSentinel
    ) {
      return sameOriginSentinel;
    }

    // Retain source quality without exposing a referrer's path or query data.
    return referrer.origin;
  } catch {
    return sameOriginSentinel;
  }
};

export const trackPageview = (url: string) => {
  const { reporterUrl, siteId } = getAnalyticsConfig();

  if (!reporterUrl || !siteId) {
    return;
  }

  try {
    if (!Counterscale.isInitialized()) {
      Counterscale.init({
        autoTrackPageviews: false,
        reporterUrl,
        siteId,
      });
    }

    // An explicit value prevents fallback to user-controlled query parameters.
    Counterscale.trackPageview({ url, referrer: safeReferrer() });
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn("Counterscale analytics event failed", error);
    }
  }
};

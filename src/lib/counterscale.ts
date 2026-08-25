import * as Counterscale from "@counterscale/tracker";

const getAnalyticsConfig = () => ({
  reporterUrl: import.meta.env.VITE_COUNTERSCALE_REPORTER_URL?.trim(),
  siteId: import.meta.env.VITE_COUNTERSCALE_SITE_ID?.trim(),
});

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

    Counterscale.trackPageview({ url });
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn("Counterscale analytics event failed", error);
    }
  }
};

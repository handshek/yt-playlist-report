import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { trackPageview } from "@/lib/counterscale";
import KofiSupportModal from "@/components/KofiSupportModal";
import type { ReportOutletContext } from "@/lib/report-context";
import {
  captureAcquisitionSource,
  getAcquisitionSource,
} from "@/lib/seo-events";

const PLAYLIST_REPORT_PATH = /^\/playlist\/[^/]+\/?$/;
const RESERVED_EVENT_PATH = /^\/events(?:\/|$)/;

const Analytics = () => {
  const location = useLocation();
  const [readyReportLocationKey, setReadyReportLocationKey] = useState<
    string | null
  >(null);

  const markReportReady = useCallback(() => {
    setReadyReportLocationKey(location.key);
  }, [location.key]);

  const outletContext: ReportOutletContext = { markReportReady };

  useEffect(() => {
    captureAcquisitionSource(location.search);

    if (
      PLAYLIST_REPORT_PATH.test(location.pathname) ||
      RESERVED_EVENT_PATH.test(location.pathname)
    ) {
      return;
    }

    const source = getAcquisitionSource();
    // Keep only the allowlisted source needed for aggregate campaign reporting.
    const pagePath = source
      ? `${location.pathname}?utm_source=${source}`
      : location.pathname;
    trackPageview(pagePath);
  }, [location.pathname, location.search]);

  return (
    <>
      <Outlet context={outletContext} />
      <KofiSupportModal
        reportReady={readyReportLocationKey === location.key}
      />
    </>
  );
};

export default Analytics;

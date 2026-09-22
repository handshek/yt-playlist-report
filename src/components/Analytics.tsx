import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { trackPageview } from "@/lib/counterscale";
import KofiSupportModal from "@/components/KofiSupportModal";
import type { ReportOutletContext } from "@/lib/report-context";

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
    if (
      PLAYLIST_REPORT_PATH.test(location.pathname) ||
      RESERVED_EVENT_PATH.test(location.pathname)
    ) {
      return;
    }

    trackPageview(`${location.pathname}${location.search}`);
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

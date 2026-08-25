import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { trackPageview } from "@/lib/counterscale";

const PLAYLIST_REPORT_PATH = /^\/playlist\/[^/]+\/?$/;

const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (PLAYLIST_REPORT_PATH.test(location.pathname)) {
      return;
    }

    trackPageview(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return <Outlet />;
};

export default Analytics;

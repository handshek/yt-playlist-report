import type { Config } from "@react-router/dev/config";
import {
  COMPARISON_HUB_PATH,
  comparisonPath,
  comparisons,
} from "./src/content/comparisons";

const prerenderPath = (canonicalPath: string) => canonicalPath.slice(0, -1);

export default {
  appDirectory: "src",
  ssr: false,
  // Keep the root splat from short-circuiting lazy discovery during hydration.
  routeDiscovery: { mode: "initial" },
  // Router 7.18 prerenders route-manifest paths, while Netlify serves the
  // generated directories at their canonical trailing-slash URLs.
  prerender: [
    "/",
    prerenderPath(COMPARISON_HUB_PATH),
    ...comparisons.map((comparison) =>
      prerenderPath(comparisonPath(comparison))
    ),
  ],
} satisfies Config;

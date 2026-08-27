import type { Config } from "@react-router/dev/config";
import { comparisonPath, comparisons } from "./src/content/comparisons";

export default {
  appDirectory: "src",
  ssr: false,
  // Keep the root splat from short-circuiting lazy discovery during hydration.
  routeDiscovery: { mode: "initial" },
  prerender: ["/", "/compare", ...comparisons.map(comparisonPath)],
} satisfies Config;

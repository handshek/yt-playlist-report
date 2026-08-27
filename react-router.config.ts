import type { Config } from "@react-router/dev/config";
import { comparisonPath, comparisons } from "./src/content/comparisons";

export default {
  appDirectory: "src",
  ssr: false,
  prerender: ["/", "/compare", ...comparisons.map(comparisonPath)],
} satisfies Config;

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
  new URL("../../src/lib/seo-events.ts", import.meta.url),
  "utf8"
);
const counterscalePatch = await readFile(
  new URL("./counterscale-v3.4.1.patch", import.meta.url),
  "utf8"
);

const extractQuotedValues = (source, pattern, label) => {
  const match = source.match(pattern);
  assert(match, `Could not find the ${label} SEO content-slug allowlist`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map(([, value]) => value);
};

const appSlugs = extractQuotedValues(
  appSource,
  /export const SEO_CONTENT_SLUGS = \[([\s\S]*?)\] as const;/,
  "application"
);
const counterscaleSlugs = extractQuotedValues(
  counterscalePatch,
  /\+const seoContentSlugs = new Set\(\[([\s\S]*?)\+\]\);/,
  "Counterscale"
);

// The app and separately deployed dashboard must accept the same fixed slugs.
assert.deepEqual(
  counterscaleSlugs,
  appSlugs,
  "Application and Counterscale SEO content-slug allowlists differ"
);

console.log(`Verified ${appSlugs.length} shared SEO content slugs.`);

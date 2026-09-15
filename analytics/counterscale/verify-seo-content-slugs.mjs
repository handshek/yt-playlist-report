import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(
  new URL("../../src/lib/seo-events.ts", import.meta.url),
  "utf8"
);
const feedbackContractSource = await readFile(
  new URL("../../src/lib/feedback-contract.ts", import.meta.url),
  "utf8"
);
const counterscalePatch = await readFile(
  new URL("./counterscale-v3.4.1.patch", import.meta.url),
  "utf8"
);

const extractQuotedValues = (source, pattern, label) => {
  const match = source.match(pattern);
  assert(match, `Could not find the ${label} allowlist`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map(([, value]) => value);
};

const sharedAllowlists = [
  ["SEO content slugs", appSource, "SEO_CONTENT_SLUGS", "seoContentSlugs"],
  [
    "acquisition sources",
    feedbackContractSource,
    "ACQUISITION_SOURCES",
    "acquisitionSources",
  ],
  [
    "feedback use cases",
    feedbackContractSource,
    "FEEDBACK_USE_CASES",
    "feedbackUseCases",
  ],
  [
    "helpful feedback reasons",
    feedbackContractSource,
    "FEEDBACK_HELPFUL_REASONS",
    "feedbackHelpfulReasons",
  ],
  [
    "missing feedback reasons",
    feedbackContractSource,
    "FEEDBACK_MISSING_REASONS",
    "feedbackMissingReasons",
  ],
];

for (const [label, source, appName, counterscaleName] of sharedAllowlists) {
  const appValues = extractQuotedValues(
    source,
    new RegExp(`export const ${appName} = \\[([\\s\\S]*?)\\] as const;`),
    `application ${label}`
  );
  const counterscaleValues = extractQuotedValues(
    counterscalePatch,
    new RegExp(`\\+const ${counterscaleName} = new Set\\(\\[([\\s\\S]*?)\\+\\]\\);`),
    `Counterscale ${label}`
  );

  // The separately deployed app and dashboard must accept the same fixed values.
  assert.deepEqual(
    counterscaleValues,
    appValues,
    `Application and Counterscale ${label} allowlists differ`
  );
}

console.log(`Verified ${sharedAllowlists.length} shared analytics allowlists.`);

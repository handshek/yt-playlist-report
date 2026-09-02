import { readFileSync } from "node:fs";
import { join } from "node:path";

const outputDirectory = join(process.cwd(), "build", "client");
const readOutput = (...segments) =>
  readFileSync(join(outputDirectory, ...segments), "utf8");

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const SITE_URL = "https://ytpr.netlify.app";
const COMPARISON_HUB_URL = `${SITE_URL}/compare/`;

const comparisonSlugs = [
  "yt-playlist-report-vs-ytpla",
  "yt-playlist-report-vs-youtube-playlist-analyzer",
  "yt-playlist-report-vs-playlistlength-app",
  "yt-playlist-report-vs-youtubeplaylistlength-org",
  "yt-playlist-report-vs-tunepocket",
];
const comparisonUrls = comparisonSlugs.map(
  (slug) => `${COMPARISON_HUB_URL}${slug}/`
);
const expectedSitemapUrls = [`${SITE_URL}/`, COMPARISON_HUB_URL, ...comparisonUrls];

const canonicalUrl = (html) =>
  html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const openGraphUrl = (html) =>
  html.match(/<meta property="og:url" content="([^"]+)"/)?.[1];
const structuredData = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    ([, json]) => JSON.parse(json)
  );

const homepage = readOutput("index.html");
assert(
  homepage.includes("Free YouTube Playlist Length Calculator &amp; Analyzer"),
  "Homepage must contain the stable playlist calculator H1"
);
assert(
  canonicalUrl(homepage) === `${SITE_URL}/`,
  "Homepage must include its canonical URL"
);

const hub = readOutput("compare", "index.html");
assert(hub.match(/<h1/g)?.length === 1, "Comparison hub must have exactly one H1");
assert(canonicalUrl(hub) === COMPARISON_HUB_URL, "Comparison hub must self-canonicalize to its trailing-slash URL");
assert(openGraphUrl(hub) === COMPARISON_HUB_URL, "Comparison hub Open Graph URL must match its canonical URL");
const hubStructuredData = structuredData(hub).find(
  (data) => data["@type"] === "CollectionPage"
);
assert(hubStructuredData, "Comparison hub must include CollectionPage JSON-LD");
assert(hubStructuredData.url === COMPARISON_HUB_URL, "Comparison hub structured-data URL must match its canonical URL");
assert(
  JSON.stringify(hubStructuredData.mainEntity.itemListElement.map(({ url }) => url)) ===
    JSON.stringify(comparisonUrls),
  "Comparison hub structured data must list every canonical comparison URL"
);

for (const [index, slug] of comparisonSlugs.entries()) {
  const html = readOutput("compare", slug, "index.html");
  const expectedUrl = comparisonUrls[index];
  assert(html.match(/<h1/g)?.length === 1, `${slug} must have exactly one H1`);
  assert(canonicalUrl(html) === expectedUrl, `${slug} must self-canonicalize to its trailing-slash URL`);
  assert(openGraphUrl(html) === expectedUrl, `${slug} Open Graph URL must match its canonical URL`);
  const data = structuredData(html);
  const webPage = data.find((item) => item["@type"] === "WebPage");
  const breadcrumbs = data.find((item) => item["@type"] === "BreadcrumbList");
  assert(webPage?.url === expectedUrl, `${slug} WebPage structured-data URL must match its canonical URL`);
  assert(breadcrumbs, `${slug} must include breadcrumb JSON-LD`);
  assert(
    breadcrumbs.itemListElement[1]?.item === COMPARISON_HUB_URL &&
      breadcrumbs.itemListElement[2]?.item === expectedUrl,
    `${slug} breadcrumb URLs must use canonical trailing-slash URLs`
  );
  assert(html.includes("Sources and methodology"), `${slug} must include visible sources`);
  assert(html.includes("Compare all tools"), `${slug} must include comparison footer navigation`);
}

const robots = readOutput("robots.txt");
const sitemap = readOutput("sitemap.xml");
const notFound = readOutput("404.html");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
  ([, url]) => url
);
assert(robots.includes("Sitemap: https://ytpr.netlify.app/sitemap.xml"), "robots.txt must declare the sitemap");
assert(!sitemap.includes("/playlist/"), "Generated playlist reports must not appear in the sitemap");
assert(sitemapUrls.length === 7, "Sitemap must contain exactly seven URLs");
assert(
  JSON.stringify(sitemapUrls) === JSON.stringify(expectedSitemapUrls),
  "Sitemap must contain only the homepage and canonical comparison URLs"
);
assert(
  sitemapUrls
    .filter((url) => url.startsWith(COMPARISON_HUB_URL))
    .every((url) => url.endsWith("/")),
  "Sitemap must not contain slashless comparison URLs"
);
assert(notFound.includes('content="noindex, follow"'), "404 page must be excluded from search results");

console.log(`Verified homepage, comparison hub, ${comparisonSlugs.length} comparison pages, crawl files, and 404 response document.`);

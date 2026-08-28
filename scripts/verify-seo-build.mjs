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

const comparisonSlugs = [
  "yt-playlist-report-vs-ytpla",
  "yt-playlist-report-vs-youtube-playlist-analyzer",
  "yt-playlist-report-vs-playlistlength-app",
  "yt-playlist-report-vs-youtubeplaylistlength-org",
  "yt-playlist-report-vs-tunepocket",
];

const homepage = readOutput("index.html");
assert(
  homepage.includes("Free YouTube Playlist Length Calculator &amp; Analyzer"),
  "Homepage must contain the stable playlist calculator H1"
);
assert(
  homepage.includes('<link rel="canonical" href="https://ytpr.netlify.app/"'),
  "Homepage must include its canonical URL"
);

const hub = readOutput("compare", "index.html");
assert(hub.match(/<h1/g)?.length === 1, "Comparison hub must have exactly one H1");
assert(hub.includes('"@type":"CollectionPage"'), "Comparison hub must include CollectionPage JSON-LD");

for (const slug of comparisonSlugs) {
  const html = readOutput("compare", slug, "index.html");
  assert(html.match(/<h1/g)?.length === 1, `${slug} must have exactly one H1`);
  assert(html.includes(`<link rel="canonical" href="https://ytpr.netlify.app/compare/${slug}"`), `${slug} must have a canonical URL`);
  assert(html.includes('"@type":"BreadcrumbList"'), `${slug} must include breadcrumb JSON-LD`);
  assert(html.includes("Sources and methodology"), `${slug} must include visible sources`);
  assert(html.includes("Compare all tools"), `${slug} must include comparison footer navigation`);
}

const robots = readOutput("robots.txt");
const sitemap = readOutput("sitemap.xml");
const notFound = readOutput("404.html");
assert(robots.includes("Sitemap: https://ytpr.netlify.app/sitemap.xml"), "robots.txt must declare the sitemap");
assert(!sitemap.includes("/playlist/"), "Generated playlist reports must not appear in the sitemap");
assert(comparisonSlugs.every((slug) => sitemap.includes(slug)), "Sitemap must include every comparison page");
assert(notFound.includes('content="noindex, follow"'), "404 page must be excluded from search results");

console.log(`Verified homepage, comparison hub, ${comparisonSlugs.length} comparison pages, crawl files, and 404 response document.`);

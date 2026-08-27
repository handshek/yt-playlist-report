import { ArrowRight, Check, Scale } from "lucide-react";
import { Link, type MetaFunction } from "react-router";
import JsonLd from "@/components/JsonLd";
import PageShell from "@/components/PageShell";
import { comparisonPath, comparisons } from "@/content/comparisons";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";

const title = "Best YouTube Playlist Analyzers Compared (2026)";
const description =
  "Compare leading YouTube playlist length calculators and analyzers for duration, search, exports, planning, privacy, detailed metrics, and sharing.";

export const meta: MetaFunction = () =>
  pageMeta({ title, description, pathname: "/compare" });

const CompareIndex = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `${SITE_URL}/compare`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: comparisons.map((comparison, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `${SITE_NAME} vs ${comparison.competitorName}`,
        url: `${SITE_URL}${comparisonPath(comparison)}`,
      })),
    },
  };

  return (
    <PageShell>
      <JsonLd data={structuredData} />
      <main>
        <section className="border-b border-neutral-200 py-20 md:py-28">
          <div className="container max-w-5xl">
            <div className="mb-7 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-red-600">
              <Scale className="size-4" /> Independent feature comparisons
            </div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-neutral-950 md:text-7xl">
              Best YouTube Playlist Analyzers Compared
            </h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-neutral-600 md:text-xl">
              Playlist tools can look interchangeable until you need to search a
              200-video course, calculate only the next module, export a CSV, or
              open a private playlist. We compared the workflows that actually
              change which tool is useful—not just which homepage has the
              longest feature list.
            </p>
          </div>
        </section>

        <section className="container max-w-5xl py-14 md:py-20">
          <div className="mb-14 border-l-4 border-red-600 bg-red-50 p-6 md:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">
              Our recommendation: YT Playlist Report
            </p>
            <h2 className="mt-3 text-2xl font-black text-neutral-950 md:text-3xl">
              The best default for analyzing one public playlist
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-neutral-700">
              It combines playlist length, playback-speed planning, selected
              ranges, title search, sortable video metrics, configurable
              columns, and a shareable report URL without asking you to sign in
              or provide a personal API key. The alternatives below still win
              specific categories such as exports, private playlists, and
              multi-playlist totals; each comparison says so plainly.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-800"
            >
              Analyze a playlist free <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid gap-6">
            {comparisons.map((comparison, index) => (
              <article
                key={comparison.slug}
                className="group grid gap-6 border border-neutral-200 bg-white p-6 shadow-sm transition hover:border-red-300 hover:shadow-md md:grid-cols-[4rem_1fr_auto] md:items-center md:p-8"
              >
                <div className="text-5xl font-black text-neutral-200">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                    {comparison.eyebrow}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-neutral-950">
                    YT Playlist Report vs {comparison.competitorName}
                  </h2>
                  <p className="mt-3 max-w-2xl leading-7 text-neutral-600">
                    {comparison.verdict}
                  </p>
                  <div className="mt-4 flex items-start gap-2 text-sm font-medium text-neutral-700">
                    <Check className="mt-0.5 size-4 shrink-0 text-red-600" />
                    Best for: {comparison.bestFor}
                  </div>
                </div>
                <Link
                  to={comparisonPath(comparison)}
                  className="inline-flex items-center gap-2 font-bold text-red-700 group-hover:text-red-900"
                >
                  Read comparison <ArrowRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>

          <section className="mt-16 border-t border-neutral-200 pt-10">
            <h2 className="text-2xl font-black text-neutral-950">
              How these comparisons were made
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-neutral-600">
              We reviewed publicly available product pages, help pages, privacy
              information, and the live YT Playlist Report experience. Feature
              availability can change, so every article includes its review date
              and direct sources. We do not assign fake scores or claim a tool is
              universally best: the recommendation is based on the most common
              job of understanding and planning one public YouTube playlist.
            </p>
          </section>
        </section>
      </main>
    </PageShell>
  );
};

export default CompareIndex;

import { ArrowRight, Check, ExternalLink, Scale, X } from "lucide-react";
import { Link, useParams, type MetaFunction } from "react-router";
import JsonLd from "@/components/JsonLd";
import PageShell from "@/components/PageShell";
import {
  comparisonBySlug,
  comparisonPath,
  comparisons,
} from "@/content/comparisons";
import { pageMeta, SITE_NAME, SITE_URL } from "@/lib/site";

export const meta: MetaFunction = ({ params }) => {
  const comparison = comparisonBySlug.get(params.comparisonSlug ?? "");

  if (!comparison) {
    return pageMeta({
      title: `Comparison Not Found | ${SITE_NAME}`,
      description: "This playlist tool comparison could not be found.",
      pathname: `/compare/${params.comparisonSlug ?? ""}`,
      robots: "noindex, follow",
    });
  }

  return pageMeta({
    title: comparison.seo.title,
    description: comparison.seo.description,
    pathname: comparisonPath(comparison),
  });
};

const Compare = () => {
  const { comparisonSlug = "" } = useParams();
  const comparison = comparisonBySlug.get(comparisonSlug);

  if (!comparison) {
    return (
      <PageShell>
        <main className="container grid min-h-[60vh] max-w-3xl place-content-center py-20 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
            404
          </p>
          <h1 className="mt-3 text-4xl font-black text-neutral-950">
            Comparison not found
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            The comparison may have moved, or the address may be incomplete.
          </p>
          <Link to="/compare" className="mt-7 font-bold text-red-700 underline">
            Browse all comparisons
          </Link>
        </main>
      </PageShell>
    );
  }

  const currentIndex = comparisons.findIndex(
    ({ slug }) => slug === comparison.slug
  );
  const related = [
    comparisons[(currentIndex + 1) % comparisons.length],
    comparisons[(currentIndex + 2) % comparisons.length],
  ];
  const canonical = `${SITE_URL}${comparisonPath(comparison)}`;
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: comparison.seo.title,
      description: comparison.seo.description,
      url: canonical,
      dateModified: "2026-08-27",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Comparisons",
          item: `${SITE_URL}/compare`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `${SITE_NAME} vs ${comparison.competitorName}`,
          item: canonical,
        },
      ],
    },
  ];

  return (
    <PageShell>
      {structuredData.map((data) => (
        <JsonLd key={data["@type"]} data={data} />
      ))}
      <main>
        <article>
          <header className="border-b border-neutral-200 py-10 md:py-16">
            <div className="container max-w-5xl">
              <nav aria-label="Breadcrumb" className="text-sm text-neutral-500">
                <ol className="flex flex-wrap items-center gap-2">
                  <li><Link to="/" className="hover:text-red-700">Home</Link></li>
                  <li aria-hidden="true">/</li>
                  <li><Link to="/compare" className="hover:text-red-700">Comparisons</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{comparison.competitorName}</li>
                </ol>
              </nav>
              <p className="mt-10 text-sm font-bold uppercase tracking-[0.2em] text-red-600">
                {comparison.eyebrow}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-neutral-950 md:text-7xl">
                YT Playlist Report vs {comparison.competitorName}
              </h1>
              <p className="mt-6 text-sm font-medium text-neutral-500">
                Last reviewed {comparison.lastReviewed}
              </p>
              <div className="mt-8 border-l-4 border-red-600 bg-red-50 p-6 md:p-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
                  <Scale className="size-4" /> The verdict
                </div>
                <p className="mt-3 text-xl font-bold leading-8 text-neutral-900 md:text-2xl">
                  {comparison.verdict}
                </p>
              </div>
              <Link
                to="/"
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-800"
              >
                Analyze a playlist free <ArrowRight className="size-4" />
              </Link>
            </div>
          </header>

          <div className="container max-w-5xl py-14 md:py-20">
            <section aria-labelledby="quick-take">
              <h2 id="quick-take" className="text-3xl font-black text-neutral-950">
                The quick take
              </h2>
              <p className="mt-5 max-w-4xl text-lg leading-8 text-neutral-700">
                {comparison.summary}
              </p>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="border border-red-200 bg-red-50/70 p-6">
                  <h3 className="font-black text-neutral-950">Choose YT Playlist Report if</h3>
                  <p className="mt-3 leading-7 text-neutral-700">{comparison.bestFor}</p>
                </div>
                <div className="border border-neutral-200 bg-neutral-50 p-6">
                  <h3 className="font-black text-neutral-950">Choose {comparison.competitorName} if</h3>
                  <p className="mt-3 leading-7 text-neutral-700">{comparison.competitorBestFor}</p>
                </div>
              </div>
            </section>

            <section className="mt-16" aria-labelledby="feature-comparison">
              <h2 id="feature-comparison" className="text-3xl font-black text-neutral-950">
                Feature-by-feature comparison
              </h2>
              <p className="mt-4 max-w-3xl leading-7 text-neutral-600">
                “Winner” means the more convenient implementation for that
                specific job, not a universal product score. A tie means the
                tools solve the need differently or with comparable utility.
              </p>
              <div className="mt-7 overflow-x-auto border border-neutral-200">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-neutral-950 text-white">
                    <tr>
                      <th scope="col" className="p-4">Capability</th>
                      <th scope="col" className="p-4">YT Playlist Report</th>
                      <th scope="col" className="p-4">{comparison.competitorName}</th>
                      <th scope="col" className="p-4">Edge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.featureRows.map((row) => (
                      <tr key={row.feature} className="border-t border-neutral-200 align-top even:bg-neutral-50">
                        <th scope="row" className="p-4 font-bold text-neutral-950">{row.feature}</th>
                        <td className="p-4 text-neutral-700">{row.ytpr}</td>
                        <td className="p-4 text-neutral-700">{row.competitor}</td>
                        <td className="p-4 font-bold text-red-700">{row.winner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-16 grid gap-10 md:grid-cols-2">
              <div>
                <h2 className="text-3xl font-black text-neutral-950">
                  Where YT Playlist Report stands out
                </h2>
                <ul className="mt-6 space-y-5">
                  {comparison.strengths.map((strength) => (
                    <li key={strength} className="flex gap-3 leading-7 text-neutral-700">
                      <Check className="mt-1 size-5 shrink-0 text-red-600" /> {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-3xl font-black text-neutral-950">Honest drawbacks</h2>
                <p className="mt-4 leading-7 text-neutral-600">
                  No playlist tool is best at every job. These are the reasons
                  the competing product may be the better choice for you.
                </p>
                <ul className="mt-6 space-y-5">
                  {comparison.concessions.map((concession) => (
                    <li key={concession} className="flex gap-3 leading-7 text-neutral-700">
                      <X className="mt-1 size-5 shrink-0 text-neutral-500" /> {concession}
                    </li>
                  ))}
                </ul>
                <a
                  href={comparison.competitorUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-7 inline-flex items-center gap-2 font-bold text-neutral-800 underline decoration-red-400 underline-offset-4"
                >
                  Visit {comparison.competitorName} <ExternalLink className="size-4" />
                </a>
              </div>
            </section>

            <section className="mt-16 border-y border-neutral-200 py-12" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-3xl font-black text-neutral-950">
                Frequently asked questions
              </h2>
              <div className="mt-7 grid gap-8 md:grid-cols-2">
                {comparison.faqs.map((faq) => (
                  <div key={faq.question}>
                    <h3 className="text-lg font-black text-neutral-950">{faq.question}</h3>
                    <p className="mt-2 leading-7 text-neutral-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-14" aria-labelledby="sources-heading">
              <h2 id="sources-heading" className="text-2xl font-black text-neutral-950">
                Sources and methodology
              </h2>
              <p className="mt-4 max-w-3xl leading-7 text-neutral-600">
                This comparison uses publicly visible product information and a
                hands-on review of YT Playlist Report. We compare documented
                capabilities, avoid ratings without supporting data, and name
                specialist advantages even when they favor the competitor.
                Features and pricing can change after the review date.
              </p>
              <ul className="mt-5 space-y-2">
                {comparison.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-red-700 underline underline-offset-4">
                      {source.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="https://github.com/buneeIsSlo/yt-playlist-report" target="_blank" rel="noopener noreferrer" className="font-medium text-red-700 underline underline-offset-4">
                    YT Playlist Report source code
                  </a>
                </li>
              </ul>
            </section>

            <section className="mt-16 bg-neutral-950 p-8 text-white md:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-400">Try the recommendation</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-black md:text-4xl">
                Turn any supported public playlist into a detailed report.
              </h2>
              <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 font-bold text-white transition-colors hover:bg-red-700">
                Analyze a playlist free <ArrowRight className="size-4" />
              </Link>
            </section>

            <section className="mt-16">
              <h2 className="text-2xl font-black text-neutral-950">Compare another tool</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    to={comparisonPath(item)}
                    data-testid="related-comparison"
                    className="flex items-center justify-between border border-neutral-200 p-5 font-bold text-neutral-900 transition hover:border-red-400 hover:text-red-700"
                  >
                    YT Playlist Report vs {item.competitorName} <ArrowRight className="size-4" />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </article>
      </main>
    </PageShell>
  );
};

export default Compare;

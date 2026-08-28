import { Link, type MetaFunction } from "react-router";
import PageShell from "@/components/PageShell";
import { pageMeta, SITE_NAME } from "@/lib/site";

export const getNotFoundMeta = () =>
  pageMeta({
    title: `Page Not Found | ${SITE_NAME}`,
    description: "The page may have moved, or the address may be incomplete.",
    pathname: "/404",
    robots: "noindex, follow",
  });

export const meta: MetaFunction = getNotFoundMeta;

function NotFound() {
  return (
    <PageShell>
      <main className="container grid min-h-[60vh] max-w-3xl place-content-center py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black text-neutral-950">
          Page not found
        </h1>
        <p className="mt-4 text-lg text-neutral-600">
          The page may have moved, or the address may be incomplete.
        </p>
        <Link to="/compare" className="mt-7 font-bold text-red-700 underline">
          Browse playlist tool comparisons
        </Link>
      </main>
    </PageShell>
  );
}

export default NotFound;

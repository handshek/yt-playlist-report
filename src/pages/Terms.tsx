import PolicyPage from "@/components/PolicyPage";
import { pageMeta } from "@/lib/site";
import type { MetaFunction } from "react-router";

export const getTermsMeta = () =>
  pageMeta({
    title: "Terms of Use | YT Playlist Report",
    description:
      "Terms governing use of YT Playlist Report and its public YouTube playlist analysis features.",
    pathname: "/terms/",
    robots: "noindex, follow",
  });

export const meta: MetaFunction = getTermsMeta;

const Terms = () => (
  <PolicyPage eyebrow="Service terms" title="Terms of Use" updated="September 15, 2026">
    <section>
      <h2>Agreement</h2>
      <p className="mt-3">
        By generating or viewing a report, you agree to these Terms and to the{" "}
        <a
          href="https://www.youtube.com/t/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          YouTube Terms of Service
        </a>
        . If you do not agree, do not use the report generator.
      </p>
    </section>
    <section>
      <h2>Permitted use</h2>
      <p className="mt-3">
        Use the service only with playlists you are permitted to analyze and in
        compliance with applicable law. Do not attempt to bypass rate limits,
        extract credentials, disrupt the service, or use automated requests
        that unreasonably consume its limited API quota.
      </p>
    </section>
    <section>
      <h2>Accuracy and availability</h2>
      <p className="mt-3">
        Reports are calculated from public data supplied by YouTube. Videos may
        be removed, hidden, or updated, so results can be incomplete or become
        outdated. The service is provided as available without a guarantee of
        uninterrupted operation or fitness for a particular purpose.
      </p>
    </section>
    <section>
      <h2>Independent service</h2>
      <p className="mt-3">
        YT Playlist Report is not affiliated with, sponsored by, or endorsed by
        YouTube or Google. YouTube retains its rights in YouTube and its API
        data.
      </p>
    </section>
  </PolicyPage>
);

export default Terms;

import PolicyPage from "@/components/PolicyPage";
import { pageMeta } from "@/lib/site";
import type { MetaFunction } from "react-router";

export const getPrivacyMeta = () =>
  pageMeta({
    title: "Privacy Policy | YT Playlist Report",
    description:
      "How YT Playlist Report handles playlist input, public YouTube data, local caching, analytics, and support payments.",
    pathname: "/privacy/",
    robots: "noindex, follow",
  });

export const meta: MetaFunction = getPrivacyMeta;

const Privacy = () => (
  <PolicyPage eyebrow="Your data" title="Privacy Policy" updated="September 15, 2026">
    <section>
      <h2>Information used to create a report</h2>
      <p className="mt-3">
        YT Playlist Report uses the YouTube Data API to retrieve public
        playlist details, video metadata, duration, and public statistics. The
        submitted playlist identifier is sent to this service and then to
        YouTube solely to generate the requested report. The service does not
        ask you to sign in to YouTube and does not access private account data.
      </p>
      <p className="mt-3">
        Report data may be stored in your browser for up to 24 hours to reduce
        repeated API requests. You can remove it at any time by clearing this
        site&apos;s browser storage.
      </p>
    </section>
    <section>
      <h2>Usage analytics</h2>
      <p className="mt-3">
        The service uses a self-hosted Counterscale installation to understand
        aggregate page usage and report completion. Analytics events use fixed
        categories and do not include submitted playlist URLs, playlist
        identifiers, form text, or raw application errors.
      </p>
    </section>
    <section>
      <h2>Optional support</h2>
      <p className="mt-3">
        If you open the Ko-fi support panel, Ko-fi processes that interaction
        under its own privacy terms. YT Playlist Report does not receive or
        store payment-card details.
      </p>
    </section>
    <section>
      <h2>Your choices and contact</h2>
      <p className="mt-3">
        You can use the service without an account. To ask a privacy question
        or request deletion of information you intentionally submitted,{" "}
        <a
          href="https://github.com/buneeIsSlo/yt-playlist-report/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          contact the maintainer
        </a>
        . Do not include a playlist URL or other personal information in a
        public issue.
      </p>
      <p className="mt-3">
        YouTube&apos;s handling of API requests is described in the{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Google Privacy Policy
        </a>
        .
      </p>
    </section>
  </PolicyPage>
);

export default Privacy;

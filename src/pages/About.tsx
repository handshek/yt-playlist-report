import PolicyPage from "@/components/PolicyPage";
import { pageMeta } from "@/lib/site";
import type { MetaFunction } from "react-router";

export const getAboutMeta = () =>
  pageMeta({
    title: "About YT Playlist Report",
    description:
      "Learn who maintains YT Playlist Report, what it does, and how its playlist reports are produced.",
    pathname: "/about/",
    robots: "noindex, follow",
  });

export const meta: MetaFunction = getAboutMeta;

const About = () => (
  <PolicyPage eyebrow="The project" title="About YT Playlist Report" updated="September 15, 2026">
    <section>
      <h2>A focused playlist planning tool</h2>
      <p className="mt-3">
        YT Playlist Report helps learners, educators, creators, and researchers
        understand a public YouTube playlist before committing their time. It
        calculates duration, adjusts for playback speed, exposes video-level
        statistics, and makes long playlists easier to search and sort.
      </p>
    </section>
    <section>
      <h2>Maintained independently</h2>
      <p className="mt-3">
        The service is independently maintained by Abhi and is not affiliated
        with or endorsed by YouTube or Google. Reports use public information
        returned by the YouTube Data API.
      </p>
    </section>
    <section>
      <h2>Questions and corrections</h2>
      <p className="mt-3">
        To report a problem, request a correction, or ask about your data, you
        can{" "}
        <a
          href="https://github.com/buneeIsSlo/yt-playlist-report/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          contact the maintainer
        </a>
        .
      </p>
    </section>
  </PolicyPage>
);

export default About;

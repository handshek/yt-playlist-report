import { githubIcon, xIcon } from "@/assets";
import { comparisonPath, comparisons } from "@/content/comparisons";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="mt-20 w-full border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="container grid gap-12 py-14 md:grid-cols-[0.8fr_1.4fr] md:py-16">
        <div className="max-w-sm">
          <Link to="/" className="text-2xl font-black italic uppercase tracking-tight">
            YTPR<span className="text-red-500">.</span>
          </Link>
          <p className="mt-4 leading-7 text-neutral-400">
            A free, focused YouTube playlist length calculator and analyzer for
            learners, creators, and researchers.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 font-bold text-red-400 hover:text-red-300"
          >
            Analyze a playlist <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <nav aria-label="Footer navigation" className="grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Comparisons
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <Link to="/compare" className="font-bold text-white hover:text-red-400">
                  Compare all tools
                </Link>
              </li>
              {comparisons.map((comparison) => (
                <li key={comparison.slug}>
                  <Link
                    to={comparisonPath(comparison)}
                    className="text-sm leading-6 text-neutral-400 hover:text-white"
                  >
                    YT Playlist Report vs {comparison.competitorName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
              Project
            </h2>
            <ul className="mt-5 space-y-3">
              <li>
                <a
                  href="https://github.com/buneeIsSlo/yt-playlist-report"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white"
                >
                  Source code
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/buneeIsSlo/yt-playlist-report/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-400 hover:text-white"
                >
                  Report an issue
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-neutral-800">
        <div className="container flex flex-col gap-4 py-6 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Made with React ⚛ and love ❤</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/buneeIsSlo" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <img src={githubIcon} className="size-5 invert" alt="" />
            </a>
            <a href="https://x.com/awwbhi2" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
              <img src={xIcon} className="size-4 invert" alt="" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

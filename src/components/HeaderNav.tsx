import { githubIcon, logoIcon } from "@/assets";
import { Button } from "./ui/button";
import { StarIcon } from "lucide-react";
import { useEffect, useState } from "react";

const HeaderNav = () => {
  const [githubStars, setGithubStars] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadGithubStars = async () => {
      try {
        const response = await fetch("/api/github-stars", {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { count?: unknown };

        if (
          typeof payload.count === "number" &&
          Number.isInteger(payload.count) &&
          payload.count >= 0
        ) {
          setGithubStars(payload.count);
        }
      } catch {
        // The GitHub link remains usable when the optional count is unavailable.
      }
    };

    void loadGithubStars();

    return () => controller.abort();
  }, []);

  return (
    <header className="w-full backdrop-blur-lg bg-red-100/5 border-b py-2 md:py-2.5 sticky top-0 left-0 z-10">
      <div className="container flex justify-between items-center">
        <a href="/" className="">
          <div className="w-fit flex items-center pointer-events-none">
            <span className="w-8 h-8 bg-red-600 grid place-content-center rounded-lg">
              <span className="w-5 object-contain aspect-square">
                <img src={logoIcon} alt="" className="w-fit h-fit" />
              </span>
            </span>
            <p className="text-2xl font-bold italic uppercase px-1">ytpr</p>
          </div>
        </a>
        <div className="flex gap-2 items-center">
          <Button variant={"outline"} className="bg-transparent p-0 h-fit">
            <a
              href="https://github.com/buneeIsSlo/yt-playlist-report"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-row-reverse items-center gap-1"
            >
              <span className="border-l p-2 flex gap-1 items-center">
                <StarIcon className="w-4 h-4  stroke-yellow-400 fill-yellow-400" />
                {githubStars !== null ? (
                  <span className="font-semibold">{githubStars}</span>
                ) : null}
              </span>
              <span className="px-1 md:p-2 flex flex-row-reverse items-center gap-1">
                Star on GitHub
                <img src={githubIcon} alt="" />
              </span>
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default HeaderNav;

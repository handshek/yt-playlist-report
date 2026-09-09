import { Link } from "react-router";
import Form from "./Form";
import { Button } from "./ui/button";
import { ytprDemo, ytprDemoSources } from "@/assets";
import { Presentation } from "lucide-react";

const Hero = () => {
  return (
    <section className="py-28">
      <div>
        <h1 className="text-4xl text-center md:text-6xl text-neutral-800 font-black max-w-[25ch] md:text-center mx-auto my-10">
          Free YouTube Playlist Length Calculator &amp; Analyzer
        </h1>
        <p className="mx-auto -mt-5 min-h-10 max-w-2xl text-center text-lg font-semibold text-neutral-600 md:text-2xl">
          See total duration, adjust playback speed, and explore every video.
        </p>
      </div>
      <Form />
      <div className="mt-16">
        <div className="flex max-w-5xl justify-center mx-auto overflow-clip relative aspect-[16/9] w-full">
          <picture className="block h-full w-full">
            <source
              type="image/avif"
              srcSet={ytprDemoSources.avif}
              sizes="(min-width: 1280px) 1024px, (min-width: 768px) calc(100vw - 16rem), calc(100vw - 4rem)"
            />
            <source
              type="image/webp"
              srcSet={ytprDemoSources.webp}
              sizes="(min-width: 1280px) 1024px, (min-width: 768px) calc(100vw - 16rem), calc(100vw - 4rem)"
            />
            <img
              src={ytprDemo}
              width={1920}
              height={1080}
              alt="YT Playlist Report showing playlist duration, statistics, and video details"
              decoding="async"
              fetchPriority="high"
              className="block h-full w-full rounded-xl border-8 border-slate-200 object-cover md:w-[1300px]"
              style={{
                maskImage: `linear-gradient(to top, transparent, black 20%)`,
              }}
            />
          </picture>
          <Button
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 hover:bg-red-800"
            size={"lg"}
            asChild
          >
            <Link
              to="playlist/PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ"
              className="text-white flex gap-2 items-center"
              reloadDocument
            >
              <Presentation className="size-5" />
              View Demo
            </Link>
          </Button>
        </div>
      </div>
      <div className="mt-16 text-center">
        <p className="text-xl md:text-3xl text-neutral-800 font-semibold">
          <span className="text-red-600 italic font-bold">400+</span> Reports
          Generated 🎉
        </p>
      </div>
    </section>
  );
};

export default Hero;

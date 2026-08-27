import Faq from "@/components/Faq";
import Hero from "../components/Hero";
import Features from "@/components/Features";
import Cta from "@/components/Cta";
import { useRef } from "react";
import HeaderNav from "@/components/HeaderNav";
import Footer from "@/components/Footer";
import type { MetaFunction } from "react-router";
import { pageMeta } from "@/lib/site";

export const getLandingMeta = () =>
  pageMeta({
    title: "Free YouTube Playlist Length Calculator & Analyzer | YTPR",
    description:
      "Calculate YouTube playlist length, adjust playback speed, select a video range, search titles, and explore detailed playlist metrics for free.",
    pathname: "/",
  });

export const meta: MetaFunction = getLandingMeta;

function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <div className="absolute inset-0 -z-10 w-full bg-white bg-[radial-gradient(red_0.1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      <HeaderNav />
      <main className="container grid place-content-center md:px-16 lg:px-28">
        <div ref={heroRef}>
          <Hero />
        </div>
        <Features />
        <Faq />
        <Cta onCtaClick={scrollToHero} />
      </main>
      <Footer />
    </>
  );
}

export default Landing;

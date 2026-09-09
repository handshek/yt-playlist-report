import logoIcon from "./ytprlogo.svg";
import githubIcon from "./githubicon.svg";
import xIcon from "./xicon.svg";
import ytprDemo from "./ytpr-v0.png";
import ytprDemo640Avif from "./ytpr-v0-640.avif";
import ytprDemo960Avif from "./ytpr-v0-960.avif";
import ytprDemo1440Avif from "./ytpr-v0-1440.avif";
import ytprDemo1920Avif from "./ytpr-v0-1920.avif";
import ytprDemo640Webp from "./ytpr-v0-640.webp";
import ytprDemo960Webp from "./ytpr-v0-960.webp";
import ytprDemo1440Webp from "./ytpr-v0-1440.webp";
import ytprDemo1920Webp from "./ytpr-v0-1920.webp";

const responsiveSource = (sources: Array<[string, number]>) =>
  sources.map(([source, width]) => `${source} ${width}w`).join(", ");

const ytprDemoSources = {
  avif: responsiveSource([
    [ytprDemo640Avif, 640],
    [ytprDemo960Avif, 960],
    [ytprDemo1440Avif, 1440],
    [ytprDemo1920Avif, 1920],
  ]),
  webp: responsiveSource([
    [ytprDemo640Webp, 640],
    [ytprDemo960Webp, 960],
    [ytprDemo1440Webp, 1440],
    [ytprDemo1920Webp, 1920],
  ]),
};

export { logoIcon, githubIcon, xIcon, ytprDemo, ytprDemoSources };

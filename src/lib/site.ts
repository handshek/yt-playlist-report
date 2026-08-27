import type { MetaDescriptor } from "react-router";

export const SITE_NAME = "YT Playlist Report";
export const SITE_URL = "https://ytpr.netlify.app";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

interface PageMeta {
  title: string;
  description: string;
  pathname: string;
  robots?: string;
}

export const pageMeta = ({
  title,
  description,
  pathname,
  robots = "index, follow",
}: PageMeta): MetaDescriptor[] => {
  const canonical = `${SITE_URL}${pathname}`;

  return [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { tagName: "link", rel: "canonical", href: canonical },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: DEFAULT_OG_IMAGE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: DEFAULT_OG_IMAGE },
  ];
};

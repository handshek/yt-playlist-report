import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
  type MetaFunction,
} from "react-router";
import { Toaster } from "sonner";
import Analytics from "@/components/Analytics";
import favicon from "@/assets/favicon.ico";
import { queryClient } from "@/lib/query-client";
import "./index.css";

export const links: LinksFunction = () => [
  { rel: "icon", href: favicon, type: "image/x-icon" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,100..900;1,100..900&display=swap",
  },
];

export const meta: MetaFunction = () => [
  { title: "YT Playlist Report - Analyze YouTube Playlists" },
  {
    name: "description",
    content:
      "Generate comprehensive reports for YouTube playlists, including total duration, average video length, and detailed video statistics.",
  },
  { name: "robots", content: "index, follow" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <Toaster />
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}

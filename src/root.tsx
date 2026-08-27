import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Links,
  Meta,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
  type LinksFunction,
  type MetaFunction,
} from "react-router";
import { Toaster } from "sonner";
import Analytics from "@/components/Analytics";
import NotFound from "@/pages/NotFound";
import { queryClient } from "@/lib/query-client";
import "./index.css";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
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

// SPA fallback documents render only the root route until client routes load.
export function HydrateFallback() {
  return (
    <main
      aria-live="polite"
      className="container grid min-h-dvh place-content-center py-20 text-center"
    >
      <p className="text-lg font-semibold text-neutral-600">
        Loading YT Playlist Report&hellip;
      </p>
    </main>
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

export function ErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (isNotFound) {
    return <NotFound />;
  }

  const message = error instanceof Error ? error.message : "Unexpected error";

  return (
    <main className="container grid min-h-[60vh] place-content-center py-20 text-center">
      <h1 className="text-4xl font-black text-neutral-950">
        Something went wrong
      </h1>
      <p className="mt-4 text-lg text-neutral-600">{message}</p>
    </main>
  );
}

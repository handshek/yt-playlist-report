import React from "react";
import ReactDOM from "react-dom/client";
import Landing from "./pages/Landing.tsx";
import Report from "./pages/Report.tsx";
import { loader as playlistLoader } from "./api/PlaylistApi.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import Analytics from "./components/Analytics.tsx";
import "./index.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <Analytics />,
    children: [
      {
        path: "/",
        element: <Landing />,
      },
      {
        path: "/playlist/:playlistId",
        element: <Report />,
        loader: playlistLoader(queryClient),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <React.StrictMode>
      <RouterProvider router={router} />
      <Toaster />
    </React.StrictMode>
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

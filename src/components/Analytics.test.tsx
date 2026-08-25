import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMemoryRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import * as Counterscale from "@counterscale/tracker";
import Analytics from "./Analytics";

vi.mock("@counterscale/tracker", () => ({
  init: vi.fn(),
  isInitialized: vi.fn(),
  trackPageview: vi.fn(),
}));

const routes: RouteObject[] = [
  {
    element: <Analytics />,
    children: [
      { path: "/", element: <div>Home</div> },
      { path: "/playlist/:playlistId", element: <div>Report</div> },
    ],
  },
];

describe("Analytics", () => {
  beforeEach(() => {
    vi.stubEnv(
      "VITE_COUNTERSCALE_REPORTER_URL",
      "https://ytpr-data.example.workers.dev/collect"
    );
    vi.stubEnv("VITE_COUNTERSCALE_SITE_ID", "ytpr-production");
    vi.mocked(Counterscale.isInitialized).mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("tracks an ordinary page through the configured Counterscale deployment", async () => {
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(Counterscale.init).toHaveBeenCalledWith({
        autoTrackPageviews: false,
        reporterUrl: "https://ytpr-data.example.workers.dev/collect",
        siteId: "ytpr-production",
      });
      expect(Counterscale.trackPageview).toHaveBeenCalledWith({ url: "/" });
    });
  });

  it("does not record a playlist route before its report succeeds", async () => {
    const router = createMemoryRouter(routes, {
      initialEntries: ["/playlist/PLabc_123"],
    });

    render(<RouterProvider router={router} />);

    await waitFor(() => {
      expect(Counterscale.trackPageview).not.toHaveBeenCalled();
    });
  });

  it("stays disabled when public analytics configuration is missing", async () => {
    vi.unstubAllEnvs();
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Home")).toBeTruthy();
    expect(Counterscale.init).not.toHaveBeenCalled();
    expect(Counterscale.trackPageview).not.toHaveBeenCalled();
  });

  it("does not disrupt navigation when the tracker fails", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(Counterscale.init).mockImplementation(() => {
      throw new Error("tracker unavailable");
    });
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Home")).toBeTruthy();
    expect(Counterscale.trackPageview).not.toHaveBeenCalled();
  });
});

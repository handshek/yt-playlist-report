import * as Counterscale from "@counterscale/tracker";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { createMemoryRouter, MemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import KofiSupportModal from "./KofiSupportModal";

vi.mock("@counterscale/tracker", () => ({
  init: vi.fn(),
  isInitialized: vi.fn(),
  trackPageview: vi.fn(),
}));

describe("KofiSupportModal", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_KOFI_PAGE_ID", "handshek");
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
    vi.useRealTimers();
  });

  it("shows an accessible launcher and records its landing exposure", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    expect(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    ).toBeTruthy();

    const cup = screen
      .getByRole("button", { name: "Support YTPR on Ko-fi" })
      .querySelector("img");
    expect(cup?.getAttribute("src")).toContain("kofi-cup");
    expect(cup?.getAttribute("alt")).toBe("");

    await waitFor(() => {
      expect(Counterscale.trackPageview).toHaveBeenCalledWith({
        url: "/support/ko-fi/widget?source=landing",
      });
    });
  });

  it("warns in development and stays hidden when the page ID is invalid", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubEnv("VITE_KOFI_PAGE_ID", "not a Ko-fi page");

    render(
      <MemoryRouter initialEntries={["/"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: "Support YTPR on Ko-fi" })
    ).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "Ko-fi support is disabled: VITE_KOFI_PAGE_ID is missing or invalid"
    );
  });

  it("loads the attributed Ko-fi panel only after the launcher is opened", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    expect(screen.queryByTitle("Support YTPR on Ko-fi")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    );

    expect(
      screen.getByRole("dialog", { name: "Support YTPR" })
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Hey! I’m the developer behind YTPR. I’m working every day to make it more helpful. Your support means a lot."
      )
    ).toBeTruthy();

    const panel = screen.getByTitle("Support YTPR on Ko-fi");
    const destination = new URL(panel.getAttribute("src")!);

    expect(destination.origin).toBe("https://ko-fi.com");
    expect(destination.pathname).toBe("/handshek/");
    expect(Object.fromEntries(destination.searchParams)).toEqual({
      hidefeed: "true",
      widget: "true",
      embed: "true",
      utm_source: "ytpr",
      utm_medium: "app",
      utm_campaign: "support",
      utm_content: "landing",
    });
    expect(Counterscale.trackPageview).toHaveBeenCalledWith({
      url: "/support/ko-fi/open?source=landing",
    });

    const directFallback = screen.getByRole("link", {
      name: "Open Ko-fi directly (opens in a new tab)",
    });
    const directDestination = new URL(directFallback.getAttribute("href")!);

    expect(directFallback.getAttribute("target")).toBe("_blank");
    expect(directFallback.getAttribute("rel")).toBe("noopener noreferrer");
    expect(Object.fromEntries(directDestination.searchParams)).toEqual({
      utm_source: "ytpr",
      utm_medium: "app",
      utm_campaign: "support",
      utm_content: "landing",
    });

    fireEvent.click(directFallback);
    expect(Counterscale.trackPageview).toHaveBeenCalledWith({
      url: "/outbound/ko-fi?source=landing",
    });
  });

  it("preserves the in-progress Ko-fi panel when it is closed and reopened", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    const launcher = screen.getByRole("button", {
      name: "Support YTPR on Ko-fi",
    });
    fireEvent.click(launcher);
    const firstPanel = screen.getByTitle("Support YTPR on Ko-fi");

    fireEvent.click(
      screen.getByRole("button", { name: "Close support dialog" })
    );

    expect(screen.getByTitle("Support YTPR on Ko-fi")).toBe(firstPanel);
    expect(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    ).toBeTruthy();

    fireEvent.click(launcher);

    expect(screen.getByTitle("Support YTPR on Ko-fi")).toBe(firstPanel);
    expect(Counterscale.trackPageview).toHaveBeenCalledTimes(2);
  });

  it("offers retry and an attributed hosted fallback when Ko-fi times out", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={["/playlist/PLprivate-id"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    );
    const firstPanel = screen.getByTitle("Support YTPR on Ko-fi");
    act(() => vi.advanceTimersByTime(8_000));

    expect(screen.getByText("Ko-fi could not load.")).toBeTruthy();
    const fallback = screen.getByRole("link", {
      name: "Continue on Ko-fi (opens in a new tab)",
    });
    const destination = new URL(fallback.getAttribute("href")!);

    expect(destination.pathname).toBe("/handshek/");
    expect(Object.fromEntries(destination.searchParams)).toEqual({
      utm_source: "ytpr",
      utm_medium: "app",
      utm_campaign: "support",
      utm_content: "report",
    });
    expect(destination.toString()).not.toContain("PLprivate-id");
    expect(fallback.getAttribute("target")).toBe("_blank");
    expect(fallback.getAttribute("rel")).toBe("noopener noreferrer");

    fireEvent.click(fallback);
    expect(Counterscale.trackPageview).toHaveBeenCalledWith({
      url: "/outbound/ko-fi?source=report",
    });

    fireEvent.click(screen.getByRole("button", { name: "Retry Ko-fi" }));
    expect(screen.getByTitle("Support YTPR on Ko-fi")).not.toBe(firstPanel);
    expect(screen.queryByText("Ko-fi could not load.")).toBeNull();
  });

  it("records a fresh exposure when an eligible history entry is revisited", async () => {
    const router = createMemoryRouter(
      [{ path: "*", element: <KofiSupportModal /> }],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(Counterscale.trackPageview).toHaveBeenCalledWith({
        url: "/support/ko-fi/widget?source=landing",
      });
    });

    await router.navigate("/compare");
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Support YTPR on Ko-fi" })
      ).toBeNull();
    });

    await router.navigate(-1);
    await screen.findByRole("button", { name: "Support YTPR on Ko-fi" });

    await waitFor(() => {
      expect(Counterscale.trackPageview).toHaveBeenCalledTimes(2);
    });
  });

  it("does not duplicate a route exposure under React Strict Mode", async () => {
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/"]}>
          <KofiSupportModal />
        </MemoryRouter>
      </StrictMode>
    );

    await waitFor(() => {
      expect(Counterscale.trackPageview).toHaveBeenCalledTimes(1);
    });
  });

  it("starts a fresh Ko-fi panel when the route view changes", async () => {
    const router = createMemoryRouter(
      [{ path: "*", element: <KofiSupportModal /> }],
      { initialEntries: ["/"] }
    );

    render(<RouterProvider router={router} />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Support YTPR on Ko-fi" })
    );
    const landingPanel = screen.getByTitle("Support YTPR on Ko-fi");
    fireEvent.load(landingPanel);

    await router.navigate("/playlist/PLmust-not-appear");
    await waitFor(() => {
      expect(screen.queryByTitle("Support YTPR on Ko-fi")).toBeNull();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    );
    const reportPanel = screen.getByTitle("Support YTPR on Ko-fi");
    const reportDestination = reportPanel.getAttribute("src")!;

    expect(reportPanel).not.toBe(landingPanel);
    expect(reportDestination).toContain("utm_content=report");
    expect(reportDestination).not.toContain("PLmust-not-appear");
    expect(
      vi.mocked(Counterscale.trackPageview).mock.calls
        .map(([event]) => event?.url ?? "")
        .join(" ")
    ).not.toContain("PLmust-not-appear");
  });

  it("keeps a successfully loaded panel available past the timeout", () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={["/"]}>
        <KofiSupportModal />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Support YTPR on Ko-fi" })
    );
    const panel = screen.getByTitle("Support YTPR on Ko-fi");
    fireEvent.load(panel);
    act(() => vi.advanceTimersByTime(8_000));

    expect(screen.queryByText("Ko-fi could not load.")).toBeNull();
    expect(screen.getByTitle("Support YTPR on Ko-fi")).toBe(panel);
  });
});

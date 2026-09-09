import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HeaderNav from "./HeaderNav";

const okResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200 });

describe("HeaderNav GitHub stars", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(okResponse({ count: 16 })))
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads and displays the star count on mount", async () => {
    render(<HeaderNav />);

    expect(await screen.findByText("16")).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      "/api/github-stars",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("does not render the former hardcoded count while loading", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    render(<HeaderNav />);

    expect(screen.queryByText("8")).toBeNull();
  });

  it("hides the count when the route fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    render(<HeaderNav />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText("16")).toBeNull();
  });

  it("hides the count when the route returns an invalid payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(okResponse({ count: "16" })))
    );

    render(<HeaderNav />);

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText("16")).toBeNull();
  });

  it("aborts the request when the header unmounts", () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));

    const { unmount } = render(<HeaderNav />);
    const options = vi.mocked(fetch).mock.calls[0][1];

    expect(options?.signal?.aborted).toBe(false);
    unmount();
    expect(options?.signal?.aborted).toBe(true);
  });
});

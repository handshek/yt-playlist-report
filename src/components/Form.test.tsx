import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { fetchPlaylistDetails } from "@/api/PlaylistApi";
import { trackSeoEvent } from "@/lib/seo-events";
import Form from "./Form";

vi.mock("@/api/PlaylistApi", () => ({
  fetchPlaylistDetails: vi.fn(),
}));

vi.mock("@/lib/seo-events", () => ({
  trackSeoEvent: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const renderForm = () => {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/", element: <Form /> },
      { path: "/playlist/:playlistId", element: <div>Playlist report</div> },
    ],
    { initialEntries: ["/"] }
  );

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

const submitUrl = (url: string) => {
  fireEvent.change(screen.getByPlaceholderText("Enter YouTube playlist URL"), {
    target: { value: url },
  });
  fireEvent.click(screen.getByRole("button", { name: /generate/i }));
};

describe("playlist report form analytics", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("records an invalid URL without sending the submitted value", () => {
    renderForm();

    submitUrl("https://youtube.com/watch?v=private-input");

    expect(fetchPlaylistDetails).not.toHaveBeenCalled();
    expect(trackSeoEvent).toHaveBeenCalledTimes(1);
    expect(trackSeoEvent).toHaveBeenCalledWith({
      name: "report_error",
      reason: "invalid_url",
    });
  });

  it("records a submit and one success around a successful report", async () => {
    vi.mocked(fetchPlaylistDetails).mockResolvedValue({
      id: "PLabc_123",
    } as never);
    renderForm();

    submitUrl("https://youtube.com/playlist?list=PLabc_123");

    expect(await screen.findByText("Playlist report")).toBeTruthy();
    expect(fetchPlaylistDetails).toHaveBeenCalledWith("PLabc_123");
    expect(trackSeoEvent).toHaveBeenNthCalledWith(1, { name: "report_submit" });
    expect(trackSeoEvent).toHaveBeenNthCalledWith(2, { name: "report_success" });
    expect(trackSeoEvent).toHaveBeenCalledTimes(2);
  });

  it("categorizes API failures without sending the raw error", async () => {
    vi.mocked(fetchPlaylistDetails).mockRejectedValue(
      new Error("upstream response containing private details")
    );
    renderForm();

    submitUrl("https://youtube.com/playlist?list=PLabc_123");

    await waitFor(() => {
      expect(trackSeoEvent).toHaveBeenLastCalledWith({
        name: "report_error",
        reason: "fetch_failed",
      });
    });
    expect(trackSeoEvent).toHaveBeenNthCalledWith(1, { name: "report_submit" });
    expect(trackSeoEvent).toHaveBeenCalledTimes(2);
  });
});

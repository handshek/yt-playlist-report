import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import About, { getAboutMeta } from "./About";
import Privacy, { getPrivacyMeta } from "./Privacy";
import Terms, { getTermsMeta } from "./Terms";
import Footer from "@/components/Footer";
import Form from "@/components/Form";

const canonical = (descriptors: ReturnType<typeof getAboutMeta>) =>
  descriptors.find((item) => "rel" in item && item.rel === "canonical");

const robots = (descriptors: ReturnType<typeof getAboutMeta>) =>
  descriptors.find((item) => "name" in item && item.name === "robots");

const renderForm = () => {
  const queryClient = new QueryClient();
  const router = createMemoryRouter([{ path: "/", element: <Form /> }]);
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
};

describe("trust and policy pages", () => {
  afterEach(cleanup);

  it.each([
    [getAboutMeta, "https://ytpr.netlify.app/about/"],
    [getPrivacyMeta, "https://ytpr.netlify.app/privacy/"],
    [getTermsMeta, "https://ytpr.netlify.app/terms/"],
  ])("publishes a canonical but keeps the utility page out of search", (meta, url) => {
    const descriptors = meta();
    expect(canonical(descriptors)).toEqual({
      tagName: "link",
      rel: "canonical",
      href: url,
    });
    expect(robots(descriptors)).toEqual({ name: "robots", content: "noindex, follow" });
  });

  it("explains who maintains the service and how to get support", () => {
    render(<About />, { wrapper: MemoryRouter });
    expect(screen.getByRole("heading", { name: "About YT Playlist Report" })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "contact the maintainer" }).getAttribute("href")
    ).toBe("https://github.com/buneeIsSlo/yt-playlist-report/issues");
  });

  it("discloses YouTube, local caching, analytics, and deletion options", () => {
    render(<Privacy />, { wrapper: MemoryRouter });
    expect(screen.getByText(/uses the YouTube Data API/i)).toBeTruthy();
    expect(screen.getByText(/stored in your browser for up to 24 hours/i)).toBeTruthy();
    expect(screen.getByText(/Counterscale/i)).toBeTruthy();
    expect(screen.getByText(/request deletion/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Google Privacy Policy" }).getAttribute("href")
    ).toBe("https://policies.google.com/privacy");
  });

  it("requires agreement to both the service and YouTube terms", () => {
    render(<Terms />, { wrapper: MemoryRouter });
    expect(screen.getByText(/agree to these Terms/i)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "YouTube Terms of Service" }).getAttribute("href")
    ).toBe("https://www.youtube.com/t/terms");
  });

  it("links every trust page from the shared footer", () => {
    render(<Footer />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: "About" }).getAttribute("href")).toBe("/about/");
    expect(screen.getByRole("link", { name: "Privacy" }).getAttribute("href")).toBe("/privacy/");
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms/");
  });

  it("places policy agreement beside the report action", () => {
    renderForm();
    expect(screen.getByText(/By generating a report/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Terms" }).getAttribute("href")).toBe("/terms/");
    expect(screen.getByRole("link", { name: "Privacy Policy" }).getAttribute("href")).toBe(
      "/privacy/"
    );
    expect(screen.getByRole("link", { name: "YouTube Terms" }).getAttribute("href")).toBe(
      "https://www.youtube.com/t/terms"
    );
  });
});

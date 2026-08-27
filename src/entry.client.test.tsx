import { beforeEach, describe, expect, it, vi } from "vitest";

const reactDomMocks = vi.hoisted(() => {
  const render = vi.fn();

  return {
    createRoot: vi.fn(() => ({ render })),
    hydrateRoot: vi.fn(),
    render,
  };
});

vi.mock("react-dom/client", () => ({
  createRoot: reactDomMocks.createRoot,
  hydrateRoot: reactDomMocks.hydrateRoot,
}));

vi.mock("react-router/dom", () => ({
  HydratedRouter: () => null,
}));

const setSpaMode = (isSpaMode: boolean) => {
  (
    window as unknown as {
      __reactRouterContext: { isSpaMode: boolean };
    }
  ).__reactRouterContext = { isSpaMode };
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("client entry", () => {
  it("mounts SPA fallback documents without hydrating unmatched route HTML", async () => {
    setSpaMode(true);

    await import("./entry.client");

    expect(reactDomMocks.createRoot).toHaveBeenCalledWith(document);
    expect(reactDomMocks.render).toHaveBeenCalledOnce();
    expect(reactDomMocks.hydrateRoot).not.toHaveBeenCalled();
  });

  it("hydrates prerendered documents", async () => {
    setSpaMode(false);

    await import("./entry.client");

    expect(reactDomMocks.hydrateRoot).toHaveBeenCalledWith(
      document,
      expect.anything()
    );
    expect(reactDomMocks.createRoot).not.toHaveBeenCalled();
  });
});

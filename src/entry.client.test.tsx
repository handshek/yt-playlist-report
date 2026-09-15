import { beforeEach, describe, expect, it, vi } from "vitest";

const reactDomMocks = vi.hoisted(() => {
  return {
    hydrateRoot: vi.fn(),
  };
});

vi.mock("react-dom/client", () => ({
  hydrateRoot: reactDomMocks.hydrateRoot,
}));

vi.mock("react-router/dom", () => ({
  HydratedRouter: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("client entry", () => {
  it("hydrates the Router framework document", async () => {
    await import("./entry.client");

    expect(reactDomMocks.hydrateRoot).toHaveBeenCalledWith(
      document,
      expect.anything()
    );
  });

  it("moves browser-extension nodes into the body before hydration", async () => {
    const extensionNode = document.createElement("browser-extension-root");
    document.documentElement.append(extensionNode);

    await import("./entry.client");

    expect(extensionNode.parentElement).toBe(document.body);
    extensionNode.remove();
  });
});

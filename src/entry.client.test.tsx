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
});

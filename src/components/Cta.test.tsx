import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Cta from "./Cta";

describe("homepage CTA", () => {
  it("promises a free report without ruling out optional paid products", () => {
    render(<Cta onCtaClick={vi.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Playlist reports stay free. No sign-up required.",
      })
    ).toBeTruthy();
    expect(screen.queryByText(/Free forever/i)).toBeNull();
  });
});

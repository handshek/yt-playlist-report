import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FlipWords } from "./flip-words";

describe("FlipWords", () => {
  it("uses phrasing content that remains valid inside a paragraph", () => {
    const { container } = render(<FlipWords words={["Playlist duration"]} />);

    expect(container.firstElementChild?.tagName).toBe("SPAN");
  });
});

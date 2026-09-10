import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Netlify cache policy", () => {
  it("keeps hashed assets immutable while HTML uses Netlify revalidation", () => {
    const config = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");

    expect(config).toContain('for = "/assets/*"');
    expect(config).toContain(
      'Cache-Control = "public, max-age=31536000, immutable"'
    );
    expect(config).toContain(
      "HTML keeps Netlify's default public, max-age=0, must-revalidate policy."
    );
  });
});

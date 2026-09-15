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

  it("routes the public YouTube endpoint through a rate-limited function rewrite", () => {
    const config = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");

    expect(config).toContain('from = "/api/youtube-playlist"');
    expect(config).toContain(
      'to = "/.netlify/functions/youtube-playlist"'
    );
    expect(config).toContain("window_limit = 30");
    expect(config).toContain("window_size = 60");
    expect(config).toContain('aggregate_by = ["ip", "domain"]');
  });

  it("routes feedback through its stricter rate-limited function rewrite", () => {
    const config = readFileSync(join(process.cwd(), "netlify.toml"), "utf8");

    expect(config).toContain('from = "/api/feedback"');
    expect(config).toContain('to = "/.netlify/functions/feedback"');
    expect(config).toContain("window_limit = 10");
    expect(config).toContain("window_size = 3600");
  });
});

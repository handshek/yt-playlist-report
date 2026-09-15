import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPlaylistDetailsQuery,
  fetchPlaylistDetails,
} from "./PlaylistApi";

describe("playlist API client", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("requests public playlist details through the same-origin endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "PLabc_12345",
          title: "Test playlist",
          description: "",
          thumbnails: {},
        })
      )
    );

    await expect(fetchPlaylistDetails("PLabc_12345")).resolves.toMatchObject({
      id: "PLabc_12345",
      title: "Test playlist",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/youtube-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlistId: "PLabc_12345",
        resource: "details",
      }),
    });
  });

  it("requests report data without putting a playlist ID in the URL", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ videos: [], duration: "", avgDuration: "" })
      )
    );

    const query = createPlaylistDetailsQuery("PLabc_12345");
    await expect(query.queryFn()).resolves.toEqual({
      videos: [],
      duration: "",
      avgDuration: "",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/youtube-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlistId: "PLabc_12345",
        resource: "report",
      }),
    });
  });

  it("throws only the endpoint's stable public error category", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "upstream_unavailable",
          raw: "private upstream details",
        }),
        { status: 502 }
      )
    );

    await expect(fetchPlaylistDetails("PLabc_12345")).rejects.toThrow(
      "upstream_unavailable"
    );
  });
});

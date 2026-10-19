import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  createPlaylistDetailsQuery,
  createPlaylistInfoQuery,
  fetchPlaylistDetails,
  refreshPlaylist,
} from "./PlaylistApi";
import { writePlaylistCache } from "@/lib/playlist-cache";

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

  it("reuses cached playlist details without another request", async () => {
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
    const query = createPlaylistInfoQuery("PLabc_12345");

    await expect(query.queryFn()).resolves.toMatchObject({
      title: "Test playlist",
    });
    await expect(query.queryFn()).resolves.toMatchObject({
      title: "Test playlist",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses cached report data across query instances", async () => {
    const report = { videos: [], duration: "", avgDuration: "" };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(report)));

    await createPlaylistDetailsQuery("PLabc_12345").queryFn();
    await createPlaylistDetailsQuery("PLabc_12345").queryFn();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetches fresh data after a refresh clears the cache", async () => {
    const details = {
      id: "PLabc_12345",
      title: "Cached playlist",
      description: "",
      thumbnails: {},
    };
    writePlaylistCache("details", "PLabc_12345", details);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ...details, title: "Fresh playlist" })));
    const queryClient = new QueryClient();

    refreshPlaylist(queryClient, "PLabc_12345");

    await expect(
      createPlaylistInfoQuery("PLabc_12345").queryFn()
    ).resolves.toMatchObject({ title: "Fresh playlist" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

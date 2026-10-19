import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { LoaderFunction, LoaderFunctionArgs } from "react-router";
import { isPlaylistId } from "@/lib/playlist-id";
import {
  clearPlaylistCache,
  readPlaylistCache,
  writePlaylistCache,
} from "@/lib/playlist-cache";
export { parseDuration, formatDuration } from "@/lib/duration";

// Interfaces
export interface PlaylistResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  items: PlaylistItem[];
  pageInfo: PageInfo;
}

export interface PlaylistItem {
  kind: string;
  etag: string;
  id: string;
  contentDetails: ContentDetails;
}

export interface ContentDetails {
  videoId: string;
  videoPublishedAt: string;
}

export interface PageInfo {
  totalResults: number;
  resultsPerPage: number;
}

interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

interface Thumbnails {
  default?: Thumbnail;
  medium?: Thumbnail;
  high?: Thumbnail;
  standard?: Thumbnail;
  maxres?: Thumbnail;
}

interface Snippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
  channelTitle: string;
  tags?: string[];
  categoryId: string;
  liveBroadcastContent: string;
  localized: {
    title: string;
    description: string;
  };
}

interface Statistics {
  viewCount: string;
  likeCount: string;
  favoriteCount: string;
  commentCount: string;
}

interface VideoContentDetails {
  duration: string;
}

export interface VideoItem {
  kind: string;
  etag: string;
  id: string;
  snippet: Snippet;
  statistics: Statistics;
  contentDetails: VideoContentDetails;
}

export interface PlaylistDetails {
  id: string;
  title: string;
  description: string;
  thumbnails: Thumbnails;
}

type PlaylistReportData = {
  videos: VideoItem[];
  duration: string;
  avgDuration: string;
};

// API functions
const PUBLIC_API_ERRORS = new Set([
  "forbidden",
  "invalid_request",
  "method_not_allowed",
  "playlist_unavailable",
  "service_unavailable",
  "upstream_unavailable",
]);

const requestPlaylistResource = async <T,>(
  playlistId: string,
  resource: "details" | "report"
): Promise<T> => {
  const response = await fetch("/api/youtube-playlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playlistId, resource }),
  });

  const payload = (await response.json()) as { error?: unknown } & T;

  if (!response.ok) {
    const error =
      typeof payload.error === "string" && PUBLIC_API_ERRORS.has(payload.error)
        ? payload.error
        : "service_unavailable";
    throw new Error(error);
  }

  return payload;
};

const calculatePlaylistDetails = async (
  playlistId: string
): Promise<PlaylistReportData> => {
  const cachedReport = readPlaylistCache<PlaylistReportData>(
    "report",
    playlistId
  );

  if (cachedReport) {
    return cachedReport;
  }

  const playlistReport = await requestPlaylistResource<PlaylistReportData>(
    playlistId,
    "report"
  );

  writePlaylistCache("report", playlistId, playlistReport);

  return playlistReport;
};

const calculatePlaylistInfo = async (
  playlistId: string
): Promise<PlaylistDetails> => {
  const cachedDetails = readPlaylistCache<PlaylistDetails>(
    "details",
    playlistId
  );

  if (cachedDetails) {
    return cachedDetails;
  }

  const details = await fetchPlaylistDetails(playlistId);
  writePlaylistCache("details", playlistId, details);

  return details;
};

export const createPlaylistDetailsQuery = (id: string) => ({
  queryKey: ["playlist", id],
  queryFn: () => calculatePlaylistDetails(id),
  staleTime: 1000 * 60 * 5,
});

export const createPlaylistInfoQuery = (id: string) => ({
  queryKey: ["playlistDetails", id],
  queryFn: () => calculatePlaylistInfo(id),
  staleTime: 1000 * 60 * 5,
});

export const fetchPlaylistDetails = async (
  playlistId: string
): Promise<PlaylistDetails> => {
  return requestPlaylistResource<PlaylistDetails>(playlistId, "details");
};

export const refreshPlaylist = (
  queryClient: QueryClient,
  playlistId: string
): void => {
  clearPlaylistCache(playlistId);
  queryClient.removeQueries({ queryKey: ["playlist", playlistId] });
  queryClient.removeQueries({ queryKey: ["playlistDetails", playlistId] });
};

export const loadPlaylist = (queryClient: QueryClient): LoaderFunction => {
  return async ({ params }: LoaderFunctionArgs) => {
    if (!isPlaylistId(params.playlistId)) {
      throw new Error("invalid_request");
    }

    try {
      const playlistDetails = await queryClient.ensureQueryData(
        createPlaylistInfoQuery(params.playlistId)
      );

      const playlistDetailsPromise = queryClient.ensureQueryData(
        createPlaylistDetailsQuery(params.playlistId)
      );

      return {
        playlistDetails,
        videoDetails: playlistDetailsPromise,
      };
    } catch (error) {
      console.error("Error in loader function:", error);
      throw error;
    }
  };
};

export const loader = (queryClient: QueryClient): LoaderFunction => {
  return (args: LoaderFunctionArgs) => loadPlaylist(queryClient)(args);
};

export const usePlaylistDuration = (playlistId: string) => {
  return useSuspenseQuery(createPlaylistDetailsQuery(playlistId));
};

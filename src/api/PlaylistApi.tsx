import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { LoaderFunction, LoaderFunctionArgs } from "react-router";

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
  default: Thumbnail;
  medium: Thumbnail;
  high: Thumbnail;
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

type CachedPlaylistReport = {
  schemaVersion: 1;
  savedAt: number;
  data: PlaylistReportData;
};

// Constants
const PLAYLIST_REPORT_CACHE_SCHEMA_VERSION = 1;
const PLAYLIST_REPORT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const PLAYLIST_REPORT_CACHE_PREFIX = "ytpr:playlist-report:";

const getPlaylistReportCacheKey = (playlistId: string) =>
  `${PLAYLIST_REPORT_CACHE_PREFIX}${playlistId}`;

const readCachedPlaylistReport = (
  playlistId: string
): PlaylistReportData | null => {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    const cachedValue = window.localStorage.getItem(
      getPlaylistReportCacheKey(playlistId)
    );

    if (!cachedValue) {
      return null;
    }

    const cachedReport = JSON.parse(cachedValue) as CachedPlaylistReport;

    if (
      cachedReport.schemaVersion !== PLAYLIST_REPORT_CACHE_SCHEMA_VERSION ||
      Date.now() - cachedReport.savedAt >= PLAYLIST_REPORT_CACHE_TTL_MS
    ) {
      return null;
    }

    return cachedReport.data;
  } catch {
    return null;
  }
};

const writeCachedPlaylistReport = (
  playlistId: string,
  data: PlaylistReportData
) => {
  try {
    if (typeof window === "undefined") {
      return;
    }

    const cachedReport: CachedPlaylistReport = {
      schemaVersion: PLAYLIST_REPORT_CACHE_SCHEMA_VERSION,
      savedAt: Date.now(),
      data,
    };

    window.localStorage.setItem(
      getPlaylistReportCacheKey(playlistId),
      JSON.stringify(cachedReport)
    );
  } catch {
    // Cache failures should never block report generation.
  }
};

// Helper functions
export const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  const hours = parseInt(match?.[1] ?? "0") || 0;
  const minutes = parseInt(match?.[2] ?? "0") || 0;
  const seconds = parseInt(match?.[3] ?? "0") || 0;
  return hours * 3600 + minutes * 60 + seconds;
};

export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);

  return parts.join(" ");
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
  const cachedReport = readCachedPlaylistReport(playlistId);

  if (cachedReport) {
    return cachedReport;
  }

  const playlistReport = await requestPlaylistResource<PlaylistReportData>(
    playlistId,
    "report"
  );

  writeCachedPlaylistReport(playlistId, playlistReport);

  return playlistReport;
};

export const createPlaylistDetailsQuery = (id: string) => ({
  queryKey: ["playlist", id],
  queryFn: () => calculatePlaylistDetails(id),
  staleTime: 1000 * 60 * 5,
});

export const fetchPlaylistDetails = async (
  playlistId: string
): Promise<PlaylistDetails> => {
  return requestPlaylistResource<PlaylistDetails>(playlistId, "details");
};

export const loadPlaylist = (queryClient: QueryClient): LoaderFunction => {
  return async ({ params }: LoaderFunctionArgs) => {
    if (!params.playlistId) {
      throw new Error("Playlist ID is required");
    }

    try {
      const playlistDetails = await queryClient.ensureQueryData({
        queryKey: ["playlistDetails", params.playlistId],
        queryFn: () => fetchPlaylistDetails(params.playlistId as string),
      });

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

import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { LoaderFunction, LoaderFunctionArgs } from "react-router";
import { isPlaylistId } from "@/lib/playlist-id";
import {
  PlaylistRequestError,
  isReportErrorReason,
} from "@/lib/report-errors";

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

export type PlaylistReport = {
  videos: VideoItem[];
};

type CachedPlaylistReport = {
  schemaVersion: 1;
  savedAt: number;
  data: PlaylistReport;
};

// Constants
const PLAYLIST_REPORT_CACHE_SCHEMA_VERSION = 1;
const PLAYLIST_REPORT_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const PLAYLIST_REPORT_CACHE_PREFIX = "ytpr:playlist-report:";

const getPlaylistReportCacheKey = (playlistId: string) =>
  `${PLAYLIST_REPORT_CACHE_PREFIX}${playlistId}`;

const readCachedPlaylistReport = (
  playlistId: string
): PlaylistReport | null => {
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
  data: PlaylistReport
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

// API functions
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
    throw new PlaylistRequestError(
      isReportErrorReason(payload.error)
        ? payload.error
        : "service_unavailable"
    );
  }

  return payload;
};

const loadPlaylistReport = async (
  playlistId: string
): Promise<PlaylistReport> => {
  const cachedReport = readCachedPlaylistReport(playlistId);

  if (cachedReport) {
    return cachedReport;
  }

  const playlistReport = await requestPlaylistResource<PlaylistReport>(
    playlistId,
    "report"
  );

  writeCachedPlaylistReport(playlistId, playlistReport);

  return playlistReport;
};

export const createPlaylistReportQuery = (id: string) => ({
  queryKey: ["playlistReport", id],
  queryFn: () => loadPlaylistReport(id),
  staleTime: 1000 * 60 * 5,
});

export const fetchPlaylistDetails = async (
  playlistId: string
): Promise<PlaylistDetails> => {
  return requestPlaylistResource<PlaylistDetails>(playlistId, "details");
};

export const loadPlaylist = (queryClient: QueryClient): LoaderFunction => {
  return async ({ params }: LoaderFunctionArgs) => {
    if (!isPlaylistId(params.playlistId)) {
      throw new PlaylistRequestError("invalid_request");
    }

    try {
      const playlistDetails = await queryClient.ensureQueryData({
        queryKey: ["playlistDetails", params.playlistId],
        queryFn: () => fetchPlaylistDetails(params.playlistId as string),
      });

      const playlistDetailsPromise = queryClient.ensureQueryData(
        createPlaylistReportQuery(params.playlistId)
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

export const usePlaylistReport = (playlistId: string) => {
  return useSuspenseQuery(createPlaylistReportQuery(playlistId));
};

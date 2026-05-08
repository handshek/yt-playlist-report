import { useSuspenseQuery, type QueryClient } from "@tanstack/react-query";
import { defer, LoaderFunction, LoaderFunctionArgs } from "react-router-dom";

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

interface VideoDetailsResponse {
  kind: string;
  etag: string;
  items: VideoItem[];
  pageInfo: PageInfo;
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
const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_API_KEY = import.meta.env.VITE_YT_API_KEY;
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
const fetchPlaylistVideoIds = async (playlistId: string): Promise<string[]> => {
  const videoIds: string[] = [];
  let nextPageToken: string | undefined;

  do {
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/playlistItems?part=contentDetails&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}&maxResults=50${
        nextPageToken ? `&pageToken=${nextPageToken}` : ""
      }`
    );
    const data: PlaylistResponse = await response.json();
    videoIds.push(...data.items.map((item) => item.contentDetails.videoId));
    nextPageToken = data.nextPageToken;
  } while (nextPageToken);

  return videoIds;
};

const fetchVideoDetails = async (
  videoIds: string[]
): Promise<{ videos: VideoItem[]; totalDuration: number }> => {
  const fetchChunk = async (
    chunk: string[]
  ): Promise<{ videos: VideoItem[]; chunkDuration: number }> => {
    const response = await fetch(
      `${YOUTUBE_API_BASE_URL}/videos?part=contentDetails,snippet,statistics&id=${chunk.join(
        ","
      )}&key=${YOUTUBE_API_KEY}`
    );

    const data: VideoDetailsResponse = await response.json();
    const chunkDuration = data.items.reduce(
      (acc, item) => acc + parseDuration(item.contentDetails.duration),
      0
    );

    return { videos: data.items, chunkDuration };
  };

  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const results = await Promise.all(chunks.map(fetchChunk));
  const allVideos = results.flatMap((result) => result.videos);
  const totalDuration = results.reduce(
    (acc, result) => acc + result.chunkDuration,
    0
  );

  return { videos: allVideos, totalDuration };
};

const calculatePlaylistDetails = async (
  playlistId: string
): Promise<PlaylistReportData> => {
  const cachedReport = readCachedPlaylistReport(playlistId);

  if (cachedReport) {
    return cachedReport;
  }

  const videoIds = await fetchPlaylistVideoIds(playlistId);
  const { videos, totalDuration } = await fetchVideoDetails(videoIds);
  const avgDuration = Math.round(totalDuration / videos.length);

  const playlistReport = {
    videos,
    duration: formatDuration(totalDuration),
    avgDuration: formatDuration(avgDuration),
  };

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
  const response = await fetch(
    `${YOUTUBE_API_BASE_URL}/playlists?part=snippet&id=${playlistId}&key=${YOUTUBE_API_KEY}`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const playlist = data.items[0];

  if (playlist === undefined) {
    throw new Error("Invalid playlist ID");
  }

  console.log(playlist);

  return {
    id: playlist.id,
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    thumbnails: playlist.snippet.thumbnails,
  };
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
        videoDetails: defer({ data: playlistDetailsPromise }),
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

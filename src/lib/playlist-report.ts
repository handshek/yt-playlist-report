import { parseDuration } from "@/lib/duration";

export type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 2;

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1;

export const PLAYBACK_SPEED_OPTIONS: readonly {
  value: PlaybackSpeed;
  label: string;
}[] = [
  { value: 0.25, label: "0.25" },
  { value: 0.5, label: "0.5" },
  { value: 0.75, label: "0.75" },
  { value: 1, label: "1.0" },
  { value: 1.25, label: "1.25" },
  { value: 1.5, label: "1.5" },
  { value: 2, label: "2.0" },
];

export interface PlaylistRange {
  start: number;
  end: number;
}

export interface PlaylistSummary<TVideo> {
  selectedVideos: TVideo[];
  totalSeconds: number;
  averageSeconds: number;
  videoCount: number;
  range: PlaylistRange;
}

const clampIndex = (value: number, max: number) => {
  const integer = Number.isFinite(value) ? Math.floor(value) : 1;
  return Math.min(Math.max(integer, 1), max);
};

const normalizeRange = (
  range: PlaylistRange,
  videoCount: number
): PlaylistRange => {
  const max = Math.max(1, Math.floor(videoCount));
  const start = clampIndex(range.start, max);
  const end = clampIndex(range.end, max);

  return start <= end ? { start, end } : { start: end, end: start };
};

export const summarizePlaylist = <
  TVideo extends { contentDetails: { duration: string } }
>(
  videos: readonly TVideo[],
  { range, speed }: { range: PlaylistRange; speed: PlaybackSpeed }
): PlaylistSummary<TVideo> => {
  const effectiveRange = normalizeRange(range, videos.length);
  const selectedVideos = videos.slice(
    effectiveRange.start - 1,
    effectiveRange.end
  );
  const totalDuration = selectedVideos.reduce(
    (total, video) => total + parseDuration(video.contentDetails.duration),
    0
  );
  const totalSeconds = Math.round(totalDuration / speed);
  const averageSeconds = selectedVideos.length
    ? Math.floor(totalSeconds / selectedVideos.length)
    : 0;

  return {
    selectedVideos,
    totalSeconds,
    averageSeconds,
    videoCount: selectedVideos.length,
    range: effectiveRange,
  };
};

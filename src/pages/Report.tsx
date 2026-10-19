import React, { Suspense, useEffect, useState } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { usePlaylistDuration, refreshPlaylist } from "@/api/PlaylistApi";
import {
  useParams,
  useLoaderData,
  useOutletContext,
  Await,
  Link,
  useAsyncError,
  useRevalidator,
  useRouteError,
  type MetaFunction,
} from "react-router";
import {
  PlaylistDetails,
  VideoItem,
  formatDuration,
  parseDuration,
} from "@/api/PlaylistApi";
import VideoTable from "@/components/VideosTable";
import createColumns from "@/components/ui/columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap, History, Clock, Film, ExternalLink, RefreshCw } from "lucide-react";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { logoIcon } from "@/assets";
import QRCode from "react-qr-code";
import { queryClient } from "@/lib/query-client";
import { getPlaylistReportSavedAt } from "@/lib/playlist-cache";
import { loader as playlistLoader } from "@/api/PlaylistApi";
import { pageMeta } from "@/lib/site";
import type { ReportOutletContext } from "@/lib/report-context";
import ReportFeedback from "@/components/ReportFeedback";
import { Button } from "@/components/ui/button";

export const getReportMeta = (playlistId = "playlist") =>
  pageMeta({
    title: "YouTube Playlist Report | YT Playlist Report",
    description:
      "Explore the duration, playback speeds, video range, engagement metrics, and individual videos in this public YouTube playlist report.",
    pathname: `/playlist/${playlistId}`,
    robots: "noindex, follow",
  });

export const meta: MetaFunction = ({ params }) =>
  getReportMeta(params.playlistId);

export const clientLoader = playlistLoader(queryClient);

const PLAYBACK_SPEED_VALUES = [
  "0.25",
  "0.5",
  "0.75",
  "1.0",
  "1.25",
  "1.5",
  "2.0",
];

const PlaylistDuration: React.FC = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const { markReportReady } = useOutletContext<ReportOutletContext>();
  const { data } = usePlaylistDuration(playlistId!);
  const [values, setValues] = useState<number[]>([1, data?.videos.length || 1]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  useEffect(() => {
    if (data?.videos) {
      markReportReady();
    }
  }, [data?.videos, markReportReady]);

  if (!data || !data.videos) {
    return <div>No video details available</div>;
  }

  const selectedVideos = data.videos.slice(values[0] - 1, values[1]);
  const totalDuration = selectedVideos.reduce(
    (acc, video) => acc + parseDuration(video.contentDetails.duration),
    0
  );
  const speedAdjustedDuration = Math.round(totalDuration / playbackSpeed);
  const avgDuration = selectedVideos.length
    ? Math.floor(speedAdjustedDuration / selectedVideos.length)
    : 0;

  const handleSpeedChange = (value: string) => {
    setPlaybackSpeed(parseFloat(value));
  };

  const columns = createColumns(playlistId!, values[0]);

  return (
    <>
      <div className="mx-auto">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 py-10 md:py-14">
          <div className="bg-neutral-50 border p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex gap-1 xl:gap-2 items-center">
                <Clock className="w-4 h-4 xl:w-5 xl:h-5  text-gray-400" />
                <h2 className="text-xs xl:text-sm font-semibold uppercase text-gray-400">
                  Total Duration
                </h2>
              </div>
              <div className="flex gap-2 items-start">
                <span className="flex items-center text-sm xl:text-base">
                  <Zap className="w-3 h-3 xl:w-4 xl:h-4 mr-1" /> Speed:
                </span>
                <Select onValueChange={handleSpeedChange} defaultValue="1.0">
                  <SelectTrigger aria-label="Playback speed" className="w-fit min-w-[60px] py-0.5 px-1.5 h-fit bg-transparent text-sm lg:text-base bg-gray-200 hover:bg-gray-300 ">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {PLAYBACK_SPEED_VALUES.map((value) => (
                      <SelectItem key={value} value={value}>{`${value}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-3xl xl:text-4xl pt-4 xl:pt-6">
              {formatDuration(speedAdjustedDuration)}
            </p>
          </div>
          <div className="bg-neutral-50 border p-4 rounded-xl flex flex-col justify-between">
            <div className="flex gap-1 xl:gap-2 items-center">
              <History className="w-4 h-4 xl:w-5 xl:h-5  text-gray-400" />
              <h2 className="text-sm font-semibold uppercase text-gray-400">
                Average Duration
              </h2>
            </div>
            <p className="text-3xl xl:text-4xl pt-4 xl:pt-6">
              {formatDuration(avgDuration)}
            </p>
          </div>
          <div className="bg-neutral-50 border p-4 rounded-xl flex flex-col justify-between">
            <div className="flex gap-1 xl:gap-2 items-center">
              <Film className="w-4 h-4 xl:w-5 xl:h-5  text-gray-400" />
              <h2 className="text-sm font-semibold uppercase text-gray-400">
                Total Videos
              </h2>
            </div>
            <p className="text-3xl xl:text-4xl pt-4 xl:pt-6">
              {selectedVideos.length}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <VideoTable
            columns={columns}
            data={selectedVideos}
            onRangeChange={setValues}
            rangeValue={values}
            totalVideos={data.videos.length}
          />
        </div>
      </div>
    </>
  );
};

const PlaylistInfo: React.FC<{
  details: PlaylistDetails;
  updatedAt: number | null;
  onRefresh: () => void;
  refreshing: boolean;
  disabled: boolean;
}> = ({ details, updatedAt, onRefresh, refreshing, disabled }) => {
  return (
    <div className="w-full flex flex-col justify-between items-start md:flex-row lg:items-end gap-5">
      <div className="flex flex-col gap-1 pl-2 border-l-4 border-red-600 order-2 md:order-1">
        <p>
          <span className="text-sm lg:text-lg font-bold">{details.title}</span>
        </p>
        <p>
          <span className="text-sm lg:text-lg">
            Updated {new Date(updatedAt ?? Date.now()).toLocaleString()}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex gap-1.5 items-center underline">
            <a
              href={`https://youtube.com/playlist?list=${details.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm lg:text-base"
            >
              Visit Playlist
            </a>
            <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4" />
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={disabled}
            aria-label="Refresh playlist report"
            title="Reports stay cached for 24 hours. Refresh to fetch the latest data now."
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
        </div>
      </div>
      <div className="lg:self-center order-1 md:order-1">
        <a href="/" className="">
          <div className="w-fit flex items-center pointer-events-none">
            <span className="w-8 h-8 lg:w-10 lg:h-10 bg-red-600 grid place-content-center rounded-lg">
              <span className="w-4 lg:w-6 object-contain aspect-square">
                <img src={logoIcon} alt="" className="w-fit h-fit" />
              </span>
            </span>
            <p className="text-2xl lg:text-4xl font-bold italic uppercase px-1">
              ytpr
            </p>
          </div>
        </a>
      </div>

      <div className="max-w-fit flex justify-start md:justify-end order-3">
        <QRCode
          size={224}
          style={{ height: "auto", maxWidth: "100%", width: "35%" }}
          value={`https://ytpr.netlify.app/playlist/${details.id}`}
          viewBox={`0 0 2224 224`}
        />
      </div>
    </div>
  );
};

interface LoaderData {
  playlistDetails: PlaylistDetails;
  videoDetails: Promise<{
    videos: VideoItem[];
    duration: string;
    avgDuration: string;
  }>;
}

const ReportSkeleton: React.FC = () => {
  return (
    <div className="min-h-dvh">
      <div className="mx-mt-8 rounded-lg">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 py-14">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
};

function ReportLoadError({ error }: { error: unknown }) {
  const revalidator = useRevalidator();
  const reason = error instanceof Error ? error.message : "";
  const invalid = reason === "invalid_request";
  const unavailable = reason === "playlist_unavailable";

  return (
    <div role="alert" className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">
        {invalid
          ? "Invalid playlist link"
          : unavailable
          ? "Playlist unavailable"
          : "Unable to load this report"}
      </h1>
      <p className="text-neutral-600">
        {invalid
          ? "This link does not contain a valid playlist ID. Enter a YouTube playlist URL to generate a report."
          : unavailable
          ? "Make sure the playlist exists and is public, then try again."
          : "We could not load the playlist details. Please try again."}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {!invalid && (
          <Button
            onClick={() => void revalidator.revalidate()}
            disabled={revalidator.state === "loading"}
          >
            {revalidator.state === "loading" ? "Trying again..." : "Try again"}
          </Button>
        )}
        <Button asChild variant="outline">
          <Link to="/">Try another playlist</Link>
        </Button>
      </div>
    </div>
  );
}

function ReportDataError() {
  return <ReportLoadError error={useAsyncError()} />;
}

export function ErrorBoundary() {
  return (
    <main className="container min-h-[60vh]">
      <ReportLoadError error={useRouteError()} />
    </main>
  );
}

const Report: React.FC = () => {
  const { playlistDetails, videoDetails } = useLoaderData() as LoaderData;
  const revalidator = useRevalidator();
  const [refreshRequested, setRefreshRequested] = useState(false);
  const reportFetching =
    useIsFetching({ queryKey: ["playlist", playlistDetails?.id] }) > 0;
  const busy = revalidator.state !== "idle" || reportFetching;

  useEffect(() => {
    if (refreshRequested && !busy) {
      setRefreshRequested(false);
    }
  }, [refreshRequested, busy]);

  if (!playlistDetails) {
    return <ReportLoadError error={new Error("playlist_unavailable")} />;
  }

  const handleRefresh = () => {
    refreshPlaylist(queryClient, playlistDetails.id);
    setRefreshRequested(true);
    void revalidator.revalidate();
  };

  return (
    <>
      <div className="xl:px-28 min-h-dvh py-6">
        <div className="container mx-auto mt-8 rounded-lg">
          <PlaylistInfo
            details={playlistDetails}
            updatedAt={getPlaylistReportSavedAt(playlistDetails.id)}
            onRefresh={handleRefresh}
            refreshing={refreshRequested}
            disabled={busy || refreshRequested}
          />
          <Suspense fallback={<ReportSkeleton />}>
            <Await
              resolve={videoDetails}
              errorElement={<ReportDataError />}
            >
              <>
                <PlaylistDuration />
                <ReportFeedback />
              </>
            </Await>
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Report;

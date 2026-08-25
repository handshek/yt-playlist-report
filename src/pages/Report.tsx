import React, { Suspense, useState } from "react";
import { usePlaylistDuration } from "@/api/PlaylistApi";
import { useParams, useLoaderData, Await } from "react-router-dom";
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
import { Zap, History, Clock, Film, ExternalLink } from "lucide-react";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import PlaylistMeasurement from "@/components/PlaylistMeasurement";
import { logoIcon } from "@/assets";
import QRCode from "react-qr-code";

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
  const { data } = usePlaylistDuration(playlistId!);
  const [values, setValues] = useState<number[]>([1, data?.videos.length || 1]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  if (!data || !data.videos) {
    return <div>No video details available</div>;
  }

  const selectedVideos = data.videos.slice(values[0] - 1, values[1]);
  const totalDuration = selectedVideos.reduce(
    (acc, video) => acc + parseDuration(video.contentDetails.duration),
    0
  );
  const speedAdjustedDuration = Math.round(totalDuration / playbackSpeed);
  const avgDuration = ~~(speedAdjustedDuration / selectedVideos.length);

  const handleSpeedChange = (value: string) => {
    setPlaybackSpeed(parseFloat(value));
  };

  // Create columns with the playlistId
  const columns = createColumns(playlistId!);

  return (
    <>
      <PlaylistMeasurement playlistId={playlistId!} />
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
                  <SelectTrigger className="w-fit min-w-[60px] py-0.5 px-1.5 h-fit bg-transparent text-sm lg:text-base bg-gray-200 hover:bg-gray-300 ">
                    <SelectValue placeholder="Select speed" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {PLAYBACK_SPEED_VALUES.map((value) => (
                      <SelectItem value={value}>{`${value}`}</SelectItem>
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

const PlaylistInfo: React.FC<{ details: PlaylistDetails }> = ({ details }) => {
  return (
    <div className="w-full flex flex-col justify-between items-start md:flex-row lg:items-end gap-5">
      <div className="flex flex-col gap-1 pl-2 border-l-4 border-red-600 order-2 md:order-1">
        <p>
          <span className="text-sm lg:text-lg font-bold">{details.title}</span>
        </p>
        <p>
          <span className="text-sm lg:text-lg">
            {new Date().toLocaleString()}
          </span>
        </p>
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

const Report: React.FC = () => {
  const { playlistDetails, videoDetails } = useLoaderData() as LoaderData;

  if (!playlistDetails) {
    console.log("stop it!!");
    return <div>Error: Failed to load playlist data</div>;
  }

  return (
    <>
      <div className="xl:px-28 min-h-dvh py-6">
        <div className="container mx-auto mt-8 rounded-lg">
          <PlaylistInfo details={playlistDetails} />
          <Suspense fallback={<ReportSkeleton />}>
            <Await
              resolve={videoDetails}
              errorElement={<div>Error loading playlist details</div>}
            >
              <PlaylistDuration />
            </Await>
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Report;

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Link, useNavigate, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPlaylistDetails } from "@/api/PlaylistApi";
import { Loader, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { trackSeoEvent } from "@/lib/seo-events";
import { isPlaylistId } from "@/lib/playlist-id";

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

const Form = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const playlistMutation = useMutation({
    mutationFn: fetchPlaylistDetails,
    onSuccess: (data) => {
      queryClient.setQueryData(["playlistDetails", data.id], data);
      trackSeoEvent({ name: "report_success" });
      navigate(`/playlist/${data.id}`);
    },
    onError: (error) => {
      trackSeoEvent({ name: "report_error", reason: "fetch_failed" });
      toast.error("Error generating report", {
        description: error.message === "playlist_unavailable"
          ? "Make sure the playlist exists and is public"
          : "The playlist could not be loaded. Please try again.",
        richColors: true,
      });
      console.error("Error fetching playlist details:", error);
    },
  });

  const isPending =
    navigation.state === "loading" || playlistMutation.isPending;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    let playlistId;

    try {
      const parsedUrl = new URL(url);
      playlistId = parsedUrl.searchParams.get("list");
      if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        !YOUTUBE_HOSTS.has(parsedUrl.hostname) ||
        !isPlaylistId(playlistId)
      ) {
        throw new Error("Invalid playlist URL");
      }
    } catch (error) {
      trackSeoEvent({ name: "report_error", reason: "invalid_url" });
      toast.error("Invalid playlist URL", {
        description: "Please enter a valid playlist URL",
        richColors: true,
      });
      return;
    }

    trackSeoEvent({ name: "report_submit" });
    playlistMutation.mutate(playlistId);
  }

  return (
    <div className="w-full">
      <div className="md:max-w-[70%] mx-auto">
        <form
          onSubmit={(e) => {
            handleSubmit(e);
          }}
          className="w-full flex flex-col lg:flex-row gap-3 items-center py-2"
        >
          <Input
            type="url"
            aria-label="YouTube playlist URL"
            placeholder="Enter YouTube playlist URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isPending}
            className="w-full py-6 md:py-6 text-base md:text-base"
          />
          <Button
            className="mt-0 w-full py-6 md:py-6 md:px-8 md:text-base lg:w-fit bg-red-600 hover:bg-red-800 transition-colors"
            disabled={isPending}
          >
            <ScrollText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
            {isPending ? "Generating..." : "Generate"}
          </Button>
        </form>
        <p className="mx-auto max-w-2xl text-center text-xs leading-5 text-neutral-500">
          By generating a report, you agree to our{" "}
          <Link to="/terms/" className="underline hover:text-neutral-800">
            Terms
          </Link>
          , acknowledge our{" "}
          <Link to="/privacy/" className="underline hover:text-neutral-800">
            Privacy Policy
          </Link>
          , and agree to the{" "}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-neutral-800"
          >
            YouTube Terms
          </a>
          .
        </p>
        {isPending && (
          <div className="w-fit mx-auto py-1 px-3 mt-2 flex items-center gap-2 rounded-full bg-neutral-50 border animate-pulse ">
            <Loader className="w-4 h-4 animate-spin" />
            <p className="text-center">
              Please wait, this may take a few seconds...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Form;

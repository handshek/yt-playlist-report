import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate, useNavigation } from "react-router";
import { Button } from "./ui/button";
import { useMutation } from "@tanstack/react-query";
import { fetchPlaylistDetails } from "@/api/PlaylistApi";
import { Loader, ScrollText } from "lucide-react";
import { toast } from "sonner";

const Form = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();
  const navigation = useNavigation();

  const playlistMutation = useMutation({
    mutationFn: fetchPlaylistDetails,
    onSuccess: (data) => {
      navigate(`playlist/${data.id}`, { state: { playlistDetails: data } });
    },
    onError: (error) => {
      setUrl("");
      toast.error("Error generating report", {
        description: "Make sure the playlist exists and is public",
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
      playlistId = new URL(url).searchParams.get("list");
    } catch (error) {
      toast.error("Invalid playlist URL", {
        description: "Please enter a valid playlist URL",
        richColors: true,
      });
      return;
    }

    if (!url.length || !playlistId) {
      setUrl("");
      toast.error("Invalid playlist URL", {
        description: "Please enter a valid playlist URL",
        richColors: true,
      });
      return;
    }

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

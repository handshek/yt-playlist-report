import { useEffect, useRef } from "react";
import { trackPageview } from "@/lib/counterscale";

interface PlaylistMeasurementProps {
  playlistId: string;
}

const PlaylistMeasurement = ({ playlistId }: PlaylistMeasurementProps) => {
  const measuredPlaylistId = useRef<string>();

  useEffect(() => {
    if (measuredPlaylistId.current === playlistId) {
      return;
    }

    measuredPlaylistId.current = playlistId;
    trackPageview(`/playlist/${playlistId}`);
  }, [playlistId]);

  return null;
};

export default PlaylistMeasurement;

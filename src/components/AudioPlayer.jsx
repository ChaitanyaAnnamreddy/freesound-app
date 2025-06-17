import { useState, useRef, useEffect } from "react";
import { IconButton, Tooltip, CircularProgress } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";

const AudioPlayer = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setError("No audio source provided");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const audio = new Audio(src);
      audioRef.current = audio;

      // Handle load success
      audio.addEventListener("canplay", () => {
        setIsLoading(false);
      });

      // Handle errors
      audio.addEventListener("error", (e) => {
        const errorMsg = `Audio error: ${e.target.error?.message || "Unknown error"}`;
        console.error("AudioPlayer: Audio error", errorMsg, e);
        setError(errorMsg);
        setIsLoading(false);
        audioRef.current = null;
      });

    } catch (err) {
      console.error("AudioPlayer: Failed to initialize Audio", err);
      setError("Failed to initialize audio: " + err.message);
      setIsLoading(false);
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) {
      console.warn("AudioPlayer: No audioRef, cannot play");
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("AudioPlayer: Play error", err);
        setError("Failed to play audio: " + err.message);
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (!src) {
    return null;
  }

  if (error) {
    return (
      <Tooltip title={error} arrow placement="top">
        <span>
          <IconButton disabled>
            <PlayArrowIcon />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip
      title={isLoading ? "Loading audio..." : isPlaying ? "Pause audio" : "Play audio"}
      arrow
      placement="top"
    >
      <span>
        <IconButton onClick={togglePlay} disabled={isLoading || !audioRef.current}>
          {isLoading ? (
            <CircularProgress size={24} />
          ) : isPlaying ? (
            <PauseIcon />
          ) : (
            <PlayArrowIcon />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default AudioPlayer;
import { useState, useEffect, useRef } from "react";
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
} from "@mui/material";
import AudioPlayer from "./AudioPlayer";
import useDB from "../hooks/useDB";

const MixTab = () => {
  const [downloadedSounds, setDownloadedSounds] = useState([]);
  const [recordedSounds, setRecordedSounds] = useState([]);
  const [selectedDownload, setSelectedDownload] = useState("");
  const [selectedRecording, setSelectedRecording] = useState("");
  const [mixedAudio, setMixedAudio] = useState(null);
  const { getSounds, isWorkerReady, workerError } = useDB();
  const worker = useRef(null);
  const token = localStorage.getItem("freesound_token");

  useEffect(() => {
    worker.current = new Worker(new URL("../workers/audioProcessor.js", import.meta.url), {
      type: "module",
    });
    return () => worker.current.terminate();
  }, []);

  useEffect(() => {
    if (isWorkerReady && token) {
      getSounds("downloaded").then(setDownloadedSounds).catch(console.error);
      getSounds("recorded").then(setRecordedSounds).catch(console.error);
    }
  }, [getSounds, isWorkerReady, token]);

  const handleMix = () => {
    const sound1 = downloadedSounds.find((s) => s.id === selectedDownload);
    const sound2 = recordedSounds.find((s) => s.id === selectedRecording);
    if (sound1 && sound2) {
      worker.current.postMessage({
        action: "mixAudio",
        data: { sound1: sound1.blob, sound2: sound2.blob },
      });
      worker.current.onmessage = (e) => {
        if (e.data.action === "mixAudio") {
          setMixedAudio(URL.createObjectURL(e.data.data));
        }
      };
    }
  };

  if (!token) {
    return (
      <Box sx={{ px: 2, py: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ mb: 2, fontWeight: "medium" }}
        >
          Please Log In
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You need to log in to mix sounds. Use your Freesound account to access the mixing functionality.
        </Typography>
      </Box>
    );
  }

  if (workerError) {
    return <Typography color="error">Database Error: {workerError}</Typography>;
  }

  if (!isWorkerReady) {
    return <Typography>Loading database...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" }, 
          gap: 2, 
          mb: 2, 
        }}
      >
        <FormControl sx={{ flex: 1, minWidth: 200 }} margin="normal">
          <InputLabel>Downloaded Sound</InputLabel>
          <Select
            value={selectedDownload}
            onChange={(e) => setSelectedDownload(e.target.value)}
            label="Downloaded Sound"
          >
            {downloadedSounds.map((sound) => (
              <MenuItem key={sound.id} value={sound.id}>
                {sound.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ flex: 1, minWidth: 200 }} margin="normal">
          <InputLabel>Recorded Sound</InputLabel>
          <Select
            value={selectedRecording}
            onChange={(e) => setSelectedRecording(e.target.value)}
            label="Recorded Sound"
          >
            {recordedSounds.map((sound) => (
              <MenuItem key={sound.id} value={sound.id}>
                {sound.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Button
        variant="contained"
        onClick={handleMix}
        disabled={!selectedDownload || !selectedRecording}
        sx={{ mb: 2 }}
      >
        Mix Sounds
      </Button>
      {mixedAudio && (
        <Box>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Mixed Audio:
          </Typography>
          <AudioPlayer src={mixedAudio} />
        </Box>
      )}
    </Box>
  );
};

export default MixTab;
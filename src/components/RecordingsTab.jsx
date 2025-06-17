import { useEffect, useState, useRef } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Box,
  Tooltip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import RefreshIcon from "@mui/icons-material/Refresh";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteIcon from "@mui/icons-material/Delete";
import AudioPlayer from "./AudioPlayer";
import AudioVisualizer from "./AudioVisualizer";
import useDB from "../hooks/useDB";

const RecordingsTab = () => {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [soundToDelete, setSoundToDelete] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const { getSounds, saveSound, deleteSound, isWorkerReady, workerError } = useDB();
  const token = localStorage.getItem("freesound_token");

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
      "audio/wav",
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    console.warn("RecordingsTab: No supported MIME types found");
    return null;
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        throw new Error("No supported audio MIME types available in this browser");
      }
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType });
        setAudioUrl(URL.createObjectURL(blob));
        try {
          const name = `recording-${Date.now()}.${mimeType
            .split(";")[0]
            .split("/")[1]}`;
          await saveSound("recorded", name, blob);
          setRefreshKey((prev) => prev + 1);
        } catch (err) {
          console.error("RecordingsTab: Save error", err);
          setError("Failed to save recording: " + err.message);
          setSnackbarMessage("Failed to save recording: " + err.message);
          setSnackbarOpen(true);
        }
        chunks.length = 0;
        stream.getTracks().forEach((track) => track.stop());
        audioContextRef.current.close();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("RecordingsTab: Start recording error", err);
      setError("Failed to start recording: " + err.message);
      setSnackbarMessage("Failed to start recording: " + err.message);
      setSnackbarOpen(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const fetchSounds = () => {
    if (isWorkerReady) {
      let isLatest = true;
      setIsRefreshing(true);
      getSounds("recorded")
        .then((sounds) => {
          if (isLatest) {
            if (!Array.isArray(sounds)) {
              console.error("RecordingsTab: getSounds returned non-array:", sounds);
              setSounds([]);
              setError("Invalid data format from database");
              setSnackbarMessage("Invalid data format from database");
              setSnackbarOpen(true);
              return;
            }
            setSounds(sounds);
            setError(null);
          }
        })
        .catch((err) => {
          if (isLatest) {
            console.error("Error fetching sounds:", err);
            setError(err.message);
            setSnackbarMessage("Failed to fetch recordings: " + err.message);
            setSnackbarOpen(true);
          }
        })
        .finally(() => {
          if (isLatest) setIsRefreshing(false);
        });
      return () => {
        isLatest = false;
      };
    }
  };

  useEffect(() => {
    const cleanup = fetchSounds();
    return cleanup;
  }, [getSounds, isWorkerReady, refreshKey]);

  const handleOpenDialog = (soundId) => {
    setSoundToDelete(soundId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSoundToDelete(null);
  };

  const handleDelete = async () => {
    try {
      setError(null);
      // Delete from database
      await deleteSound(soundToDelete);
      // Update UI by removing the sound
      setSounds(sounds.filter((sound) => sound.id !== soundToDelete));
      // Show success message
      setSnackbarMessage("Recording deleted successfully");
      setSnackbarOpen(true);
    } catch (err) {
      setError("Failed to delete recording: " + err.message);
      setSnackbarMessage("Failed to delete recording: " + err.message);
      setSnackbarOpen(true);
    } finally {
      handleCloseDialog();
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  if (!token) {
    return (
      <Box sx={{ px: 2, py: 2 }}>
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ mb: 2, fontWeight: "medium" }}
        >
          Please Log In
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You need to log in to record and manage sounds. Use your Freesound account to access the recording functionality.
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
    <Box sx={{ px: 2, py: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Tooltip title="Refresh recordings" arrow placement="top">
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              disabled={isRecording || isRefreshing}
            >
              {isRefreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
            </Button>
          </span>
        </Tooltip>
      </Box>
      {isRecording && <AudioVisualizer analyser={analyserRef.current} />}
      <Box sx={{ display: "flex", gap: 1, my: 2 }}>
        <Tooltip
          title={isRecording ? "Stop recording" : "Start recording"}
          arrow
          placement="top"
        >
          <Button
            variant="contained"
            color={isRecording ? "secondary" : "primary"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isWorkerReady || isPaused}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </Button>
        </Tooltip>
        <Tooltip
          title={isPaused ? "Resume recording" : "Pause recording"}
          arrow
          placement="top"
        >
          <Button
            variant="contained"
            color="primary"
            onClick={isPaused ? resumeRecording : pauseRecording}
            disabled={!isRecording}
          >
            <PauseIcon />
          </Button>
        </Tooltip>
      </Box>
      {audioUrl && (
        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 1 }}>
            Latest Recording:
          </Typography>
          <audio src={audioUrl} controls />
        </Box>
      )}
      {sounds.length === 0 ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          No recordings found. Use the controls above to start recording.
        </Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper" }}>
          {sounds.map((sound, index) => (
            <ListItem
              key={sound.id}
              sx={{
                py: 1,
                px: 2,
                transition: "background-color 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  backgroundColor: "action.hover",
                  boxShadow: 1,
                },
                borderBottom:
                  index < sounds.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <ListItemText
                primary={sound.name}
                secondary={
                  sound.createdAt
                    ? new Date(sound.createdAt).toLocaleString()
                    : null
                }
                primaryTypographyProps={{ fontWeight: "medium" }}
                secondaryTypographyProps={{
                  color: "text.secondary",
                  fontSize: "0.875rem",
                }}
              />
              <AudioPlayer src={URL.createObjectURL(sound.blob)} />
              <Tooltip title="Delete recording" arrow placement="top">
                <IconButton
                  onClick={() => handleOpenDialog(sound.id)}
                  disabled={isRecording}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="delete-confirmation-dialog"
      >
        <DialogTitle id="delete-confirmation-dialog">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete the recording from the database. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecordingsTab;
import { useState } from "react";
import {
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  Tooltip,
  Box,
  CircularProgress,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import GetAppIcon from "@mui/icons-material/GetApp";
import { searchSounds, downloadSound } from "../services/freesoundApi";
import useDB from "../hooks/useDB";
import AudioPlayer from "./AudioPlayer";

const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [downloadingId, setDownloadingId] = useState(null); // Track downloading sound ID
  const { saveSound, isWorkerReady, workerError } = useDB();
  const token = localStorage.getItem("freesound_token");
  console.log("SearchTab: token =", token);

  console.log("SearchTab: Rendering with results =", results.length);

  const handleSearch = async () => {
    if (!token) {
      setError("Please log in to search sounds");
      return;
    }
    try {
      setError(null);
      const sounds = await searchSounds(query, token);
      console.log(
        "SearchTab: Preview URLs =",
        sounds.map((s) => ({
          id: s.id,
          name: s.name,
          preview: s.previews?.["preview-hq-mp3"] || s.previews?.["preview-lq-mp3"],
        }))
      );
      setResults(sounds);
      console.log("SearchTab: Search completed, results =", sounds.length);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search sounds: " + err.message);
    }
  };

  const handleDownload = async (sound) => {
    try {
      setError(null);
      setDownloadingId(sound.id); // Set loading state
      console.log("SearchTab: Downloading sound ID =", sound.id);
      const blob = await downloadSound(sound.id, token);

      // Trigger file download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = sound.name || `sound-${sound.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Save to database
      const name = sound.name || `sound-${sound.id}.mp3`;
      await saveSound("downloaded", name, blob);
      console.log("SearchTab: Saved sound to database", { id: sound.id, name });

      // Show success message
      setSnackbarMessage(`Sound ${sound.name || `ID ${sound.id}`} downloaded and saved successfully`);
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Download or save error:", err.message);
      setError(`Failed to download or save sound: ${err.message}`);
    } finally {
      setDownloadingId(null); // Clear loading state
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ px: 2, py: 2 }}>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      {workerError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Database Error: {workerError}
          <Button
            onClick={() => window.location.reload()}
            size="small"
            sx={{ ml: 1 }}
          >
            Retry
          </Button>
        </Typography>
      )}
      {!isWorkerReady && !workerError && (
        <Typography sx={{ mb: 2 }}>Loading database...</Typography>
      )}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Search Sounds"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!token}
          sx={{ alignSelf: "center" }}
        >
          Search
        </Button>
      </Box>
      {results.length === 0 && isWorkerReady && !error && (
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          No results found. Try searching for a sound.
        </Typography>
      )}
      <List sx={{ bgcolor: "background.paper" }}>
        {results.map((sound, index) => (
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
                index < results.length - 1
                  ? "1px solid"
                  : "none",
              borderColor: "divider",
            }}
          >
            <ListItemText
              primary={sound.name}
              secondary={sound.description || "No description"}
              primaryTypographyProps={{ fontWeight: "medium" }}
              secondaryTypographyProps={{ color: "text.secondary", fontSize: "0.875rem" }}
            />
            {sound.previews?.["preview-hq-mp3"] || sound.previews?.["preview-lq-mp3"] ? (
              <AudioPlayer
                src={sound.previews["preview-hq-mp3"] || sound.previews["preview-lq-mp3"]}
              />
            ) : (
              <Typography variant="body2" color="textSecondary">
                No preview available
              </Typography>
            )}
            <Tooltip title="Download sound" arrow placement="top">
              <span>
                <IconButton
                  onClick={() => handleDownload(sound)}
                  disabled={!token || !isWorkerReady || downloadingId === sound.id}
                >
                  {downloadingId === sound.id ? (
                    <CircularProgress size={24} />
                  ) : (
                    <GetAppIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </ListItem>
        ))}
      </List>
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
    </Box>
  );
};

export default SearchTab;
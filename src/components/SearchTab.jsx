import { useState, useEffect } from "react";
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import { searchSounds, downloadSound, loginFreesound } from "../services/freesoundApi";
import useDB from "../hooks/useDB";
import AudioPlayer from "./AudioPlayer";

const SearchTab = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [downloadingId, setDownloadingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const { saveSound, isWorkerReady, workerError } = useDB();
  const token = localStorage.getItem("freesound_token");

  const handleSearch = async () => {
    try {
      setError(null);
      setLoading(true);
      const sounds = await searchSounds(query, token);
      setResults(sounds);
    } catch (err) {
      setError("Failed to search sounds: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isWorkerReady) {
      handleSearch();
    }
  }, [isWorkerReady]);

  const handleTagClick = (tag) => {
    setQuery(tag);
    handleSearch();
  };

  const handleDownload = async (sound) => {
    if (!token) {
      setLoginDialogOpen(true);
      return;
    }
    try {
      setError(null);
      setDownloadingId(sound.id);
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

      // Show success message
      setSnackbarMessage(`Sound ${sound.name || `ID ${sound.id}`} downloaded and saved successfully`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Download or save error:", err.message);
      setError(`Failed to download or save sound: ${err.message}`);
      setSnackbarMessage(`Failed to download or save sound: ${err.message}`);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
    setSnackbarSeverity("success");
  };

  const handleLoginDialogClose = () => {
    setLoginDialogOpen(false);
  };

  const handleLoginRedirect = () => {
    setLoginDialogOpen(false);
    loginFreesound();
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
          disabled={!isWorkerReady || loading}
          sx={{ alignSelf: "center" }}
        >
          Search
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", flexDirection: "column" }}>
          <CircularProgress />
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      ) : results.length === 0 && isWorkerReady && !error ? (
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          No results found. Try searching for a sound.
        </Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", py: 0 }}>
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
                  index < results.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <ListItemText
                primary={sound.name}
                secondary={
                  <>
                    {sound.description || "No description"}
                    {sound.tags && sound.tags.length > 0 && (
                      <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {sound.tags.map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            variant="filled"
                            sx={{ fontSize: "0.75rem", backgroundColor: "#f06292", color: "white", cursor: "pointer" }}
                            onClick={() => handleTagClick(tag)}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                }
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
              <Tooltip title={token ? "Download sound" : "Please log in to download"} arrow placement="top">
                <span>
                  <IconButton
                    onClick={() => handleDownload(sound)}
                    disabled={!isWorkerReady || downloadingId === sound.id}
                    color="primary"
                    sx={{
                      "&:hover": {
                        bgcolor: "primary.light",
                        color: "primary.contrastText",
                      },
                    }}
                  >
                    {downloadingId === sound.id ? (
                      <CircularProgress size={24} color="primary" />
                    ) : (
                      <GetAppIcon />
                    )}
                  </IconButton>
                </span>
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
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog
        open={loginDialogOpen}
        onClose={handleLoginDialogClose}
        aria-labelledby="login-dialog-title"
      >
        <DialogTitle id="login-dialog-title">Log In Required</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please log in to download sounds. Use your Freesound account to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLoginDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLoginRedirect} color="primary" variant="contained">
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchTab;
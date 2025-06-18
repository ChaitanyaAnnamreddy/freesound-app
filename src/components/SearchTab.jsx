import { useState, useEffect, useCallback } from "react";
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
  InputAdornment,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import ClearIcon from "@mui/icons-material/Clear";
import { searchSounds, downloadSound, loginFreesound } from "../services/freesoundApi";
import useDB from "../hooks/useDB";
import AudioPlayer from "./AudioPlayer";

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

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
  const debouncedQuery = useDebounce(query, 300);

  const handleSearch = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const sounds = await searchSounds(debouncedQuery, token);
      setResults(sounds);
    } catch (err) {
      setError("Failed to search sounds: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, token]);

  useEffect(() => {
    if (isWorkerReady) {
      handleSearch();
    }
  }, [isWorkerReady, handleSearch]);

  const handleTagClick = (tag) => {
    setQuery(tag);
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

  const handleClearQuery = () => {
    setQuery("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !loading && isWorkerReady) {
      handleSearch();
    }
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
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Search Sounds"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          margin="normal"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {query && (
                  <IconButton
                    onClick={handleClearQuery}
                    size="small"
                    aria-label="Clear search query"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                {loading && <CircularProgress size={20} />}
              </InputAdornment>
            ),
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
            },
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={!isWorkerReady || loading}
          sx={{
            alignSelf: "center",
            borderRadius: "8px",
            px: 3,
          }}
        >
          Search
        </Button>
      </Box>
      {loading && !query ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh", flexDirection: "column" }}>
          <CircularProgress />
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      ) : results.length === 0 && isWorkerReady && !error ? (
        <Typography color="textSecondary" sx={{ mt: 2, textAlign: "center" }}>
          No results found. Try searching for a sound.
        </Typography>
      ) : (
        <List sx={{ bgcolor: "transparent", py: 0 }}>
          {results.map((sound, index) => (
            <ListItem
              key={sound.id}
              sx={{
                bgcolor: "background.paper",
                borderRadius: "12px",
                mb: 1.5,
                p: { xs: 1.5, sm: 2 },
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                },
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "stretch", sm: "center" },
                gap: 2,
                border: "1px solid",
                borderColor: "divider",
              }}
              role="listitem"
              aria-label={`Sound: ${sound.name}`}
            >
              <ListItemText
                primary={sound.name}
                secondary={
                  <>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        mb: 0.5,
                      }}
                    >
                      {sound.description || "No description"}
                    </Typography>
                    {sound.tags && sound.tags.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {sound.tags.slice(0, 5).map((tag, idx) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            variant="filled"
                            sx={{
                              fontSize: "0.7rem",
                              bgcolor: "secondary.main",
                              color: "white",
                              cursor: "pointer",
                              "&:hover": {
                                bgcolor: "#33bfff",
                              },
                            }}
                            onClick={() => handleTagClick(tag)}
                            aria-label={`Search for tag: ${tag}`}
                          />
                        ))}
                        {sound.tags.length > 5 && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: "0.7rem", ml: 0.5, alignSelf: "center" }}
                          >
                            +{sound.tags.length - 5} more
                          </Typography>
                        )}
                      </Box>
                    )}
                  </>
                }
                primaryTypographyProps={{
                  variant: "h6",
                  fontWeight: "bold",
                  fontSize: { xs: "1rem", sm: "1.1rem" },
                  color: "text.primary",
                  noWrap: true,
                  textOverflow: "ellipsis",
                }}
                secondaryTypographyProps={{
                  component: "div",
                  color: "text.secondary",
                  fontSize: "0.85rem",
                }}
                sx={{ flex: 1, minWidth: 0 }}
              />
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexShrink: 0,
                  mt: { xs: 1, sm: 0 },
                }}
              >
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
                          transform: "scale(1.1)",
                        },
                        transition: "transform 0.2s, background-color 0.2s",
                      }}
                      aria-label={token ? "Download sound" : "Log in to download sound"}
                    >
                      {downloadingId === sound.id ? (
                        <CircularProgress size={24} color="primary" />
                      ) : (
                        <GetAppIcon />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
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
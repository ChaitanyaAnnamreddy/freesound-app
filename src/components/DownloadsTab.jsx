import { useEffect, useState } from "react";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
  Box,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import AudioPlayer from "./AudioPlayer";
import useDB from "../hooks/useDB";

const DownloadsTab = () => {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [soundToDelete, setSoundToDelete] = useState(null);
  const { getSounds, deleteSound, isWorkerReady, workerError } = useDB();
  const token = localStorage.getItem("freesound_token");

  const fetchSounds = () => {
    if (isWorkerReady) {
      let isLatest = true;
      getSounds("downloaded")
        .then((sounds) => {
          if (isLatest) {
            if (!Array.isArray(sounds)) {
              console.error("DownloadsTab: getSounds returned non-array:", sounds);
              setSounds([]);
              setError("Invalid data format from database");
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
          }
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
      setSnackbarMessage("Sound deleted successfully");
      setSnackbarOpen(true);
    } catch (err) {
      setError("Failed to delete sound: " + err.message);
      setSnackbarMessage("Failed to delete sound: " + err.message);
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
      <Box sx={{ px: 2, py: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "80vh" }}>
        <Typography
          variant="h6"
          color="text.primary"
          sx={{ mb: 2, fontWeight: "medium" }}
        >
          Please Log In
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          You need to log in to view and manage your downloaded sounds. Use your Freesound account to access the downloads functionality.
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
        <Tooltip title="Refresh downloads" arrow placement="top">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            sx={{ borderRadius: "8px" }}
          >
            <RefreshIcon />
          </Button>
        </Tooltip>
      </Box>
      {sounds.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          No downloaded sounds found.
        </Typography>
      ) : (
        <List sx={{ bgcolor: "transparent", py: 0 }}>
          {sounds.map((sound, index) => (
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
              aria-label={`Downloaded sound: ${sound.name}`}
            >
              <ListItemText
                primary={sound.name}
                secondary={
                  sound.createdAt
                    ? new Date(sound.createdAt).toLocaleString()
                    : null
                }
                slotProps={{
                  primary: {
                    variant: "h6",
                    fontWeight: "bold",
                    fontSize: { xs: "1rem", sm: "1.1rem" },
                    color: "text.primary",
                    noWrap: true,
                    textOverflow: "ellipsis",
                  },
                  secondary: {
                    color: "text.secondary",
                    fontSize: "0.85rem",
                  },
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
                <AudioPlayer src={URL.createObjectURL(sound.blob)} />
                <Tooltip title="Delete sound" arrow placement="top">
                  <IconButton
                    onClick={() => handleOpenDialog(sound.id)}
                    color="error"
                    sx={{
                      "&:hover": {
                        bgcolor: "error.light",
                        color: "error.contrastText",
                        transform: "scale(1.1)",
                      },
                      transition: "transform 0.2s, background-color 0.2s",
                    }}
                    aria-label="Delete downloaded sound"
                  >
                    <DeleteIcon />
                  </IconButton>
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
            This will permanently delete the sound from the database. Are you sure you want to proceed?
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

export default DownloadsTab;
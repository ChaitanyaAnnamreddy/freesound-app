import { useEffect, useState } from "react";
import { List, ListItem, ListItemText, Typography, Button, Box, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AudioPlayer from "./AudioPlayer";
import useDB from "../hooks/useDB";

const DownloadsTab = () => {
  const [sounds, setSounds] = useState([]);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getSounds, isWorkerReady, workerError } = useDB();

  const fetchSounds = () => {
    if (isWorkerReady) {
      getSounds("downloaded")
        .then((sounds) => {
          setSounds(sounds || []);
          setError(null);
        })
        .catch((err) => {
          console.error("Error fetching sounds:", err);
          setError(err.message);
        });
    }
  };

  useEffect(() => {
    fetchSounds();
  }, [getSounds, isWorkerReady, refreshKey]);

  if (workerError) {
    return <Typography color="error">Database Error: {workerError}</Typography>;
  }

  if (!isWorkerReady) {
    return <Typography>Loading database...</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {error && <Typography color="error">{error}</Typography>}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Tooltip title="Refresh" arrow placement="top">
          <Button
            size="small"
            variant="outlined"
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            <RefreshIcon />
          </Button>
        </Tooltip>
      </Box>
      {sounds.length === 0 ? (
        <Typography color="textSecondary">
          No downloaded sounds found.
        </Typography>
      ) : (
        <List>
          {sounds.map((sound) => (
            <ListItem key={sound.id}>
              <ListItemText primary={sound.name} />
              <AudioPlayer src={URL.createObjectURL(sound.blob)} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default DownloadsTab;
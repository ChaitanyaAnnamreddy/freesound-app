import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAccessToken } from "../services/freesoundApi";
import { Typography, Box, CircularProgress } from "@mui/material";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      getAccessToken(code)
        .then((token) => {
          localStorage.setItem("freesound_token", token);
          navigate("/");
        })
        .catch((err) => {
          console.error("Failed to get access token:", err);
          setError("Failed to authenticate. Please try again.");
        });
    } else {
      setError("No authorization code provided.");
    }
  }, [searchParams, navigate]);

  if (error) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column" }}>
      <CircularProgress />
    </Box>
  );
};

export default Callback;
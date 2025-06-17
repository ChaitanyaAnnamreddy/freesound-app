import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getAccessToken } from "../services/freesoundApi";
import { Box, CircularProgress, Typography } from "@mui/material";

const Callback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !isProcessing) {
      setIsProcessing(true);
      getAccessToken(code)
        .then((token) => {
          localStorage.setItem("freesound_token", token);
          navigate("/", { replace: true });
        })
        .catch((err) => {
          console.error("Callback: OAuth error:", err);
          setError("Failed to authenticate. Please try again.");
          setTimeout(() => {
            setIsProcessing(false);
            navigate("/", { replace: true });
          }, 3000);
        });
    } else if (!code && !isProcessing) {
      setError("No authorization code found.");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 3000);
    }

    return () => {
      setIsProcessing(false);
    };
  }, [searchParams, navigate, isProcessing]);

  return (
    <div>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
          <Typography>Authenticating...</Typography>
        </Box>
      )}
    </div>
  );
};

export default Callback;

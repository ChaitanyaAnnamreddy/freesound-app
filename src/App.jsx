import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import { AppBar, Tabs, Tab, Box, Button, Container } from "@mui/material";
import SearchTab from "./components/SearchTab";
import RecordingsTab from "./components/RecordingsTab";
import DownloadsTab from "./components/DownloadsTab";
import MixTab from "./components/MixTab";
import Callback from "./components/Callback";
import { loginFreesound } from "./services/freesoundApi";

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  const token = localStorage.getItem("freesound_token");

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem("freesound_token");
    window.location.reload();
  };

  return (
    <Router>
      <Container maxWidth="xl" sx={{ paddingX: "0px !important"}}>
        <AppBar position="static">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab
                label="Search"
                component={Link}
                to="/"
                sx={{
                  textTransform: "none",
                  color: "white",
                  "&.Mui-selected": {
                    backgroundColor: "#f1f1f1",
                  },
                }}
              />
              <Tab
                label="Recordings"
                component={Link}
                to="/recordings"
                sx={{
                  textTransform: "none",
                  color: "white",
                  "&.Mui-selected": {
                    backgroundColor: "#f1f1f1",
                  },
                }}
              />
              <Tab
                label="Downloads"
                component={Link}
                to="/downloads"
                sx={{
                  textTransform: "none",
                  color: "white",
                  "&.Mui-selected": {
                    backgroundColor: "#f1f1f1",
                  },
                }}
              />
              <Tab
                label="Mix"
                component={Link}
                to="/mix"
                sx={{
                  textTransform: "none",
                  color: "white",
                  "&.Mui-selected": {
                    backgroundColor: "#f1f1f1",
                  },
                }}
              />
            </Tabs>
            <Box>
              {!token ? (
                <Button color="inherit" onClick={loginFreesound}  sx={{
                    marginRight:2,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#f1f1f1",
                     color: "#1976d2",
                    },
                  }}>
                  Login
                </Button>
              ) : (
                <Button
                  color="inherit"
                  onClick={handleLogout}
                    sx={{
                    marginRight:2,
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#f1f1f1",
                     color: "#1976d2",
                    },
                  }}
                >
                  Logout
                </Button>
              )}
            </Box>
          </Box>
        </AppBar>
        <Routes>
          <Route path="/" element={<SearchTab />} />
          <Route path="/recordings" element={<RecordingsTab />} />
          <Route path="/downloads" element={<DownloadsTab />} />
          <Route path="/mix" element={<MixTab />} />
          <Route path="/callback" element={<Callback />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
import { useState, useEffect } from "react";
import {
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Box,
  Button,
  Container,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchTab from "./components/SearchTab";
import RecordingsTab from "./components/RecordingsTab";
import DownloadsTab from "./components/DownloadsTab";
import MixTab from "./components/MixTab";
import Callback from "./components/Callback";
import { loginFreesound } from "./services/freesoundApi";

// Custom MUI theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#f06292",
    },
    background: {
      default: "#f5f5f5",
      paper: "#fff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.9rem",
          transition: "color 0.3s, background-color 0.3s",
          "&.Mui-selected": {
            color: "#1976d2",
            backgroundColor: "#e3f2fd",
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
  },
});

const App = () => {
  const [tabValue, setTabValue] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("freesound_token"));
  const location = useLocation();

  // Sync tabValue with current route
  useEffect(() => {
    const pathToTab = {
      "/": 0,
      "/recordings": 1,
      "/downloads": 2,
      "/mix": 3,
    };
    setTabValue(pathToTab[location.pathname] || 0);
  }, [location.pathname]);

  // Listen for localStorage changes to update token
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "freesound_token") {
        setToken(event.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleLogout = () => {
    localStorage.removeItem("freesound_token");
    setToken(null);
    window.location.reload();
  };

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const navItems = [
    { label: "Search", path: "/" },
    { label: "Recordings", path: "/recordings" },
    { label: "Downloads", path: "/downloads" },
    { label: "Mix", path: "/mix" },
  ];

  return (
    <ThemeProvider theme={theme}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Open navigation menu"
            onClick={toggleDrawer(true)}
            sx={{ display: { xs: "block", sm: "none" }, mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 0, mr: 4, display: { xs: "none", sm: "block" } }}
          >
            Sound Mixer
          </Typography>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="Navigation tabs"
            sx={{ flexGrow: 1, display: { xs: "none", sm: "flex" } }}
            TabIndicatorProps={{
              style: { backgroundColor: "#1976d2", height: 3 },
            }}
          >
            {navItems.map((item, index) => (
              <Tab
                key={item.label}
                label={item.label}
                component={Link}
                to={item.path}
                aria-label={`Navigate to ${item.label} tab`}
                sx={{
                  color: "white",
                  "&.Mui-selected": {
                    color: "#1976d2",
                    backgroundColor: "#e3f2fd",
                  },
                }}
              />
            ))}
          </Tabs>
          <Box sx={{ ml: "auto" }}>
            {!token ? (
              <Tooltip title="Log in with Freesound account">
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={loginFreesound}
                  startIcon={<LoginIcon />}
                  sx={{
                    mr: 2,
                    borderColor: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "white",
                    },
                  }}
                  aria-label="Log in"
                >
                  Login
                </Button>
              </Tooltip>
            ) : (
              <Tooltip title="Log out of your account">
                <Button
                  color="inherit"
                  variant="outlined"
                  onClick={handleLogout}
                  startIcon={<LogoutIcon />}
                  sx={{
                    mr: 2,
                    borderColor: "white",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "white",
                    },
                  }}
                  aria-label="Log out"
                >
                  Logout
                </Button>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        aria-label="Mobile navigation menu"
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Typography variant="h6" sx={{ p: 2, fontWeight: 600 }}>
            Sound Mixer
          </Typography>
          <List >
            {navItems.map((item) => (
              <ListItem
                key={item.label}
                component={Link}
                to={item.path}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.08)",
                  },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Container
        maxWidth="1920px"
        sx={{
          py: 3,
          bgcolor: "background.default",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <Routes>
          <Route path="/" element={<SearchTab />} />
          <Route path="/recordings" element={<RecordingsTab />} />
          <Route path="/downloads" element={<DownloadsTab />} />
          <Route path="/mix" element={<MixTab />} />
          <Route path="/callback" element={<Callback />} />
        </Routes>
      </Container>
    </ThemeProvider>
  );
};

export default App;
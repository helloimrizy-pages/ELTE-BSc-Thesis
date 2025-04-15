import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import LogoutIcon from "@mui/icons-material/Logout";

interface SidebarProps {
  minimized?: boolean;
  onToggleMinimize?: (value: boolean) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  minimized = false,
  onToggleMinimize,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [firstName, setFirstName] = useState<string>("");
  const [nameLoading, setNameLoading] = useState<boolean>(true);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const fetchUser = async () => {
      if (!user) return;
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || "User");
      }
      setNameLoading(false);
    };

    fetchUser();
  }, [user]);

  useEffect(() => {
    const savedMinimized = localStorage.getItem("sidebarMinimized");
    if (savedMinimized !== null) {
      onToggleMinimize?.(savedMinimized === "true");
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !minimized;
    localStorage.setItem("sidebarMinimized", String(newState));
    onToggleMinimize?.(!minimized);
  };

  return (
    <Paper
      elevation={1}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
        overflow: "hidden",
        transition: "width 0.2s ease-in-out",
        minWidth: minimized ? "50px" : "160px",
        maxWidth: minimized ? "60px" : "220px",
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {!minimized && (
          <Typography variant="subtitle1" fontWeight="bold">
            Hi{nameLoading ? "," : `, ${firstName}!`}
          </Typography>
        )}

        <IconButton
          size="small"
          onClick={toggleSidebar}
          sx={{
            color: "white",
            ml: minimized ? "auto" : 0,
            mr: minimized ? "auto" : 0,
          }}
        >
          {minimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
        <List component="nav" disablePadding>
          <ListItem disablePadding>
            <Tooltip title={minimized ? "Job Dashboard" : ""} placement="right">
              <ListItemButton
                onClick={() => navigate("/")}
                selected={isActive("/")}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <DashboardIcon color={isActive("/") ? "primary" : "action"} />
                </ListItemIcon>
                {!minimized && <ListItemText primary="Job Dashboard" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding>
            <Tooltip
              title={minimized ? "Candidate Analytics" : ""}
              placement="right"
            >
              <ListItemButton
                onClick={() => navigate("/analytics")}
                selected={location.pathname.startsWith("/analytics")}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <AnalyticsIcon
                    color={isActive("/analytics") ? "primary" : "action"}
                  />
                </ListItemIcon>
                {!minimized && <ListItemText primary="Candidate Analytics" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <Divider />

          <ListItem disablePadding>
            <Tooltip title={minimized ? "Job Postings" : ""} placement="right">
              <ListItemButton
                onClick={() => navigate("/jobs")}
                selected={location.pathname.startsWith("/jobs")}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <WorkIcon color={isActive("/jobs") ? "primary" : "action"} />
                </ListItemIcon>
                {!minimized && <ListItemText primary="Job Postings" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>

      <Box>
        <List component="nav" disablePadding>
          <ListItem disablePadding>
            <Tooltip title={minimized ? "My Profile" : ""} placement="right">
              <ListItemButton
                onClick={() => navigate("/profile")}
                selected={location.pathname.startsWith("/profile")}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <PersonIcon
                    color={isActive("/profile") ? "primary" : "action"}
                  />
                </ListItemIcon>
                {!minimized && <ListItemText primary="My Profile" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding>
            <Tooltip title={minimized ? "Settings" : ""} placement="right">
              <ListItemButton
                onClick={() => navigate("/settings")}
                selected={location.pathname.startsWith("/settings")}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  "&.Mui-selected": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                    "&:hover": {
                      bgcolor: "rgba(0, 0, 0, 0.08)",
                    },
                  },
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <SettingsIcon
                    color={isActive("/settings") ? "primary" : "action"}
                  />
                </ListItemIcon>
                {!minimized && <ListItemText primary="Settings" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>

          <ListItem disablePadding>
            <Tooltip title={minimized ? "Logout" : ""} placement="right">
              <ListItemButton
                onClick={onLogout}
                sx={{
                  justifyContent: minimized ? "center" : "flex-start",
                  px: minimized ? 1 : 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: minimized ? 0 : 40 }}>
                  <LogoutIcon color="action" />
                </ListItemIcon>
                {!minimized && <ListItemText primary="Logout" />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar;

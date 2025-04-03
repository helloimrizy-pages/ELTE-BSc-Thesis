import React from "react";
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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import WorkIcon from "@mui/icons-material/Work";
import PersonIcon from "@mui/icons-material/Person";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Paper
      elevation={1}
      sx={{
        width: "100%",
        mb: 3,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, bgcolor: "primary.main", color: "white" }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Dashboard Navigation
        </Typography>
      </Box>
      <List component="nav" disablePadding>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate("/")}
            selected={isActive("/")}
            sx={{
              "&.Mui-selected": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
                borderLeft: "4px solid",
                borderColor: "primary.main",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.08)",
                },
              },
            }}
          >
            <ListItemIcon>
              <DashboardIcon color={isActive("/") ? "primary" : "action"} />
            </ListItemIcon>
            <ListItemText primary="Job Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate("/analytics")}
            selected={isActive("/analytics")}
            sx={{
              "&.Mui-selected": {
                bgcolor: "rgba(0, 0, 0, 0.04)",
                borderLeft: "4px solid",
                borderColor: "primary.main",
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.08)",
                },
              },
            }}
          >
            <ListItemIcon>
              <AnalyticsIcon
                color={isActive("/analytics") ? "primary" : "action"}
              />
            </ListItemIcon>
            <ListItemText primary="Candidate Analytics" />
          </ListItemButton>
        </ListItem>

        <Divider />

        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <WorkIcon />
            </ListItemIcon>
            <ListItemText primary="Job Postings" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText primary="My Profile" />
          </ListItemButton>
        </ListItem>
      </List>
    </Paper>
  );
};

export default Sidebar;

import React from "react";
import {
  Menu,
  MenuItem,
  Divider,
  Typography,
  Box,
  Avatar,
  styled,
  alpha,
  ListItemIcon,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: theme.spacing(2),
    minWidth: 280,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
    padding: theme.spacing(1),
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.paper, 0.9)
        : theme.palette.background.paper,
    backdropFilter: "blur(8px)",
  },
  "& .MuiMenuItem-root": {
    borderRadius: theme.spacing(1),
    margin: theme.spacing(0.5, 0),
    padding: theme.spacing(1.2, 2),
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
  },
}));

const UserAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  fontSize: 24,
  fontWeight: 600,
  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
}));

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  onLogout,
}) => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      if (!user?.uid) return;
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
        }
      } catch (error) {
        console.error("Failed to fetch user name:", error);
      }
    };

    fetchUserName();
  }, [user]);

  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    } else if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleMyProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    onClose();
  };

  return (
    <StyledMenu
      anchorEl={anchorEl}
      id="primary-search-account-menu"
      keepMounted
      open={isOpen}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        elevation: 0,
        sx: {
          overflow: "visible",
          "&:before": {
            content: '""',
            display: "block",
            position: "absolute",
            top: 0,
            right: 14,
            width: 10,
            height: 10,
            bgcolor: "background.paper",
            transform: "translateY(-50%) rotate(45deg)",
            zIndex: 0,
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 2,
          pb: 3,
        }}
      >
        {user?.photoURL ? (
          <UserAvatar src={user.photoURL} alt={user.displayName || "User"} />
        ) : (
          <UserAvatar>{getInitials()}</UserAvatar>
        )}
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ mt: 2, mb: 0.5 }}
        >
          {firstName || lastName
            ? `${firstName} ${lastName}`
            : user?.email?.split("@")[0] || "User"}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          {user?.email || ""}
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <MenuItem onClick={handleMyProfile}>
        <ListItemIcon>
          <PersonOutlineOutlinedIcon color="primary" fontSize="small" />
        </ListItemIcon>
        <Typography variant="body1">My Profile</Typography>
      </MenuItem>

      <MenuItem onClick={handleSettings}>
        <ListItemIcon>
          <SettingsOutlinedIcon color="primary" fontSize="small" />
        </ListItemIcon>
        <Typography variant="body1">Settings</Typography>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      <MenuItem onClick={onLogout} sx={{ color: "error.main" }}>
        <ListItemIcon>
          <LogoutOutlinedIcon color="error" fontSize="small" />
        </ListItemIcon>
        <Typography variant="body1">Logout</Typography>
      </MenuItem>
    </StyledMenu>
  );
};

import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  anchorEl: HTMLElement | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  anchorEl,
  isOpen,
  onClose,
  onLogout,
}) => {
  const navigate = useNavigate();

  const handleMyProfile = () => {
    navigate("/profile");
    onClose();
  };

  const handleSettings = () => {
    navigate("/settings");
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      id="primary-search-account-menu"
      keepMounted
      open={isOpen}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <MenuItem onClick={handleMyProfile}>My Profile</MenuItem>
      <MenuItem onClick={handleSettings}>Settings</MenuItem>
      <MenuItem onClick={onLogout}>Logout</MenuItem>
    </Menu>
  );
};

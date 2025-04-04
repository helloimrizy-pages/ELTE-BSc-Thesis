import React, { useState, useEffect } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  MenuItem,
  InputBase,
  styled,
  alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AccountCircle from "@mui/icons-material/AccountCircle";
import MailIcon from "@mui/icons-material/Mail";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MoreIcon from "@mui/icons-material/MoreVert";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase";
import { ProfileMenu } from "./ProfileMenu";
import logo from "../../assets/logo.png";

const NOTIFICATION_COUNTS = {
  MESSAGES: 4,
  NOTIFICATIONS: 17,
} as const;

interface AppBarProps {
  onLogout: () => Promise<void>;
  onSearch: (value: string) => void;
}

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.black, 0.05),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.1),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(3),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "black",
  "& .MuiInputBase-input": {
    color: "black",
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
    "&::placeholder": {
      color: "black",
      opacity: 1,
    },
  },
}));

export const TransparaAppBar: React.FC<AppBarProps> = ({
  onLogout,
  onSearch,
}) => {
  const [user] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(searchInput);
    }, 300);

    return () => clearTimeout(delay);
  }, [searchInput]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] =
    useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMoreAnchorEl(null);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    handleMobileMenuClose();
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMoreAnchorEl(event.currentTarget);
  };

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      id="mobile-menu"
      keepMounted
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size="large" aria-label="show new mails" color="inherit">
          <Badge badgeContent={NOTIFICATION_COUNTS.MESSAGES} color="error">
            <MailIcon />
          </Badge>
        </IconButton>
        <p>Messages</p>
      </MenuItem>
      <MenuItem>
        <IconButton
          size="large"
          aria-label="show new notifications"
          color="inherit"
        >
          <Badge badgeContent={NOTIFICATION_COUNTS.NOTIFICATIONS} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <p>Notifications</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle />
        </IconButton>
        <p>Profile</p>
      </MenuItem>
    </Menu>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "white",
          boxShadow: "none",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              minWidth: "200px",
              marginLeft: "20px",
            }}
          >
            <img
              src={logo}
              alt="Transpara Logo"
              style={{ height: "50px", marginRight: "8px" }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                display: { xs: "none", sm: "block" },
                color: "black",
                fontWeight: 500,
              }}
            >
              Transpara
            </Typography>
          </Box>

          {}
          <Box
            sx={{ flex: 1, display: "flex", justifyContent: "center", px: 2 }}
          >
            <Search
              sx={{
                flex: 1,
                maxWidth: "1200px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <SearchIconWrapper>
                <SearchIcon sx={{ color: "#666" }} />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Type to search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                inputProps={{ "aria-label": "search" }}
                sx={{
                  width: "100%",
                  input: {
                    color: "black",
                    "&::placeholder": {
                      color: "black",
                      opacity: 1,
                    },
                  },
                }}
              />
            </Search>
          </Box>

          {}
          <Box
            sx={{
              display: "flex",
              gap: 1,
              minWidth: "200px",
              justifyContent: "flex-end",
              marginRight: "30px",
            }}
          >
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
              <IconButton size="large" sx={{ color: "black" }}>
                <Badge badgeContent={2} color="error">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 4h2v2h14v-2h2v2h1v16h-20v-16h1v-2zm17 4h-16v12h16v-12zm-5 4h-6v-2h6v2z"
                      fill="currentColor"
                    />
                  </svg>
                </Badge>
              </IconButton>
              <IconButton size="large" sx={{ color: "black" }}>
                <NotificationsIcon />
              </IconButton>
              <IconButton
                size="large"
                edge="end"
                onClick={handleProfileMenuOpen}
                sx={{
                  padding: 0,
                  "& img": {
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    objectFit: "cover",
                    border: "2px solid #ccc",
                  },
                }}
              >
                <img
                  src={user?.photoURL || "https://via.placeholder.com/32"}
                  alt="Profile"
                />
              </IconButton>
            </Box>

            {}
            <Box sx={{ display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="show more"
                aria-controls="mobile-menu"
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                sx={{ color: "black" }}
              >
                <MoreIcon />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {}
      {renderMobileMenu}
      <ProfileMenu
        anchorEl={anchorEl}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onLogout={onLogout}
      />
    </Box>
  );
};

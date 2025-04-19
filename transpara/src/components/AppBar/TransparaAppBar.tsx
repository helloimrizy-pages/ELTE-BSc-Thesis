import React, { useState, useEffect } from "react";
import { styled, alpha } from "@mui/material/styles";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Avatar,
  Button,
  Skeleton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { ProfileMenu } from "./ProfileMenu";
import TransparaLogo from "../../assets/transpara-logo.svg";
import { doc, getDoc } from "firebase/firestore";

import blankProfile from "../../assets/blank-profile.svg";

interface AppBarProps {
  onLogout: () => Promise<void>;
  onSearch: (value: string) => void;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.0),
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  position: "sticky",
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
  borderBottom: `1px solid ${theme.palette.divider}`, // 👈 add this line
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minWidth: "200px",
  marginRight: theme.spacing(2),
}));

const Search = styled("div")(({ theme }) => {
  const isDark = theme.palette.mode === "dark";
  return {
    position: "relative",
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: isDark
      ? alpha(theme.palette.common.white, 0.08)
      : alpha(theme.palette.common.black, 0.04),
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.12)
        : alpha(theme.palette.common.black, 0.06),
      boxShadow: isDark
        ? "0 2px 6px rgba(255, 255, 255, 0.05)"
        : "0 2px 8px rgba(0, 0, 0, 0.05)",
    },
    "&:focus-within": {
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.15)
        : alpha(theme.palette.common.black, 0.06),
      boxShadow: isDark
        ? "0 2px 10px rgba(255, 255, 255, 0.08)"
        : "0 2px 8px rgba(0, 0, 0, 0.08)",
    },
    width: "100%",
    marginRight: theme.spacing(2),
    [theme.breakpoints.up("sm")]: {
      width: "auto",
      flexGrow: 1,
      maxWidth: 600,
    },
  };
});

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.secondary,
}));

const ClearButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  position: "absolute",
  right: 8,
  top: "50%",
  transform: "translateY(-50%)",
  visibility: "visible",
  opacity: 1,
  transition: "opacity 0.2s ease",
  color: theme.palette.text.secondary,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: theme.palette.text.primary,
  width: "100%",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1.5, 4, 1.5, 5),
    width: "100%",
    transition: theme.transitions.create("width"),
    fontWeight: 400,
    fontSize: "0.95rem",
  },
}));

const ProfileButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(0.5, 1.5, 0.5, 1),
  textTransform: "none",
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  color: theme.palette.text.primary,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.text.primary, 0.12),
  },
}));

export const TransparaAppBar: React.FC<AppBarProps> = ({
  onLogout,
  onSearch,
}) => {
  const [user, loading] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(searchInput);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchInput, onSearch]);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserDisplayName(`${userData.firstName} ${userData.lastName}`);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  if (loading || isLoadingProfile) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <StyledAppBar>
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            <LogoContainer>
              <img
                src={TransparaLogo}
                alt="Transpara Logo"
                style={{ height: "32px", marginRight: "12px" }}
              />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Transpara
              </Typography>
            </LogoContainer>

            <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <Skeleton
                variant="rectangular"
                width="100%"
                height={42}
                sx={{ maxWidth: 600, borderRadius: 8 }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ ml: 1 }}
              />
              <Skeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ ml: 1 }}
              />
            </Box>
          </Toolbar>
        </StyledAppBar>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <StyledAppBar elevation={0}>
        <Toolbar
          sx={{ display: "flex", alignItems: "center", px: { xs: 2, md: 3 } }}
        >
          <LogoContainer>
            <img
              src={TransparaLogo}
              alt="Transpara Logo"
              style={{ height: "32px", marginRight: "12px" }}
            />
            <Typography
              variant="h6"
              noWrap
              sx={{
                display: { xs: "none", sm: "block" },
                color: "text.primary",
                fontWeight: 600,
              }}
            >
              Transpara
            </Typography>
          </LogoContainer>

          <Box sx={{ display: "flex", flex: 1, justifyContent: "center" }}>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search for jobs, candidates, or companies..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                inputProps={{ "aria-label": "search" }}
              />
              {searchInput && (
                <ClearButton
                  size="small"
                  aria-label="clear search"
                  onClick={handleClearSearch}
                >
                  <ClearIcon fontSize="small" />
                </ClearButton>
              )}
            </Search>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ProfileButton
              onClick={handleProfileMenuOpen}
              endIcon={<KeyboardArrowDownIcon fontSize="small" />}
              aria-haspopup="true"
              aria-expanded={isMenuOpen ? "true" : undefined}
            >
              <Avatar
                src={user?.photoURL || blankProfile}
                alt="Profile"
                sx={{
                  width: 30,
                  height: 30,
                  mr: 1,
                  border: "2px solid white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  display: { xs: "none", sm: "block" },
                }}
              >
                {userDisplayName}
              </Typography>
            </ProfileButton>
          </Box>
        </Toolbar>
      </StyledAppBar>

      <ProfileMenu
        anchorEl={anchorEl}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onLogout={onLogout}
      />
    </Box>
  );
};

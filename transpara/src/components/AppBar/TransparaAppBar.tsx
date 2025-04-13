import React, { useState, useEffect } from "react";
import { styled, alpha } from "@mui/material/styles";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Badge,
  Menu,
  InputBase,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  Paper,
  Fade,
  Chip,
  Button,
  Skeleton,
  List,
  ListItem,
  ListItemButton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { ProfileMenu } from "./ProfileMenu";
import TransparaLogo from "../../assets/transpara-logo.svg";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import blankProfile from "../../assets/blank-profile.svg";

interface AppBarProps {
  onLogout: () => Promise<void>;
  onSearch: (value: string) => void;
}

interface NotificationItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  timestamp: Timestamp;
  read: boolean;
  jobId: string;
  type: string;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.0),
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  position: "sticky",
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  minWidth: "200px",
  marginRight: theme.spacing(2),
}));

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.common.black, 0.04),
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.black, 0.06),
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  "&:focus-within": {
    backgroundColor: alpha(theme.palette.common.black, 0.06),
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  width: "100%",
  marginRight: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    width: "auto",
    flexGrow: 1,
    maxWidth: 600,
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

const ActionButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderRadius: theme.shape.borderRadius * 1.5,
  marginLeft: theme.spacing(1),
  padding: theme.spacing(1),
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
}));

const ProfileButton = styled(Button)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  borderRadius: theme.shape.borderRadius * 1.5,
  padding: theme.spacing(0.5, 1.5, 0.5, 1),
  textTransform: "none",
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.text.primary,
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
}));

const NotificationMenu = styled(Paper)(({ theme }) => ({
  overflow: "hidden",
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: "0 6px 20px rgba(0, 0, 0, 0.1)",
  width: 360,
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 2.5),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NotificationList = styled(List)(() => ({
  maxHeight: 400,
  overflow: "auto",
  padding: 0,
}));

const NotificationItem = styled(ListItem)<{ read: boolean }>(
  ({ theme, read }) => ({
    padding: theme.spacing(1.5, 2.5),
    backgroundColor: read
      ? "transparent"
      : alpha(theme.palette.primary.main, 0.04),
    transition: "background-color 0.2s ease",
    borderBottom: `1px solid ${theme.palette.divider}`,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
    },
    "&:last-child": {
      borderBottom: "none",
    },
  })
);

const EmptyNotification = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4),
  color: theme.palette.text.secondary,
}));

export const TransparaAppBar: React.FC<AppBarProps> = ({
  onLogout,
  onSearch,
}) => {
  const [user, loading] = useAuthState(auth);
  const [searchInput, setSearchInput] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userDisplayName, setUserDisplayName] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationAnchorEl);

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

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: NotificationItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<NotificationItem, "id">),
      }));
      setNotifications(notifs);
    });

    return unsubscribe;
  }, [user]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleNotificationOpen = (e: React.MouseEvent<HTMLElement>) =>
    setNotificationAnchorEl(e.currentTarget);

  const handleNotificationClose = () => setNotificationAnchorEl(null);

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const markAllAsRead = async () => {
    const promises = notifications
      .filter((n) => !n.read)
      .map((n) => updateDoc(doc(db, "notifications", n.id), { read: true }));

    await Promise.all(promises);
    handleNotificationClose();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
            <Tooltip title="Notifications">
              <ActionButton
                color="inherit"
                onClick={handleNotificationOpen}
                aria-haspopup="true"
                aria-expanded={isNotificationsOpen ? "true" : undefined}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.65rem",
                      height: 16,
                      minWidth: 16,
                      padding: "0 4px",
                    },
                  }}
                >
                  {unreadCount > 0 ? (
                    <NotificationsIcon fontSize="small" />
                  ) : (
                    <NotificationsNoneIcon fontSize="small" />
                  )}
                </Badge>
              </ActionButton>
            </Tooltip>

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

      <Menu
        anchorEl={notificationAnchorEl}
        open={isNotificationsOpen}
        onClose={handleNotificationClose}
        TransitionComponent={Fade}
        PaperProps={{ component: NotificationMenu }}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <NotificationHeader>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} new`}
              size="small"
              color="primary"
              onClick={markAllAsRead}
              sx={{ fontSize: "0.75rem" }}
            />
          )}
        </NotificationHeader>

        <NotificationList>
          {notifications.length === 0 ? (
            <EmptyNotification>
              <NotificationsNoneIcon
                sx={{ fontSize: 40, mb: 1, opacity: 0.7 }}
              />
              <Typography variant="body2" align="center">
                No notifications yet
              </Typography>
            </EmptyNotification>
          ) : (
            notifications.map((notif) => (
              <NotificationItem key={notif.id} read={notif.read} disablePadding>
                <ListItemButton
                  onClick={() => {
                    markAsRead(notif.id);
                    handleNotificationClose();
                  }}
                  dense
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NotificationsIcon
                      fontSize="small"
                      color={notif.read ? "action" : "primary"}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        fontWeight={notif.read ? 400 : 500}
                        color="textPrimary"
                      >
                        {`${notif.candidateName} applied for ${notif.jobTitle}`}
                      </Typography>
                    }
                    secondary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 0.5 }}
                      >
                        <AccessTimeIcon
                          fontSize="inherit"
                          sx={{ fontSize: 14, mr: 0.5, opacity: 0.7 }}
                        />
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          component="span"
                        >
                          {notif.timestamp?.toDate()
                            ? formatDistanceToNow(notif.timestamp.toDate(), {
                                addSuffix: true,
                              })
                            : "Just now"}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              </NotificationItem>
            ))
          )}
        </NotificationList>

        {notifications.length > 0 && (
          <Box
            sx={{
              p: 2,
              textAlign: "center",
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Button
              size="small"
              color="primary"
              onClick={handleNotificationClose}
            >
              View All
            </Button>
          </Box>
        )}
      </Menu>

      <ProfileMenu
        anchorEl={anchorEl}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onLogout={onLogout}
      />
    </Box>
  );
};

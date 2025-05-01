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
  Badge,
  MenuItem,
  Popover,
  Tooltip,
  Fade,
  Paper,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";

import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { ProfileMenu } from "./ProfileMenu";
import TransparaLogo from "../../assets/transpara-logo.svg";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  getDocs,
  where,
  writeBatch,
} from "firebase/firestore";

import blankProfile from "../../assets/blank-profile.svg";

interface AppBarProps {
  onLogout: () => Promise<void>;
  onSearch: (value: string) => void;
}

interface NotificationData {
  candidateID: string;
  jobId: string;
  jobTitle?: string;
  firstName: string;
  lastName: string;
  appliedAt: Timestamp;
  read: boolean;
  notificationDocId: string;
}

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.0),
  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
  position: "sticky",
  top: 0,
  zIndex: theme.zIndex.drawer + 1,
  borderBottom: `1px solid ${theme.palette.divider}`,
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

const NotificationPopover = styled(Popover)(({ theme }) => ({
  "& .MuiPopover-paper": {
    width: 380,
    maxHeight: 500,
    borderRadius: theme.shape.borderRadius * 2,
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.12)",
    overflow: "hidden",
  },
}));

const NotificationHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const NotificationList = styled(Box)(({ theme }) => ({
  maxHeight: 420,
  overflowY: "auto",
  padding: theme.spacing(1, 1),
  "&::-webkit-scrollbar": {
    width: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.paper,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    borderRadius: "6px",
  },
}));

const NotificationItem = styled(MenuItem)<{ isRead: boolean }>(
  ({ theme, isRead }) => ({
    display: "flex",
    borderRadius: theme.shape.borderRadius * 1.5,
    padding: theme.spacing(1.5, 2),
    margin: theme.spacing(0.5, 0),
    backgroundColor: isRead
      ? "transparent"
      : alpha(theme.palette.primary.main, 0.05),
    position: "relative",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.1),
    },
  })
);

const NotificationAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 40,
  height: 40,
}));

const NotificationFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(1.5),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const EmptyNotification = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4),
  height: 220,
  color: theme.palette.text.secondary,
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
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorNotifEl, setAnchorNotifEl] = useState<null | HTMLElement>(null);
  const openNotif = Boolean(anchorNotifEl);
  const isMenuOpen = Boolean(anchorEl);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      const jobSnapshot = await getDocs(
        query(collection(db, "jobs"), where("ownerUid", "==", user.uid))
      );
      const unsubscribers: (() => void)[] = [];

      for (const jobDoc of jobSnapshot.docs) {
        const jobId = jobDoc.id;

        const notifQuery = query(
          collection(db, "jobs", jobId, "notifications"),
          orderBy("timestamp", "desc"),
          limit(10)
        );

        const unsubscribe = onSnapshot(notifQuery, (snapshot) => {
          const newNotifs: NotificationData[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            newNotifs.push({
              candidateID: data.candidateID || docSnap.id,
              jobId,
              jobTitle: data.jobTitle || "Unknown",
              firstName: data.firstName || "Unknown",
              lastName: data.lastName || "Unknown",
              appliedAt:
                data.appliedAt instanceof Timestamp
                  ? data.appliedAt
                  : Timestamp.fromDate(new Date()),
              read: data.read || false,
              notificationDocId: docSnap.id,
            });
          });

          setNotifications((prev) => {
            const others = prev.filter((n) => n.jobId !== jobId);
            return [...others, ...newNotifs].sort(
              (a, b) => b.appliedAt.toMillis() - a.appliedAt.toMillis()
            );
          });

          setUnreadCount(
            () => [...newNotifs, ...notifications].filter((n) => !n.read).length
          );
        });

        unsubscribers.push(unsubscribe);
      }

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    };

    fetchNotifications();
  }, [user]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => setAnchorEl(null);

  const handleClearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorNotifEl(event.currentTarget);
  };

  const handleNotifClose = () => {
    setAnchorNotifEl(null);
  };

  const handleNotificationClick = async (
    notif: NotificationData,
    markOnly = false
  ) => {
    if (notif.notificationDocId) {
      await updateDoc(
        doc(db, "jobs", notif.jobId, "notifications", notif.notificationDocId),
        { read: true }
      );
    }

    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationDocId === notif.notificationDocId
          ? { ...n, read: true }
          : n
      )
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    if (!markOnly) {
      navigate(`/jobs/${notif.jobId}/applications/${notif.candidateID}`);
      setAnchorNotifEl(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || notifications.length === 0) return;

    setIsMarkingAllRead(true);

    try {
      const batch = writeBatch(db);

      const unreadNotifications = notifications.filter((n) => !n.read);

      unreadNotifications.forEach((notif) => {
        const notifRef = doc(
          db,
          "jobs",
          notif.jobId,
          "notifications",
          notif.notificationDocId
        );
        batch.update(notifRef, { read: true });
      });

      await batch.commit();

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const groupedNotifications = notifications.reduce((acc, notif) => {
    if (!acc[notif.jobId]) {
      acc[notif.jobId] = {
        jobTitle: notif.jobTitle || "Untitled Job",
        notifs: [],
      };
    }
    acc[notif.jobId].notifs.push(notif);
    return acc;
  }, {} as Record<string, { jobTitle: string; notifs: NotificationData[] }>);

  const handleClearAllNotifications = async () => {
    const batch = writeBatch(db);
    notifications.forEach((notif) => {
      const ref = doc(
        db,
        "jobs",
        notif.jobId,
        "notifications",
        notif.notificationDocId
      );
      batch.delete(ref);
    });
    await batch.commit();
    setNotifications([]);
    setUnreadCount(0);
  };

  const formatNotificationDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
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
            <Tooltip title="Notifications">
              <IconButton
                color="inherit"
                onClick={handleNotifOpen}
                sx={{
                  position: "relative",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "scale(1.05)",
                  },
                }}
              >
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  overlap="circular"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.7rem",
                      height: "18px",
                      minWidth: "18px",
                      padding: "0 4px",
                    },
                  }}
                >
                  <NotificationsIcon color="action" />
                </Badge>
              </IconButton>
            </Tooltip>

            <NotificationPopover
              open={openNotif}
              anchorEl={anchorNotifEl}
              onClose={handleNotifClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              TransitionComponent={Fade}
            >
              <Paper elevation={0}>
                <NotificationHeader>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        You have {unreadCount} unread notification
                        {unreadCount !== 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Box>
                  {unreadCount > 0 && (
                    <Button
                      size="small"
                      startIcon={<MarkEmailReadIcon fontSize="small" />}
                      onClick={handleMarkAllAsRead}
                      disabled={isMarkingAllRead}
                      sx={{
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                      }}
                    >
                      Mark all as read
                    </Button>
                  )}
                </NotificationHeader>

                <NotificationList>
                  {notifications.length === 0 ? (
                    <EmptyNotification>
                      <CheckCircleIcon
                        sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                      >
                        You're all caught up!
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        align="center"
                        sx={{ mt: 1 }}
                      >
                        No new notifications at the moment
                      </Typography>
                    </EmptyNotification>
                  ) : (
                    Object.entries(groupedNotifications).map(
                      ([jobId, group]) => (
                        <Box key={jobId} sx={{ mb: 2 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              px: 2,
                              pb: 0.5,
                              fontWeight: 600,
                              color: "text.secondary",
                              fontSize: "0.8rem",
                            }}
                          >
                            {group.jobTitle}
                          </Typography>

                          {group.notifs.map((notif) => (
                            <NotificationItem
                              key={notif.notificationDocId}
                              onClick={() => handleNotificationClick(notif)}
                              isRead={notif.read}
                            >
                              <NotificationAvatar>
                                <PersonIcon />
                              </NotificationAvatar>

                              <Box sx={{ ml: 2, flex: 1 }}>
                                <Typography
                                  variant="subtitle2"
                                  fontWeight={600}
                                  noWrap
                                >
                                  {notif.firstName} {notif.lastName}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mt: 0.5 }}
                                >
                                  applied{" "}
                                  {formatNotificationDate(notif.appliedAt)}
                                </Typography>
                              </Box>

                              <Tooltip title="Mark as read">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleNotificationClick(notif, true); // just mark
                                  }}
                                  sx={{ ml: 1 }}
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </NotificationItem>
                          ))}
                        </Box>
                      )
                    )
                  )}
                </NotificationList>

                <NotificationFooter>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    onClick={handleClearAllNotifications}
                    sx={{
                      textTransform: "none",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    Clear all notifications
                  </Button>
                </NotificationFooter>
              </Paper>
            </NotificationPopover>

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

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
  Divider,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../firebase";
import { ProfileMenu } from "./ProfileMenu";
import logo from "../../assets/logo.png";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] =
    useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const isMenuOpen = Boolean(anchorEl);

  useEffect(() => {
    const delay = setTimeout(() => {
      onSearch(searchInput);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchInput]);

  useEffect(() => {
    if (!user) return;
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

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              />
            </Search>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
            <IconButton color="inherit" onClick={handleNotificationOpen}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon sx={{ color: "black" }} />
              </Badge>
            </IconButton>

            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              sx={{
                padding: 0,
                ml: 2,
                "& img": {
                  borderRadius: "50%",
                  width: 42,
                  height: 42,
                  objectFit: "cover",
                  border: "2px solid #ccc",
                },
              }}
            >
              <img src={user?.photoURL || blankProfile} alt="Profile" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{ style: { width: "320px" } }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1 }}>
          Notifications
        </Typography>
        <Divider />
        {notifications.length === 0 && (
          <MenuItem disabled>No notifications</MenuItem>
        )}
        {notifications.map((notif) => (
          <MenuItem
            key={notif.id}
            onClick={() => {
              markAsRead(notif.id);
              handleNotificationClose();
            }}
            sx={{ backgroundColor: notif.read ? "white" : "#f5f5f5" }}
          >
            <ListItemIcon>
              <NotificationsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="body1" component="span">
                  {`${notif.candidateName} applied for ${notif.jobTitle}`}
                </Typography>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="textSecondary"
                  component="span"
                >
                  {notif.timestamp?.toDate()
                    ? formatDistanceToNow(notif.timestamp.toDate(), {
                        addSuffix: true,
                      })
                    : "Just now"}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Menu>

      {}
      <ProfileMenu
        anchorEl={anchorEl}
        isOpen={isMenuOpen}
        onClose={handleMenuClose}
        onLogout={onLogout}
      />
    </Box>
  );
};

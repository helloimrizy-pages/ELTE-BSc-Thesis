import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Snackbar,
  Alert,
  Skeleton,
  CircularProgress,
  Badge,
} from "@mui/material";
import { auth, db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { TransparaAppBar } from "../components/AppBar/AppBar";
import Sidebar from "../components/AppBar/Sidebar";
import { signOut, updateProfile } from "firebase/auth";

import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import SaveIcon from "@mui/icons-material/Save";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import BadgeIcon from "@mui/icons-material/Badge";

const ProfileCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
  minHeight: "calc(100vh - 64px)",
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: theme.palette.primary.main,
  color: "white",
  position: "relative",
}));

const ProfileContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: 120,
  height: 120,
  border: "4px solid white",
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
}));

const AvatarBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: theme.palette.background.paper,
    cursor: "pointer",
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(3),
  position: "relative",
  "&:after": {
    content: '""',
    position: "absolute",
    left: 0,
    bottom: -8,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1),
    transition: "all 0.3s ease",
    "&:hover": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
  },
  "& .Mui-disabled": {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(0, 0, 0, 0.1)",
    },
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.2, 3),
  textTransform: "none",
  fontSize: "0.95rem",
  fontWeight: 600,
  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 15px rgba(0, 0, 0, 0.15)",
  },
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
  marginBottom: theme.spacing(3),
  overflow: "visible",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.08)",
  },
}));

const CardTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const ProfilePage: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    return localStorage.getItem("sidebarMinimized") === "true";
  });

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;

      try {
        const uid = auth.currentUser.uid;
        const docRef = doc(db, "users", uid);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || auth.currentUser.email || "");
          setUsername(data.username || "");
          setCompany(data.company || "");
          setJobTitle(data.jobTitle || "");
          setPhotoURL(auth.currentUser.photoURL);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showSnackbar("Failed to load profile data", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    try {
      const uid = auth.currentUser.uid;
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        firstName,
        lastName,
      });
      showSnackbar("Profile updated successfully", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar("Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const allowedTypes = ["image/jpeg", "image/png"];

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !auth.currentUser) return;

    const file = e.target.files[0];

    if (!allowedTypes.includes(file.type)) {
      showSnackbar("Only JPG and PNG files are allowed", "error");
      return;
    }

    setIsUploading(true);

    try {
      const storageRef = ref(
        storage,
        `profilePhotos/${auth.currentUser.uid}/${file.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        () => {},
        (error) => {
          console.error("Upload error:", error);
          showSnackbar("Failed to upload profile picture", "error");
          setIsUploading(false);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            await updateProfile(auth.currentUser!, { photoURL: url });
            setPhotoURL(url);
            showSnackbar("Profile picture updated successfully", "success");
          } catch (error) {
            console.error("Error updating profile picture:", error);
            showSnackbar("Failed to update profile picture", "error");
          } finally {
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      console.error("Error starting upload:", error);
      showSnackbar("Failed to start upload", "error");
      setIsUploading(false);
    }
  };

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} onSearch={() => {}} />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ mt: 4, mb: 4, px: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          <Box
            sx={{
              width: sidebarMinimized ? 80 : 240,
              transition: "width 0.3s ease",
              flexShrink: 0,
            }}
          >
            <Sidebar
              minimized={sidebarMinimized}
              onToggleMinimize={() =>
                setSidebarMinimized((prev) => {
                  localStorage.setItem("sidebarMinimized", String(!prev));
                  return !prev;
                })
              }
              onLogout={handleLogout}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <ProfileCard>
              <ProfileHeader>
                <Box display="flex" alignItems="center">
                  {isLoading ? (
                    <Skeleton
                      variant="circular"
                      width={120}
                      height={120}
                      sx={{ mr: 3 }}
                    />
                  ) : (
                    <AvatarBadge
                      overlap="circular"
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      badgeContent={
                        isUploading ? (
                          <CircularProgress size={20} sx={{ color: "white" }} />
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              "&:hover": { bgcolor: "primary.dark" },
                            }}
                          >
                            <PhotoCameraIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <StyledAvatar src={photoURL || undefined}>
                        {!photoURL &&
                          (
                            firstName.charAt(0) + lastName.charAt(0)
                          ).toUpperCase()}
                      </StyledAvatar>
                    </AvatarBadge>
                  )}
                  <Box ml={3}>
                    {isLoading ? (
                      <>
                        <Skeleton variant="text" width={180} height={40} />
                        <Skeleton variant="text" width={120} height={24} />
                      </>
                    ) : (
                      <>
                        <Typography variant="h4" fontWeight="700">
                          {firstName} {lastName}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ opacity: 0.9, mt: 0.5 }}
                        >
                          {company} - {jobTitle}
                        </Typography>
                      </>
                    )}
                  </Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg, image/png"
                    onChange={handlePhotoUpload}
                    hidden
                  />
                </Box>
              </ProfileHeader>

              <ProfileContent>
                <SectionTitle variant="h6">Personal Information</SectionTitle>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <SectionCard>
                      <CardTitle>
                        <PersonIcon sx={{ color: "text.secondary", mr: 1.5 }} />
                        <Typography variant="subtitle1" fontWeight="600">
                          Name Details
                        </Typography>
                      </CardTitle>
                      <CardContent>
                        {isLoading ? (
                          <>
                            <Skeleton
                              variant="rectangular"
                              height={56}
                              sx={{ mb: 3, borderRadius: 1 }}
                            />
                            <Skeleton
                              variant="rectangular"
                              height={56}
                              sx={{ borderRadius: 1 }}
                            />
                          </>
                        ) : (
                          <>
                            <StyledTextField
                              fullWidth
                              label="First Name"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <PersonIcon color="action" sx={{ mr: 1 }} />
                                ),
                              }}
                            />
                            <StyledTextField
                              fullWidth
                              label="Last Name"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <PersonIcon color="action" sx={{ mr: 1 }} />
                                ),
                              }}
                              sx={{ mb: 0 }}
                            />
                          </>
                        )}
                      </CardContent>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SectionCard>
                      <CardTitle>
                        <BadgeIcon sx={{ color: "text.secondary", mr: 1.5 }} />
                        <Typography variant="subtitle1" fontWeight="600">
                          Account Details
                        </Typography>
                      </CardTitle>
                      <CardContent>
                        {isLoading ? (
                          <>
                            <Skeleton
                              variant="rectangular"
                              height={56}
                              sx={{ mb: 3, borderRadius: 1 }}
                            />
                            <Skeleton
                              variant="rectangular"
                              height={56}
                              sx={{ borderRadius: 1 }}
                            />
                          </>
                        ) : (
                          <>
                            <StyledTextField
                              fullWidth
                              label="Email"
                              value={email}
                              disabled
                              InputProps={{
                                startAdornment: (
                                  <EmailIcon color="action" sx={{ mr: 1 }} />
                                ),
                              }}
                            />
                            <StyledTextField
                              fullWidth
                              label="Username"
                              value={username}
                              disabled
                              InputProps={{
                                startAdornment: (
                                  <BadgeIcon color="action" sx={{ mr: 1 }} />
                                ),
                              }}
                              sx={{ mb: 0 }}
                            />
                          </>
                        )}
                      </CardContent>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SectionCard>
                      <CardTitle>
                        <BusinessIcon
                          sx={{ color: "text.secondary", mr: 1.5 }}
                        />
                        <Typography variant="subtitle1" fontWeight="600">
                          Company Information
                        </Typography>
                      </CardTitle>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton
                            variant="rectangular"
                            height={56}
                            sx={{ borderRadius: 1 }}
                          />
                        ) : (
                          <StyledTextField
                            fullWidth
                            label="Company"
                            value={company}
                            disabled
                            InputProps={{
                              startAdornment: (
                                <BusinessIcon color="action" sx={{ mr: 1 }} />
                              ),
                            }}
                            sx={{ mb: 0 }}
                          />
                        )}
                      </CardContent>
                    </SectionCard>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SectionCard>
                      <CardTitle>
                        <BusinessIcon
                          sx={{ color: "text.secondary", mr: 1.5 }}
                        />
                        <Typography variant="subtitle1" fontWeight="600">
                          Job Information
                        </Typography>
                      </CardTitle>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton
                            variant="rectangular"
                            height={56}
                            sx={{ borderRadius: 1 }}
                          />
                        ) : (
                          <StyledTextField
                            fullWidth
                            label="Job Title"
                            value={jobTitle}
                            disabled
                            InputProps={{
                              startAdornment: (
                                <BusinessIcon color="action" sx={{ mr: 1 }} />
                              ),
                            }}
                            sx={{ mb: 0 }}
                          />
                        )}
                      </CardContent>
                    </SectionCard>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    mt: 3,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <ActionButton
                    variant="contained"
                    onClick={handleSave}
                    color="primary"
                    disabled={isLoading || isSaving}
                    startIcon={
                      isSaving ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </ActionButton>
                </Box>
              </ProfileContent>
            </ProfileCard>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProfilePage;

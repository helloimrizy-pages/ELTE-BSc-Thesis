import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Snackbar,
  Alert,
  LinearProgress,
  TextField,
  Switch,
  Tabs,
  Tab,
  alpha,
} from "@mui/material";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase";
import { TransparaAppBar } from "../components/AppBar/TransparaAppBar";
import Sidebar from "../components/AppBar/Sidebar";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SecurityIcon from "@mui/icons-material/Security";
import LockIcon from "@mui/icons-material/Lock";
import SaveIcon from "@mui/icons-material/Save";
import KeyIcon from "@mui/icons-material/Key";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonIcon from "@mui/icons-material/Person";
import ShieldIcon from "@mui/icons-material/Shield";

import { useThemeContext } from "../context/ThemeContext";

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : "#fafafa",
  minHeight: "calc(100vh - 64px)",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  borderRadius: theme.spacing(2),
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  height: "100%",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  overflow: "visible",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
    transform: "translateY(-2px)",
  },
}));

const CardTitle = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const IconAvatar = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 40,
  height: 40,
  borderRadius: 20,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(2),
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
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1, 3),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 500,
    minWidth: 100,
  },
}));

const PasswordStrengthIndicator = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const SecurityTip = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: theme.spacing(1.5),
  "& .icon": {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1.5),
    marginTop: 2,
  },
}));

const SettingsPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { toggleColorMode, mode } = useThemeContext();
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }

    let strength = 0;

    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    setPasswordStrength((strength / 6) * 100);
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    checkPasswordStrength(value);
  };

  const getStrengthColor = () => {
    if (passwordStrength < 33) return "error";
    if (passwordStrength < 66) return "warning";
    return "success";
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 33) return "Weak";
    if (passwordStrength < 66) return "Medium";
    return "Strong";
  };

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordStrength(0);
  };

  const handleChangePassword = async () => {
    const user = auth.currentUser;

    if (!user || !user.email) {
      showSnackbar("User is not authenticated.", "error");
      return;
    }

    if (newPassword.length < 6) {
      showSnackbar("New password must be at least 6 characters.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbar("New password and confirmation do not match.", "error");
      return;
    }

    setIsLoading(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      showSnackbar("Password updated successfully.", "success");
      resetPasswordFields();
    } catch (error: unknown) {
      console.error(error);
      if (error instanceof Error) {
        showSnackbar(`Failed to update password: ${error.message}`, "error");
      } else {
        showSnackbar("Failed to update password.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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
          elevation={6}
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
              onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
              onLogout={handleLogout}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <PageContainer>
              <Box sx={{ px: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                      Account Settings
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Manage your account preferences and security options
                    </Typography>
                  </Box>
                </Box>

                <StyledTabs
                  value={currentTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab
                    label="Security"
                    icon={<SecurityIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Preferences"
                    icon={<PersonIcon />}
                    iconPosition="start"
                  />
                </StyledTabs>

                {currentTab === 0 && (
                  <>
                    <SectionTitle variant="h6">
                      <ShieldIcon /> Security Settings
                    </SectionTitle>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <SectionCard>
                          <CardTitle>
                            <IconAvatar>
                              <KeyIcon />
                            </IconAvatar>
                            <Typography variant="subtitle1" fontWeight="600">
                              Change Password
                            </Typography>
                          </CardTitle>
                          <CardContent sx={{ p: 3 }}>
                            <StyledTextField
                              fullWidth
                              label="Current Password"
                              type={showCurrentPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) =>
                                setCurrentPassword(e.target.value)
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockIcon color="action" />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() =>
                                        setShowCurrentPassword(
                                          !showCurrentPassword
                                        )
                                      }
                                      edge="end"
                                      size="small"
                                    >
                                      {showCurrentPassword ? (
                                        <VisibilityOffIcon />
                                      ) : (
                                        <VisibilityIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />

                            <StyledTextField
                              fullWidth
                              label="New Password"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={handleNewPasswordChange}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockIcon color="action" />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                      }
                                      edge="end"
                                      size="small"
                                    >
                                      {showNewPassword ? (
                                        <VisibilityOffIcon />
                                      ) : (
                                        <VisibilityIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />

                            {newPassword && (
                              <PasswordStrengthIndicator>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    Password Strength
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color={getStrengthColor()}
                                  >
                                    {getStrengthLabel()}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={passwordStrength}
                                  color={getStrengthColor()}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </PasswordStrengthIndicator>
                            )}

                            <StyledTextField
                              fullWidth
                              label="Confirm New Password"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              error={
                                confirmPassword !== "" &&
                                newPassword !== confirmPassword
                              }
                              helperText={
                                confirmPassword !== "" &&
                                newPassword !== confirmPassword
                                  ? "Passwords don't match"
                                  : ""
                              }
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LockIcon color="action" />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() =>
                                        setShowConfirmPassword(
                                          !showConfirmPassword
                                        )
                                      }
                                      edge="end"
                                      size="small"
                                    >
                                      {showConfirmPassword ? (
                                        <VisibilityOffIcon />
                                      ) : (
                                        <VisibilityIcon />
                                      )}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                              sx={{ mb: 0 }}
                            />

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                mt: 3,
                              }}
                            >
                              <ActionButton
                                variant="outlined"
                                color="inherit"
                                onClick={resetPasswordFields}
                                sx={{ mr: 2 }}
                                disabled={isLoading}
                              >
                                Reset
                              </ActionButton>
                              <ActionButton
                                variant="contained"
                                color="primary"
                                onClick={handleChangePassword}
                                disabled={
                                  isLoading ||
                                  !currentPassword ||
                                  !newPassword ||
                                  !confirmPassword
                                }
                                startIcon={
                                  isLoading ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <SaveIcon />
                                  )
                                }
                              >
                                {isLoading ? "Updating..." : "Update Password"}
                              </ActionButton>
                            </Box>
                          </CardContent>
                        </SectionCard>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <SectionCard>
                          <CardTitle>
                            <IconAvatar>
                              <SecurityIcon />
                            </IconAvatar>
                            <Typography variant="subtitle1" fontWeight="600">
                              Password Security Tips
                            </Typography>
                          </CardTitle>
                          <CardContent sx={{ p: 3 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              paragraph
                            >
                              Creating a strong password is essential for
                              keeping your account secure. Follow these
                              guidelines:
                            </Typography>

                            <Box sx={{ mt: 3 }}>
                              <SecurityTip>
                                <Typography variant="body2" className="icon">
                                  •
                                </Typography>
                                <Typography variant="body2">
                                  Use at least 12 characters - longer passwords
                                  are generally more secure
                                </Typography>
                              </SecurityTip>

                              <SecurityTip>
                                <Typography variant="body2" className="icon">
                                  •
                                </Typography>
                                <Typography variant="body2">
                                  Include a mix of uppercase and lowercase
                                  letters for additional complexity
                                </Typography>
                              </SecurityTip>

                              <SecurityTip>
                                <Typography variant="body2" className="icon">
                                  •
                                </Typography>
                                <Typography variant="body2">
                                  Add numbers and special characters (!@#$%^&*)
                                  to strengthen your password
                                </Typography>
                              </SecurityTip>

                              <SecurityTip>
                                <Typography variant="body2" className="icon">
                                  •
                                </Typography>
                                <Typography variant="body2">
                                  Avoid using personal information that others
                                  might know or could easily discover
                                </Typography>
                              </SecurityTip>

                              <SecurityTip>
                                <Typography variant="body2" className="icon">
                                  •
                                </Typography>
                                <Typography variant="body2">
                                  Don't reuse passwords across multiple services
                                  or accounts
                                </Typography>
                              </SecurityTip>
                            </Box>

                            <Box
                              sx={{
                                mt: 3,
                                pt: 2,
                                borderTop: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                fontWeight={600}
                              >
                                Need Additional Help?
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                paragraph
                              >
                                Contact our support team if you're experiencing
                                issues with your account.
                              </Typography>
                              <ActionButton
                                variant="outlined"
                                color="primary"
                                size="small"
                                startIcon={<MailOutlineIcon />}
                                onClick={() =>
                                  window.open(
                                    `mailto:support@yourapp.com?subject=Security Question&body=Hello,%20I%20need%20help%20with...`
                                  )
                                }
                              >
                                Contact Support
                              </ActionButton>
                            </Box>
                          </CardContent>
                        </SectionCard>
                      </Grid>
                    </Grid>
                  </>
                )}

                {currentTab === 1 && (
                  <>
                    <SectionTitle variant="h6">
                      <PersonIcon /> Preferences
                    </SectionTitle>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <SectionCard sx={{ height: "100%" }}>
                          <CardTitle>
                            <IconAvatar>
                              {mode === "dark" ? (
                                <DarkModeIcon />
                              ) : (
                                <LightModeIcon />
                              )}
                            </IconAvatar>
                            <Typography variant="subtitle1" fontWeight="600">
                              Theme Preferences
                            </Typography>
                          </CardTitle>
                          <CardContent sx={{ p: 3 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              paragraph
                            >
                              Choose between light and dark mode for your
                              dashboard experience.
                            </Typography>

                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                mt: 2,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: alpha("#000", 0.04),
                              }}
                            >
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                {mode === "dark" ? (
                                  <DarkModeIcon
                                    sx={{ mr: 2, color: "primary.main" }}
                                  />
                                ) : (
                                  <LightModeIcon
                                    sx={{ mr: 2, color: "primary.main" }}
                                  />
                                )}
                                <Typography variant="body1" fontWeight={500}>
                                  {mode === "dark" ? "Dark Mode" : "Light Mode"}
                                </Typography>
                              </Box>

                              <Switch
                                checked={mode === "dark"}
                                onChange={toggleColorMode}
                                color="primary"
                              />
                            </Box>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 3 }}
                            >
                              {mode === "dark"
                                ? "Dark mode reduces eye strain in low-light environments and can save battery life on OLED screens."
                                : "Light mode provides better readability in well-lit environments and matches traditional document styles."}
                            </Typography>
                          </CardContent>
                        </SectionCard>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <SectionCard sx={{ height: "100%" }}>
                          <CardTitle>
                            <IconAvatar>
                              <MailOutlineIcon />
                            </IconAvatar>
                            <Typography variant="subtitle1" fontWeight="600">
                              Feedback & Support
                            </Typography>
                          </CardTitle>
                          <CardContent sx={{ p: 3 }}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              paragraph
                            >
                              We're constantly improving our platform based on
                              your feedback. Let us know how we can make your
                              experience better.
                            </Typography>

                            <Box
                              sx={{
                                mt: 3,
                                p: 3,
                                borderRadius: 2,
                                bgcolor: alpha("#000", 0.04),
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                textAlign: "center",
                              }}
                            >
                              <MailOutlineIcon
                                sx={{
                                  fontSize: 40,
                                  color: "primary.main",
                                  mb: 2,
                                }}
                              />
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                fontWeight={600}
                              >
                                Have Questions or Feedback?
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 3 }}
                              >
                                Our team is here to help! Reach out with any
                                questions, suggestions, or issues.
                              </Typography>
                              <ActionButton
                                variant="contained"
                                color="primary"
                                startIcon={<MailOutlineIcon />}
                                onClick={() =>
                                  window.open(
                                    `mailto:support@yourapp.com?subject=Feedback&body=Hello,%20I'd%20like%20to%20share%20some%20feedback...`
                                  )
                                }
                              >
                                Contact Support
                              </ActionButton>
                            </Box>
                          </CardContent>
                        </SectionCard>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Box>
            </PageContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;

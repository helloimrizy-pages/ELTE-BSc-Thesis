import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
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

const SettingsContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  minHeight: "calc(100vh - 64px)",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
}));

const SettingsCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
}));

const SettingsHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 4),
  backgroundColor: theme.palette.primary.main,
  color: "white",
  position: "relative",
}));

const SettingsContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
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

const PasswordStrengthIndicator = styled(Box, {
  shouldForwardProp: (prop) => prop !== "strength",
})<{ strength: number }>(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2),
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

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
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

  return (
    <Box>
      <TransparaAppBar
        onLogout={async () => auth.signOut()}
        onSearch={() => {}}
      />

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

      <SettingsContainer>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Sidebar />
            </Grid>

            <Grid item xs={12} md={9}>
              <SettingsCard>
                <SettingsHeader>
                  <Box display="flex" alignItems="center">
                    <SecurityIcon sx={{ fontSize: 32, mr: 2 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700}>
                        Security Settings
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.5, opacity: 0.9 }}
                      >
                        Manage your account security preferences
                      </Typography>
                    </Box>
                  </Box>
                </SettingsHeader>

                <SettingsContent>
                  <SectionTitle variant="h6">Password Management</SectionTitle>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <SectionCard>
                        <CardTitle>
                          <KeyIcon sx={{ color: "text.secondary", mr: 1.5 }} />
                          <Typography variant="subtitle1" fontWeight="600">
                            Change Password
                          </Typography>
                        </CardTitle>
                        <CardContent>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 3 }}
                          >
                            To change your password, enter your current password
                            for verification, then enter a new secure password.
                          </Typography>

                          <StyledTextField
                            fullWidth
                            label="Current Password"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
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
                            <PasswordStrengthIndicator
                              strength={passwordStrength}
                            >
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
                            onChange={(e) => setConfirmPassword(e.target.value)}
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

                    <Grid item xs={12}>
                      <SectionCard>
                        <CardTitle>
                          <SecurityIcon
                            sx={{ color: "text.secondary", mr: 1.5 }}
                          />
                          <Typography variant="subtitle1" fontWeight="600">
                            Password Security Tips
                          </Typography>
                        </CardTitle>
                        <CardContent>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            gutterBottom
                          >
                            Creating a strong password is essential for keeping
                            your account secure. Follow these guidelines:
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              • Use at least 12 characters
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              • Include a mix of uppercase and lowercase letters
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              • Add numbers and special characters
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              • Avoid using personal information
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              • Don't reuse passwords across multiple services
                            </Typography>
                          </Box>
                        </CardContent>
                      </SectionCard>
                    </Grid>
                  </Grid>
                </SettingsContent>
              </SettingsCard>
            </Grid>
          </Grid>
        </Container>
      </SettingsContainer>
    </Box>
  );
};

export default SettingsPage;

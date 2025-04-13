import React, { useState } from "react";
import { auth, db } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import TransparaLogo from "../../assets/transpara-logo.svg";

import { styled } from "@mui/material/styles";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
  Divider,
  Snackbar,
  Alert,
  Container,
  Link,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const AuthContainer = styled(Box)(() => ({
  height: "100vh",
  display: "flex",
  overflow: "hidden",
}));

const FormContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: theme.spacing(2),
  maxWidth: 480,
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)",
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
  padding: theme.spacing(1.5),
  textTransform: "none",
  fontSize: "1rem",
  fontWeight: 600,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const TextLink = styled(Link)(() => ({
  cursor: "pointer",
  fontWeight: 500,
  textDecoration: "none",
  transition: "all 0.2s ease",
  "&:hover": {
    textDecoration: "underline",
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  marginBottom: theme.spacing(4),
}));

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email,
          firstName,
          lastName,
          username,
          company,
          createdAt: new Date(),
        });

        await auth.signOut();
        showSnackbar("Account created successfully!", "success");
        setSignUpSuccess(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        showSnackbar(err.message, "error");
      } else {
        setError("An unknown error occurred");
        showSnackbar("An unknown error occurred", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showSnackbar("Password reset email sent!", "success");
      setIsResetPassword(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
        showSnackbar(err.message, "error");
      } else {
        setError("An unknown error occurred");
        showSnackbar("An unknown error occurred", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setUsername("");
    setCompany("");
    setError(null);
  };

  const switchMode = (mode: "login" | "signup" | "reset") => {
    resetForm();
    if (mode === "login") {
      setIsLogin(true);
      setIsResetPassword(false);
    } else if (mode === "signup") {
      setIsLogin(false);
      setIsResetPassword(false);
    } else {
      setIsResetPassword(true);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <AuthContainer>
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
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Grid container>
        {}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            backgroundColor: (theme) => theme.palette.background.paper,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: { xs: 2, md: 4 },
          }}
        >
          <Container
            maxWidth="sm"
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <FormContainer elevation={0}>
              <LogoContainer>
                <img
                  src={TransparaLogo}
                  alt="Transpara Logo"
                  style={{
                    height: 150,
                    objectFit: "contain",
                  }}
                />
              </LogoContainer>

              {signUpSuccess ? (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
                    Registration Successful!
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ mb: 4, color: "text.secondary" }}
                  >
                    Your account has been created. You can now log in with your
                    credentials.
                  </Typography>
                  <ActionButton
                    variant="contained"
                    fullWidth
                    color="primary"
                    onClick={() => {
                      setSignUpSuccess(false);
                      setIsLogin(true);
                      resetForm();
                    }}
                  >
                    Go to Login
                  </ActionButton>
                </Box>
              ) : isResetPassword ? (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <IconButton
                      sx={{ mr: 1, p: 0 }}
                      onClick={() => switchMode("login")}
                    >
                      <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Reset Password
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                  >
                    Enter your email address and we'll send you a link to reset
                    your password.
                  </Typography>

                  <form onSubmit={handleResetPasswordSubmit}>
                    <StyledTextField
                      fullWidth
                      label="Email Address"
                      variant="outlined"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <ActionButton
                      type="submit"
                      variant="contained"
                      fullWidth
                      color="primary"
                      sx={{ mb: 2 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Send Reset Link"
                      )}
                    </ActionButton>
                  </form>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                    {isLogin ? "Welcome back" : "Create an account"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                  >
                    {isLogin
                      ? "Sign in to access your Transpara account"
                      : "Join Transpara's fair recruitment system"}
                  </Typography>

                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit}>
                    {!isLogin && (
                      <>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <StyledTextField
                              fullWidth
                              label="First Name"
                              variant="outlined"
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              required
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <PersonIcon color="action" />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <StyledTextField
                              fullWidth
                              label="Last Name"
                              variant="outlined"
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              required
                            />
                          </Grid>
                        </Grid>

                        <StyledTextField
                          fullWidth
                          label="Username"
                          variant="outlined"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />

                        <StyledTextField
                          fullWidth
                          label="Company"
                          variant="outlined"
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          required
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </>
                    )}

                    <StyledTextField
                      fullWidth
                      label="Email Address"
                      variant="outlined"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledTextField
                      fullWidth
                      label="Password"
                      variant="outlined"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {!isLogin && (
                      <StyledTextField
                        fullWidth
                        label="Confirm Password"
                        variant="outlined"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
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
                                  setShowConfirmPassword(!showConfirmPassword)
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
                      />
                    )}

                    <ActionButton
                      type="submit"
                      variant="contained"
                      fullWidth
                      color="primary"
                      sx={{ mb: 3 }}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : isLogin ? (
                        "Sign In"
                      ) : (
                        "Create Account"
                      )}
                    </ActionButton>

                    {isLogin && (
                      <Box sx={{ textAlign: "center", mb: 3 }}>
                        <TextLink
                          onClick={() => switchMode("reset")}
                          color="primary"
                        >
                          Forgot your password?
                        </TextLink>
                      </Box>
                    )}
                  </form>

                  <Divider sx={{ my: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      OR
                    </Typography>
                  </Divider>

                  <Box sx={{ textAlign: "center" }}>
                    <Typography variant="body2">
                      {isLogin
                        ? "Don't have an account? "
                        : "Already have an account? "}
                      <TextLink
                        onClick={() => switchMode(isLogin ? "signup" : "login")}
                        color="primary"
                        fontWeight={600}
                      >
                        {isLogin ? "Sign up" : "Sign in"}
                      </TextLink>
                    </Typography>
                  </Box>
                </Box>
              )}
            </FormContainer>
          </Container>
        </Grid>

        {/* Right side - Image */}
        <Grid
          item
          xs={0}
          md={6}
          sx={{
            display: { xs: "none", md: "block" },
            position: "relative",
            minHeight: "100vh",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url("https://images.unsplash.com/photo-1739820120366-b518d16785ed?q=80&w=3687&auto=format&fit=crop")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              boxShadow: "inset 0 0 0 2000px rgba(0, 0, 0, 0.3)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 40,
              left: 40,
              color: "white",
              zIndex: 1,
              maxWidth: 400,
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Fair Recruitment Starts Here - On Your Hand
            </Typography>
            <Typography variant="body1">
              Transpara provides an unbiased and transparent recruitment system
              that helps companies hire the best talent based on merit.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </AuthContainer>
  );
};

export default AuthPage;

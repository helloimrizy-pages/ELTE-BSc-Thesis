import React, { useState } from "react";
import {
  Grid,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { auth } from "../../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import logo from "../../assets/logo.png";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
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
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
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
      alert("Password reset email sent!");
      setIsResetPassword(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
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
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Grid container sx={{ height: "100vh" }}>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 4,
        }}
      >
        {isResetPassword ? (
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <Typography variant="h4" align="center" sx={{ mb: 3 }}>
              Reset Password
            </Typography>

            {error && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            <form onSubmit={handleResetPasswordSubmit}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  mb: 2,
                  backgroundColor: "black",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                }}
              >
                Reset
              </Button>
            </form>
            <Button
              fullWidth
              sx={{
                color: "black",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#666",
                },
              }}
              onClick={() => setIsResetPassword(false)}
            >
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <img
              src={logo}
              alt="Transpara Logo"
              style={{
                width: "70%",
                display: "block",
                margin: "0 auto",
              }}
            />
            <Typography variant="h4" align="center" sx={{ mb: 3 }}>
              {isLogin ? "Login" : "Sign Up"}
            </Typography>

            <Typography variant="subtitle1" align="center" sx={{ mb: 3 }}>
              Transpara is here to provide fair recruitment system!
            </Typography>

            {error && (
              <Typography color="error" align="center" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <>
                  <TextField
                    fullWidth
                    label="First Name"
                    variant="outlined"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    variant="outlined"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Username"
                    variant="outlined"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Company"
                    variant="outlined"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    variant="outlined"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            edge="end"
                          >
                            {showConfirmPassword ? (
                              <VisibilityIcon />
                            ) : (
                              <VisibilityOffIcon />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </>
              )}

              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Password"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityIcon />
                        ) : (
                          <VisibilityOffIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              {isLogin ? (
                <>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      mb: 2,
                      backgroundColor: "black",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#333",
                      },
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    fullWidth
                    onClick={() => setIsResetPassword(true)}
                    sx={{
                      textAlign: "right",
                      mb: 2,
                      color: "black",
                      backgroundColor: "transparent",
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: "#666",
                      },
                    }}
                  >
                    Forgot Password?
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{
                    mb: 2,
                    backgroundColor: "black",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#333",
                    },
                  }}
                >
                  Sign Up
                </Button>
              )}
            </form>

            <Button
              fullWidth
              sx={{
                color: "black",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "transparent",
                  color: "#666",
                },
              }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Create an account" : "Already have an account? Login"}
            </Button>
          </Box>
        )}
      </Grid>

      <Grid
        item
        xs={12}
        md={6}
        sx={{
          backgroundImage: `url("https://images.unsplash.com/photo-1739820120366-b518d16785ed?q=80&w=3687&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </Grid>
  );
};

export default AuthPage;

import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Button,
  Typography,
  Box,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  LinearProgress,
  Snackbar,
} from "@mui/material";
import { auth } from "../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import EmailIcon from "@mui/icons-material/Email";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3),
}));

const VerificationCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
  maxWidth: 480,
  width: "100%",
}));

const CardHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: "white",
  padding: theme.spacing(3),
  textAlign: "center",
}));

const CardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const EmailIconContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "white",
  width: 80,
  height: 80,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
  marginBottom: theme.spacing(2),
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.2, 3),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const InstructionStep = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  border: "1px solid rgba(0, 0, 0, 0.05)",
}));

const StepNumber = styled(Box)(({ theme }) => ({
  width: 24,
  height: 24,
  borderRadius: "50%",
  backgroundColor: theme.palette.primary.main,
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(1.5),
  fontWeight: 600,
  fontSize: "0.85rem",
}));

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [, setEmailSent] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [checkedVerification, setCheckedVerification] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!auth.currentUser) return;

      try {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setCheckedVerification(true);
          setSuccess(true);

          const timer = setTimeout(() => {
            navigate("/dashboard");
          }, 3000);

          return () => clearTimeout(timer);
        } else {
          setCheckedVerification(true);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    };

    checkVerification();

    const interval = setInterval(checkVerification, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (remainingTime === null || remainingTime <= 0) return;

    const timer = setTimeout(() => {
      setRemainingTime((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remainingTime]);

  const resendEmail = async () => {
    if (!auth.currentUser || auth.currentUser.emailVerified) return;

    try {
      setLoading(true);
      setError(null);

      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login`,
      });

      setEmailSent(true);
      setSnackbarMessage("Verification email sent successfully!");
      setSnackbarOpen(true);
      setRemainingTime(60);
    } catch (error) {
      console.error("Failed to send verification email:", error);
      setError("Failed to resend email. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        setSnackbarMessage(
          "Your email is not verified yet. Please check your inbox."
        );
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      setError("Failed to check verification status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (!checkedVerification) {
    return (
      <PageContainer>
        <Container maxWidth="sm" sx={{ textAlign: "center" }}>
          <CircularProgress size={60} thickness={4} />
          <Typography sx={{ mt: 2 }}>
            Checking verification status...
          </Typography>
        </Container>
      </PageContainer>
    );
  }

  if (success) {
    return (
      <PageContainer>
        <VerificationCard>
          <CardHeader>
            <EmailIconContainer>
              <MarkEmailReadIcon color="primary" sx={{ fontSize: 40 }} />
            </EmailIconContainer>
            <Typography variant="h5" fontWeight="700">
              Email Verified!
            </Typography>
          </CardHeader>
          <CardContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your email has been successfully verified.
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              You'll be redirected to the dashboard automatically in a few
              seconds.
            </Typography>
            <LinearProgress />
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <ActionButton
                variant="contained"
                color="primary"
                onClick={() => navigate("/dashboard")}
                fullWidth
              >
                Go to Dashboard Now
              </ActionButton>
            </Box>
          </CardContent>
        </VerificationCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <VerificationCard>
        <CardHeader>
          <EmailIconContainer>
            <EmailIcon color="primary" sx={{ fontSize: 40 }} />
          </EmailIconContainer>
          <Typography variant="h5" fontWeight="700">
            Verify Your Email
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            Please verify your email to continue
          </Typography>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Typography variant="body1" sx={{ mb: 3 }}>
            We've sent a verification link to{" "}
            <Typography component="span" fontWeight="600" color="primary">
              {auth.currentUser?.email}
            </Typography>
            . Please check your inbox and follow the instructions to activate
            your account.
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
              Follow these steps:
            </Typography>

            <InstructionStep>
              <StepNumber>1</StepNumber>
              <Box>
                <Typography variant="body2" fontWeight="500">
                  Check your email inbox
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Look for an email from Transpara with the subject "Verify your
                  email"
                </Typography>
              </Box>
            </InstructionStep>

            <InstructionStep>
              <StepNumber>2</StepNumber>
              <Box>
                <Typography variant="body2" fontWeight="500">
                  Click the verification link
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Open the email and click on the verification link provided
                </Typography>
              </Box>
            </InstructionStep>

            <InstructionStep>
              <StepNumber>3</StepNumber>
              <Box>
                <Typography variant="body2" fontWeight="500">
                  Return to this page
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  After verification, come back here to continue to your account
                </Typography>
              </Box>
            </InstructionStep>
          </Box>

          <ActionButton
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleCheckVerification}
            startIcon={<RefreshIcon />}
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? "Checking..." : "I've Verified My Email"}
          </ActionButton>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Didn't receive the email?
            </Typography>
          </Divider>

          <Box sx={{ mb: 2 }}>
            <ActionButton
              variant="outlined"
              color="primary"
              onClick={resendEmail}
              disabled={
                loading || (remainingTime !== null && remainingTime > 0)
              }
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : remainingTime !== null && remainingTime > 0 ? (
                `Resend Email (${remainingTime}s)`
              ) : (
                "Resend Verification Email"
              )}
            </ActionButton>
          </Box>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToLogin}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              width: "100%",
              justifyContent: "center",
            }}
          >
            Back to Login
          </Button>
        </CardContent>
      </VerificationCard>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleCloseSnackbar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </PageContainer>
  );
};

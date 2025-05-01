import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Button,
  Grid,
  Chip,
  useTheme,
  alpha,
  styled,
  IconButton,
  Tabs,
  Tab,
  Link,
  Tooltip,
  LinearProgress,
  ButtonProps,
  Menu,
  MenuItem,
  ListItemIcon,
  Fade,
  Snackbar,
  Alert,
} from "@mui/material";
import { getDoc } from "firebase/firestore";
import { db } from "../firebase";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import EuroOutlinedIcon from "@mui/icons-material/EuroOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LanguageIcon from "@mui/icons-material/Language";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import ForwardToInboxOutlinedIcon from "@mui/icons-material/ForwardToInboxOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { updateDoc, doc } from "firebase/firestore";

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

const ProfileCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "visible",
  marginBottom: theme.spacing(3),
  position: "relative",
}));

const SectionCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  height: "100%",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  overflow: "visible",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  fontSize: 40,
  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
  border: `4px solid ${theme.palette.background.paper}`,
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  "& .MuiSvgIcon-root": {
    marginRight: theme.spacing(1.5),
    color:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.primary.main, 0.7)
        : theme.palette.primary.main,
  },
}));

const ActionButton = styled(Button)<ButtonProps>(({ theme }) => ({
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 500,
    minWidth: 120,
  },
}));

interface Candidate {
  appliedAt: { seconds: number; nanoseconds: number };
  availableStartDate: string;
  candidateID: string;
  cvUrl: string;
  email: string;
  expectedSalary: string;
  firstName: string;
  jobId: string;
  jobTitle: string;
  lastName: string;
  linkedinUrl?: string;
  message: string;
  phoneCountry: string;
  phoneCountryCode: string;
  phoneNumber: string;
  placeOfResidence: string;
  portfolioUrl?: string;
  websiteUrl?: string;
  status?: string;
}

const CandidateProfilePage: React.FC = () => {
  const { jobId, candidateId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [currentTab, setCurrentTab] = useState(0);
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [statusSnackbarOpen, setStatusSnackbarOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSeverity, setStatusSeverity] = useState<"success" | "error">(
    "success"
  );

  const handleShareProfile = () => {
    const link = `${window.location.origin}/job/${jobId}/candidate/${candidateId}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${candidate?.firstName} ${candidate?.lastName} - Candidate Profile`,
          text: `Check out this candidate for ${candidate?.jobTitle}`,
          url: link,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(link);
      setStatusMessage("Candidate profile link copied to clipboard!");
      setStatusSeverity("success");
      setStatusSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchCandidateData = async () => {
      if (!jobId || !candidateId) return;

      try {
        const docRef = doc(db, "jobs", jobId, "applications", candidateId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setCandidate(snapshot.data() as Candidate);
        }
      } catch (err) {
        console.error("Error loading candidate profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, [jobId, candidateId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusSelect = async (
    status: "shortlisted" | "rejected" | "interviewed" | "offered" | "hired"
  ) => {
    if (!jobId || !candidateId) return;

    try {
      const docRef = doc(db, "jobs", jobId, "applications", candidateId);
      await updateDoc(docRef, { status });
      setCandidate((prev) => prev && { ...prev, status });

      let statusLabel = "";
      switch (status) {
        case "shortlisted":
          statusLabel = "shortlisted";
          break;
        case "interviewed":
          statusLabel = "marked as interviewed";
          break;
        case "offered":
          statusLabel = "sent an offer";
          break;
        case "hired":
          statusLabel = "hired";
          break;
        case "rejected":
          statusLabel = "rejected";
          break;
      }

      setStatusMessage(`Candidate ${statusLabel} successfully`);
      setStatusSeverity(status === "rejected" ? "error" : "success");
      setStatusSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusMessage("Failed to update candidate status");
      setStatusSeverity("error");
      setStatusSnackbarOpen(true);
    } finally {
      handleMenuClose();
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          mt: 10,
        }}
      >
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Loading candidate profile...
        </Typography>
        <Box sx={{ width: "300px", mt: 2 }}>
          <LinearProgress />
        </Box>
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Box
        sx={{
          mt: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          p: 4,
        }}
      >
        <Typography variant="h5" gutterBottom>
          Candidate Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The candidate profile you are looking for does not exist or has been
          removed.
        </Typography>
        <ActionButton
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </ActionButton>
      </Box>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ px: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              borderRadius: 1.5,
              textTransform: "none",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
              "&:hover": {
                boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            Back to Candidates
          </Button>

          <Box>
            <Tooltip title="Share Profile">
              <IconButton
                size="small"
                onClick={handleShareProfile}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <ShareOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <ProfileCard>
          <Box
            sx={{
              p: 3,
              pb: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
            }}
          >
            <Grid container alignItems="center" spacing={3}>
              <Grid item>
                <ProfileAvatar
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color:
                      theme.palette.mode === "dark"
                        ? alpha(theme.palette.primary.main, 0.8)
                        : theme.palette.primary.main,
                  }}
                >
                  {candidate.firstName?.charAt(0)}
                  {candidate.lastName?.charAt(0)}
                </ProfileAvatar>
              </Grid>

              <Grid item xs>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      {candidate.firstName} {candidate.lastName}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Applicant for <strong>{candidate.jobTitle}</strong>
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <Chip
                        icon={<LocationOnOutlinedIcon fontSize="small" />}
                        label={candidate.placeOfResidence}
                        size="small"
                        sx={{
                          mr: 1,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: "1px solid",
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                      <Chip
                        icon={<CalendarTodayOutlinedIcon fontSize="small" />}
                        label={`Applied ${new Date(
                          candidate.appliedAt?.seconds * 1000
                        ).toLocaleDateString()}`}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: "1px solid",
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      />
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <ActionButton
                      component="a"
                      href={`mailto:${candidate.email}`}
                      variant="outlined"
                      color="primary"
                      startIcon={<ForwardToInboxOutlinedIcon />}
                      size="small"
                    >
                      Send Message
                    </ActionButton>

                    <ActionButton
                      variant="contained"
                      color={
                        candidate.status === "shortlisted"
                          ? "success"
                          : candidate.status === "interviewed"
                          ? "info"
                          : candidate.status === "offered"
                          ? "warning"
                          : candidate.status === "hired"
                          ? "success"
                          : candidate.status === "rejected"
                          ? "error"
                          : "primary"
                      }
                      startIcon={
                        candidate.status === "shortlisted" ? (
                          <CheckCircleOutlineIcon />
                        ) : candidate.status === "interviewed" ? (
                          <PersonAddOutlinedIcon />
                        ) : candidate.status === "offered" ? (
                          <WorkOutlineOutlinedIcon />
                        ) : candidate.status === "hired" ? (
                          <EuroOutlinedIcon />
                        ) : candidate.status === "rejected" ? (
                          <HighlightOffOutlinedIcon />
                        ) : (
                          <CheckCircleOutlineIcon />
                        )
                      }
                      size="small"
                      onClick={handleMenuClick}
                      sx={{
                        ...(candidate.status === "hired" && {
                          bgcolor: theme.palette.success.dark,
                        }),
                      }}
                    >
                      {candidate.status === "shortlisted"
                        ? "Shortlisted"
                        : candidate.status === "interviewed"
                        ? "Interviewed"
                        : candidate.status === "offered"
                        ? "Offered"
                        : candidate.status === "hired"
                        ? "Hired"
                        : candidate.status === "rejected"
                        ? "Rejected"
                        : "Set Status"}
                    </ActionButton>

                    <Menu
                      anchorEl={anchorEl}
                      open={openMenu}
                      onClose={handleMenuClose}
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      transformOrigin={{ vertical: "top", horizontal: "right" }}
                      PaperProps={{
                        elevation: 3,
                        sx: {
                          mt: 1.5,
                          overflow: "visible",
                          borderRadius: 2,
                          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.15))",
                          "&:before": {
                            content: '""',
                            display: "block",
                            position: "absolute",
                            top: 0,
                            right: 14,
                            width: 10,
                            height: 10,
                            bgcolor: "background.paper",
                            transform: "translateY(-50%) rotate(45deg)",
                            zIndex: 0,
                          },
                          minWidth: 180,
                        },
                      }}
                      TransitionComponent={Fade}
                    >
                      <MenuItem
                        onClick={() => handleStatusSelect("shortlisted")}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          my: 0.5,
                          mx: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <CheckCircleOutlineIcon
                            fontSize="small"
                            color="success"
                            sx={{ mr: 1 }}
                          />
                        </ListItemIcon>
                        <Typography variant="body2" fontWeight={500}>
                          Shortlist Candidate
                        </Typography>
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleStatusSelect("interviewed")}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          my: 0.5,
                          mx: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <PersonAddOutlinedIcon
                            fontSize="small"
                            color="info"
                            sx={{ mr: 1 }}
                          />
                        </ListItemIcon>
                        <Typography variant="body2" fontWeight={500}>
                          Mark as Interviewed
                        </Typography>
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleStatusSelect("offered")}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          my: 0.5,
                          mx: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <WorkOutlineOutlinedIcon
                            fontSize="small"
                            color="warning"
                            sx={{ mr: 1 }}
                          />
                        </ListItemIcon>
                        <Typography variant="body2" fontWeight={500}>
                          Offered
                        </Typography>
                      </MenuItem>

                      <MenuItem
                        onClick={() => handleStatusSelect("hired")}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          my: 0.5,
                          mx: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.success.dark, 0.1),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <EuroOutlinedIcon
                            fontSize="small"
                            sx={{ mr: 1, color: theme.palette.success.dark }}
                          />
                        </ListItemIcon>
                        <Typography variant="body2" fontWeight={500}>
                          Hired
                        </Typography>
                      </MenuItem>

                      <Divider sx={{ my: 1 }} />

                      <MenuItem
                        onClick={() => handleStatusSelect("rejected")}
                        sx={{
                          py: 1.5,
                          borderRadius: 1,
                          my: 0.5,
                          mx: 0.5,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <HighlightOffOutlinedIcon
                            fontSize="small"
                            color="error"
                            sx={{ mr: 1 }}
                          />
                        </ListItemIcon>
                        <Typography variant="body2" fontWeight={500}>
                          Reject Candidate
                        </Typography>
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ p: 3 }}>
            <StyledTabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab
                label="Overview"
                icon={<PersonAddOutlinedIcon />}
                iconPosition="start"
              />
              <Tab
                label="Documents"
                icon={<DescriptionOutlinedIcon />}
                iconPosition="start"
              />
            </StyledTabs>

            {currentTab === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SectionCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{ mb: 3 }}
                      >
                        Contact Information
                      </Typography>

                      <InfoRow>
                        <EmailOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            <Link
                              href={`mailto:${candidate.email}`}
                              color="inherit"
                            >
                              {candidate.email}
                            </Link>
                          </Typography>
                        </Box>
                      </InfoRow>

                      <InfoRow>
                        <PhoneOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            <Link
                              href={`tel:${candidate.phoneCountryCode}${candidate.phoneNumber}`}
                              color="inherit"
                            >
                              {candidate.phoneCountryCode}{" "}
                              {formatPhoneNumber(candidate.phoneNumber)}
                            </Link>
                          </Typography>
                        </Box>
                      </InfoRow>

                      <InfoRow>
                        <LocationOnOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Location
                          </Typography>
                          <Typography variant="body1">
                            {candidate.placeOfResidence}
                          </Typography>
                        </Box>
                      </InfoRow>

                      {(candidate.linkedinUrl ||
                        candidate.websiteUrl ||
                        candidate.portfolioUrl) && (
                        <>
                          <Divider sx={{ my: 2 }} />

                          {candidate.linkedinUrl && (
                            <InfoRow>
                              <LinkedInIcon />
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  LinkedIn
                                </Typography>
                                <Link
                                  href={candidate.linkedinUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                >
                                  View Profile
                                </Link>
                              </Box>
                            </InfoRow>
                          )}

                          {candidate.websiteUrl && (
                            <InfoRow>
                              <LanguageIcon />
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Website
                                </Typography>
                                <Link
                                  href={candidate.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                >
                                  {candidate.websiteUrl.replace(
                                    /^https?:\/\/(www\.)?/,
                                    ""
                                  )}
                                </Link>
                              </Box>
                            </InfoRow>
                          )}

                          {candidate.portfolioUrl && (
                            <InfoRow>
                              <WorkOutlineOutlinedIcon />
                              <Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Portfolio
                                </Typography>
                                <Link
                                  href={candidate.portfolioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  underline="hover"
                                >
                                  View Portfolio
                                </Link>
                              </Box>
                            </InfoRow>
                          )}
                        </>
                      )}
                    </CardContent>
                  </SectionCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SectionCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{ mb: 3 }}
                      >
                        Application Details
                      </Typography>

                      <InfoRow>
                        <WorkOutlineOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Applied For
                          </Typography>
                          <Typography variant="body1">
                            {candidate.jobTitle}
                          </Typography>
                        </Box>
                      </InfoRow>

                      <InfoRow>
                        <CalendarTodayOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Available Start Date
                          </Typography>
                          <Typography variant="body1">
                            {new Date(
                              candidate.availableStartDate
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Typography>
                        </Box>
                      </InfoRow>

                      <InfoRow>
                        <EuroOutlinedIcon />
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Expected Salary
                          </Typography>
                          <Typography variant="body1">
                            €
                            {new Intl.NumberFormat().format(
                              Number(candidate.expectedSalary)
                            )}{" "}
                            per month
                          </Typography>
                        </Box>
                      </InfoRow>
                    </CardContent>
                  </SectionCard>
                </Grid>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <SectionCard>
                      <CardContent sx={{ p: 3 }}>
                        <Typography
                          variant="h6"
                          fontWeight={600}
                          gutterBottom
                          sx={{ mb: 2 }}
                        >
                          Cover Message
                        </Typography>
                        <Box
                          sx={{
                            bgcolor: alpha(
                              theme.palette.background.default,
                              0.5
                            ),
                            p: 2.5,
                            borderRadius: 2,
                            border: "1px solid",
                            borderColor: alpha(theme.palette.divider, 0.5),
                          }}
                        >
                          <Typography
                            variant="body1"
                            component="div"
                            paragraph
                            sx={{
                              whiteSpace: "normal",
                              lineHeight: 1.8,
                            }}
                          >
                            {candidate.message || "No cover message provided."}
                          </Typography>
                        </Box>
                      </CardContent>
                    </SectionCard>
                  </Grid>
                </Grid>
              </Grid>
            )}

            {currentTab === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <SectionCard>
                    <CardContent sx={{ p: 3 }}>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        gutterBottom
                        sx={{ mb: 3 }}
                      >
                        Resume / CV
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 3,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box
                            sx={{
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              borderRadius: "50%",
                              p: 1.5,
                              mr: 2,
                            }}
                          >
                            <DescriptionOutlinedIcon
                              fontSize="large"
                              color="primary"
                            />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={600}>
                              Candidate CV Document
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Uploaded when applied on{" "}
                              {new Date(
                                candidate.appliedAt?.seconds * 1000
                              ).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                        <ActionButton
                          component="a"
                          variant="contained"
                          color="primary"
                          href={candidate.cvUrl}
                          rel="noopener noreferrer"
                        >
                          View CV
                        </ActionButton>
                      </Box>
                    </CardContent>
                  </SectionCard>
                </Grid>
              </Grid>
            )}
          </Box>
        </ProfileCard>
      </Box>

      <Snackbar
        open={statusSnackbarOpen}
        autoHideDuration={4000}
        onClose={() => setStatusSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setStatusSnackbarOpen(false)}
          severity={statusSeverity}
          elevation={6}
          variant="filled"
        >
          {statusMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default CandidateProfilePage;

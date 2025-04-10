import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isValidFirestoreId } from "../utils/validation";
import { CountryOption } from "../types/country";
import { countries } from "../constants/countries";
import { useParams, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  Container,
  Grid,
  StepConnector,
  stepConnectorClasses,
  StepIconProps,
  useTheme,
  useMediaQuery,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  GitHub as GitHubIcon,
  AttachFile as AttachFileIcon,
  CloudUpload as CloudUploadIcon,
  Euro as EuroIcon,
  Event as EventIcon,
  Check as CheckIcon,
  KeyboardArrowRight as ArrowRightIcon,
} from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { setDoc } from "firebase/firestore";
import { BusinessCenter as BusinessCenterIcon } from "@mui/icons-material";

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  minHeight: "100vh",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(8),
}));

const ApplicationCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
}));

const JobHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.primary.main,
  color: "white",
}));

const FormContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledDropzone = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.primary.main}`,
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(4),
  textAlign: "center",
  marginBottom: theme.spacing(3),
  cursor: "pointer",
  transition: "all 0.3s ease",
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
    borderColor: theme.palette.primary.dark,
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
  padding: theme.spacing(1.2, 4),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const BackButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.2, 3),
  textTransform: "none",
}));

const ReviewSection = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
}));

const ReviewItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "&:last-child": {
    marginBottom: 0,
  },
}));

const FileChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  height: "auto",
  "& .MuiChip-label": {
    display: "block",
    whiteSpace: "normal",
    padding: theme.spacing(0.5, 0),
  },
}));

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: "calc(-50% + 16px)",
    right: "calc(50% + 16px)",
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

const QontoStepIcon = (props: StepIconProps) => {
  const { active, completed, className } = props;
  const theme = useTheme();

  return (
    <Box
      className={className}
      sx={{
        height: 22,
        display: "flex",
        alignItems: "center",
        color:
          theme.palette.mode === "dark" ? theme.palette.grey[700] : "#eaeaf0",
        ...(active && {
          color: theme.palette.primary.main,
        }),
        ...(completed && {
          color: theme.palette.primary.main,
        }),
      }}
    >
      {completed ? (
        <CheckIcon sx={{ fontSize: 24 }} />
      ) : (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "currentColor",
          }}
        />
      )}
    </Box>
  );
};

const steps = [
  "Basic Information",
  "Contact Details",
  "Additional Information",
  "Review",
];

export const ApplicationPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const { jobId } = useParams();
  const [jobTitle, setJobTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [placeOfResidence, setPlaceOfResidence] = useState("");
  const [isJobOpen, setIsJobOpen] = useState<boolean | null>(null);

  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    countries.find((c) => c.code === "US")!
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const [availableStartDate, setAvailableStartDate] = useState<Date | null>(
    null
  );
  const [expectedSalary, setExpectedSalary] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || !isValidFirestoreId(jobId)) {
        setError("Invalid job ID");
        setIsLoading(false);
        return;
      }

      try {
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        if (jobDoc.exists()) {
          const jobData = jobDoc.data();
          setJobTitle(jobData.title);
          setIsJobOpen(jobData.isOpen !== false);
        } else {
          setError("Job not found");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Failed to fetch job details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJob();
    loadDraft();
  }, [jobId]);

  useEffect(() => {
    saveDraft();
  }, [
    firstName,
    lastName,
    email,
    confirmEmail,
    placeOfResidence,
    phoneNumber,
    message,
    linkedinUrl,
    websiteUrl,
    expectedSalary,
    portfolioUrl,
    availableStartDate,
  ]);

  const loadDraft = () => {
    const saved = localStorage.getItem("job_application_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
        setEmail(parsed.email || "");
        setConfirmEmail(parsed.confirmEmail || "");
        setPlaceOfResidence(parsed.placeOfResidence || "");
        setPhoneNumber(parsed.phoneNumber || "");
        setMessage(parsed.message || "");
        setLinkedinUrl(parsed.linkedinUrl || "");
        setWebsiteUrl(parsed.websiteUrl || "");
        setExpectedSalary(parsed.expectedSalary || "");
        setPortfolioUrl(parsed.portfolioUrl || "");
        if (parsed.availableStartDate) {
          setAvailableStartDate(new Date(parsed.availableStartDate));
        }
        if (parsed.selectedCountry) {
          setSelectedCountry(parsed.selectedCountry);
        }

        showSnackbar("Application draft loaded");
      } catch (e) {
        console.error("Error loading draft:", e);
      }
    }
  };

  const saveDraft = () => {
    try {
      const draft = {
        firstName,
        lastName,
        email,
        confirmEmail,
        placeOfResidence,
        phoneNumber,
        message,
        linkedinUrl,
        websiteUrl,
        expectedSalary,
        portfolioUrl,
        availableStartDate,
        selectedCountry,
      };
      localStorage.setItem("job_application_draft", JSON.stringify(draft));
    } catch (e) {
      console.error("Error saving draft:", e);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("job_application_draft");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setCvFile(acceptedFiles[0]);
        showSnackbar(`CV uploaded: ${acceptedFiles[0].name}`);
      }
    },
  });

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
      window.scrollTo(0, 0);
    } else {
      showSnackbar("Please fill in all required fields");
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    window.scrollTo(0, 0);
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!firstName || !lastName || !email) return false;
        if (email !== confirmEmail) return false;
        return true;
      case 1:
        return Boolean(phoneNumber && placeOfResidence);
      case 2:
        return Boolean(message && cvFile && expectedSalary);
      default:
        return true;
    }
  };

  const handleApply = async () => {
    if (!jobId || !isValidFirestoreId(jobId)) {
      setError("Invalid job ID");
      return;
    }

    if (!cvFile) {
      showSnackbar("Please upload your CV before submitting");
      return;
    }

    setConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const applicationsCollection = collection(
        db,
        "jobs",
        jobId,
        "applications"
      );
      const applicationRef = doc(applicationsCollection);
      const candidateID = applicationRef.id;

      const storage = getStorage();
      const cvRef = ref(
        storage,
        `applications/${jobId}/${candidateID}_${cvFile.name}`
      );
      const uploadSnapshot = await uploadBytes(cvRef, cvFile);
      const cvUrl = await getDownloadURL(uploadSnapshot.ref);

      const applicationData = {
        candidateID,
        jobId,
        jobTitle,
        firstName,
        lastName,
        email,
        placeOfResidence,
        phoneCountryCode: selectedCountry.phone,
        phoneCountry: selectedCountry.code,
        phoneNumber,
        linkedinUrl,
        websiteUrl,
        message,
        cvUrl,
        expectedSalary,
        portfolioUrl,
        availableStartDate: availableStartDate
          ? availableStartDate.toISOString()
          : null,
        appliedAt: new Date(),
      };

      await setDoc(applicationRef, applicationData);

      setSuccessMessage("Application submitted successfully!");
      clearDraft();

      setTimeout(() => {
        navigate("/jobs");
      }, 3000);
    } catch (err) {
      console.error("Application submission failed:", err);
      setError("Failed to submit application. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isJobOpen === false) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <ApplicationCard elevation={0}>
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "warning.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <BusinessCenterIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>
              <Typography variant="h5" gutterBottom>
                Job Application Closed
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                This job is no longer accepting applications.
              </Typography>
            </Box>
          </ApplicationCard>
        </Container>
      </PageContainer>
    );
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"></InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <StyledTextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              variant="outlined"
            />

            <StyledTextField
              label="Confirm Email Address"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              fullWidth
              required
              variant="outlined"
              error={email !== confirmEmail && confirmEmail !== ""}
              helperText={
                email !== confirmEmail && confirmEmail !== ""
                  ? "Emails do not match"
                  : ""
              }
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              Contact Information
            </Typography>

            <Autocomplete
              id="country-select"
              options={countries}
              autoHighlight
              value={selectedCountry}
              onChange={(event, newValue) => {
                if (newValue) setSelectedCountry(newValue);
              }}
              getOptionLabel={(option) => `${option.label} (+${option.phone})`}
              renderOption={(props, option) => {
                return (
                  <Box
                    component="li"
                    sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                    {...props}
                  >
                    <img
                      loading="lazy"
                      width="20"
                      src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                      alt=""
                    />
                    {option.label} (+{option.phone})
                  </Box>
                );
              }}
              renderInput={(params) => (
                <StyledTextField
                  {...params}
                  label="Country"
                  required
                  variant="outlined"
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
            />

            <StyledTextField
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    +{selectedCountry.phone}
                  </InputAdornment>
                ),
              }}
              placeholder="Enter phone number without country code"
            />

            <StyledTextField
              label="Place of Residence"
              value={placeOfResidence}
              onChange={(e) => setPlaceOfResidence(e.target.value)}
              fullWidth
              required
              variant="outlined"
              placeholder="City, Country"
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              Resume & Additional Information
            </Typography>

            <StyledDropzone
              {...getRootProps()}
              sx={{
                backgroundColor: isDragActive
                  ? "rgba(0, 0, 0, 0.05)"
                  : "rgba(0, 0, 0, 0.02)",
                border: `2px dashed ${
                  cvFile
                    ? theme.palette.success.main
                    : theme.palette.primary.main
                }`,
              }}
            >
              <input {...getInputProps()} />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {cvFile ? (
                  <>
                    <CheckIcon
                      sx={{ fontSize: 40, color: "success.main", mb: 1 }}
                    />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Resume uploaded successfully
                    </Typography>
                    <FileChip
                      icon={<AttachFileIcon />}
                      label={cvFile.name}
                      onDelete={() => setCvFile(null)}
                      variant="outlined"
                      color="primary"
                    />
                  </>
                ) : (
                  <>
                    <CloudUploadIcon
                      sx={{ fontSize: 40, color: "primary.main", mb: 1 }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ mb: 1, fontWeight: 500 }}
                    >
                      Upload your resume (PDF)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Drag & drop your file here, or click to browse your files
                    </Typography>
                  </>
                )}
              </Box>
            </StyledDropzone>

            <StyledTextField
              label="Message to Hiring Manager"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              variant="outlined"
              placeholder="Introduce yourself and explain why you're a great fit for this position..."
            />

            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 4 }}>
              Professional Details
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Expected Salary"
                  type="number"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  fullWidth
                  required
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EuroIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Available Start Date"
                    value={availableStartDate}
                    onChange={(date) => setAvailableStartDate(date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: "outlined",
                        required: true,
                        InputProps: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventIcon color="action" />
                            </InputAdornment>
                          ),
                        },
                        sx: {
                          mb: 3,
                          borderRadius: 1,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                            transition: "all 0.3s ease",
                            "&:hover": {
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "primary.main",
                              },
                            },
                          },
                        },
                      },
                      popper: { disablePortal: true },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Typography variant="h6" fontWeight="600" sx={{ mb: 2, mt: 1 }}>
              Social Profiles
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="LinkedIn"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkedInIcon sx={{ color: "#0077B5" }} />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  label="Website"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  fullWidth
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WebsiteIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  placeholder="https://yourwebsite.com"
                />
              </Grid>
            </Grid>

            <StyledTextField
              label="Portfolio / GitHub"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <GitHubIcon color="action" />
                  </InputAdornment>
                ),
              }}
              placeholder="https://github.com/username"
              sx={{ mb: 0 }}
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
              Review Your Application
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your application details before submitting. Once
              submitted, you won't be able to make changes.
            </Alert>

            <ReviewSection>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                Personal Information
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Full Name
                    </Typography>
                    <Typography variant="body1">
                      {firstName} {lastName}
                    </Typography>
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Email Address
                    </Typography>
                    <Typography variant="body1">{email}</Typography>
                  </ReviewItem>
                </Grid>
              </Grid>
            </ReviewSection>

            <ReviewSection>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                Contact Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography variant="body1">
                      +{selectedCountry.phone} {phoneNumber}
                    </Typography>
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">{placeOfResidence}</Typography>
                  </ReviewItem>
                </Grid>
              </Grid>
            </ReviewSection>

            <ReviewSection>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                Professional Details
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Resume
                    </Typography>
                    {cvFile ? (
                      <FileChip
                        icon={<AttachFileIcon />}
                        label={cvFile.name}
                        variant="outlined"
                        color="primary"
                      />
                    ) : (
                      <Typography variant="body1" color="error">
                        No resume uploaded
                      </Typography>
                    )}
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Expected Salary
                    </Typography>
                    <Typography variant="body1">€{expectedSalary}</Typography>
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Available Start Date
                    </Typography>
                    <Typography variant="body1">
                      {availableStartDate
                        ? format(availableStartDate, "MMMM d, yyyy")
                        : "Not specified"}
                    </Typography>
                  </ReviewItem>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Message to Hiring Manager
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: "background.paper",
                    borderRadius: 1,
                    borderLeft: "4px solid",
                    borderColor: "primary.main",
                  }}
                >
                  {message}
                </Typography>
              </Box>
            </ReviewSection>

            <ReviewSection>
              <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
                Social Profiles
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      LinkedIn
                    </Typography>
                    <Typography variant="body1">
                      {linkedinUrl || "Not provided"}
                    </Typography>
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Website
                    </Typography>
                    <Typography variant="body1">
                      {websiteUrl || "Not provided"}
                    </Typography>
                  </ReviewItem>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ReviewItem>
                    <Typography variant="body2" color="text.secondary">
                      Portfolio / GitHub
                    </Typography>
                    <Typography variant="body1">
                      {portfolioUrl || "Not provided"}
                    </Typography>
                  </ReviewItem>
                </Grid>
              </Grid>
            </ReviewSection>
          </Box>
        );
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 3 }}>
              Loading job details...
            </Typography>
          </Box>
        </Container>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Alert
            severity="error"
            variant="filled"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" onClick={() => navigate("/jobs")}>
                Browse Jobs
              </Button>
            }
          >
            {error}
          </Alert>

          <ApplicationCard elevation={0}>
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" gutterBottom>
                Unable to load job application
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                There was a problem loading this job. Please try again later or
                browse other available positions.
              </Typography>
              <ActionButton
                variant="contained"
                onClick={() => navigate("/jobs")}
                startIcon={<ArrowRightIcon />}
              >
                View All Jobs
              </ActionButton>
            </Box>
          </ApplicationCard>
        </Container>
      </PageContainer>
    );
  }

  if (successMessage) {
    return (
      <PageContainer>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <ApplicationCard elevation={0}>
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  bgcolor: "success.light",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <CheckIcon sx={{ fontSize: 40, color: "white" }} />
              </Box>

              <Typography variant="h4" gutterBottom>
                Application Submitted!
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 600, mx: "auto" }}
              >
                Thank you for applying to {jobTitle}. Your application has been
                received and is being reviewed by the hiring team.
              </Typography>
            </Box>
          </ApplicationCard>
        </Container>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Container maxWidth="md">
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Tooltip title="Back to job details">
            <IconButton
              onClick={() => navigate(`/job/${jobId}`)}
              sx={{ mr: 2 }}
              aria-label="go back"
            >
              <BackIcon />
            </IconButton>
          </Tooltip>

          <Box>
            <Typography variant="h5" fontWeight="700">
              Apply for {jobTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete all sections to submit your application
            </Typography>
          </Box>
        </Box>

        <ApplicationCard elevation={0} sx={{ mb: 4 }}>
          <JobHeader>
            <Typography variant="h5" fontWeight="700" gutterBottom>
              {jobTitle}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Follow the steps below to complete your application
            </Typography>
          </JobHeader>

          <Box sx={{ px: 4, pt: 4 }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel={!isMobile}
              orientation={isMobile ? "vertical" : "horizontal"}
              connector={<QontoConnector />}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={QontoStepIcon}>
                    <Typography
                      variant="body2"
                      fontWeight={
                        activeStep === steps.indexOf(label) ? 600 : 400
                      }
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <FormContainer>
            {renderStepContent(activeStep)}

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <BackButton
                variant="outlined"
                onClick={
                  activeStep === 0
                    ? () => navigate(`/job/${jobId}`)
                    : handleBack
                }
                startIcon={activeStep === 0 ? <BackIcon /> : undefined}
              >
                {activeStep === 0 ? "Back to Job" : "Previous Step"}
              </BackButton>

              {activeStep === steps.length - 1 ? (
                <ActionButton
                  variant="contained"
                  color="primary"
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={isSubmitting}
                  endIcon={
                    isSubmitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : undefined
                  }
                >
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </ActionButton>
              ) : (
                <ActionButton
                  variant="contained"
                  color="primary"
                  onClick={handleNext}
                  endIcon={<ArrowRightIcon />}
                >
                  Continue
                </ActionButton>
              )}
            </Box>
          </FormContainer>
        </ApplicationCard>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Submit Application</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your application for {jobTitle}?
            Once submitted, you won't be able to make any changes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleApply} variant="contained" color="primary">
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </PageContainer>
  );
};

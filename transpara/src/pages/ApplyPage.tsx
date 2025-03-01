import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, addDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isValidFirestoreId } from "../utils/validation";
import { CountryOption } from "../types/country";
import { countries } from "../constants/countries";
import { useParams, useNavigate } from "react-router-dom";
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
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  ArrowBack as BackIcon,
  LinkedIn as LinkedInIcon,
  Language as WebsiteIcon,
  // Facebook as FacebookIcon,
  // Twitter as TwitterIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const steps = [
  "Basic Information",
  "Contact Details",
  "Additional Information",
  "Review",
];

export const ApplyPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const { jobId } = useParams();
  const [jobTitle, setJobTitle] = useState("");

  // Personal Information
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [placeOfResidence, setPlaceOfResidence] = useState("");

  // Phone Information
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    countries.find((c) => c.code === "US")!
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  // Social Profiles
  const [linkedinUrl, setLinkedinUrl] = useState("");
  // const [xUrl, setXUrl] = useState("");
  // const [facebookUrl, setFacebookUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Additional fields
  const [message, setMessage] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId || !isValidFirestoreId(jobId)) {
        setError("Invalid job ID");
        return;
      }
      try {
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        if (jobDoc.exists()) {
          setJobTitle(jobDoc.data().title);
        } else {
          setError("Job not found");
        }
      } catch {
        setError("Failed to fetch job details");
      }
    };
    fetchJob();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return firstName && lastName && email && email === confirmEmail;
      case 1:
        return phoneNumber && placeOfResidence;
      case 2:
        return message && cvFile;
      default:
        return true;
    }
  };

  const handleApply = async () => {
    if (!jobId || !isValidFirestoreId(jobId)) {
      setError("Invalid job ID");
      return;
    }

    setIsSubmitting(true);
    let cvUrl = "";

    try {
      if (cvFile) {
        const storage = getStorage();
        const cvRef = ref(storage, `applications/${jobId}/${cvFile.name}`);
        const uploadSnapshot = await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(uploadSnapshot.ref);
      }

      const applicationData = {
        firstName,
        lastName,
        email,
        confirmEmail,
        placeOfResidence,
        phoneCountryCode: selectedCountry.phone,
        phoneCountry: selectedCountry.code,
        phoneNumber,
        linkedinUrl,
        // xUrl,
        // facebookUrl,
        websiteUrl,
        message,
        cvUrl,
        appliedAt: new Date(),
      };

      // Submit application
      await addDoc(
        collection(db, "jobs", jobId, "applications"),
        applicationData
      );

      setSuccessMessage("Application submitted successfully!");

      // Redirect after delay
      setTimeout(() => {
        navigate("/jobs");
      }, 3000);
    } catch (err) {
      console.error("Application submission failed:", err);
      setError("Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 3 }}>
            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Confirm Email Address"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              fullWidth
              required
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
          <Box sx={{ mt: 3 }}>
            <Autocomplete
              id="country-select"
              options={countries}
              autoHighlight
              value={selectedCountry}
              onChange={(event, newValue) => {
                if (newValue) setSelectedCountry(newValue);
              }}
              getOptionLabel={(option) => `${option.label} (+${option.phone})`}
              renderOption={(props, option) => (
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
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country"
                  required
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                />
              )}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              label="Place of Residence"
              value={placeOfResidence}
              onChange={(e) => setPlaceOfResidence(e.target.value)}
              fullWidth
              required
            />
          </Box>
        );

      case 2:
        return (
          <Box sx={{ mt: 3 }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              sx={{ mb: 3, width: "100%", height: "100px" }}
            >
              {cvFile ? cvFile.name : "Upload your CV/Resume"}
              <VisuallyHiddenInput type="file" onChange={handleFileChange} />
            </Button>

            <TextField
              label="Message to Hiring Manager"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Social Profiles (Optional)
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                label="LinkedIn"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <LinkedInIcon sx={{ mr: 1, color: "#0077B5" }} />
                  ),
                }}
              />
              <TextField
                label="Website"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <WebsiteIcon sx={{ mr: 1, color: "#666" }} />,
                }}
              />
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ mt: 3 }}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: "#f5f5f5" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Review Your Application
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Personal Information
                  </Typography>
                  <Typography>
                    {firstName} {lastName}
                  </Typography>
                  <Typography>{email}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contact Details
                  </Typography>
                  <Typography>
                    +{selectedCountry.phone} {phoneNumber}
                  </Typography>
                  <Typography>{placeOfResidence}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Attachments
                  </Typography>
                  <Chip
                    label={cvFile?.name || "No CV uploaded"}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 4 }}>
      <IconButton
        onClick={() => navigate(`/job/${jobId}`)}
        sx={{ mb: 2 }}
        aria-label="go back"
      >
        <BackIcon />
      </IconButton>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {jobTitle}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Complete your application
          </Typography>
        </Box>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={activeStep === steps.length - 1 ? handleApply : handleNext}
            disabled={!validateStep() || isSubmitting}
          >
            {isSubmitting ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              "Submit Application"
            ) : (
              "Continue"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

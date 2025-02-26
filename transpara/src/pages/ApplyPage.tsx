import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, addDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Box,
  Typography,
  TextField,
  Button,
  Autocomplete,
} from "@mui/material";
import { isValidFirestoreId } from "../utils/validation";

interface CountryOption {
  code: string;
  label: string;
  phone: string;
  suggested?: boolean;
}

const countries: CountryOption[] = [
  { code: "AD", label: "Andorra", phone: "376" },
  { code: "AE", label: "United Arab Emirates", phone: "971" },
  { code: "AF", label: "Afghanistan", phone: "93" },
  // ... (other countries)
  { code: "US", label: "United States", phone: "1", suggested: true },
  // ... (remaining countries)
];

export const ApplyPage: React.FC = () => {
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
  const [xUrl, setXUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
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

  const handleApply = async () => {
    if (!jobId || !isValidFirestoreId(jobId)) {
      setError("Invalid job ID");
      return;
    }

    let cvUrl = "";
    // If a CV file is selected, upload it to Firebase Storage.
    if (cvFile) {
      try {
        const storage = getStorage();
        const cvRef = ref(storage, `applications/${jobId}/${cvFile.name}`);
        const uploadSnapshot = await uploadBytes(cvRef, cvFile);
        cvUrl = await getDownloadURL(uploadSnapshot.ref);
      } catch (uploadError) {
        console.error("Error uploading CV:", uploadError);
        setError("Failed to upload CV file");
        return;
      }
    }

    // Prepare the application data including the CV URL.
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
      xUrl,
      facebookUrl,
      websiteUrl,
      message,
      cvUrl, // store the download URL
      appliedAt: new Date(),
    };

    try {
      await addDoc(
        collection(db, "jobs", jobId, "applications"),
        applicationData
      );
      alert("Application submitted!");
    } catch (err) {
      console.error(err);
      setError("Failed to submit application");
    }
  };

  return (
    <Box
      sx={{
        p: 4,
        maxWidth: 600,
        mx: "auto",
        mt: 4,
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        backgroundColor: "#fff",
      }}
    >
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Typography variant="h3" sx={{ mb: 3, fontWeight: 500 }}>
            {jobTitle}
          </Typography>

          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Resume/CV
          </Typography>
          <Button
            variant="outlined"
            component="label"
            sx={{
              mb: 3,
              width: "100%",
              textTransform: "none",
              padding: 1.5,
              borderRadius: 1,
            }}
          >
            {cvFile ? cvFile.name : "Upload CV"}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Personal Information
          </Typography>
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm Email Address"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Place of Residence"
            value={placeOfResidence}
            onChange={(e) => setPlaceOfResidence(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Phone Number
          </Typography>
          <Box sx={{ mb: 2 }}>
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
                  {option.label} ({option.code}) +{option.phone}
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Country Code"
                  inputProps={{
                    ...params.inputProps,
                    autoComplete: "new-password",
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <TextField
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
            />
          </Box>

          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Social Profiles
          </Typography>
          <TextField
            label="LinkedIn URL"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="X URL"
            value={xUrl}
            onChange={(e) => setXUrl(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Facebook URL"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Website URL"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
            Message to Hiring Manager
          </Typography>
          <TextField
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            multiline
            rows={4}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            onClick={handleApply}
            sx={{ width: "100%", padding: 1.5, textTransform: "none" }}
          >
            Submit Application
          </Button>
        </>
      )}
    </Box>
  );
};

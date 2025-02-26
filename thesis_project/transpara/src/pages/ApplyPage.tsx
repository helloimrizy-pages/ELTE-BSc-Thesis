import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, addDoc, getDoc } from "firebase/firestore";
import { Box, Typography, TextField, Button } from "@mui/material";
import { isValidFirestoreId } from "../utils/validation";

export const ApplyPage: React.FC = () => {
  const { jobId } = useParams();
  const [jobTitle, setJobTitle] = useState("");
  const [applicantName, setApplicantName] = useState("");
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

  const handleApply = async () => {
    if (!jobId || !isValidFirestoreId(jobId)) {
      setError("Invalid job ID");
      return;
    }
    try {
      await addDoc(collection(db, "jobs", jobId, "applications"), {
        name: applicantName,
        appliedAt: new Date(),
      });
      alert("Application submitted!");
    } catch {
      setError("Failed to submit application");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Typography variant="h5">Apply for: {jobTitle}</Typography>
          <TextField
            label="Your Name"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            fullWidth
          />
          <Button variant="contained" onClick={handleApply}>
            Submit Application
          </Button>
        </>
      )}
    </Box>
  );
};

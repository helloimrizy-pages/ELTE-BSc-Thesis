import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Box,
  Typography,
  Button,
  Container,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  category: string;
  description: string;
  ownerUid: string;
}

export const JobPost: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setError("No job ID provided.");
        setLoading(false);
        return;
      }
      try {
        const jobDoc = await getDoc(doc(db, "jobs", jobId));
        if (jobDoc.exists()) {
          setJob(jobDoc.data() as Job);
        } else {
          setError("Job not found.");
        }
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Failed to fetch job details.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {job?.title}
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {job?.location}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {job?.type} &bull; {job?.category}
          </Typography>
        </Box>
        <Box
          sx={{
            typography: "body1",
            "& p": { mb: 2 },
          }}
          dangerouslySetInnerHTML={{ __html: job?.description || "" }}
        />
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate(`/apply/${jobId}`)}
          >
            Apply Now
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobPost;

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { styled } from "@mui/material/styles";
import {
  Box,
  Typography,
  Button,
  Container,
  Alert,
  Paper,
  Chip,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  useTheme,
  useMediaQuery,
} from "@mui/material";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CategoryIcon from "@mui/icons-material/Category";
import ShareIcon from "@mui/icons-material/Share";
import { Timestamp } from "firebase/firestore";

const JobContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  minHeight: "calc(100vh - 64px)",
  paddingTop: theme.spacing(3),
  paddingBottom: theme.spacing(6),
}));

const JobCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
}));

const JobHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
  position: "relative",
}));

const JobContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const JobDescription = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.02)",
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(3),
  marginTop: theme.spacing(3),
  "& ul": {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  "& ol": {
    paddingLeft: theme.spacing(3),
    marginBottom: theme.spacing(2),
  },
  "& li": {
    marginBottom: theme.spacing(1),
  },
  "& p": {
    marginBottom: theme.spacing(2),
  },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(3),
    "&:first-child": {
      marginTop: 0,
    },
  },
}));

const JobInfoChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 500,
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
  backgroundColor: "rgba(0, 0, 0, 0.04)",
  "& .MuiChip-icon": {
    marginLeft: theme.spacing(0.5),
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 4),
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

const SecondaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1.5, 3),
  textTransform: "none",
  fontWeight: 500,
  boxShadow: "none",
}));

const ActionIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: "rgba(0, 0, 0, 0.04)",
  marginLeft: theme.spacing(1),
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1),
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(0, 0, 0, 0.08)",
  },
}));

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  category: string;
  description: string;
  ownerUid: string;
  createdAt?: Timestamp;
  company?: string;
  salary?: string;
  postedDate?: string;
}

export const PublishedJobPostingPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobDescription, setJobDescription] = useState("");

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
          const jobData = { ...jobDoc.data(), id: jobDoc.id } as Job;
          setJob(jobData);
          setJobDescription(jobData.description || "");
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

  const handleApply = () => {
    navigate(`/apply/${jobId}`);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: job?.title,
          text: `Check out this job: ${job?.title}`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <JobContainer>
        <Container maxWidth="md">
          <Box sx={{ mb: 2 }}>
            <Skeleton variant="text" width={200} height={30} />
          </Box>
          <JobCard>
            <JobHeader>
              <Skeleton variant="text" width="60%" height={40} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", mt: 2 }}>
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={32}
                  sx={{ mr: 1 }}
                />
                <Skeleton
                  variant="rounded"
                  width={100}
                  height={32}
                  sx={{ mr: 1 }}
                />
                <Skeleton variant="rounded" width={100} height={32} />
              </Box>
            </JobHeader>
            <JobContent>
              <Skeleton
                variant="rectangular"
                height={300}
                sx={{ borderRadius: 1.5 }}
              />
              <Box sx={{ mt: 4, textAlign: "center" }}>
                <Skeleton
                  variant="rounded"
                  width={200}
                  height={50}
                  sx={{ mx: "auto" }}
                />
              </Box>
            </JobContent>
          </JobCard>
        </Container>
      </JobContainer>
    );
  }

  if (error) {
    return (
      <JobContainer>
        <Container maxWidth="md" sx={{ pt: 4 }}>
          <Alert
            severity="error"
            variant="filled"
            action={
              <Button color="inherit" onClick={handleGoBack}>
                Go Back
              </Button>
            }
          >
            {error}
          </Alert>
        </Container>
      </JobContainer>
    );
  }

  return (
    <JobContainer>
      <Container maxWidth="md">
        <JobCard>
          <JobHeader>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight="700"
                  gutterBottom
                >
                  {job?.title}
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  {job?.createdAt?.toDate().toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typography>
              </Box>

              {!isMobile && (
                <Box sx={{ display: "flex" }}>
                  <ActionIconButton
                    aria-label="share job"
                    onClick={handleShare}
                  >
                    <ShareIcon />
                  </ActionIconButton>
                </Box>
              )}
            </Box>

            <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap" }}>
              <JobInfoChip icon={<LocationOnIcon />} label={job?.location} />
              <JobInfoChip icon={<BusinessCenterIcon />} label={job?.type} />
              <JobInfoChip icon={<CategoryIcon />} label={job?.category} />
              {job?.salary && <JobInfoChip label={job?.salary} />}
            </Box>
          </JobHeader>

          <JobContent>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Job Description
            </Typography>

            <JobDescription
              dangerouslySetInnerHTML={{ __html: jobDescription }}
            />

            <Divider sx={{ my: 4 }} />

            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <ActionButton
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleApply}
                >
                  Apply Now
                </ActionButton>
              </Grid>
              <Grid item xs={12} sm={6}>
                <SecondaryButton
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={handleShare}
                  startIcon={<ShareIcon />}
                >
                  Share Job
                </SecondaryButton>
              </Grid>
            </Grid>
          </JobContent>
        </JobCard>
      </Container>
    </JobContainer>
  );
};

export default PublishedJobPostingPage;

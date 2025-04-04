import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { NewJobDialog } from "./NewJob";
import { EditJobDialog } from "../Dashboard/EditJobDialog";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Sidebar from "../AppBar/Sidebar";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  category: string;
  description: string;
  ownerUid: string;
}

const Dashboard: React.FC = () => {
  const [openNewJob, setOpenNewJob] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, "jobs"),
      where("ownerUid", "==", auth.currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobList: Job[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Job, "id">),
      }));
      setJobs(jobList);
    });
    return unsubscribe;
  }, []);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setOpenEditDialog(true);
  };

  const handleDeleteJob = async (jobId: string) => {
    if (window.confirm("Are you sure you want to delete this job posting?")) {
      try {
        await deleteDoc(doc(db, "jobs", jobId));
      } catch (error) {
        console.error("Failed to delete job:", error);
        alert("Failed to delete job.");
      }
    }
  };

  const handleCopyLink = (jobId: string) => {
    const link = `${window.location.origin}/job/${jobId}`;
    navigator.clipboard.writeText(link);
    alert("Job link copied to clipboard!");
  };

  const stripHTML = (html: string) => html.replace(/<[^>]+>/g, "");

  const filteredJobs = jobs.filter((job) =>
    `${job.title} ${job.location} ${job.type} ${job.category} ${stripHTML(
      job.description
    )}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      <TransparaAppBar
        onLogout={handleLogout}
        onSearch={(value) => setSearchTerm(value)}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Sidebar />

            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Quick Stats
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Job Postings:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {jobs.length}
                </Typography>
              </Box>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
              >
                <Typography variant="body2" color="text.secondary">
                  Applications:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  14
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  Top Candidate:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  Aisha A.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={9}>
            <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Typography variant="h5">Your Job Postings</Typography>
                <Button
                  variant="contained"
                  onClick={() => setOpenNewJob(true)}
                  sx={{
                    backgroundColor: "black",
                    "&:hover": { backgroundColor: "#333" },
                  }}
                >
                  New Job
                </Button>
              </Box>

              {filteredJobs.length === 0 ? (
                <Box
                  sx={{
                    p: 4,
                    textAlign: "center",
                    bgcolor: "rgba(0,0,0,0.02)",
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ mb: 2 }}>No job postings found.</Typography>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenNewJob(true)}
                  >
                    Create Your First Job
                  </Button>
                </Box>
              ) : (
                <List>
                  {filteredJobs.map((job) => (
                    <ListItem
                      key={job.id}
                      divider
                      disablePadding
                      sx={{
                        mb: 1,
                        border: "1px solid #eee",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <ListItemButton
                        onClick={() => handleJobClick(job)}
                        sx={{ flex: 1 }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" fontWeight="medium">
                              {job.title}
                            </Typography>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {job.location} • {job.type}
                              </Typography>
                              <Box
                                component="span"
                                sx={{
                                  display: "block",
                                  mt: 1,
                                  color: "primary.main",
                                }}
                              >
                                {`${window.location.origin}/job/${job.id}`}
                              </Box>
                            </>
                          }
                        />
                      </ListItemButton>

                      <Box
                        sx={{ display: "flex", alignItems: "center", pr: 1 }}
                      >
                        <IconButton
                          onClick={() => handleCopyLink(job.id)}
                          aria-label="Copy job link"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteJob(job.id)}
                          aria-label="Delete job"
                        >
                          <DeleteIcon fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <NewJobDialog open={openNewJob} onClose={() => setOpenNewJob(false)} />

      {selectedJob && (
        <EditJobDialog
          open={openEditDialog}
          onClose={() => {
            setOpenEditDialog(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
        />
      )}
    </Box>
  );
};

export default Dashboard;

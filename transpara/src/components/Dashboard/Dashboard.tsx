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
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { NewJobDialog } from "./NewJob";
import { EditJobDialog } from "../Dashboard/EditJobDialog";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Sidebar from "../AppBar/Sidebar";

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

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {}
          <Grid item xs={12} md={3}>
            <Sidebar />

            {}
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

          {}
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

              {jobs.length === 0 ? (
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
                  {jobs.map((job) => (
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
                      <ListItemButton onClick={() => handleJobClick(job)}>
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
                                component="span"
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

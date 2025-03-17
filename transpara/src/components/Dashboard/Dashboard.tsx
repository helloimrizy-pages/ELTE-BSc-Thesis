import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Paper,
} from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth, db } from "../../firebase";
import { signOut } from "firebase/auth";
import { NewJobDialog } from "./NewJob";
import { EditJobDialog } from "../Dashboard/EditJobDialog";
import { collection, query, where, onSnapshot } from "firebase/firestore";

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

  // Fetch jobs created by the current user
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
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Dashboard
        </Typography>

        <Paper elevation={3} sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6">Your Job Postings</Typography>
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
          <Divider />
          {jobs.length === 0 ? (
            <Typography sx={{ mt: 2 }}>No job postings found.</Typography>
          ) : (
            <List>
              {jobs.map((job) => (
                <ListItem key={job.id} divider disablePadding>
                  <ListItemButton onClick={() => handleJobClick(job)}>
                    <ListItemText
                      primary={job.title}
                      secondary={`${window.location.origin}/job/${job.id}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>

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

<<<<<<< HEAD
// src/components/Dashboard/Dashboard.tsx
=======
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9
import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
<<<<<<< HEAD
import { NewJobDialog } from "./NewJob"; // <-- We'll create this
=======
import { NewJobDialog } from "./NewJob";
>>>>>>> aec407536805ea8610bf96b876efdd671b37f5d9

const Dashboard: React.FC = () => {
  const [openNewJob, setOpenNewJob] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Dashboard Content
        </Typography>

        {/* Button to open the "New Job" dialog */}
        <Button
          variant="contained"
          onClick={() => setOpenNewJob(true)}
          sx={{
            backgroundColor: "black",
            "&:hover": {
              backgroundColor: "#333",
            },
          }}
        >
          New Job
        </Button>
      </Box>

      {/* Dialog for creating a new job */}
      <NewJobDialog open={openNewJob} onClose={() => setOpenNewJob(false)} />
    </Box>
  );
};

export default Dashboard;

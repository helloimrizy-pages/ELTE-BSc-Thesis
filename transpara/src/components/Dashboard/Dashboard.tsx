import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import Sidebar from "../AppBar/Sidebar";

const Dashboard: React.FC = () => {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} onSearch={() => {}} />
      <Sidebar />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to your Dashboard
        </Typography>
        <Typography>
          You can use this space to show overall analytics, user tips, recent
          activity, etc.
        </Typography>
      </Container>
    </Box>
  );
};

export default Dashboard;

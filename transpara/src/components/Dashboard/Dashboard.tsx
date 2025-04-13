import React, { useState } from "react";
import { Box } from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";
import Sidebar from "../AppBar/Sidebar";

const Dashboard: React.FC = () => {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} onSearch={() => {}} />

      <Box sx={{ mt: 4, mb: 4, px: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            transition: "all 0.3s ease",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: sidebarMinimized ? 80 : 240,
              transition: "width 0.3s ease",
              flexShrink: 0,
            }}
          >
            <Sidebar
              minimized={sidebarMinimized}
              onToggleMinimize={() => setSidebarMinimized(!sidebarMinimized)}
              onLogout={handleLogout}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pr: 2 }}></Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

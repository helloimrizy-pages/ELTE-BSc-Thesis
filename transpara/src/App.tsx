import "./setupGlobal";
import React from "react";
import AuthPage from "./components/Auth/AuthPage";
import Dashboard from "./components/Dashboard/Dashboard";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ApplyPage } from "./pages/ApplyPage";
import JobPost from "./pages/JobPost";
import { AnalyticsPage } from "./components/Analytics/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        {/* Home or Auth */}
        <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />

        {/* Job Posting Page */}
        <Route path="/job/:jobId" element={<JobPost />} />

        {/* Applicant Application Page */}
        <Route path="/apply/:jobId" element={<ApplyPage />} />

        {/* Analytics */}
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Profile and Settings */}
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/" />}
        />
        <Route
          path="/settings"
          element={user ? <SettingsPage /> : <Navigate to="/" />}
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

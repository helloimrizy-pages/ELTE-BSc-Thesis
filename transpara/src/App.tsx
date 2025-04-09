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

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        {/* If user is logged in, go to Dashboard, otherwise show Auth Page */}
        <Route path="/" element={user ? <Dashboard /> : <AuthPage />} />

        {/* Job Posting Page */}
        <Route path="/job/:jobId" element={<JobPost />} />

        {/* Applicant Job Application Page */}
        <Route path="/apply/:jobId" element={<ApplyPage />} />

        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

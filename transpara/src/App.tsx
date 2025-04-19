import "./setupGlobal";
import { useEffect } from "react";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ThemeProvider } from "./context/ThemeContext";

import AuthPage from "./components/Auth/AuthPage";
import Dashboard from "./components/Dashboard/Dashboard";
import JobPostings from "./pages/JobPostingPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { ApplicationPage } from "./pages/ApplicationPage";
import { PublishedJobPostingPage } from "./pages/PublishedJobPostingPage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

// Handle logout with query param ?logout=true
function LogoutHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("logout") === "true") {
      auth.signOut();
    }
  }, [location]);

  return <>{children}</>;
}

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return null;

  return (
    <ThemeProvider>
      <Router>
        <LogoutHandler>
          <Routes>
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" /> : <AuthPage />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <JobPostings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="/apply/:jobId" element={<ApplicationPage />} />
            <Route path="/job/:jobId" element={<PublishedJobPostingPage />} />
            <Route
              path="/profile/:jobId/:candidateId"
              element={<CandidateProfilePage />}
            />
            <Route
              path="/jobs/:jobId/applications/:candidateId"
              element={<CandidateProfilePage />}
            />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </LogoutHandler>
      </Router>
    </ThemeProvider>
  );
}

export default App;

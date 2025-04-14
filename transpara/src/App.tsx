import "./setupGlobal";
import Dashboard from "./components/Dashboard/Dashboard";
import AuthPage from "./components/Auth/AuthPage";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { ApplicationPage } from "./pages/ApplicationPage";
import { PublishedJobPostingPage } from "./pages/PublishedJobPostingPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import CandidateProfilePage from "./pages/CandidateProfilePage";
import SettingsPage from "./pages/SettingsPage";
import JobPostings from "./pages/JobPostingPage";
import { ThemeProvider } from "./context/ThemeContext";
import { useEffect } from "react";

// Navigate to ?logout=true to log out
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
            <Route
              path="/"
              element={user ? <Navigate to="/dashboard" /> : <AuthPage />}
            />
            <Route
              path="/dashboard"
              element={user ? <Dashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/jobs"
              element={user ? <JobPostings /> : <Navigate to="/" />}
            />
            <Route
              path="/analytics"
              element={user ? <AnalyticsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/profile"
              element={user ? <ProfilePage /> : <Navigate to="/" />}
            />
            <Route
              path="/settings"
              element={user ? <SettingsPage /> : <Navigate to="/" />}
            />
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

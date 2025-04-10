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
} from "react-router-dom";

import { ApplicationPage } from "./pages/ApplicationPage";
import { PublishedJobPostingPage } from "./pages/PublishedJobPostingPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import JobPostings from "./pages/JobPostingPage";

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return null;

  return (
    <Router>
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

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;

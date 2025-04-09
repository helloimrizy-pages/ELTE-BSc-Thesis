import "./setupGlobal";
import Dashboard from "./components/Dashboard/Dashboard";
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
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        {/* Home or Auth */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/jobs" element={<JobPostings />} />

        {/* Job Posting Page */}
        <Route path="/job/:jobId" element={<PublishedJobPostingPage />} />

        {/* Applicant Application Page */}
        <Route path="/apply/:jobId" element={<ApplicationPage />} />

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

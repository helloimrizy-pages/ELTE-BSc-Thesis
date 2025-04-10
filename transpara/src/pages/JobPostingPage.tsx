import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Paper,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Avatar,
  Skeleton,
  Tabs,
  Tab,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  alpha,
} from "@mui/material";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import WorkIcon from "@mui/icons-material/Work";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import ShareIcon from "@mui/icons-material/Share";
import LinkIcon from "@mui/icons-material/Link";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";

import { TransparaAppBar } from "../components/AppBar/TransparaAppBar";
import Sidebar from "../components/AppBar/Sidebar";
import { signOut } from "firebase/auth";
import { updateDoc } from "firebase/firestore";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { NewJobDialog } from "../components/Dashboard/NewJob";
import { EditJobDialog } from "../components/Dashboard/EditJobDialog";
import { Snackbar } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  minHeight: "calc(100vh - 64px)",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
}));

const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  height: "100%",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
    transform: "translateY(-2px)",
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  padding: theme.spacing(2.5),
  display: "flex",
  alignItems: "center",
  height: "100%",
}));

const JobCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  overflow: "hidden",
  marginBottom: theme.spacing(3),
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
    transform: "translateY(-2px)",
  },
}));

const JobCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderBottom: `1px solid ${theme.palette.divider}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

const JobCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
}));

const JobCardFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: alpha(theme.palette.primary.main, 0.03),
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1.5),
  padding: theme.spacing(1, 3),
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const JobInfoChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  height: 28,
  fontSize: "0.75rem",
  fontWeight: 500,
  margin: theme.spacing(0, 0.5, 0.5, 0),
  "& .MuiChip-icon": {
    fontSize: "1rem",
    marginLeft: 2,
  },
}));

const IconAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 40,
  height: 40,
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 500,
    minWidth: 100,
  },
}));

interface JobWithStats extends Job {
  views?: number;
  applications?: number;
  createdAt?: Timestamp;
}

interface Job {
  id: string;
  title: string;
  location: string;
  type: string;
  category: string;
  description: string;
  ownerUid: string;
  isOpen?: boolean;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A569BD",
  "#5DADE2",
];

const JobPostingPage: React.FC = () => {
  const theme = useTheme();
  const [openNewJob, setOpenNewJob] = useState(false);
  const [jobs, setJobs] = useState<JobWithStats[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobWithStats | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number;
    totalApplications: number;
    categoryBreakdown: { name: string; value: number }[];
    applicationTimeline: { date: string; applications: number }[];
    locationBreakdown: { name: string; value: number }[];
  }>({
    totalViews: 0,
    totalApplications: 0,
    categoryBreakdown: [],
    applicationTimeline: [],
    locationBreakdown: [],
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuJob, setMenuJob] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [closedJobsCount, setClosedJobsCount] = useState(0);
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleShareJob = (job: Job) => {
    const link = `${window.location.origin}/job/${job.id}`;
    if (navigator.share) {
      navigator
        .share({
          title: job.title,
          text: `Check out this job: ${job.title}`,
          url: link,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(link);
      setSnackbarMessage("Job link copied to clipboard!");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      if (!auth.currentUser) return;

      try {
        setJobsLoading(true);

        const q = query(
          collection(db, "jobs"),
          where("ownerUid", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const jobList: JobWithStats[] = [];
          let totalViews = 0;
          let totalApplications = 0;
          let closedCount = 0;
          const categoryCounts: Record<string, number> = {};
          const locationCounts: Record<string, number> = {};
          const applicationDates: Record<string, number> = {};

          for (const docSnap of snapshot.docs) {
            const jobData = docSnap.data() as Omit<JobWithStats, "id">;
            const jobId = docSnap.id;

            const applicationsQuery = query(
              collection(db, "jobs", jobId, "applications")
            );
            const applicationsSnapshot = await getDocs(applicationsQuery);
            const applicationCount = applicationsSnapshot.size;

            const viewsCount = jobData.views || 0;

            totalViews += viewsCount;
            totalApplications += applicationCount;

            if (jobData.category) {
              categoryCounts[jobData.category] =
                (categoryCounts[jobData.category] || 0) + 1;
            }

            if (jobData.isOpen === false) {
              closedCount += 1;
            }

            if (jobData.location) {
              locationCounts[jobData.location] =
                (locationCounts[jobData.location] || 0) + 1;
            }

            applicationsSnapshot.forEach((appDoc) => {
              const appData = appDoc.data();
              if (appData.appliedAt) {
                const date = new Date(appData.appliedAt.toDate());
                const dateStr = date.toISOString().split("T")[0];
                applicationDates[dateStr] =
                  (applicationDates[dateStr] || 0) + 1;
              }
            });

            jobList.push({
              id: jobId,
              ...jobData,
              applications: applicationCount,
              views: viewsCount,
            });
          }
          const activeCount = jobList.filter((j) => j.isOpen !== false).length;
          setActiveJobsCount(activeCount);
          setClosedJobsCount(closedCount);
          const categoryBreakdown = Object.entries(categoryCounts).map(
            ([name, value]) => ({ name, value })
          );

          const locationBreakdown = Object.entries(locationCounts).map(
            ([name, value]) => ({ name, value })
          );

          const today = new Date();
          const timeline = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            const dateFormatted = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            timeline.push({
              date: dateFormatted,
              applications: applicationDates[dateStr] || 0,
            });
          }

          setJobs(jobList);
          setAnalyticsData({
            totalViews,
            totalApplications,
            categoryBreakdown,
            applicationTimeline: timeline,
            locationBreakdown,
          });
          setJobsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching jobs:", error);
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleDeleteJob = async (jobId: string) => {
    setDeleteDialogOpen(false);
    setJobToDelete(null);

    try {
      await deleteDoc(doc(db, "jobs", jobId));
      setSnackbarMessage("Job deleted successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to delete job:", error);
      setSnackbarMessage("Failed to delete job");
    }
  };

  const handleCopyLink = (jobId: string) => {
    const link = `${window.location.origin}/job/${jobId}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
    setSnackbarMessage("Job link copied to clipboard!");
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    jobId: string
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuJob(jobId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuJob(null);
  };

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditClick = (job: JobWithStats) => {
    setSelectedJob(job);
    setOpenEditDialog(true);
    handleMenuClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderJobCards = () => {
    if (jobsLoading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <JobCard key={i} elevation={0}>
            <JobCardHeader>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </JobCardHeader>
            <JobCardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  sx={{ mr: 1, borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  sx={{ mr: 1, borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={60}
                  height={24}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Skeleton variant="text" width="100%" />
            </JobCardContent>
            <JobCardFooter>
              <Skeleton variant="text" width="40%" />
              <Box>
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  sx={{ display: "inline-block", mr: 1 }}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  sx={{ display: "inline-block" }}
                />
              </Box>
            </JobCardFooter>
          </JobCard>
        ));
    }

    if (jobs.length === 0) {
      return (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <BusinessCenterIcon
            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" gutterBottom>
            No job postings yet
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 400, mx: "auto" }}
          >
            Start creating job postings to attract candidates to your open
            positions.
          </Typography>
          <ActionButton
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewJob(true)}
          >
            Create New Job
          </ActionButton>
        </Box>
      );
    }

    return jobs.map((job) => (
      <JobCard key={job.id} elevation={0}>
        <JobCardHeader>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                width: 40,
                height: 40,
                mr: 2,
              }}
            >
              <WorkIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }} noWrap>
              {job.title}
            </Typography>
          </Box>
          <IconButton onClick={(e) => handleMenuOpen(e, job.id)}>
            <MoreVertIcon />
          </IconButton>
        </JobCardHeader>

        <JobCardContent>
          <Box sx={{ display: "flex", flexWrap: "wrap", mb: 2 }}>
            <JobInfoChip
              icon={<LocationOnIcon />}
              label={job.location}
              size="small"
            />
            <JobInfoChip
              icon={<AccessTimeIcon />}
              label={job.type}
              size="small"
            />
            <JobInfoChip
              icon={<CategoryIcon />}
              label={job.category}
              size="small"
            />
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", mr: 3 }}>
                <Badge
                  badgeContent={job.applications || 0}
                  color="primary"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: 10,
                      height: 16,
                      minWidth: 16,
                    },
                  }}
                >
                  <PersonIcon
                    sx={{ color: "text.secondary", mr: 0.5 }}
                    fontSize="small"
                  />
                </Badge>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  marginLeft={2}
                >
                  Applicants
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary">
              {job.createdAt
                ? new Date(job.createdAt.toDate()).toLocaleDateString()
                : ""}
            </Typography>
          </Box>
        </JobCardContent>

        <JobCardFooter>
          <Button
            variant="text"
            color="primary"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEditClick(job)}
            sx={{ textTransform: "none" }}
          >
            Edit Details
          </Button>

          <Box>
            <Tooltip title="Copy job link">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(job.id);
                }}
                sx={{
                  mr: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <LinkIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Share job">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareJob(job);
                }}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </JobCardFooter>
      </JobCard>
    ));
  };

  const renderJobStats = () => {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <DashboardCard>
            <CardContent sx={{ height: "100%", p: 3 }}>
              <SectionTitle variant="h6">
                <CategoryIcon /> Job Categories
              </SectionTitle>

              <Box sx={{ height: 250, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <DashboardCard>
            <CardContent sx={{ height: "100%", p: 3 }}>
              <SectionTitle variant="h6">
                <TrendingUpIcon /> Application Trends
              </SectionTitle>

              <Box sx={{ height: 250, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.applicationTimeline}
                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar
                      dataKey="applications"
                      fill={theme.palette.primary.main}
                      name="Applications"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </DashboardCard>
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <StatsCard>
                <IconAvatar>
                  <BusinessCenterIcon />
                </IconAvatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4" fontWeight="600">
                    {activeJobsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Jobs
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>

            <Grid item xs={12} sm={4}>
              <StatsCard>
                <IconAvatar>
                  <PersonIcon />
                </IconAvatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4" fontWeight="600">
                    {analyticsData.totalApplications}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Applications
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>

            <Grid item xs={12} sm={4}>
              <StatsCard>
                <IconAvatar>
                  <BusinessCenterIcon />
                </IconAvatar>
                <Box sx={{ ml: 2 }}>
                  <Typography variant="h4" fontWeight="600">
                    {closedJobsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Closed Jobs
                  </Typography>
                </Box>
              </StatsCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <TransparaAppBar onLogout={handleLogout} onSearch={() => {}} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Sidebar />
          </Grid>

          <Grid item xs={12} md={9}>
            <PageContainer>
              <Container maxWidth="lg">
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 4,
                  }}
                >
                  <Box>
                    <Typography variant="h4" fontWeight="700" gutterBottom>
                      Job Postings
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Manage your job listings and track applications
                    </Typography>
                  </Box>

                  <ActionButton
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenNewJob(true)}
                  >
                    Create New Job
                  </ActionButton>
                </Box>

                <StyledTabs
                  value={currentTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab label="Job Listings" />
                  <Tab label="Analytics" />
                </StyledTabs>

                {linkCopied && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Job link copied to clipboard!
                  </Alert>
                )}

                {currentTab === 0 && <Box>{renderJobCards()}</Box>}

                {currentTab === 1 && (
                  <Box>
                    {jobsLoading ? (
                      <Box sx={{ p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : jobs.length === 0 ? (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        Create your first job posting to see analytics data.
                      </Alert>
                    ) : (
                      renderJobStats()
                    )}
                  </Box>
                )}

                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem
                    onClick={() => {
                      const job = jobs.find((j) => j.id === menuJob);
                      if (job) handleEditClick(job);
                    }}
                  >
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
                  </MenuItem>

                  <MenuItem
                    onClick={() => {
                      if (menuJob) handleCopyLink(menuJob);
                      handleMenuClose();
                    }}
                  >
                    <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} /> Copy
                    Link
                  </MenuItem>

                  {(() => {
                    const job = jobs.find((j) => j.id === menuJob);
                    if (!job) return null;

                    const isOpen = job.isOpen ?? true; // fallback to true if undefined

                    return (
                      <MenuItem
                        onClick={async () => {
                          try {
                            await updateDoc(doc(db, "jobs", job.id), {
                              isOpen: !isOpen,
                            });
                            setSnackbarMessage(
                              `Job ${isOpen ? "closed" : "opened"} successfully`
                            );
                            setSnackbarOpen(true);
                          } catch (error) {
                            console.error(
                              "Error updating job open/close status:",
                              error
                            );
                            setSnackbarMessage("Failed to update job status");
                            setSnackbarOpen(true);
                          }
                          handleMenuClose();
                        }}
                      >
                        {isOpen ? (
                          <>
                            <LockIcon fontSize="small" sx={{ mr: 1 }} /> Close
                            Job
                          </>
                        ) : (
                          <>
                            <LockOpenIcon fontSize="small" sx={{ mr: 1 }} />{" "}
                            Open Job
                          </>
                        )}
                      </MenuItem>
                    );
                  })()}

                  <Divider />
                  <MenuItem
                    onClick={() => {
                      if (menuJob) handleDeleteClick(menuJob);
                    }}
                    sx={{ color: "error.main" }}
                  >
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                  </MenuItem>
                </Menu>

                <Dialog
                  open={deleteDialogOpen}
                  onClose={() => setDeleteDialogOpen(false)}
                >
                  <DialogTitle>Delete Job Posting</DialogTitle>
                  <DialogContent>
                    <DialogContentText>
                      Are you sure you want to delete this job posting? This
                      action cannot be undone.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        jobToDelete && handleDeleteJob(jobToDelete)
                      }
                      color="error"
                      variant="contained"
                    >
                      Delete
                    </Button>
                  </DialogActions>
                </Dialog>

                <NewJobDialog
                  open={openNewJob}
                  onClose={() => setOpenNewJob(false)}
                />

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

                <Snackbar
                  open={snackbarOpen}
                  autoHideDuration={3000}
                  onClose={() => setSnackbarOpen(false)}
                  message={snackbarMessage}
                />
              </Container>
            </PageContainer>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default JobPostingPage;

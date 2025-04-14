import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  useTheme,
  alpha,
  styled,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Paper,
} from "@mui/material";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import Sidebar from "../AppBar/Sidebar";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { collectionGroup, getDocs, Timestamp } from "firebase/firestore";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as MUITooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CSVLink } from "react-csv";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import DownloadIcon from "@mui/icons-material/Download";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DescriptionIcon from "@mui/icons-material/Description";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";

const PageContainer = styled(Box)(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.background.default
      : "#fafafa",
  minHeight: "calc(100vh - 64px)",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  borderRadius: theme.spacing(2),
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

const IconAvatar = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.7)
      : theme.palette.primary.main,
  width: 50,
  height: 50,
  borderRadius: 25,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: theme.spacing(2),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  fontWeight: 500,
  textTransform: "capitalize",
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

const FilterSelect = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1.5),
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: theme.palette.background.paper,
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

const STATUS_COLORS: Record<string, string> = {
  applied: "#9e9e9e",
  shortlisted: "#4caf50",
  interviewed: "#2196f3",
  offered: "#ff9800",
  hired: "#673ab7",
  rejected: "#f44336",
};

interface Candidate {
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  appliedAt: Timestamp;
  jobTitle?: string;
  linkedinUrl?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  placeOfResidence?: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    return localStorage.getItem("sidebarMinimized") === "true";
  });
  const [dateFilter, setDateFilter] = useState("30");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
  };

  const enrichedCandidates = candidates.map((c) => ({
    ...c,
    name: `${c.firstName} ${c.lastName}`,
    appliedAtFormatted:
      c.appliedAt instanceof Timestamp
        ? new Date(c.appliedAt.seconds * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
        : "N/A",
    phoneFormatted:
      c.phoneCountryCode && c.phoneNumber
        ? `+${c.phoneCountryCode} ${c.phoneNumber.replace(
            /(\d{3})(\d{3})(\d+)/,
            "$1 $2 $3"
          )}`
        : "N/A",
  }));

  const fetchCandidates = async () => {
    try {
      setRefreshing(true);
      const snapshot = await getDocs(collectionGroup(db, "applications"));
      const list: Candidate[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pathSegments = docSnap.ref.path.split("/");
        const jobId = pathSegments.length > 1 ? pathSegments[1] : null;

        if (data.firstName && data.appliedAt instanceof Timestamp && jobId) {
          list.push({
            id: docSnap.id,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email || "",
            status: data.status || "applied",
            appliedAt: data.appliedAt,
            jobTitle: data.jobTitle || "",
            linkedinUrl: data.linkedinUrl || "",
            phoneCountryCode: data.phoneCountryCode || "",
            phoneNumber: data.phoneNumber || "",
            placeOfResidence: data.placeOfResidence || "",
            jobId,
          });
        }
      });

      list.sort((a, b) => b.appliedAt.seconds - a.appliedAt.seconds);
      const validCandidates = list.filter(
        (c) => c && c.appliedAt instanceof Timestamp
      );
      setCandidates(validCandidates);
    } catch (err) {
      console.error("Error loading candidates:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const refreshData = () => {
    fetchCandidates();
  };

  const applied = candidates.filter(
    (c) => c.status === "applied" || !c.status
  ).length;
  const shortlisted = candidates.filter(
    (c) => c.status === "shortlisted"
  ).length;
  const hired = candidates.filter((c) => c.status === "hired").length;
  const offered = candidates.filter((c) => c.status === "offered").length;
  const interviewed = candidates.filter(
    (c) => c.status === "interviewed"
  ).length;
  const rejected = candidates.filter((c) => c.status === "rejected").length;

  const filteredCandidates = enrichedCandidates.filter((c) => {
    const searchableText =
      `${c.firstName} ${c.lastName} ${c.email} ${c.jobTitle} ${c.placeOfResidence}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const prepareTimelineData = () => {
    const dateMap = new Map<string, { date: string; applications: number }>();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(dateFilter));

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      dateMap.set(dateStr, { date: dateStr, applications: 0 });
    }

    filteredCandidates.forEach((candidate) => {
      const dateStr = new Date(
        candidate.appliedAt.seconds * 1000
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (dateMap.has(dateStr)) {
        const current = dateMap.get(dateStr);
        if (current) {
          dateMap.set(dateStr, {
            ...current,
            applications: current.applications + 1,
          });
        }
      }
    });

    return Array.from(dateMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.date + ", " + new Date().getFullYear());
        const dateB = new Date(b.date + ", " + new Date().getFullYear());
        return dateA.getTime() - dateB.getTime();
      })
      .map((item) => ({
        ...item,
        displayApplications: item.applications > 0 ? item.applications : null,
      }));
  };

  const lineChartData = prepareTimelineData();

  const statusData = [
    { name: "Applied", value: applied },
    { name: "Shortlisted", value: shortlisted },
    { name: "Interviewed", value: interviewed },
    { name: "Offered", value: offered },
    { name: "Hired", value: hired },
    { name: "Rejected", value: rejected },
  ].filter((item) => item.value > 0);

  const columns: GridColDef[] = [
    {
      field: "name",
      headerName: "Candidate Name",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "jobTitle",
      headerName: "Position",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
      minWidth: 220,
    },
    {
      field: "phoneFormatted",
      headerName: "Phone",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "placeOfResidence",
      headerName: "Location",
      flex: 1,
      minWidth: 180,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        const status = (params.value as string) || "applied";
        const color = STATUS_COLORS[status] || STATUS_COLORS.applied;

        return (
          <StyledChip
            label={status}
            size="small"
            sx={{
              backgroundColor: alpha(color, 0.1),
              color: color,
              border: `1px solid ${alpha(color, 0.3)}`,
            }}
          />
        );
      },
    },
    {
      field: "appliedAtFormatted",
      headerName: "Applied Date",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "linkedinUrl",
      headerName: "LinkedIn",
      width: 120,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const linkedinUrl = params.row?.linkedinUrl;
        return linkedinUrl ? (
          <IconButton
            size="small"
            component="a"
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "#0A66C2" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </IconButton>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              width: "100%",
              alignContent: "center",
              height: "100%",
            }}
          >
            N/A
          </Typography>
        );
      },
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={50} />
        <Typography variant="h6" color="text.secondary">
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <TransparaAppBar
        onLogout={handleLogout}
        onSearch={(value) => setSearchTerm(value)}
      />

      <Box sx={{ mt: 4, mb: 4, px: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
          <Box
            sx={{
              width: sidebarMinimized ? 80 : 240,
              transition: "width 0.3s ease",
              flexShrink: 0,
            }}
          >
            <Sidebar
              minimized={sidebarMinimized}
              onToggleMinimize={() =>
                setSidebarMinimized((prev) => {
                  localStorage.setItem("sidebarMinimized", String(!prev));
                  return !prev;
                })
              }
              onLogout={handleLogout}
            />
          </Box>

          <Box sx={{ flexGrow: 1, pr: 2 }}>
            <PageContainer>
              <Box sx={{ px: 4 }}>
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
                      Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Track your recruitment metrics and candidate pipeline
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Tooltip title="Refresh Data">
                      <IconButton
                        onClick={refreshData}
                        sx={{
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.2),
                          },
                        }}
                        disabled={refreshing}
                      >
                        {refreshing ? (
                          <CircularProgress size={24} color="primary" />
                        ) : (
                          <RefreshIcon />
                        )}
                      </IconButton>
                    </Tooltip>

                    <FilterSelect
                      select
                      label="Date Range"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      size="small"
                      sx={{ width: "100%" }}
                      InputProps={{
                        startAdornment: (
                          <CalendarTodayIcon
                            sx={{
                              mr: 1,
                              color: "text.secondary",
                              fontSize: 20,
                            }}
                          />
                        ),
                      }}
                    >
                      {[7, 14, 30, 60, 90].map((d) => (
                        <MenuItem key={d} value={d.toString()}>
                          Last {d} days
                        </MenuItem>
                      ))}
                    </FilterSelect>
                  </Box>
                </Box>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <IconAvatar>
                        <PeopleAltIcon fontSize="large" />
                      </IconAvatar>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {candidates.length}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Candidates
                        </Typography>
                      </Box>
                    </StatsCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <IconAvatar
                        sx={{
                          bgcolor: alpha(STATUS_COLORS.shortlisted, 0.1),
                          color: STATUS_COLORS.shortlisted,
                        }}
                      >
                        <PersonSearchIcon fontSize="large" />
                      </IconAvatar>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {shortlisted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Shortlisted
                        </Typography>
                      </Box>
                    </StatsCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <IconAvatar
                        sx={{
                          bgcolor: alpha(STATUS_COLORS.offered, 0.1),
                          color: STATUS_COLORS.offered,
                        }}
                      >
                        <ThumbUpIcon fontSize="large" />
                      </IconAvatar>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {offered}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Offers Extended
                        </Typography>
                      </Box>
                    </StatsCard>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard>
                      <IconAvatar
                        sx={{
                          bgcolor: alpha(STATUS_COLORS.hired, 0.1),
                          color: STATUS_COLORS.hired,
                        }}
                      >
                        <CheckCircleIcon fontSize="large" />
                      </IconAvatar>
                      <Box>
                        <Typography variant="h4" fontWeight="600">
                          {hired}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hired
                        </Typography>
                      </Box>
                    </StatsCard>
                  </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid item xs={12} md={8}>
                    <DashboardCard>
                      <CardContent sx={{ p: 3 }}>
                        <SectionTitle variant="h6">
                          <TrendingUpIcon /> Application Trends
                        </SectionTitle>
                        {lineChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                              data={lineChartData}
                              margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={{
                                  stroke: alpha(
                                    theme.palette.text.primary,
                                    0.2
                                  ),
                                }}
                                interval="preserveStartEnd"
                                tickFormatter={(value, index) => {
                                  if (parseInt(dateFilter) <= 14) {
                                    const totalDataPoints =
                                      lineChartData.length;
                                    if (
                                      index === 0 ||
                                      index === totalDataPoints - 1 ||
                                      index === Math.floor(totalDataPoints / 2)
                                    ) {
                                      return value;
                                    }
                                    return "";
                                  }

                                  if (parseInt(dateFilter) <= 30) {
                                    if (
                                      index % 5 === 0 ||
                                      index === lineChartData.length - 1
                                    ) {
                                      return value;
                                    }
                                    return "";
                                  }

                                  if (
                                    index % 10 === 0 ||
                                    index === lineChartData.length - 1
                                  ) {
                                    return value;
                                  }
                                  return "";
                                }}
                              />
                              <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={{
                                  stroke: alpha(
                                    theme.palette.text.primary,
                                    0.2
                                  ),
                                }}
                              />
                              <MUITooltip
                                formatter={(value: number) => [
                                  `${value} Applications`,
                                  "Applications",
                                ]}
                                contentStyle={{
                                  borderRadius: 8,
                                  border: "none",
                                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                                  backgroundColor:
                                    theme.palette.background.paper,
                                }}
                              />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="applications"
                                name="Applications"
                                stroke={theme.palette.primary.main}
                                strokeWidth={3}
                                connectNulls={true}
                                dot={false}
                                activeDot={{
                                  r: 6,
                                  fill: theme.palette.primary.main,
                                  stroke: theme.palette.background.paper,
                                  strokeWidth: 2,
                                }}
                              />

                              <Line
                                type="monotone"
                                dataKey="displayApplications"
                                stroke="none"
                                dot={{
                                  r: 4,
                                  fill: theme.palette.background.paper,
                                  stroke: theme.palette.primary.main,
                                  strokeWidth: 3,
                                }}
                                activeDot={false}
                                legendType="none"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box
                            sx={{
                              height: 300,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                              bgcolor: alpha(
                                theme.palette.background.default,
                                0.5
                              ),
                              borderRadius: 2,
                            }}
                          >
                            <CalendarTodayIcon
                              sx={{
                                fontSize: 40,
                                color: "text.disabled",
                                mb: 2,
                              }}
                            />
                            <Typography variant="body1" color="text.secondary">
                              No application data available for the selected
                              time period.
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <DashboardCard>
                      <CardContent sx={{ p: 3 }}>
                        <SectionTitle variant="h6">
                          <PersonAddIcon /> Candidate Status
                        </SectionTitle>
                        {statusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={1}
                                dataKey="value"
                                label={({ name, percent }) =>
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                              >
                                {statusData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      Object.values(STATUS_COLORS)[
                                        index %
                                          Object.values(STATUS_COLORS).length
                                      ]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Legend />
                              <MUITooltip
                                formatter={(value: number, name: string) => [
                                  `${value} Candidates`,
                                  name,
                                ]}
                                contentStyle={{
                                  borderRadius: 8,
                                  border: "none",
                                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                                  backgroundColor:
                                    theme.palette.background.paper,
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <Box
                            sx={{
                              height: 300,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "column",
                              bgcolor: alpha(
                                theme.palette.background.default,
                                0.5
                              ),
                              borderRadius: 2,
                            }}
                          >
                            <PeopleAltIcon
                              sx={{
                                fontSize: 40,
                                color: "text.disabled",
                                mb: 2,
                              }}
                            />
                            <Typography variant="body1" color="text.secondary">
                              No candidates available to display status
                              distribution.
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </DashboardCard>
                  </Grid>
                </Grid>

                <DashboardCard>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                      }}
                    >
                      <SectionTitle variant="h6" sx={{ mb: 0 }}>
                        <DescriptionIcon /> Candidate Details
                      </SectionTitle>

                      <CSVLink
                        headers={[
                          { label: "Candidate ID", key: "id" },
                          { label: "Job ID", key: "jobId" },
                          { label: "Full Name", key: "name" },
                          { label: "Email", key: "email" },
                          { label: "Phone Number", key: "phone" },
                          { label: "Location", key: "location" },
                          { label: "Job Title", key: "jobTitle" },
                          { label: "Application Status", key: "status" },
                          { label: "Applied At", key: "appliedAt" },
                        ]}
                        data={enrichedCandidates.map((c) => ({
                          id: c.id,
                          jobId: c.jobId,
                          name: `${c.firstName} ${c.lastName}`,
                          email: c.email,
                          phone: c.phoneFormatted,
                          location: c.placeOfResidence || "N/A",
                          jobTitle: c.jobTitle || "N/A",
                          status: c.status || "applied",
                          appliedAt:
                            c.appliedAt instanceof Timestamp
                              ? new Date(
                                  c.appliedAt.seconds * 1000
                                ).toLocaleDateString()
                              : "N/A",
                        }))}
                        filename={`candidates_export_${
                          new Date().toISOString().split("T")[0]
                        }.csv`}
                        style={{ textDecoration: "none" }}
                      >
                        <ActionButton
                          variant="outlined"
                          color="primary"
                          startIcon={<DownloadIcon />}
                        >
                          Export to CSV
                        </ActionButton>
                      </CSVLink>
                    </Box>

                    <Paper
                      elevation={0}
                      sx={{
                        height: 500,
                        width: "100%",
                        borderRadius: theme.spacing(2),
                        overflow: "hidden",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <DataGrid
                        rows={filteredCandidates}
                        columns={columns}
                        localeText={{
                          noRowsLabel: searchTerm
                            ? "No matching candidates found"
                            : "No candidates available",
                        }}
                        getRowId={(row) => row.id}
                        onRowClick={(params) => {
                          const candidateId = params.row.id;
                          const jobId = params.row.jobId;
                          navigate(
                            `/jobs/${jobId}/applications/${candidateId}`
                          );
                        }}
                        pageSizeOptions={[10, 25, 50, 100]}
                        initialState={{
                          pagination: {
                            paginationModel: { pageSize: 10, page: 0 },
                          },
                          sorting: {
                            sortModel: [{ field: "appliedAt", sort: "desc" }],
                          },
                        }}
                        disableRowSelectionOnClick
                        sx={{
                          border: "none",
                          "& .MuiDataGrid-cell:focus": {
                            outline: "none",
                          },
                          "& .MuiDataGrid-columnHeaders": {
                            backgroundColor: alpha(
                              theme.palette.primary.main,
                              0.05
                            ),
                            borderBottom: "none",
                          },
                          "& .MuiDataGrid-virtualScroller": {
                            backgroundColor: theme.palette.background.paper,
                          },
                          cursor: "pointer",
                        }}
                      />
                    </Paper>
                  </CardContent>
                </DashboardCard>
              </Box>
            </PageContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

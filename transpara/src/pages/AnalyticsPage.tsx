import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  Alert,
  Skeleton,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Stack,
  Rating,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts";
import axios from "axios";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../firebase";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";
import { TransparaAppBar } from "../components/AppBar/AppBar";
import Sidebar from "../components/AppBar/Sidebar";
import { signOut } from "firebase/auth";
import { ShapFeature } from "../pages/ShapFeature";

import PersonIcon from "@mui/icons-material/Person";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BarChartIcon from "@mui/icons-material/BarChart";
import PieChartIcon from "@mui/icons-material/PieChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import InfoIcon from "@mui/icons-material/Info";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SkillsIcon from "@mui/icons-material/Psychology";
import EducationIcon from "@mui/icons-material/School";
import ExperienceIcon from "@mui/icons-material/WorkHistory";
import CompareIcon from "@mui/icons-material/Compare";
import DescriptionIcon from "@mui/icons-material/Description";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  ChartLegend
);

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

const AnalyticsCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  height: "100%",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
    transform: "translateY(-2px)",
  },
}));

const CardTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  "& svg": {
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

const MetricCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  padding: theme.spacing(2.5),
  display: "flex",
  alignItems: "center",
  height: "100%",
}));

const IconAvatar = styled(Avatar)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  width: 48,
  height: 48,
}));

const CandidateCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  marginBottom: theme.spacing(3),
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  overflow: "visible",
  "&:hover": {
    boxShadow: "0 6px 25px rgba(0, 0, 0, 0.1)",
    transform: "translateY(-2px)",
  },
}));

const ScoreChip = styled(Chip)<{ level: "high" | "medium" | "low" }>(
  ({ theme, level }) => {
    const getColor = () => {
      switch (level) {
        case "high":
          return { bg: "#e6f7ed", text: "#2e7d32" };
        case "medium":
          return { bg: "#fff8e6", text: "#ed6c02" };
        case "low":
          return { bg: "#feeceb", text: "#d32f2f" };
        default:
          return { bg: "#e6f7ed", text: "#2e7d32" };
      }
    };

    const { bg, text } = getColor();

    return {
      backgroundColor: bg,
      color: text,
      fontWeight: 600,
      borderRadius: theme.spacing(1),
      "& .MuiChip-label": {
        padding: "0 10px",
      },
    };
  }
);
interface ShapContributor {
  feature: string;
  impact: number;
  value: number;
  positive: boolean;
}

interface ShapEntry {
  id: string;
  candidate_file: string;
  base_value: number;
  prediction: number;
  contributors: ShapContributor[];
}

interface ShapExplanationReport {
  analysis_id: string;
  shap: ShapEntry[];
}

interface ChatGPTExplanation {
  job_position: string;
  similarity: {
    score: number;
    max_score: number;
    comment: string;
  };
  shap_analysis: {
    positive_contributors: {
      feature: string;
      impact: string;
      comment: string;
    }[];
    negative_contributors: {
      feature: string;
      impact: string;
      comment: string;
    }[];
  };
  direct_observations: {
    skills: string[];
    experience: string[];
    education: string;
    comment: string;
  };
  notable_gaps_and_missing_requirements: string;
  gender_bias: {
    score: number;
    max_score: number;
    comment: string;
  };
  conclusion: string;
}

interface Explanation {
  candidate_file: string;
  similarity_score: number;
  bias_score: number;
  rank: number;
  id: string;
  chatgpt_explanation?: ChatGPTExplanation;
}

interface Job {
  id: string;
  title: string;
}

interface BiasSummary {
  average_bias: number;
  min_bias: number;
  max_bias: number;
  median_bias: number;
  most_neutral_candidate: string;
  least_neutral_candidate: string;
}

interface RankingEntry {
  id: string;
  candidate_file: string;
  score: number;
  rank: number;
}

interface RankingResults {
  analysis_id: string;
  ranking: RankingEntry[];
}

interface BiasEntry {
  id: string;
  candidate_file: string;
  gender_bias_score: number;
  male_terms: string | Record<string, number>;
  female_terms: string | Record<string, number>;
  recommendation: string;
}

interface BiasReport {
  analysis_id: string;
  title: string;
  understanding: {
    description: string;
    calculation: string;
  };
  candidate_analysis: BiasEntry[];
  recommendations: string[];
  summary: BiasSummary;
}

interface ChatGptResponse {
  explanations: Explanation[];
}

interface CandidateTextsResponse {
  analysis_id: string;
  texts: CandidateTextEntry[];
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

interface CandidateTextEntry {
  id: string;
  candidate_file: string;
  extracted_text: string;
}

interface CandidateTextsResponse {
  analysis_id: string;
  texts: CandidateTextEntry[];
}

export const AnalyticsPage = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Explanation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [candidateTexts, setCandidateTexts] = useState<CandidateTextsResponse>({
    analysis_id: "",
    texts: [],
  });
  const [noNewCandidates, setNoNewCandidates] = useState(false);
  const [biasSummary, setBiasSummary] = useState<BiasSummary | null>(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(() => {
    return localStorage.getItem("sidebarMinimized") === "true";
  });
  const navigate = useNavigate();
  const [selectedShapCandidateId, setSelectedShapCandidateId] = useState<
    string | null
  >(null);
  const shapData = useRef<ShapEntry[]>([]);

  const getShapDataForCandidate = (candidateId: string) => {
    const found = shapData.current.find((entry) => entry.id === candidateId);
    console.log("🔍 Looking for SHAP candidateId:", candidateId);
    console.log("🔍 Found entry:", found);
    return found;
  };

  const handleLogout = async () => {
    localStorage.removeItem("selectedJobId");
    await signOut(auth);
  };

  const fetchJobs = async () => {
    if (!auth.currentUser) return;

    try {
      const q = query(
        collection(db, "jobs"),
        where("ownerUid", "==", auth.currentUser.uid)
      );
      const snapshot = await getDocs(q);

      const jobList: Job[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      }));

      setJobs(jobList);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAnalysisFromFirebase = async (jobId: string) => {
    const storage = getStorage();
    const basePath = `reports/${jobId}`;

    const files = {
      ranking_result: "ranking_results.json",
      chatgpt_explanations: "chatgpt_explanations.json",
      gender_bias_report: "gender_bias_analysis.json",
      candidate_texts: "candidate_texts.json",
      shap_explanation: "shap_explanations.json",
      job_desc_keywords: "keywords.json",
    };

    try {
      const urls = await Promise.all(
        Object.values(files).map((file) =>
          getDownloadURL(ref(storage, `${basePath}/${file}`))
        )
      );
      const [rankingJson, chatgptJson, biasJson, textJson, shapJson] =
        (await Promise.all(
          urls.map((url) => fetch(url).then((r) => r.json()))
        )) as [
          RankingResults,
          ChatGptResponse,
          BiasReport,
          CandidateTextsResponse,
          ShapExplanationReport
        ];

      shapData.current = Array.isArray(shapJson.shap)
        ? shapJson.shap
        : Object.values(shapJson.shap || {});

      console.log("✅ SHAP entries:", shapData.current);

      const rankingMap: Record<string, RankingEntry> =
        rankingJson.ranking.reduce((acc, entry) => {
          acc[entry.id] = entry;
          return acc;
        }, {} as Record<string, RankingEntry>);

      const biasMap: Record<string, BiasEntry> =
        biasJson.candidate_analysis.reduce((acc, entry) => {
          acc[entry.id] = entry;
          return acc;
        }, {} as Record<string, BiasEntry>);

      const combined: Explanation[] = Object.values(rankingMap).map((r) => ({
        id: r.id,
        candidate_file: r.candidate_file,
        similarity_score: r.score,
        bias_score: biasMap[r.id]?.gender_bias_score ?? 0,
        rank: r.rank,
        chatgpt_explanation: chatgptJson.explanations?.find(
          (c) => c.id === r.id
        )?.chatgpt_explanation,
      }));

      setData(combined);
      setBiasSummary(biasJson.summary || null);
      setCandidateTexts(textJson || { analysis_id: "", texts: [] });

      return true;
    } catch (err) {
      console.warn("Some reports not found, running analysis...", err);
      return false;
    }
  };

  const fetchAnalysis = async () => {
    if (!selectedJobId) return;
    try {
      setLoading(true);

      const analysisExists = await fetchAnalysisFromFirebase(selectedJobId);

      const jobRef = collection(db, "jobs", selectedJobId, "applications");
      const snapshot = await getDocs(jobRef);
      const actualApplicants = snapshot.size;

      const metadataRef = collection(
        db,
        "jobs",
        selectedJobId,
        "analysis_metadata"
      );
      const metadataSnapshot = await getDocs(metadataRef);
      let expectedApplicants = 0;

      metadataSnapshot.forEach((doc) => {
        if (doc.id === "summary") {
          expectedApplicants = doc.data().numApplicants || 0;
        }
      });

      const needsUpdate = actualApplicants !== expectedApplicants;

      if (!analysisExists || needsUpdate) {
        console.log(
          "Running backend analysis due to new applicants or missing reports."
        );
        const res = await axios.post("/api/analyze-candidates", {
          jobId: selectedJobId,
        });

        const chatgpt = res.data?.chatgpt_explanations?.explanations || [];
        const bias = res.data?.gender_bias_report?.summary || null;
        const texts = res.data?.candidate_texts || {
          analysis_id: "",
          texts: [],
        };

        setData(chatgpt);
        setBiasSummary(bias);
        setCandidateTexts(texts);
      } else {
        console.log("Using cached analysis from Firebase Storage.");
      }
    } catch (err) {
      console.error("Error during analysis:", err);
      alert("Failed to fetch or generate analysis.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter((candidate) =>
    candidate.candidate_file.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topCandidates = filteredData.filter(
    (candidate) => candidate.chatgpt_explanation
  );

  useEffect(() => {
    const init = async () => {
      await fetchJobs();

      const savedJobId = localStorage.getItem("selectedJobId");
      if (savedJobId && jobs.some((job) => job.id === savedJobId)) {
        setSelectedJobId(savedJobId);
      } else {
        setSelectedJobId("");
        localStorage.removeItem("selectedJobId");
      }
    };

    init();
  }, []);

  useEffect(() => {
    const checkAndLoadCachedAnalysis = async () => {
      if (!selectedJobId) return;
      setLoading(true);

      const analysisExists = await fetchAnalysisFromFirebase(selectedJobId);

      if (analysisExists) {
        const jobRef = collection(db, "jobs", selectedJobId, "applications");
        const snapshot = await getDocs(jobRef);
        const actualApplicants = snapshot.size;

        const metadataRef = collection(
          db,
          "jobs",
          selectedJobId,
          "analysis_metadata"
        );
        const metadataSnapshot = await getDocs(metadataRef);
        let expectedApplicants = 0;

        metadataSnapshot.forEach((doc) => {
          if (doc.id === "summary") {
            expectedApplicants = doc.data().numApplicants || 0;
          }
        });

        const needsUpdate = actualApplicants !== expectedApplicants;
        setNoNewCandidates(!needsUpdate);
      } else {
        setNoNewCandidates(false);
      }

      setLoading(false);
    };

    checkAndLoadCachedAnalysis();
  }, [selectedJobId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getBiasLevelColor = (biasScore: number) => {
    if (biasScore < 1) return "high";
    if (biasScore < 3) return "medium";
    return "low";
  };

  const getSimilarityLevelColor = (score: number) => {
    if (score >= 0.7) return "high";
    if (score >= 0.4) return "medium";
    return "low";
  };

  const getSkillsFromCandidates = () => {
    const allSkills = new Set<string>();
    data.forEach((candidate) => {
      if (candidate.chatgpt_explanation?.direct_observations?.skills) {
        candidate.chatgpt_explanation.direct_observations.skills.forEach(
          (skill) => {
            allSkills.add(skill.toLowerCase());
          }
        );
      }
    });
    return Array.from(allSkills);
  };

  const renderSkillsRadarChart = () => {
    if (
      !candidateTexts ||
      !candidateTexts.texts ||
      candidateTexts.texts.length === 0
    )
      return null;

    const candidateMapping: Record<string, string> =
      candidateTexts.texts.reduce(
        (acc: Record<string, string>, entry: CandidateTextEntry) => {
          acc[entry.id] = entry.extracted_text.toLowerCase();
          return acc;
        },
        {}
      );

    const candidateIds = data.map((c) => c.id);
    const skillList = getSkillsFromCandidates();

    const skillCounts: Record<string, Record<string, number>> = {};

    candidateIds.forEach((id) => {
      const text = candidateMapping[id] || "";
      skillCounts[id] = {};
      skillList.forEach((skill) => {
        const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, "g");
        const count = (text.match(regex) || []).length;
        skillCounts[id][skill] = count;
      });
    });

    const totalSkillFreq: Record<string, number> = {};
    skillList.forEach((skill) => {
      totalSkillFreq[skill] = candidateIds.reduce(
        (sum, id) => sum + (skillCounts[id]?.[skill] || 0),
        0
      );
    });

    const topSkills = Object.entries(totalSkillFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill]) => skill);

    const radarData = topSkills.map((skill) => {
      const entry: Record<string, number | string> = { skill };
      let maxVal = Math.max(
        ...candidateIds.map((id) => skillCounts[id]?.[skill] || 0)
      );
      if (maxVal === 0) maxVal = 1;

      data.forEach((candidate) => {
        entry[candidate.id] =
          (skillCounts[candidate.id]?.[skill] || 0) / maxVal;
      });

      return entry;
    });

    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart outerRadius={150} width={500} height={400} data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill" />
          <PolarRadiusAxis angle={30} domain={[0, 1]} />
          {data.slice(0, 4).map((candidate, i) => (
            <Radar
              key={candidate.id}
              name={candidate.candidate_file}
              dataKey={candidate.id}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderCandidateCards = (dataToRender: Explanation[]) => {
    if (loading) {
      return Array(3)
        .fill(0)
        .map((_, i) => (
          <CandidateCard key={i}>
            <CardHeader
              avatar={<Skeleton variant="circular" width={40} height={40} />}
              title={<Skeleton variant="text" width="60%" />}
              subheader={<Skeleton variant="text" width="40%" />}
              action={<Skeleton variant="circular" width={30} height={30} />}
            />
            <Divider />
            <CardContent>
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Skeleton variant="rectangular" width="45%" height={20} />
                <Skeleton variant="rectangular" width="45%" height={20} />
              </Box>
              <Skeleton variant="rectangular" height={100} />
            </CardContent>
          </CandidateCard>
        ));
    }

    if (dataToRender.length === 0) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2, mb: 3 }}>
          No analyzed candidates found. Run analysis and check top results.
        </Alert>
      );
    }

    return dataToRender.map((candidate, idx) => (
      <CandidateCard key={candidate.candidate_file}>
        <CardHeader
          avatar={
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              {candidate.rank || idx + 1}
            </Avatar>
          }
          title={
            <Typography variant="subtitle1" fontWeight={600}>
              {candidate.candidate_file}
            </Typography>
          }
          subheader={candidate.chatgpt_explanation?.job_position || "Candidate"}
          action={
            <Tooltip title="View details">
              <IconButton
                size="small"
                sx={{ borderRadius: 1.5, textTransform: "none" }}
                onClick={() =>
                  navigate(`/profile/${selectedJobId}/${candidate.id}`)
                }
              >
                <ArrowForwardIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Match Score
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <ScoreChip
                  label={`${(candidate.similarity_score * 100).toFixed(0)}%`}
                  level={getSimilarityLevelColor(candidate.similarity_score)}
                  size="small"
                />
                <Rating
                  value={candidate.similarity_score * 5}
                  precision={0.5}
                  readOnly
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Bias Score
              </Typography>
              <ScoreChip
                label={candidate.bias_score.toFixed(1)}
                level={getBiasLevelColor(candidate.bias_score)}
                size="small"
              />
            </Grid>
          </Grid>
        </CardContent>
      </CandidateCard>
    ));
  };

  const renderAnalyticsOverview = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton
              variant="rectangular"
              height={400}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton
              variant="rectangular"
              height={400}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      );
    }

    if (!biasSummary || filteredData.length === 0) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No analytics data available. Please run analysis to view insights.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {}
        <Grid item xs={12} md={4}>
          <MetricCard>
            <IconAvatar>
              <PersonIcon />
            </IconAvatar>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h4" fontWeight="600">
                {filteredData.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Candidates
              </Typography>
            </Box>
          </MetricCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <MetricCard>
            <IconAvatar>
              <SkillsIcon />
            </IconAvatar>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h4" fontWeight="600">
                {getSkillsFromCandidates().length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Unique Skills
              </Typography>
            </Box>
          </MetricCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <MetricCard>
            <IconAvatar>
              <AssessmentIcon />
            </IconAvatar>
            <Box sx={{ ml: 2 }}>
              <Typography variant="h4" fontWeight="600">
                {biasSummary.average_bias.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Bias Score
              </Typography>
            </Box>
          </MetricCard>
        </Grid>

        {}
        <Grid item xs={12} md={6}>
          <AnalyticsCard>
            <CardContent sx={{ p: 3 }}>
              <CardTitle variant="h6">
                <BarChartIcon /> Top Candidates by Match Score
              </CardTitle>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredData
                      .sort((a, b) => b.similarity_score - a.similarity_score)
                      .slice(0, 8)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="candidate_file"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                      tickFormatter={(value) =>
                        value.length > 15
                          ? `${value.substring(0, 15)}...`
                          : value
                      }
                    />
                    <YAxis
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [
                        `${(value * 100).toFixed(1)}%`,
                        "Match Score",
                      ]}
                    />
                    <Bar
                      dataKey="similarity_score"
                      fill={theme.palette.primary.main}
                      name="Match Score"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </AnalyticsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <AnalyticsCard>
            <CardContent sx={{ p: 3 }}>
              <CardTitle variant="h6">
                <PieChartIcon /> Gender Bias Distribution
              </CardTitle>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Low Bias (0-1)",
                          value: filteredData.filter((c) => c.bias_score < 1)
                            .length,
                        },
                        {
                          name: "Medium Bias (1-3)",
                          value: filteredData.filter(
                            (c) => c.bias_score >= 1 && c.bias_score < 3
                          ).length,
                        },
                        {
                          name: "High Bias (3+)",
                          value: filteredData.filter((c) => c.bias_score >= 3)
                            .length,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            index === 0
                              ? "#6A80B9"
                              : index === 1
                              ? "#6A80B9"
                              : "#F6C794"
                          }
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </AnalyticsCard>
        </Grid>

        <Grid item xs={12}>
          <AnalyticsCard>
            <CardContent sx={{ p: 3 }}>
              <CardTitle variant="h6">
                <CompareIcon /> Candidate Skill Comparison
              </CardTitle>
              {renderSkillsRadarChart()}
            </CardContent>
          </AnalyticsCard>
        </Grid>

        <Grid item xs={12}>
          <AnalyticsCard>
            <CardContent sx={{ p: 3 }}>
              <ShapFeature
                data={filteredData}
                loading={loading}
                selectedShapCandidateId={selectedShapCandidateId}
                onCandidateSelect={setSelectedShapCandidateId}
                getShapDataForCandidate={getShapDataForCandidate}
              />
            </CardContent>
          </AnalyticsCard>
        </Grid>

        {filteredData.length > 0 && biasSummary && (
          <Grid item xs={12}>
            <AnalyticsCard>
              <CardContent sx={{ p: 3 }}>
                <CardTitle variant="h6">
                  <InfoIcon /> Bias Analysis Summary
                </CardTitle>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Most Neutral Candidate
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha("#4caf50", 0.1),
                          border: "1px solid",
                          borderColor: alpha("#4caf50", 0.2),
                        }}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {biasSummary.most_neutral_candidate}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Bias Score:
                          </Typography>
                          <ScoreChip
                            label={biasSummary.min_bias.toFixed(1)}
                            level="high"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Least Neutral Candidate
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha("#f44336", 0.1),
                          border: "1px solid",
                          borderColor: alpha("#f44336", 0.2),
                        }}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {biasSummary.least_neutral_candidate}
                        </Typography>
                        <Box
                          sx={{ display: "flex", alignItems: "center", mt: 1 }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Bias Score:
                          </Typography>
                          <ScoreChip
                            label={biasSummary.max_bias.toFixed(1)}
                            level="low"
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "rgba(0, 0, 0, 0.02)",
                    border: "1px solid",
                    borderColor: "divider",
                    mt: 2,
                  }}
                >
                  <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                    <WarningIcon
                      sx={{
                        verticalAlign: "middle",
                        mr: 1,
                        color: "warning.main",
                      }}
                    />
                    Recommendations to Reduce Gender Bias
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex" }}>
                          <CheckCircleIcon
                            sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Use gender-neutral job titles (e.g., "
                            <i>chairperson</i>" instead of
                            "chairman/chairwoman").
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex" }}>
                          <CheckCircleIcon
                            sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Replace gendered pronouns with "<i>they/them</i>"
                            where possible.
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Stack spacing={1}>
                        <Box sx={{ display: "flex" }}>
                          <CheckCircleIcon
                            sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Focus on skills and achievements rather than
                            personal attributes.
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex" }}>
                          <CheckCircleIcon
                            sx={{ color: "success.main", mr: 1, fontSize: 20 }}
                          />
                          <Typography variant="body2">
                            Review for unconscious bias in language describing
                            leadership, technical skills, etc.
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </AnalyticsCard>
          </Grid>
        )}
      </Grid>
    );
  };

  const renderDetailedAnalysis = (dataToRender: Explanation[]) => {
    if (dataToRender.length === 0) {
      return (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No top candidates analyzed yet. Run analysis and check the results.
        </Alert>
      );
    }

    return dataToRender.map((candidate, idx) => (
      <CandidateCard key={idx} sx={{ p: 0 }}>
        <CardHeader
          title={
            <Typography variant="h6" fontWeight={600}>
              {candidate.candidate_file}
            </Typography>
          }
          subheader={
            <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
              <ScoreChip
                label={`Match: ${(candidate.similarity_score * 100).toFixed(
                  0
                )}%`}
                level={getSimilarityLevelColor(candidate.similarity_score)}
                size="small"
                sx={{ mr: 1 }}
              />
              <ScoreChip
                label={`Bias: ${candidate.bias_score.toFixed(1)}`}
                level={getBiasLevelColor(candidate.bias_score)}
                size="small"
              />
            </Box>
          }
          action={
            <Typography
              variant="h6"
              sx={{ mr: 2, fontWeight: 700, color: theme.palette.primary.main }}
            >
              #{candidate.rank || idx + 1}
            </Typography>
          }
          sx={{ px: 3, pt: 3, pb: 2 }}
        />

        {candidate.chatgpt_explanation ? (
          <CardContent sx={{ px: 3, pt: 0 }}>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <SkillsIcon
                      sx={{ color: theme.palette.primary.main, mr: 1 }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Skills
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {candidate.chatgpt_explanation?.direct_observations?.skills?.map(
                      (skill, i) => (
                        <Chip
                          key={i}
                          label={skill}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: theme.palette.primary.main,
                            fontWeight: 500,
                            mb: 0.5,
                          }}
                        />
                      )
                    )}
                  </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <ExperienceIcon
                      sx={{ color: theme.palette.primary.main, mr: 1 }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Experience
                    </Typography>
                  </Box>
                  <Box>
                    {candidate.chatgpt_explanation?.direct_observations
                      ?.experience?.length > 0 ? (
                      <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                        {Array.isArray(
                          candidate.chatgpt_explanation?.direct_observations
                            ?.experience
                        ) &&
                        candidate.chatgpt_explanation.direct_observations
                          .experience.length > 0 ? (
                          <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                            {candidate.chatgpt_explanation.direct_observations.experience.map(
                              (exp, i) => (
                                <Box component="li" key={i} sx={{ mb: 0.5 }}>
                                  <Typography variant="body2">{exp}</Typography>
                                </Box>
                              )
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No experience data available
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No experience data available
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <EducationIcon
                      sx={{ color: theme.palette.primary.main, mr: 1 }}
                    />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Education
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {candidate.chatgpt_explanation?.direct_observations
                      ?.education || "No education data available"}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Match Analysis
                  </Typography>
                  <Typography variant="body2">
                    {candidate.chatgpt_explanation?.similarity?.comment}
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Bias Analysis
                  </Typography>
                  <Typography variant="body2">
                    {candidate.chatgpt_explanation?.gender_bias?.comment}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Notable Gaps
                  </Typography>
                  <Typography variant="body2">
                    {candidate.chatgpt_explanation
                      ?.notable_gaps_and_missing_requirements ||
                      "No significant gaps identified"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 3 }} />
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Conclusion
              </Typography>
              <Typography variant="body2">
                {candidate.chatgpt_explanation.conclusion}
              </Typography>
            </Box>
          </CardContent>
        ) : (
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              No detailed explanation available for this candidate.
            </Typography>
          </CardContent>
        )}
      </CandidateCard>
    ));
  };

  return (
    <Box>
      <TransparaAppBar
        onLogout={handleLogout}
        onSearch={(value) => setSearchTerm(value)}
      />

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
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" fontWeight="700" gutterBottom>
                    Candidate Analysis
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Compare and analyze candidate data for better hiring
                    decisions
                  </Typography>
                </Box>

                <AnalyticsCard elevation={0} sx={{ mb: 2 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        alignItems: { xs: "stretch", sm: "flex-end" },
                        gap: 2,
                      }}
                    >
                      <FormControl fullWidth>
                        <InputLabel>Select Job</InputLabel>
                        <Select
                          value={selectedJobId}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedJobId(value);
                            setNoNewCandidates(false);
                            localStorage.setItem("selectedJobId", value);
                          }}
                          label="Select Job"
                          sx={{
                            borderRadius: 1.5,
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: alpha(
                                theme.palette.primary.main,
                                0.2
                              ),
                            },
                          }}
                        >
                          {initialLoading ? (
                            <MenuItem disabled>Loading jobs...</MenuItem>
                          ) : jobs.length === 0 ? (
                            <MenuItem disabled>No jobs available</MenuItem>
                          ) : (
                            jobs.map((job) => (
                              <MenuItem key={job.id} value={job.id}>
                                {job.title}
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>

                      <ActionButton
                        variant="contained"
                        onClick={fetchAnalysis}
                        disabled={!selectedJobId || loading}
                        startIcon={
                          loading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <RefreshIcon />
                          )
                        }
                        sx={{
                          minWidth: 170,
                          height: 56,
                        }}
                      >
                        {loading ? "Analyzing..." : "Run Analysis"}
                      </ActionButton>
                    </Box>
                  </CardContent>
                </AnalyticsCard>

                {!loading && selectedJobId && data.length > 0 && (
                  <>
                    {noNewCandidates ? (
                      <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        No new candidates since last analysis. Showing cached
                        analysis.
                      </Alert>
                    ) : (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        New candidates have applied since the last analysis.
                        Click "Run Analysis" to update the results.
                      </Alert>
                    )}
                  </>
                )}

                <StyledTabs
                  value={currentTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab
                    label="Candidates"
                    icon={<PersonIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Analytics"
                    icon={<AssessmentIcon />}
                    iconPosition="start"
                  />
                  <Tab
                    label="Detailed Analysis"
                    icon={<DescriptionIcon />}
                    iconPosition="start"
                  />
                </StyledTabs>

                {currentTab === 0 && (
                  <Box>{renderCandidateCards(filteredData)}</Box>
                )}

                {currentTab === 1 && renderAnalyticsOverview()}

                {currentTab === 2 && (
                  <>{renderDetailedAnalysis(topCandidates.slice(0, 4))}</>
                )}
              </Box>
            </PageContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

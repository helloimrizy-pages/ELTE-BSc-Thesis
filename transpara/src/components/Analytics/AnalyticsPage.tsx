import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Container,
  Grid,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { TransparaAppBar } from "../AppBar/TransparaAppBar";
import Sidebar from "../AppBar/Sidebar";
import { signOut } from "firebase/auth";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ChartTooltip,
  Legend
);

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
  chatgpt_explanation?: ChatGPTExplanation;
}
interface Job {
  id: string;
  title: string;
}

export const AnalyticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Explanation[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  const [biasSummary, setBiasSummary] = useState<{
    average_bias: number;
    min_bias: number;
    max_bias: number;
    median_bias: number;
    most_neutral_candidate: string;
    least_neutral_candidate: string;
  } | null>(null);

  const fetchJobs = async () => {
    const snapshot = await getDocs(collection(db, "jobs"));
    const jobList: Job[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
    }));
    setJobs(jobList);
  };

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const res = await axios.post("/api/analyze-candidates", {
        jobId: selectedJobId,
      });

      const explanationData =
        res.data?.chatgpt_explanations?.explanations || [];
      const bias = res.data?.gender_bias_report?.summary || null;

      setData(explanationData);
      setBiasSummary(bias);
    } catch (err) {
      console.error("Error fetching analysis:", err);
      alert("Failed to fetch analysis. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const tryFetchCachedAnalysis = async () => {
      if (!selectedJobId) return;
      try {
        setLoading(true);
        const res = await axios.get(`/api/get-analysis/${selectedJobId}`);
        const explanationData =
          res.data?.chatgpt_explanations?.explanations || [];
        const bias = res.data?.gender_bias_report?.summary || null;

        if (explanationData.length > 0) {
          setData(explanationData);
          setBiasSummary(bias);
        } else {
          setData([]);
          setBiasSummary(null);
        }
      } catch {
        console.warn("No cached analysis found or error fetching it.");
        setData([]);
        setBiasSummary(null);
      } finally {
        setLoading(false);
      }
    };

    tryFetchCachedAnalysis();
  }, [selectedJobId]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <Box>
      <TransparaAppBar
        onLogout={handleLogout}
        onSearch={(value) => setSearchTerm(value)}
      />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Sidebar />
          </Grid>

          <Grid item xs={12} md={9}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Candidate Ranking Analysis
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Job</InputLabel>
                <Select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  label="Select Job"
                >
                  {jobs.map((job) => (
                    <MenuItem key={job.id} value={job.id}>
                      {job.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={fetchAnalysis}
                disabled={!selectedJobId}
                sx={{
                  mb: 3,
                  backgroundColor: "black",
                  "&:hover": { backgroundColor: "#333" },
                }}
              >
                Run Analysis
              </Button>

              {loading ? (
                <CircularProgress />
              ) : Array.isArray(data) && data.length > 0 ? (
                <Box>
                  {!loading && selectedJobId && data.length > 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Showing cached analysis. Click "Run Analysis" to refresh.
                    </Typography>
                  )}

                  <Box sx={{ height: 300, mt: 3 }}>
                    <Typography variant="subtitle1">
                      Top Candidates by Similarity Score
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <XAxis dataKey="candidate_file" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip />
                        <Bar dataKey="similarity_score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  {data.length > 0 && (
                    <Box sx={{ mt: 6 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Candidate Skill Comparison
                      </Typography>
                      <Radar
                        data={{
                          labels: [
                            "machine learning",
                            "python",
                            "ai",
                            "nlp",
                            "algorithms",
                            "pytorch",
                            "tensorflow",
                            "deep learning",
                          ],
                          datasets: data.map((candidate) => ({
                            label: `${
                              candidate.candidate_file
                            } (${candidate.similarity_score.toFixed(2)})`,
                            data: [
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "machine learning"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "python"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "ai"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "nlp"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "algorithms"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "pytorch"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "tensorflow"
                              )
                                ? 1
                                : 0,
                              candidate.chatgpt_explanation?.direct_observations.skills.includes(
                                "deep learning"
                              )
                                ? 1
                                : 0,
                            ],
                            fill: true,
                            backgroundColor: "rgba(0, 123, 255, 0.2)",
                            borderColor: "rgba(0, 123, 255, 1)",
                            borderWidth: 1,
                          })),
                        }}
                        options={{
                          responsive: true,
                          scales: {
                            r: {
                              suggestedMin: 0,
                              suggestedMax: 1,
                              ticks: { stepSize: 1 },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}

                  <Box sx={{ height: 300, mt: 5 }}>
                    <Typography variant="subtitle1">
                      Gender Bias Scores
                    </Typography>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <XAxis dataKey="candidate_file" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="bias_score" fill="#ff7f50" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  {biasSummary && (
                    <Box sx={{ mt: 5 }}>
                      {data.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Candidate-Level Gender Bias Details
                          </Typography>
                          {data.map((candidate, idx) => {
                            const biasEntry = candidate.bias_score;
                            return (
                              <Paper
                                key={idx}
                                elevation={1}
                                sx={{
                                  p: 2,
                                  my: 2,
                                  backgroundColor: "#fff",
                                  borderLeft: `5px solid ${
                                    biasEntry < 1
                                      ? "#82ca9d"
                                      : biasEntry < 3
                                      ? "#ffc658"
                                      : "#ff7f50"
                                  }`,
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  fontWeight="bold"
                                >
                                  {candidate.candidate_file}
                                </Typography>
                                <Typography variant="body2">
                                  Bias Score:{" "}
                                  <strong>{biasEntry.toFixed(2)}</strong>
                                </Typography>
                              </Paper>
                            );
                          })}
                        </Box>
                      )}

                      <Box sx={{ mt: 5 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Recommendations to Reduce Gender Bias in Resumes
                        </Typography>
                        <ul>
                          <li>
                            Use gender-neutral job titles (e.g., “
                            <i>chairperson</i>” instead of
                            “chairman/chairwoman”).
                          </li>
                          <li>
                            Replace gendered pronouns with “<i>they/them</i>”
                            where possible.
                          </li>
                          <li>
                            Focus on skills and achievements rather than
                            personal attributes.
                          </li>
                          <li>
                            Review for unconscious bias in language describing
                            leadership, technical skills, etc.
                          </li>
                        </ul>
                      </Box>

                      <Box sx={{ height: 250, mt: 5 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Most vs Least Neutral Candidates
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              {
                                name: "Most Neutral",
                                candidate: biasSummary.most_neutral_candidate,
                                score: biasSummary.min_bias,
                              },
                              {
                                name: "Least Neutral",
                                candidate: biasSummary.least_neutral_candidate,
                                score: biasSummary.max_bias,
                              },
                            ]}
                          >
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="score" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>

                      {data.map((candidate, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            mt: 4,
                            p: 3,
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            backgroundColor: "#f9f9f9",
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold">
                            {candidate.candidate_file}
                          </Typography>

                          {candidate.chatgpt_explanation ? (
                            <>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                <strong>Position:</strong>{" "}
                                {candidate.chatgpt_explanation.job_position}
                              </Typography>
                              <Typography variant="body1">
                                <strong>Similarity:</strong>{" "}
                                {
                                  candidate.chatgpt_explanation.similarity
                                    .comment
                                }
                              </Typography>
                              <Typography variant="body1">
                                <strong>Bias:</strong>{" "}
                                {
                                  candidate.chatgpt_explanation.gender_bias
                                    .comment
                                }
                              </Typography>

                              <Typography variant="body2" sx={{ mt: 2 }}>
                                <strong>Direct Observations:</strong>
                              </Typography>
                              <ul>
                                <li>
                                  <strong>Skills:</strong>{" "}
                                  {candidate.chatgpt_explanation.direct_observations.skills.join(
                                    ", "
                                  )}
                                </li>
                                <li>
                                  <strong>Experience:</strong>{" "}
                                  {candidate.chatgpt_explanation.direct_observations.experience.join(
                                    ", "
                                  )}
                                </li>
                                <li>
                                  <strong>Education:</strong>{" "}
                                  {
                                    candidate.chatgpt_explanation
                                      .direct_observations.education
                                  }
                                </li>
                              </ul>

                              <Typography variant="body2">
                                <strong>Notable Gaps:</strong>{" "}
                                {
                                  candidate.chatgpt_explanation
                                    .notable_gaps_and_missing_requirements
                                }
                              </Typography>

                              <Typography variant="body2" sx={{ mt: 2 }}>
                                <strong>Conclusion:</strong>{" "}
                                {candidate.chatgpt_explanation.conclusion}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No explanation available for this candidate.
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                !loading &&
                selectedJobId && (
                  <Typography variant="body2" color="text.secondary">
                    No analysis results available. Please try running analysis
                    again or check your job selection.
                  </Typography>
                )
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

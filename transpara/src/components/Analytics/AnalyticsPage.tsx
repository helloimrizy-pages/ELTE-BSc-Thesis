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
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import axios from "axios";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

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
  const [biasSummary, setBiasSummary] = useState<{
    average_bias: number;
    min_bias: number;
    max_bias: number;
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
    fetchJobs();
  }, []);

  const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a9a9a9"];

  return (
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

          <Box sx={{ height: 300, mt: 5 }}>
            <Typography variant="subtitle1">Gender Bias Scores</Typography>
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
              <Typography variant="subtitle1" gutterBottom>
                Gender Bias Summary
              </Typography>
              <PieChart width={400} height={250}>
                <Pie
                  data={[
                    { name: "Avg Bias", value: biasSummary.average_bias },
                    { name: "Min Bias", value: biasSummary.min_bias },
                    { name: "Max Bias", value: biasSummary.max_bias },
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                  dataKey="value"
                >
                  {colors.map((c, i) => (
                    <Cell key={`cell-${i}`} fill={c} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>

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
                        {candidate.chatgpt_explanation.similarity.comment}
                      </Typography>
                      <Typography variant="body1">
                        <strong>Bias:</strong>{" "}
                        {candidate.chatgpt_explanation.gender_bias.comment}
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
                            candidate.chatgpt_explanation.direct_observations
                              .education
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
            No analysis results available. Please try running analysis again or
            check your job selection.
          </Typography>
        )
      )}
    </Paper>
  );
};

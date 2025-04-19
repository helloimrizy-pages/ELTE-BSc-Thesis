import React from "react";
import { styled, alpha } from "@mui/material/styles";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Grid,
  Divider,
  Paper,
  Avatar,
  CircularProgress,
  Tooltip,
  useTheme,
} from "@mui/material";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Icons
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InfoIcon from "@mui/icons-material/Info";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import StarIcon from "@mui/icons-material/Star";

// Styled components
const FeatureCard = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
}));

const StyledSelect = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.spacing(1.5),
    transition: "all 0.3s ease",
    "&:hover": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
      },
    },
  },
}));

const FeatureBar = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  transition: "transform 0.2s ease",
  "&:hover": {
    transform: "translateX(4px)",
  },
}));

const FeatureImpactChip = styled(Chip)<{
  impact: "positive" | "negative" | "neutral";
}>(({ theme, impact }) => {
  const getColor = () => {
    switch (impact) {
      case "positive":
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          text: theme.palette.success.main,
        };
      case "negative":
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          text: theme.palette.error.main,
        };
      case "neutral":
        return {
          bg: alpha(theme.palette.info.main, 0.1),
          text: theme.palette.info.main,
        };
      default:
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          text: theme.palette.success.main,
        };
    }
  };

  const { bg, text } = getColor();

  return {
    backgroundColor: bg,
    color: text,
    fontWeight: 600,
    "& .MuiChip-icon": {
      color: text,
    },
  };
});

const CandidateAvatar = styled(Avatar)(({ theme }) => ({
  width: 36,
  height: 36,
  marginRight: theme.spacing(1.5),
  border: `2px solid ${theme.palette.background.paper}`,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
}));

const InfoPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  backgroundColor: alpha(theme.palette.info.main, 0.05),
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  marginBottom: theme.spacing(3),
}));

// Types
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

interface Explanation {
  id: string;
  candidate_file: string;
  similarity_score: number;
  // Other properties
}

interface ShapFeatureProps {
  data: Explanation[];
  loading: boolean;
  selectedShapCandidateId: string | null;
  onCandidateSelect: (id: string) => void;
  getShapDataForCandidate: (id: string) => ShapEntry | undefined;
}

export const ShapFeature: React.FC<ShapFeatureProps> = ({
  data,
  loading,
  selectedShapCandidateId,
  onCandidateSelect,
  getShapDataForCandidate,
}) => {
  const theme = useTheme();
  const shapEntry = selectedShapCandidateId
    ? getShapDataForCandidate(selectedShapCandidateId)
    : undefined;

  // Format the chart data
  const getChartData = () => {
    if (!shapEntry || !shapEntry.contributors) return [];

    return shapEntry.contributors
      .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
      .slice(0, 8)
      .map((contributor) => ({
        name:
          contributor.feature.length > 20
            ? `${contributor.feature.slice(0, 17)}...`
            : contributor.feature,
        impact: contributor.impact,
        direction: contributor.positive ? "Positive" : "Negative",
        absImpact: Math.abs(contributor.impact),
      }));
  };

  // Get top positive and negative features
  const getTopFeatures = () => {
    if (!shapEntry || !shapEntry.contributors)
      return { positive: [], negative: [] };

    const sorted = [...shapEntry.contributors].sort(
      (a, b) => b.impact - a.impact
    );

    return {
      positive: sorted.filter((c) => c.positive).slice(0, 4),
      negative: sorted.filter((c) => !c.positive).slice(0, 4),
    };
  };

  // Render loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  // Get top features
  const topFeatures = shapEntry
    ? getTopFeatures()
    : { positive: [], negative: [] };
  const chartData = shapEntry ? getChartData() : [];

  return (
    <FeatureCard>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ display: "flex", alignItems: "center" }}
        >
          <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
          Feature Importance Analysis
        </Typography>
        <Tooltip title="SHAP values explain how much each feature contributes to the prediction for this candidate.">
          <InfoIcon
            sx={{
              ml: 1,
              color: "text.secondary",
              fontSize: 16,
              cursor: "help",
            }}
          />
        </Tooltip>
      </Box>

      <InfoPanel elevation={0}>
        <Box sx={{ display: "flex", alignItems: "flex-start" }}>
          <HelpOutlineIcon sx={{ mr: 1.5, color: "info.main", mt: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            SHAP (SHapley Additive exPlanations) values show how each feature in
            a candidate's profile contributes to their match score. Positive
            values push the score higher, while negative values lower it. This
            helps understand why certain candidates rank higher than others.
          </Typography>
        </Box>
      </InfoPanel>

      <StyledSelect fullWidth sx={{ mb: 3, maxWidth: 400 }}>
        <InputLabel id="candidate-select-label">Select Candidate</InputLabel>
        <Select
          labelId="candidate-select-label"
          id="candidate-select"
          value={selectedShapCandidateId || ""}
          label="Select Candidate"
          onChange={(e) => onCandidateSelect(e.target.value as string)}
          renderValue={(selected) => {
            const candidate = data.find((c) => c.id === selected);
            return (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CandidateAvatar>
                  {candidate?.candidate_file.charAt(0) || "C"}
                </CandidateAvatar>
                <Typography variant="body2" fontWeight={500}>
                  {candidate?.candidate_file || "Select a candidate"}
                </Typography>
              </Box>
            );
          }}
        >
          {data.length === 0 ? (
            <MenuItem disabled>No candidates available</MenuItem>
          ) : (
            data.map((candidate) => (
              <MenuItem key={candidate.id} value={candidate.id}>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <CandidateAvatar>
                    {candidate.candidate_file.charAt(0)}
                  </CandidateAvatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      {candidate.candidate_file}
                    </Typography>
                  </Box>
                  {candidate.similarity_score >= 0.7 && (
                    <StarIcon
                      sx={{ color: "warning.main", ml: 1, fontSize: 16 }}
                    />
                  )}
                </Box>
              </MenuItem>
            ))
          )}
        </Select>
      </StyledSelect>

      {!selectedShapCandidateId ? (
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          Please select a candidate to view their feature importance analysis.
        </Alert>
      ) : !shapEntry ? (
        <Alert severity="info" sx={{ borderRadius: 1.5 }}>
          No feature importance data available for this candidate.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Importance Chart
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={["dataMin", "dataMax"]} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <RechartsTooltip
                    formatter={(
                      value: number | string,
                      name: string,
                      item: { payload?: { direction?: string } }
                    ) => [
                      `Impact: ${Number(value).toFixed(4)}`,
                      item.payload?.direction ?? "",
                    ]}
                    labelFormatter={(label: string) => `Feature: ${label}`}
                  />

                  <Legend />
                  <Bar dataKey="impact" name="Feature Impact">
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.direction === "Positive"
                            ? theme.palette.success.main
                            : theme.palette.error.main
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <TrendingUpIcon
                  sx={{ mr: 1, color: theme.palette.success.main }}
                />
                Top Positive Factors
              </Typography>

              {topFeatures.positive.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                  No positive factors found
                </Alert>
              ) : (
                topFeatures.positive.map((feature, index) => (
                  <FeatureBar
                    key={index}
                    sx={{
                      backgroundColor: alpha(theme.palette.success.main, 0.05),
                      borderLeft: `3px solid ${theme.palette.success.main}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {feature.feature}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Value:{" "}
                        {typeof feature.value === "number"
                          ? feature.value.toFixed(2)
                          : feature.value}
                      </Typography>
                    </Box>
                    <FeatureImpactChip
                      label={`+${feature.impact.toFixed(4)}`}
                      size="small"
                      impact="positive"
                      icon={<TrendingUpIcon />}
                    />
                  </FeatureBar>
                ))
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <TrendingDownIcon
                  sx={{ mr: 1, color: theme.palette.error.main }}
                />
                Top Negative Factors
              </Typography>

              {topFeatures.negative.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 1.5 }}>
                  No negative factors found
                </Alert>
              ) : (
                topFeatures.negative.map((feature, index) => (
                  <FeatureBar
                    key={index}
                    sx={{
                      backgroundColor: alpha(theme.palette.error.main, 0.05),
                      borderLeft: `3px solid ${theme.palette.error.main}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {feature.feature}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Value:{" "}
                        {typeof feature.value === "number"
                          ? feature.value.toFixed(2)
                          : feature.value}
                      </Typography>
                    </Box>
                    <FeatureImpactChip
                      label={feature.impact.toFixed(4)}
                      size="small"
                      impact="negative"
                      icon={<TrendingDownIcon />}
                    />
                  </FeatureBar>
                ))
              )}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Prediction Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    border: `1px solid ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Base Value
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {shapEntry.base_value.toFixed(4)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.success.main, 0.05),
                    border: `1px solid ${alpha(
                      theme.palette.success.main,
                      0.1
                    )}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Final Prediction
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {shapEntry.prediction.toFixed(4)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.info.main, 0.05),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Total Features
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {shapEntry.contributors.length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.warning.main, 0.05),
                    border: `1px solid ${alpha(
                      theme.palette.warning.main,
                      0.1
                    )}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Positive Features
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {shapEntry.contributors.filter((c) => c.positive).length}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </FeatureCard>
  );
};

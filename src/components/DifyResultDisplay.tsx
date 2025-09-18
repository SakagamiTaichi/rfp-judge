import React from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert,
  LinearProgress,
  Stack,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Cancel as CancelIcon,
  Timer as TimerIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  FileCopy as FileCopyIcon,
} from "@mui/icons-material";

interface Assessment {
  compliance_status: "○" | "△" | "×";
  reasoning: string;
  alternative_solution?: string;
  reference_source?: string;
  type?: string;
}

interface JudgementItem {
  original_item: string;
  assessment: Assessment;
}

interface DifyWorkflowResult {
  id: string;
  workflow_id: string;
  status: "succeeded" | "failed" | "running" | "stopped";
  outputs: {
    judgement: JudgementItem[];
  };
  error?: string;
  elapsed_time: number;
  total_tokens: number;
  total_steps: number;
  created_at: number;
  finished_at: number;
}

interface DifyResultDisplayProps {
  result: DifyWorkflowResult;
  fileName?: string;
}

export const DifyResultDisplay: React.FC<DifyResultDisplayProps> = ({
  result,
  fileName,
}) => {
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString("ja-JP");
  };

  const formatElapsedTime = (seconds: number): string => {
    return `${seconds.toFixed(2)}秒`;
  };

  const getComplianceStatusIcon = (status: string) => {
    switch (status) {
      case "○":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      case "△":
        return <WarningIcon sx={{ color: "#ff9800" }} />;
      case "×":
        return <CancelIcon sx={{ color: "#f44336" }} />;
      default:
        return <InfoIcon sx={{ color: "#2196f3" }} />;
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "○":
        return "success";
      case "△":
        return "warning";
      case "×":
        return "error";
      default:
        return "default";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "succeeded":
        return <CheckCircleIcon sx={{ color: "#4caf50" }} />;
      case "failed":
        return <CancelIcon sx={{ color: "#f44336" }} />;
      case "running":
        return <LinearProgress sx={{ width: 100 }} />;
      default:
        return <InfoIcon sx={{ color: "#2196f3" }} />;
    }
  };

  const complianceStats = result.outputs.judgement.reduce((acc, item) => {
    acc[item.assessment.compliance_status] =
      (acc[item.assessment.compliance_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* ヘッダー情報 */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
          <Box>
            <Typography
              variant="h5"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <AssessmentIcon color="primary" />
              RFP判定結果
              {fileName && (
                <Chip
                  label={fileName}
                  size="small"
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            {getStatusIcon(result.status)}
            <Chip
              label={result.status.toUpperCase()}
              color={result.status === "succeeded" ? "success" : "error"}
              variant="filled"
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 統計情報 */}
        <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                処理時間
              </Typography>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <TimerIcon fontSize="small" />
                {formatElapsedTime(result.elapsed_time)}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                トークン数
              </Typography>
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <PsychologyIcon fontSize="small" />
                {result.total_tokens.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                ステップ数
              </Typography>
              <Typography variant="h6">{result.total_steps}</Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <Typography variant="body2" color="text.secondary">
                判定項目数
              </Typography>
              <Typography variant="h6">
                {result.outputs.judgement.length}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* 適合性統計 - グラフ表示 */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              適合性サマリー
            </Typography>
            <Box>
              {/* 統計チップ */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  詳細統計
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(complianceStats).map(([status, count]) => (
                    <Box
                      key={status}
                      sx={{ display: "flex", alignItems: "center", gap: 2 }}
                    >
                      <Chip
                        icon={getComplianceStatusIcon(status)}
                        label={`${status}: ${count}件`}
                        color={
                          getComplianceStatusColor(status) as
                            | "success"
                            | "warning"
                            | "error"
                            | "default"
                        }
                        variant="outlined"
                        sx={{ minWidth: 120 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        (
                        {Math.round(
                          (count / result.outputs.judgement.length) * 100
                        )}
                        %)
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    総項目数: {result.outputs.judgement.length}件
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* エラー表示 */}
      {result.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">エラー:</Typography>
          {result.error}
        </Alert>
      )}

      {/* 判定結果 */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        詳細判定結果
      </Typography>

      {result.outputs.judgement.map((item, index) => (
        <Accordion key={index} sx={{ mb: 1 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              <Chip
                icon={getComplianceStatusIcon(
                  item.assessment.compliance_status
                )}
                label={item.assessment.compliance_status}
                color={
                  getComplianceStatusColor(
                    item.assessment.compliance_status
                  ) as "success" | "warning" | "error" | "default"
                }
                size="small"
              />
              <Typography variant="body1" sx={{ flex: 1 }}>
                {item.original_item}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {/* 判定理由 */}
              <Box>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  判定理由:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ pl: 2, borderLeft: "3px solid #e0e0e0" }}
                >
                  {item.assessment.reasoning}
                </Typography>
              </Box>

              {/* 参照元 */}
              {item.assessment.reference_source && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="secondary"
                  >
                    参照元:
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                    <Typography variant="body2" style={{ fontStyle: "italic" }}>
                      "{item.assessment.reference_source}"
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* 代替案 */}
              {item.assessment.alternative_solution && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    color="warning.main"
                  >
                    代替案:
                  </Typography>
                  <Alert
                    severity="info"
                    sx={{ "& .MuiAlert-message": { width: "100%" } }}
                  >
                    {item.assessment.alternative_solution}
                  </Alert>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* フッター情報 */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          実行ID:
          <Box component="span" sx={{ fontFamily: "monospace", ml: 1 }}>
            {result.id}
          </Box>
          <Tooltip title="IDをコピー">
            <IconButton
              size="small"
              onClick={() => copyToClipboard(result.id)}
            >
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          実行時刻: {formatDate(result.created_at)} -{" "}
          {formatDate(result.finished_at)}
        </Typography>
      </Box>
    </Paper>
  );
};

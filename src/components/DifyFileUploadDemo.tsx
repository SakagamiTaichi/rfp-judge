import React, { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Folder as FolderIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  FileCopy as FileCopyIcon,
  PlayArrow as PlayArrowIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import { DifyFileUpload } from "./DifyFileUpload";
import { DifyResultDisplay } from "./DifyResultDisplay";

interface UploadResult {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
  file?: File;
}

interface WorkflowResult {
  id: string;
  file_id: string;
  status: "running" | "completed" | "failed";
  result?: unknown;
  created_at: number;
  error?: string;
}

export const DifyFileUploadDemo: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [workflowApiKey, setWorkflowApiKey] = useState("");
  const [userId, setUserId] = useState("user-123");
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [workflowResults, setWorkflowResults] = useState<WorkflowResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [executingWorkflows, setExecutingWorkflows] = useState<Set<string>>(
    new Set()
  );

  const handleUploadSuccess = (result: UploadResult, file: File) => {
    const uploadResult = { ...result, file };
    setUploadResults((prev) => [uploadResult, ...prev]);
    setError(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString("ja-JP");
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon color="primary" />;
    } else if (mimeType === "application/pdf") {
      return <PdfIcon color="error" />;
    }
    return <FolderIcon color="action" />;
  };

  const getFileTypeChip = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return (
        <Chip label="画像" color="primary" size="small" icon={<ImageIcon />} />
      );
    } else if (mimeType === "application/pdf") {
      return <Chip label="PDF" color="error" size="small" icon={<PdfIcon />} />;
    }
    return (
      <Chip label="その他" color="default" size="small" icon={<FolderIcon />} />
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const executeWorkflow = async (fileId: string) => {
    if (!workflowApiKey.trim()) {
      setError("ワークフロー用のAPI Keyを入力してください");
      return;
    }

    const uploadResult = uploadResults.find((result) => result.id === fileId);
    if (!uploadResult?.file) {
      setError("ファイルが見つかりません");
      return;
    }

    setExecutingWorkflows((prev) => new Set(prev.add(fileId)));
    setError(null);

    console.log("Executing workflow with file:", uploadResult.file.name);

    try {
      const response = await fetch("https://api.dify.ai/v1/workflows/run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${workflowApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            file: {
              type: "document",
              transfer_method: "local_file",
              upload_file_id: fileId,
            },
          },
          user: userId,
          response_mode: "blocking",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Workflow execution failed:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });
        throw new Error(
          `ワークフロー実行に失敗しました: ${response.status} ${response.statusText}\n詳細: ${errorText}`
        );
      }

      const result = await response.json();

      const workflowResult: WorkflowResult = {
        id: result.workflow_run_id || `workflow_${Date.now()}`,
        file_id: fileId,
        status: "completed",
        result: result,
        created_at: Math.floor(Date.now() / 1000),
      };

      setWorkflowResults((prev) => [workflowResult, ...prev]);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "ワークフロー実行エラーが発生しました";
      setError(errorMessage);

      const failedResult: WorkflowResult = {
        id: `failed_${Date.now()}`,
        file_id: fileId,
        status: "failed",
        error: errorMessage,
        created_at: Math.floor(Date.now() / 1000),
      };

      setWorkflowResults((prev) => [failedResult, ...prev]);
    } finally {
      setExecutingWorkflows((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  const getWorkflowResultForFile = (fileId: string) => {
    return workflowResults.find((result) => result.file_id === fileId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 800, mx: "auto" }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          <InfoIcon color="primary" />
          設定
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Dify File Upload API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="your-dify-file-upload-api-key"
            fullWidth
            variant="outlined"
            helperText="Difyのファイルアップロード用API Keyを入力してください"
          />

          <TextField
            label="Dify Workflow API Key"
            type="password"
            value={workflowApiKey}
            onChange={(e) => setWorkflowApiKey(e.target.value)}
            placeholder="your-dify-workflow-api-key"
            fullWidth
            variant="outlined"
            helperText="Difyのワークフロー実行用API Keyを入力してください"
          />

          <TextField
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="unique-user-id"
            fullWidth
            variant="outlined"
            helperText="一意のユーザーIDを設定してください"
          />
        </Box>
      </Paper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, maxWidth: 800, mx: "auto" }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 3, maxWidth: 800, mx: "auto" }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
          ファイルアップロード
        </Typography>
        <DifyFileUpload
          apiKey={apiKey}
          userId={userId}
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </Paper>

      {uploadResults.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mt: 3, maxWidth: 1200, mx: "auto" }}>
          <Typography variant="h5" gutterBottom>
            アップロード履歴
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>種類</TableCell>
                  <TableCell>ファイル名</TableCell>
                  <TableCell>サイズ</TableCell>
                  <TableCell>形式</TableCell>
                  <TableCell>アップロード日時</TableCell>
                  <TableCell>File ID</TableCell>
                  <TableCell>アクション</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((result) => (
                  <TableRow key={result.id} hover>
                    <TableCell>{getFileTypeIcon(result.mime_type)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {result.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatFileSize(result.size)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{getFileTypeChip(result.mime_type)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(result.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          fontFamily="monospace"
                          sx={{
                            maxWidth: 120,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {result.id}
                        </Typography>
                        <Tooltip title="IDをコピー">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(result.id)}
                          >
                            <FileCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const workflowResult = getWorkflowResultForFile(
                          result.id
                        );
                        const isExecuting = executingWorkflows.has(result.id);

                        if (isExecuting) {
                          return (
                            <Button
                              variant="outlined"
                              disabled
                              startIcon={<CircularProgress size={16} />}
                              size="small"
                            >
                              実行中...
                            </Button>
                          );
                        }

                        if (workflowResult) {
                          if (workflowResult.status === "completed") {
                            return (
                              <Chip
                                label="実行完了"
                                color="success"
                                size="small"
                                icon={<CheckCircleIcon />}
                              />
                            );
                          } else if (workflowResult.status === "failed") {
                            return (
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <Chip
                                  label="実行失敗"
                                  color="error"
                                  size="small"
                                  icon={<WarningIcon />}
                                />
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PlayArrowIcon />}
                                  onClick={() => executeWorkflow(result.id)}
                                >
                                  再実行
                                </Button>
                              </Box>
                            );
                          }
                        }

                        return (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={() => executeWorkflow(result.id)}
                            color="primary"
                          >
                            実行
                          </Button>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {workflowResults.length > 0 && (
        <Paper elevation={3} sx={{ p: 3, mt: 3, maxWidth: 1200, mx: "auto" }}>
          <Typography variant="h5" gutterBottom>
            ワークフロー実行結果
          </Typography>
          {workflowResults.map((result) => {
            const uploadFile = uploadResults.find(
              (upload) => upload.id === result.file_id
            );
            return (
              <Accordion key={result.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      width: "100%",
                    }}
                  >
                    <Typography variant="h6">
                      {uploadFile?.name || `File ID: ${result.file_id}`}
                    </Typography>
                    {result.status === "completed" && (
                      <Chip
                        label="成功"
                        color="success"
                        size="small"
                        icon={<CheckCircleIcon />}
                      />
                    )}
                    {result.status === "failed" && (
                      <Chip
                        label="失敗"
                        color="error"
                        size="small"
                        icon={<WarningIcon />}
                      />
                    )}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: "auto" }}
                    >
                      {formatDate(result.created_at)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {result.status === "completed" &&
                    result.result !== undefined && (
                      <Box>
                        {/* DifyResultDisplayコンポーネントを使用 */}
                        {result.result &&
                        typeof result.result === "object" &&
                        "outputs" in result.result ? (
                          <DifyResultDisplay
                            result={result.result as any}
                            fileName={uploadFile?.name}
                          />
                        ) : (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              実行結果:
                            </Typography>
                            <Paper sx={{ p: 2, backgroundColor: "#f5f5f5" }}>
                              <pre
                                style={{
                                  margin: 0,
                                  whiteSpace: "pre-wrap",
                                  fontFamily: "monospace",
                                }}
                              >
                                {typeof result.result === "string"
                                  ? result.result
                                  : JSON.stringify(result.result, null, 2)}
                              </pre>
                            </Paper>
                          </Box>
                        )}
                      </Box>
                    )}
                  {result.status === "failed" && result.error && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        gutterBottom
                        color="error"
                      >
                        エラー:
                      </Typography>
                      <Alert severity="error">{result.error}</Alert>
                    </Box>
                  )}
                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      実行ID: {result.id}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(result.id)}
                    >
                      <FileCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Paper>
      )}
    </Container>
  );
};

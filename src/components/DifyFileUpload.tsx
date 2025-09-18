import React, { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

interface DifyUploadResponse {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
}

interface DifyFileUploadProps {
  apiKey: string;
  userId: string;
  onUploadSuccess?: (response: DifyUploadResponse, file: File) => void;
  onUploadError?: (error: string) => void;
}

export const DifyFileUpload: React.FC<DifyFileUploadProps> = ({
  apiKey,
  userId,
  onUploadSuccess,
  onUploadError
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = useTheme();

  const supportedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'pdf'];


  const validateFile = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      return `サポートされていないファイル形式です。対応形式: ${supportedFormats.join(', ')}`;
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user', encodeURIComponent(userId));

      const response = await fetch('https://api.dify.ai/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed with response:', errorText);
        throw new Error(`アップロードに失敗しました: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('Upload response body:', responseText);
      
      let result: DifyUploadResponse;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed upload result:', result);
        setUploadSuccess(true);
        onUploadSuccess?.(result, file);
        
        // 3秒後に成功状態をリセット
        setTimeout(() => setUploadSuccess(false), 3000);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('レスポンスの解析に失敗しました');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アップロードエラーが発生しました';
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={dragOver ? 8 : 2}
        sx={{
          p: 4,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragOver 
            ? theme.palette.primary.main 
            : uploading 
            ? theme.palette.grey[400] 
            : theme.palette.grey[300],
          backgroundColor: dragOver 
            ? alpha(theme.palette.primary.main, 0.05)
            : uploading 
            ? alpha(theme.palette.grey[500], 0.05)
            : alpha(theme.palette.grey[100], 0.3),
          cursor: uploading ? 'not-allowed' : 'pointer',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: uploading ? theme.palette.grey[400] : theme.palette.primary.light,
            backgroundColor: uploading 
              ? alpha(theme.palette.grey[500], 0.05)
              : alpha(theme.palette.primary.main, 0.02)
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={uploading}
          aria-label="ファイルを選択してアップロード"
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {uploading ? (
            <>
              <CircularProgress size={48} />
              <Typography variant="h6" color="text.secondary">
                アップロード中...
              </Typography>
            </>
          ) : uploadSuccess ? (
            <>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 64, 
                  color: theme.palette.success.main,
                  animation: 'pulse 1s ease-in-out'
                }} 
              />
              <Typography variant="h6" color="success.main">
                アップロード完了！
              </Typography>
            </>
          ) : (
            <>
              <CloudUploadIcon 
                sx={{ 
                  fontSize: 64, 
                  color: dragOver ? theme.palette.primary.main : theme.palette.grey[400],
                  transition: 'color 0.3s ease'
                }} 
              />
              <Typography variant="h6" gutterBottom>
                ファイルをドラッグ&ドロップまたはクリックして選択
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Chip 
                  label="画像" 
                  variant="outlined" 
                  size="small"
                  icon={<ImageIcon />}
                />
                <Chip 
                  label="PDF" 
                  variant="outlined" 
                  size="small"
                  icon={<PdfIcon />}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                PNG, JPG, JPEG, WebP, GIF, PDF
              </Typography>
            </>
          )}
        </Box>
      </Paper>
    </Box>
  );
};
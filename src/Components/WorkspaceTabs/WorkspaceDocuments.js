import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Tooltip,
  LinearProgress,
  alpha,
} from '@mui/material';
import {
  Add,
  Close,
  Description,
  Download,
  Delete,
  CloudUpload,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { API_BASE } from '../../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const CATEGORIES = ['General', 'Legal', 'Financial', 'Product', 'Hiring'];

const WorkspaceDocuments = ({ workspaceId }) => {
  const { user } = useUser();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState('General');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user, workspaceId, categoryFilter, searchQuery]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/documents?${params.toString()}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDocuments(data || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch documents');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['pdf', 'xlsx', 'xls', 'csv'];
      if (!allowedExts.includes(ext)) {
        setError('Invalid file type. Only PDF, Excel (.xlsx, .xls), and CSV files are allowed.');
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit.');
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', category);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setUploadDialogOpen(false);
          setSelectedFile(null);
          setCategory('General');
          setDescription('');
          setUploadProgress(0);
          fetchDocuments();
        } else {
          const errorData = JSON.parse(xhr.responseText);
          setError(errorData.error || 'Upload failed');
        }
        setUploading(false);
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please try again.');
        setUploading(false);
      });

      xhr.open('POST', `${API_BASE}/workspaces/${workspaceId}/documents`);
      xhr.setRequestHeader('X-Clerk-User-Id', user.id);
      xhr.send(formData);
    } catch (err) {
      setError(err.message);
      setUploading(false);
    }
  };

  const handleDownload = async (documentId) => {
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/documents/${documentId}/url`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to generate download URL');
      }
    } catch (err) {
      alert('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        fetchDocuments();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete document');
      }
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategoryColor = (cat) => {
    const colors = {
      General: { bg: alpha(SLATE_400, 0.1), color: SLATE_500 },
      Legal: { bg: alpha('#f59e0b', 0.1), color: '#f59e0b' },
      Financial: { bg: alpha(SKY, 0.1), color: SKY },
      Product: { bg: alpha(TEAL, 0.1), color: TEAL },
      Hiring: { bg: alpha('#ec4899', 0.1), color: '#ec4899' },
    };
    return colors[cat] || colors.General;
  };

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header with filters and add button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            label="Category"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="all">All Categories</MenuItem>
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            bgcolor: TEAL,
            '&:hover': { bgcolor: TEAL_LIGHT },
            textTransform: 'none',
          }}
        >
          Upload Document
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2, borderRadius: 2 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Documents List */}
      <Box>
        {documents.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              bgcolor: BG,
              borderRadius: 2,
              border: '1px dashed',
              borderColor: SLATE_200,
            }}
          >
            <Box sx={{
              width: 64,
              height: 64,
              borderRadius: 2,
              bgcolor: alpha(TEAL, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}>
              <Description sx={{ fontSize: 32, color: TEAL }} />
            </Box>
            <Typography variant="h6" sx={{ mb: 1, color: SLATE_900, fontWeight: 600 }}>
              No documents yet
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              Upload your first document to get started
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map((doc) => (
              <Box
                key={doc.id}
                sx={{
                  p: 2.5,
                  bgcolor: '#fff',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: SLATE_200,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: `0 4px 12px ${alpha(SLATE_900, 0.1)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      bgcolor: alpha(TEAL, 0.1),
                      color: TEAL,
                      borderRadius: 2,
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Description sx={{ fontSize: 24 }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: SLATE_900,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.original_filename}
                      </Typography>
                      <Chip
                        label={doc.category}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(doc.category).bg,
                          color: getCategoryColor(doc.category).color,
                          border: `1px solid ${alpha(getCategoryColor(doc.category).color, 0.3)}`,
                          fontWeight: 600,
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                    </Box>

                    {doc.description && (
                      <Typography
                        variant="body2"
                        sx={{ mb: 1.5, color: SLATE_500, lineHeight: 1.6 }}
                      >
                        {doc.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>
                        {formatFileSize(doc.size_bytes)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>
                        • {format(parseISO(doc.created_at), 'MMM d, yyyy')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(doc.id)}
                        sx={{ 
                          color: SKY,
                          '&:hover': { bgcolor: alpha(SKY, 0.1) },
                        }}
                      >
                        <Download sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(doc.id)}
                        sx={{ 
                          color: '#ef4444',
                          '&:hover': { bgcolor: alpha('#ef4444', 0.1) },
                        }}
                      >
                        <Delete sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: SLATE_900, fontWeight: 600, borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Upload Document</Typography>
            {!uploading && (
              <IconButton
                size="small"
                onClick={() => {
                  setUploadDialogOpen(false);
                  setSelectedFile(null);
                  setCategory('General');
                  setDescription('');
                  setError(null);
                }}
                sx={{ color: SLATE_500 }}
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {uploading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1.5, color: SLATE_900 }}>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  bgcolor: alpha(TEAL, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: TEAL,
                  },
                }}
              />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 2 }}>
            <input
              accept=".pdf,.xlsx,.xls,.csv"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                disabled={uploading}
                sx={{
                  py: 2.5,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: selectedFile ? TEAL : SLATE_200,
                  borderRadius: 2,
                  color: selectedFile ? TEAL : SLATE_500,
                  '&:hover': {
                    borderColor: TEAL,
                    bgcolor: alpha(TEAL, 0.05),
                  },
                }}
              >
                {selectedFile ? selectedFile.name : 'Select File (PDF, Excel, CSV)'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="caption" sx={{ mt: 1, display: 'block', color: SLATE_500 }}>
                Size: {formatFileSize(selectedFile.size)}
              </Typography>
            )}
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            disabled={uploading}
            inputProps={{ maxLength: 1000 }}
            helperText={`${description.length}/1000 characters`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setCategory('General');
              setDescription('');
              setError(null);
            }}
            disabled={uploading}
            sx={{ color: SLATE_500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={<CloudUpload />}
            sx={{
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
            }}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceDocuments;

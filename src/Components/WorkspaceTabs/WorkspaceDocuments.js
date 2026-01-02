import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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
      // Validate file type
      const ext = file.name.split('.').pop().toLowerCase();
      const allowedExts = ['pdf', 'xlsx', 'xls', 'csv'];
      if (!allowedExts.includes(ext)) {
        setError('Invalid file type. Only PDF, Excel (.xlsx, .xls), and CSV files are allowed.');
        return;
      }

      // Validate file size (20MB)
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
      General: { bg: '#e2e8f0', color: '#475569' },
      Legal: { bg: '#fef3c7', color: '#92400e' },
      Financial: { bg: '#dbeafe', color: '#1e40af' },
      Product: { bg: '#d1fae5', color: '#065f46' },
      Hiring: { bg: '#fce7f3', color: '#9f1239' },
    };
    return colors[cat] || colors.General;
  };

  if (loading && documents.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      maxWidth: '1200px',
      mx: 'auto',
      width: '100%',
      height: '100%',
      minHeight: 'calc(100vh - 300px)',
    }}>
      {/* Header with filters and add button */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
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

        <Tooltip title="Upload document">
          <IconButton
            color="primary"
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Documents List - Scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          maxHeight: 'calc(100vh - 400px)',
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f5f9',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e1',
            borderRadius: '4px',
            '&:hover': {
              background: '#94a3b8',
            },
          },
        }}
      >
        {documents.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 8,
              color: 'text.secondary',
            }}
          >
            <Description sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              No documents yet
            </Typography>
            <Typography variant="body2">
              Upload your first document to get started
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map((doc) => (
              <Card
                key={doc.id}
                sx={{
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'white',
                        borderRadius: 1,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Description />
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1rem',
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
                            fontWeight: 500,
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      {doc.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {doc.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(doc.size_bytes)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          • {format(parseISO(doc.created_at), 'MMM d, yyyy')}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Download">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(doc.id)}
                          sx={{ color: 'primary.main' }}
                        >
                          <Download fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(doc.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
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
      >
        <DialogTitle>
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
              >
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Uploading... {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
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
                  py: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: selectedFile ? 'success.main' : 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(14, 165, 233, 0.05)',
                  },
                }}
              >
                {selectedFile ? selectedFile.name : 'Select File (PDF, Excel, CSV)'}
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setSelectedFile(null);
              setCategory('General');
              setDescription('');
              setError(null);
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploading}
            startIcon={<CloudUpload />}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceDocuments;


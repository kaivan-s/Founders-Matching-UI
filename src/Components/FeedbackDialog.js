import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close, Send, ArrowForward } from '@mui/icons-material';
import { API_BASE } from '../config/api';
import { useNavigate } from 'react-router-dom';

const FeedbackDialog = ({ open, onClose, workspaceId = null }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setTitle('');
      setDescription('');
      setCategory('Other');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          workspaceId: workspaceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setSuccess(true);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('Other');
      
      // Don't auto-close - let user see success message and CTA
      
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
          Give Feedback
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: '#64748b' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2 }}>
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => {
                setSuccess(false);
                onClose();
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                Thanks! If we ship this or find it very useful, we'll reach out and may send a reward.
              </Typography>
              <Button
                variant="text"
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => {
                  onClose();
                  navigate('/my-feedback');
                }}
                sx={{
                  color: '#0d9488',
                  fontWeight: 600,
                  textTransform: 'none',
                  mt: 1,
                }}
              >
                View all your feedback and benefits
              </Button>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={loading}
            sx={{ mb: 2 }}
            placeholder="Brief summary of your feedback"
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200 characters`}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="Bug">Bug</MenuItem>
              <MenuItem value="UX">UX</MenuItem>
              <MenuItem value="Feature">Feature</MenuItem>
              <MenuItem value="Pricing">Pricing</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            multiline
            rows={6}
            disabled={loading}
            placeholder="Explain the problem, why it matters, and any examples..."
            inputProps={{ maxLength: 5000 }}
            helperText={`${description.length}/5000 characters`}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />

          {workspaceId && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                This feedback will be linked to the current workspace
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
          <Button onClick={onClose} disabled={loading} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !title.trim() || !description.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <Send />}
            sx={{
              bgcolor: '#0d9488',
              '&:hover': {
                bgcolor: '#14b8a6',
              },
            }}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FeedbackDialog;


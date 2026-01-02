import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  BugReport,
  DesignServices,
  Lightbulb,
  AttachMoney,
  MoreHoriz,
  CheckCircle,
  Schedule,
  Cancel,
  Visibility,
  Close,
  CardGiftcard,
  TrendingUp,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import FeedbackDialog from './FeedbackDialog';
import { useNavigate } from 'react-router-dom';

const categoryIcons = {
  Bug: <BugReport />,
  UX: <DesignServices />,
  Feature: <Lightbulb />,
  Pricing: <AttachMoney />,
  Other: <MoreHoriz />,
};

const statusColors = {
  'New': { color: '#64748b', bgcolor: '#f1f5f9' },
  'Under review': { color: '#0284c7', bgcolor: '#e0f2fe' },
  'Planned': { color: '#7c3aed', bgcolor: '#f3e8ff' },
  'In progress': { color: '#f59e0b', bgcolor: '#fef3c7' },
  'Implemented': { color: '#059669', bgcolor: '#d1fae5' },
  'Rejected': { color: '#dc2626', bgcolor: '#fee2e2' },
};

const FeedbackHistory = () => {
  const { user } = useUser();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  // Calculate summary statistics
  const totalFeedback = feedback.length;
  const implementedCount = feedback.filter(f => f.status === 'Implemented').length;
  const activeBenefitsCount = feedback.filter(f => f.reward_amount_cents > 0 && f.reward_paid === true).length;

  useEffect(() => {
    if (user) {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/feedback/my`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch feedback');
      }

      const data = await response.json();
      setFeedback(data);
    } catch (err) {
      setError(err.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatReward = (cents) => {
    if (!cents || cents === 0) return null;
    const rupees = cents / 100;
    return `₹${rupees.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button onClick={fetchFeedback} variant="outlined">
          Retry
        </Button>
      </Box>
    );
  }

  const getBenefitsText = (item) => {
    if (item.reward_amount_cents > 0) {
      if (item.reward_paid) {
        return 'Extra benefits unlocked – reward granted.';
      } else {
        return 'Extra benefits approved – payout pending.';
      }
    } else {
      return 'Extra benefits: not granted (yet).';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#1e3a8a' }}>
            My Feedback & Benefits
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your feedback and rewards
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setFeedbackDialogOpen(true)}
          sx={{
            bgcolor: '#0d9488',
            '&:hover': {
              bgcolor: '#14b8a6',
            },
          }}
        >
          Give Feedback
        </Button>
      </Box>

      {/* Summary Section */}
      {feedback.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Card
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1e3a8a' }}>
                Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                    {totalFeedback}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You've submitted {totalFeedback} {totalFeedback === 1 ? 'feedback item' : 'feedback items'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669' }}>
                    {implementedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {implementedCount === 1 ? 'Implemented' : 'Implemented'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d9488' }}>
                    {activeBenefitsCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active benefits
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {feedback.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 6,
              border: '1px solid',
              borderColor: 'divider',
              maxWidth: '400px',
            }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#0d9488',
                mb: 3,
              }}
            >
              <Lightbulb sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700 }}>
              No feedback yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Share your ideas, report bugs, or suggest improvements. We value your input!
            </Typography>
            <Button
              variant="contained"
              onClick={() => setFeedbackDialogOpen(true)}
              sx={{
                bgcolor: '#0d9488',
                '&:hover': {
                  bgcolor: '#14b8a6',
                },
              }}
            >
              Submit Your First Feedback
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {feedback.map((item) => {
            const statusStyle = statusColors[item.status] || statusColors['New'];
            const reward = formatReward(item.reward_amount_cents);

            return (
              <Card
                key={item.id}
                onClick={() => {
                  setSelectedFeedback(item);
                  setDetailDialogOpen(true);
                }}
                sx={{
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: '#0d9488',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Box sx={{ color: '#0d9488' }}>{categoryIcons[item.category] || categoryIcons.Other}</Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                          {item.title}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
                        <Chip
                          label={item.category}
                          size="small"
                          icon={categoryIcons[item.category] || categoryIcons.Other}
                          sx={{
                            bgcolor: 'rgba(13, 148, 136, 0.1)',
                            color: '#0d9488',
                            fontWeight: 500,
                          }}
                        />
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            bgcolor: statusStyle.bgcolor,
                            color: statusStyle.color,
                            fontWeight: 500,
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {formatDate(item.created_at)}
                        </Typography>
                      </Box>
                      {/* Benefits Line */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 1,
                          p: 1,
                          borderRadius: 1,
                          bgcolor: item.reward_amount_cents > 0 && item.reward_paid ? '#d1fae5' : item.reward_amount_cents > 0 ? '#fef3c7' : '#f1f5f9',
                        }}
                      >
                        <CardGiftcard
                          sx={{
                            fontSize: 16,
                            color: item.reward_amount_cents > 0 && item.reward_paid ? '#059669' : item.reward_amount_cents > 0 ? '#f59e0b' : '#64748b',
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: item.reward_amount_cents > 0 && item.reward_paid ? '#059669' : item.reward_amount_cents > 0 ? '#f59e0b' : '#64748b',
                            fontWeight: item.reward_amount_cents > 0 ? 500 : 400,
                          }}
                        >
                          {getBenefitsText(item)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Feedback Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        {selectedFeedback && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a8a' }}>
                Feedback Details
              </Typography>
              <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {selectedFeedback.title}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                  {selectedFeedback.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={selectedFeedback.category}
                    size="small"
                    icon={categoryIcons[selectedFeedback.category] || categoryIcons.Other}
                    sx={{
                      bgcolor: 'rgba(13, 148, 136, 0.1)',
                      color: '#0d9488',
                    }}
                  />
                  <Chip
                    label={selectedFeedback.status}
                    size="small"
                    sx={{
                      bgcolor: statusColors[selectedFeedback.status]?.bgcolor || '#f1f5f9',
                      color: statusColors[selectedFeedback.status]?.color || '#64748b',
                    }}
                  />
                </Box>

                {/* Benefits Section */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: selectedFeedback.reward_amount_cents > 0 && selectedFeedback.reward_paid ? '#d1fae5' : selectedFeedback.reward_amount_cents > 0 ? '#fef3c7' : '#f1f5f9',
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CardGiftcard
                      sx={{
                        fontSize: 20,
                        color: selectedFeedback.reward_amount_cents > 0 && selectedFeedback.reward_paid ? '#059669' : selectedFeedback.reward_amount_cents > 0 ? '#f59e0b' : '#64748b',
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Benefits
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: selectedFeedback.reward_amount_cents > 0 ? 1 : 0 }}>
                    {getBenefitsText(selectedFeedback)}
                  </Typography>
                  {selectedFeedback.reward_amount_cents > 0 && (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Reward: {formatReward(selectedFeedback.reward_amount_cents)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Status: {selectedFeedback.reward_paid ? 'Paid' : 'Pending'}
                        {selectedFeedback.reward_paid_at && (
                          <> • Paid on {formatDate(selectedFeedback.reward_paid_at)}</>
                        )}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Status History */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                    Status History
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={selectedFeedback.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[selectedFeedback.status]?.bgcolor || '#f1f5f9',
                        color: statusColors[selectedFeedback.status]?.color || '#64748b',
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Updated: {formatDate(selectedFeedback.updated_at)}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  Submitted: {formatDate(selectedFeedback.created_at)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Feedback Submission Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => {
          setFeedbackDialogOpen(false);
          fetchFeedback(); // Refresh list after submission
        }}
      />
    </Box>
  );
};

export default FeedbackHistory;


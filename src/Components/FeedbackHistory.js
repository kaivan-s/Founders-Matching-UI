import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
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

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const categoryIcons = {
  Bug: <BugReport />,
  UX: <DesignServices />,
  Feature: <Lightbulb />,
  Pricing: <AttachMoney />,
  Other: <MoreHoriz />,
};

const statusColors = {
  'New': { color: SLATE_500, bgcolor: alpha(SLATE_400, 0.1) },
  'Under review': { color: SKY, bgcolor: alpha(SKY, 0.1) },
  'Planned': { color: NAVY, bgcolor: alpha(NAVY, 0.1) },
  'In progress': { color: '#f59e0b', bgcolor: alpha('#f59e0b', 0.1) },
  'Implemented': { color: TEAL, bgcolor: alpha(TEAL, 0.1) },
  'Rejected': { color: '#ef4444', bgcolor: alpha('#ef4444', 0.1) },
};

const FeedbackHistory = () => {
  const { user } = useUser();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

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
    const dollars = cents / 100;
    return `$${dollars.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
        <Button onClick={fetchFeedback} variant="outlined" sx={{ borderColor: TEAL, color: TEAL }}>
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
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
            My Feedback & Benefits
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
            Track your feedback and rewards
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setFeedbackDialogOpen(true)}
          sx={{
            bgcolor: TEAL,
            '&:hover': {
              bgcolor: TEAL_LIGHT,
            },
            textTransform: 'none',
          }}
        >
          Give Feedback
        </Button>
      </Box>

      {/* Summary Section */}
      {feedback.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              bgcolor: '#fff',
              border: '1px solid',
              borderColor: SLATE_200,
              borderRadius: 2,
              p: 3,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
              Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: SLATE_900 }}>
                  {totalFeedback}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  You've submitted {totalFeedback} {totalFeedback === 1 ? 'feedback item' : 'feedback items'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEAL }}>
                  {implementedCount}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  {implementedCount === 1 ? 'Implemented' : 'Implemented'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: TEAL }}>
                  {activeBenefitsCount}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  Active benefits
                </Typography>
              </Box>
            </Box>
          </Box>
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
              bgcolor: '#fff',
              borderRadius: 2,
              p: 6,
              border: '1px solid',
              borderColor: SLATE_200,
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
                borderRadius: 2,
                bgcolor: alpha(TEAL, 0.1),
                mb: 3,
              }}
            >
              <Lightbulb sx={{ fontSize: 32, color: TEAL }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700, color: SLATE_900 }}>
              No feedback yet
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
              Share your ideas, report bugs, or suggest improvements. We value your input!
            </Typography>
            <Button
              variant="contained"
              onClick={() => setFeedbackDialogOpen(true)}
              sx={{
                bgcolor: TEAL,
                '&:hover': {
                  bgcolor: TEAL_LIGHT,
                },
                textTransform: 'none',
              }}
            >
              Submit Your First Feedback
            </Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflowY: 'auto', pr: 1,
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: SLATE_200,
            borderRadius: '3px',
            '&:hover': {
              background: SLATE_400,
            },
          },
        }}>
          {feedback.map((item) => {
            const statusStyle = statusColors[item.status] || statusColors['New'];
            const reward = formatReward(item.reward_amount_cents);

            return (
              <Box
                key={item.id}
                onClick={() => {
                  setSelectedFeedback(item);
                  setDetailDialogOpen(true);
                }}
                sx={{
                  mb: 2,
                  bgcolor: '#fff',
                  border: '1px solid',
                  borderColor: SLATE_200,
                  borderRadius: 2,
                  p: 2.5,
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: TEAL,
                    boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ color: TEAL, display: 'flex', alignItems: 'center' }}>
                        {categoryIcons[item.category] || categoryIcons.Other}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        {item.title}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        mb: 1.5,
                        color: SLATE_500,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
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
                          bgcolor: alpha(TEAL, 0.1),
                          color: TEAL,
                          border: `1px solid ${alpha(TEAL, 0.3)}`,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          bgcolor: statusStyle.bgcolor,
                          color: statusStyle.color,
                          border: `1px solid ${alpha(statusStyle.color, 0.3)}`,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 24,
                        }}
                      />
                      <Typography variant="caption" sx={{ ml: 'auto', color: SLATE_400 }}>
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
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: item.reward_amount_cents > 0 && item.reward_paid 
                          ? alpha(TEAL, 0.05) 
                          : item.reward_amount_cents > 0 
                          ? alpha('#f59e0b', 0.05) 
                          : BG,
                        border: '1px solid',
                        borderColor: item.reward_amount_cents > 0 && item.reward_paid 
                          ? alpha(TEAL, 0.2) 
                          : item.reward_amount_cents > 0 
                          ? alpha('#f59e0b', 0.2) 
                          : SLATE_200,
                      }}
                    >
                      <CardGiftcard
                        sx={{
                          fontSize: 16,
                          color: item.reward_amount_cents > 0 && item.reward_paid 
                            ? TEAL 
                            : item.reward_amount_cents > 0 
                            ? '#f59e0b' 
                            : SLATE_400,
                        }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          color: item.reward_amount_cents > 0 && item.reward_paid 
                            ? TEAL 
                            : item.reward_amount_cents > 0 
                            ? '#f59e0b' 
                            : SLATE_500,
                          fontWeight: item.reward_amount_cents > 0 ? 500 : 400,
                        }}
                      >
                        {getBenefitsText(item)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
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
            borderRadius: 2,
          },
        }}
      >
        {selectedFeedback && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Feedback Details
              </Typography>
              <IconButton onClick={() => setDetailDialogOpen(false)} size="small" sx={{ color: SLATE_500 }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5, color: SLATE_500, fontWeight: 600 }}>
                  Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
                  {selectedFeedback.title}
                </Typography>

                <Typography variant="subtitle2" sx={{ mb: 0.5, color: SLATE_500, fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap', color: SLATE_900, lineHeight: 1.6 }}>
                  {selectedFeedback.description}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={selectedFeedback.category}
                    size="small"
                    icon={categoryIcons[selectedFeedback.category] || categoryIcons.Other}
                    sx={{
                      bgcolor: alpha(TEAL, 0.1),
                      color: TEAL,
                      border: `1px solid ${alpha(TEAL, 0.3)}`,
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                  <Chip
                    label={selectedFeedback.status}
                    size="small"
                    sx={{
                      bgcolor: statusColors[selectedFeedback.status]?.bgcolor || alpha(SLATE_400, 0.1),
                      color: statusColors[selectedFeedback.status]?.color || SLATE_500,
                      border: `1px solid ${alpha(statusColors[selectedFeedback.status]?.color || SLATE_400, 0.3)}`,
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                </Box>

                {/* Benefits Section */}
                <Box
                  sx={{
                    p: 2,
                    bgcolor: selectedFeedback.reward_amount_cents > 0 && selectedFeedback.reward_paid 
                      ? alpha(TEAL, 0.05) 
                      : selectedFeedback.reward_amount_cents > 0 
                      ? alpha('#f59e0b', 0.05) 
                      : BG,
                    borderRadius: 2,
                    mb: 2,
                    border: '1px solid',
                    borderColor: selectedFeedback.reward_amount_cents > 0 && selectedFeedback.reward_paid 
                      ? alpha(TEAL, 0.2) 
                      : selectedFeedback.reward_amount_cents > 0 
                      ? alpha('#f59e0b', 0.2) 
                      : SLATE_200,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CardGiftcard
                      sx={{
                        fontSize: 20,
                        color: selectedFeedback.reward_amount_cents > 0 && selectedFeedback.reward_paid 
                          ? TEAL 
                          : selectedFeedback.reward_amount_cents > 0 
                          ? '#f59e0b' 
                          : SLATE_400,
                      }}
                    />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                      Benefits
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mb: selectedFeedback.reward_amount_cents > 0 ? 1 : 0, color: SLATE_900 }}>
                    {getBenefitsText(selectedFeedback)}
                  </Typography>
                  {selectedFeedback.reward_amount_cents > 0 && (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: SLATE_900 }}>
                        Reward: {formatReward(selectedFeedback.reward_amount_cents)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>
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
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: SLATE_500 }}>
                    Status History
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={selectedFeedback.status}
                      size="small"
                      sx={{
                        bgcolor: statusColors[selectedFeedback.status]?.bgcolor || alpha(SLATE_400, 0.1),
                        color: statusColors[selectedFeedback.status]?.color || SLATE_500,
                        border: `1px solid ${alpha(statusColors[selectedFeedback.status]?.color || SLATE_400, 0.3)}`,
                        fontSize: '0.7rem',
                        height: 24,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: SLATE_500 }}>
                      Updated: {formatDate(selectedFeedback.updated_at)}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="caption" sx={{ color: SLATE_400 }}>
                  Submitted: {formatDate(selectedFeedback.created_at)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
              <Button 
                onClick={() => setDetailDialogOpen(false)}
                sx={{ color: SLATE_500 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Feedback Submission Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => {
          setFeedbackDialogOpen(false);
          fetchFeedback();
        }}
      />
    </Box>
  );
};

export default FeedbackHistory;

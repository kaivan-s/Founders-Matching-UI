import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  alpha,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Business,
  CheckCircle,
  Close,
  AccessTime,
  Cancel,
  Inbox,
  Send,
  LocationOn,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const MyApplications = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [withdrawing, setWithdrawing] = useState(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);
  
  // Withdraw dialog
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [appToWithdraw, setAppToWithdraw] = useState(null);

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/seeker/applications`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleWithdraw = async () => {
    if (!appToWithdraw) return;
    
    setWithdrawing(appToWithdraw.id);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/seeker/applications/${appToWithdraw.id}/withdraw`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw');
      }
      
      setSuccess('Application withdrawn successfully');
      setWithdrawDialogOpen(false);
      setAppToWithdraw(null);
      fetchApplications();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawing(null);
    }
  };

  const getTimeSince = (timestamp) => {
    if (!timestamp) return 'Recently';
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AccessTime sx={{ fontSize: 16 }} />;
      case 'accepted': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'rejected': return <Close sx={{ fontSize: 16 }} />;
      case 'withdrawn': return <Cancel sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: alpha(SKY, 0.1), color: SKY };
      case 'accepted': return { bg: alpha(TEAL, 0.1), color: TEAL };
      case 'rejected': return { bg: alpha('#ef4444', 0.1), color: '#ef4444' };
      case 'withdrawn': return { bg: alpha(SLATE_400, 0.1), color: SLATE_400 };
      default: return { bg: alpha(SLATE_400, 0.1), color: SLATE_400 };
    }
  };

  const filteredApplications = applications.filter(app => {
    if (tabValue === 0) return app.status === 'pending';
    if (tabValue === 1) return app.status === 'accepted';
    if (tabValue === 2) return app.status === 'rejected' || app.status === 'withdrawn';
    return true;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: { xs: 2, sm: 3 },
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'flex-start' }, 
        mb: 3,
        gap: { xs: 2, sm: 0 },
      }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            My Applications
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
            Track your applications to projects
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={() => navigate('/find-project')}
          sx={{ 
            bgcolor: TEAL, 
            '&:hover': { bgcolor: TEAL_LIGHT },
            alignSelf: { xs: 'stretch', sm: 'flex-start' },
          }}
        >
          Find More Projects
        </Button>
      </Box>

      {/* Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .MuiTabs-indicator': { bgcolor: TEAL },
        }}
      >
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Pending</span>
              {pendingCount > 0 && (
                <Chip 
                  label={pendingCount} 
                  size="small" 
                  sx={{ 
                    bgcolor: SKY, 
                    color: '#fff', 
                    height: 20, 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }} 
                />
              )}
            </Box>
          } 
        />
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Accepted</span>
              {acceptedCount > 0 && (
                <Chip 
                  label={acceptedCount} 
                  size="small" 
                  sx={{ 
                    bgcolor: TEAL, 
                    color: '#fff', 
                    height: 20, 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }} 
                />
              )}
            </Box>
          } 
        />
        <Tab label="Closed" />
      </Tabs>

      {/* Empty State */}
      {filteredApplications.length === 0 ? (
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          px: { xs: 2, sm: 0 },
        }}>
          <Box
            sx={{
              textAlign: 'center',
              bgcolor: '#fff',
              borderRadius: 2,
              p: { xs: 4, sm: 6 },
              border: '1px solid',
              borderColor: SLATE_200,
              maxWidth: { xs: '100%', sm: '400px' },
              width: '100%',
            }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: 2,
              bgcolor: alpha(SKY, 0.1),
              mb: 3,
            }}>
              <Inbox sx={{ fontSize: 40, color: SKY }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: SLATE_900 }}>
              {tabValue === 0 ? 'No pending applications' : 
               tabValue === 1 ? 'No accepted applications yet' : 
               'No closed applications'}
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
              {tabValue === 0 
                ? 'Start exploring projects and apply to the ones that match your interests.'
                : 'Applications you\'ve submitted will show up here.'}
            </Typography>
            {tabValue === 0 && (
              <Button
                variant="contained"
                onClick={() => navigate('/find-project')}
                sx={{ bgcolor: SKY, '&:hover': { bgcolor: alpha(SKY, 0.85) } }}
              >
                Find Projects
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        /* Applications List */
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          pr: 1,
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AnimatePresence>
              {filteredApplications.map((app, index) => {
                const project = app.project || {};
                const owner = app.project_owner || {};
                const timeSince = getTimeSince(app.created_at);
                const statusStyle = getStatusColor(app.status);
                
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <Card
                      sx={{
                        border: '1px solid',
                        borderColor: SLATE_200,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: statusStyle.color,
                          boxShadow: `0 4px 12px ${alpha(statusStyle.color, 0.1)}`,
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', gap: 2 }}>
                          {/* Project Icon */}
                          <Box sx={{ 
                            width: { xs: 48, sm: 56 }, 
                            height: { xs: 48, sm: 56 }, 
                            borderRadius: 2,
                            bgcolor: alpha(SKY, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <Business sx={{ fontSize: { xs: 24, sm: 28 }, color: SKY }} />
                          </Box>

                          {/* Info */}
                          <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900, wordBreak: 'break-word' }}>
                                {project.title}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(app.status)}
                                label={app.status}
                                size="small"
                                sx={{
                                  textTransform: 'capitalize',
                                  bgcolor: statusStyle.bg,
                                  color: statusStyle.color,
                                  fontWeight: 600,
                                  '& .MuiChip-icon': { color: statusStyle.color },
                                }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Typography variant="caption" sx={{ color: SLATE_400 }}>
                                Applied {timeSince}
                              </Typography>
                              {project.stage && (
                                <Chip
                                  label={project.stage}
                                  size="small"
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    bgcolor: alpha(SLATE_400, 0.1),
                                    color: SLATE_500,
                                    textTransform: 'capitalize',
                                  }}
                                />
                              )}
                            </Box>

                            {project.description && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: SLATE_500, 
                                  mb: 1.5,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {project.description}
                              </Typography>
                            )}

                            {/* Owner Info */}
                            {owner.name && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  src={owner.profile_picture_url}
                                  sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                                >
                                  {owner.name?.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                                  by {owner.name}
                                </Typography>
                                {owner.location && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                    <LocationOn sx={{ fontSize: 12, color: SLATE_400 }} />
                                    <Typography variant="caption" sx={{ color: SLATE_400 }}>
                                      {owner.location}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            )}

                            {/* Rejection Reason */}
                            {app.status === 'rejected' && app.rejection_reason && (
                              <Box sx={{ 
                                mt: 2, 
                                p: 1.5, 
                                borderRadius: 1, 
                                bgcolor: alpha('#ef4444', 0.05),
                                border: '1px solid',
                                borderColor: alpha('#ef4444', 0.2),
                              }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef4444' }}>
                                  Feedback from founder:
                                </Typography>
                                <Typography variant="body2" sx={{ color: SLATE_500, mt: 0.5 }}>
                                  {app.rejection_reason}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Actions */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: { xs: 'row', sm: 'column' }, 
                            gap: 1, 
                            flexShrink: 0,
                            width: { xs: '100%', sm: 'auto' },
                            mt: { xs: 1, sm: 0 },
                          }}>
                            {app.status === 'accepted' && (
                              <Button
                                variant="contained"
                                size="small"
                                fullWidth
                                onClick={() => navigate('/workspaces')}
                                sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
                              >
                                Go to Workspace
                              </Button>
                            )}
                            {app.status === 'pending' && (
                              <Button
                                variant="outlined"
                                size="small"
                                fullWidth
                                startIcon={<Cancel />}
                                onClick={() => {
                                  setAppToWithdraw(app);
                                  setWithdrawDialogOpen(true);
                                }}
                                sx={{ 
                                  borderColor: SLATE_200, 
                                  color: SLATE_500,
                                  '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
                                }}
                              >
                                Withdraw
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Box>
        </Box>
      )}

      {/* Withdraw Confirmation Dialog */}
      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            mx: { xs: 2, sm: 3 },
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
          } 
        }}
      >
        <DialogTitle sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Withdraw Application?
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ color: SLATE_500, wordBreak: 'break-word' }}>
            Are you sure you want to withdraw your application to <strong>{appToWithdraw?.project?.title}</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
        }}>
          <Button 
            onClick={() => setWithdrawDialogOpen(false)} 
            sx={{ color: SLATE_500, order: { xs: 2, sm: 1 } }}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleWithdraw}
            disabled={withdrawing === appToWithdraw?.id}
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, order: { xs: 1, sm: 2 } }}
            fullWidth
          >
            {withdrawing === appToWithdraw?.id ? <CircularProgress size={16} color="inherit" /> : 'Withdraw'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyApplications;

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Divider,
  Tabs,
  Tab,
  Card,
  CardContent,
  alpha,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Close,
  LocationOn,
  Verified,
  Business,
  ExpandMore,
  ExpandLess,
  Psychology,
  Videocam,
  Mic,
  LinkedIn,
  GitHub,
  Language,
  Work,
  Inbox,
  Lock,
  AutoAwesome,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';
import FirstMatchCoaching from './FirstMatchCoaching';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const OwnerApplications = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [responding, setResponding] = useState(null);
  
  // Tab state
  const [tabValue, setTabValue] = useState(0); // Status tabs: 0=Pending, 1=Accepted, 2=Rejected
  const [selectedProjectId, setSelectedProjectId] = useState(null); // Project filter
  
  // Detail dialog state
  const [selectedApp, setSelectedApp] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [expandedProfile, setExpandedProfile] = useState(false);
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [appToReject, setAppToReject] = useState(null);
  
  // First match coaching
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [newMatchId, setNewMatchId] = useState(null);
  
  // User plan for paywall
  const [userPlan, setUserPlan] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const FREE_VISIBLE_LIMIT = 2; // Free users can only see 2 applications

  // Fetch user's plan
  useEffect(() => {
    const fetchPlan = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${API_BASE}/billing/plans`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.current_plan || 'FREE');
        }
      } catch {
        setUserPlan('FREE');
      }
    };
    fetchPlan();
  }, [user?.id]);
  
  // Direct checkout to Pro
  const handleDirectCheckout = async () => {
    if (!user?.id) return;
    
    setCheckoutLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/founder/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(false);
    }
  };

  const fetchApplications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/owner/applications`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplications(data.applications || []);
      setStats({
        pending: data.pending_count || 0,
        accepted: (data.applications || []).filter(a => a.status === 'accepted').length,
        rejected: (data.applications || []).filter(a => a.status === 'rejected').length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleRespond = async (appId, response, reason = null) => {
    setResponding(appId);
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/owner/applications/${appId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ 
          response,
          rejection_reason: reason,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to respond');
      }

      const data = await res.json();
      
      // Refresh applications list
      fetchApplications();
      
      // Close dialogs
      setDetailDialogOpen(false);
      setRejectDialogOpen(false);
      setRejectionReason('');
      setAppToReject(null);

      if (response === 'accept') {
        setSuccess('Application accepted! A workspace has been created.');
        window.dispatchEvent(new Event('interestAccepted'));
        
        // Show coaching modal
        if (data.match_id) {
          setNewMatchId(data.match_id);
          setCoachingOpen(true);
        }
      } else {
        setSuccess('Application rejected.');
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResponding(null);
    }
  };

  const handleOpenDetail = (app) => {
    setSelectedApp(app);
    setDetailDialogOpen(true);
    setExpandedProfile(false);
  };

  const handleOpenRejectDialog = (app) => {
    setAppToReject(app);
    setRejectDialogOpen(true);
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

  // Extract unique projects from applications
  const projects = React.useMemo(() => {
    const projectMap = new Map();
    applications.forEach(app => {
      if (app.project?.id && !projectMap.has(app.project.id)) {
        projectMap.set(app.project.id, {
          id: app.project.id,
          title: app.project.title || 'Untitled Project',
          pendingCount: 0,
        });
      }
      if (app.project?.id && app.status === 'pending') {
        const proj = projectMap.get(app.project.id);
        if (proj) proj.pendingCount++;
      }
    });
    return Array.from(projectMap.values());
  }, [applications]);

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Filter applications by project and status
  const filteredApplications = applications.filter(app => {
    // Filter by project
    if (selectedProjectId && app.project?.id !== selectedProjectId) return false;
    
    // Filter by status tab
    if (tabValue === 0) return app.status === 'pending';
    if (tabValue === 1) return app.status === 'accepted';
    if (tabValue === 2) return app.status === 'rejected' || app.status === 'withdrawn';
    return true;
  });

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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Applications
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
          {stats.pending} pending {stats.pending === 1 ? 'application' : 'applications'} to your projects
        </Typography>
      </Box>

      {/* No applications at all - show global empty state */}
      {applications.length === 0 ? (
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
              bgcolor: alpha(TEAL, 0.1),
              mb: 3,
            }}>
              <Inbox sx={{ fontSize: 40, color: TEAL }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: SLATE_900 }}>
              No applications yet
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              When people apply to join your projects, they'll appear here.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
      {/* Project Tabs */}
      {projects.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}>
            Select Project
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {projects.map((project) => (
              <Chip
                key={project.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <span>{project.title}</span>
                    {project.pendingCount > 0 && (
                      <Box
                        sx={{
                          bgcolor: selectedProjectId === project.id ? '#fff' : TEAL,
                          color: selectedProjectId === project.id ? TEAL : '#fff',
                          borderRadius: '50%',
                          width: 18,
                          height: 18,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                        }}
                      >
                        {project.pendingCount}
                      </Box>
                    )}
                  </Box>
                }
                onClick={() => setSelectedProjectId(project.id)}
                sx={{
                  cursor: 'pointer',
                  fontWeight: 600,
                  bgcolor: selectedProjectId === project.id ? TEAL : alpha(SLATE_200, 0.5),
                  color: selectedProjectId === project.id ? '#fff' : SLATE_900,
                  border: '1px solid',
                  borderColor: selectedProjectId === project.id ? TEAL : SLATE_200,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: selectedProjectId === project.id ? TEAL : alpha(TEAL, 0.1),
                    borderColor: TEAL,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Status Tabs */}
      <Tabs 
        value={tabValue} 
        onChange={(e, v) => setTabValue(v)}
        sx={{ 
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 2 },
          '& .MuiTabs-indicator': { bgcolor: TEAL },
        }}
      >
        <Tab 
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>Pending</span>
              {filteredApplications.filter(a => a.status === 'pending').length > 0 && tabValue !== 0 && (
                <Chip 
                  label={applications.filter(a => a.project?.id === selectedProjectId && a.status === 'pending').length} 
                  size="small" 
                  sx={{ 
                    bgcolor: alpha(TEAL, 0.1), 
                    color: TEAL, 
                    height: 18, 
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }} 
                />
              )}
            </Box>
          } 
        />
        <Tab label="Accepted" />
        <Tab label="Rejected" />
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
              bgcolor: alpha(TEAL, 0.1),
              mb: 3,
            }}>
              <Inbox sx={{ fontSize: 40, color: TEAL }} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: SLATE_900 }}>
              {tabValue === 0 ? 'No pending applications' : 
               tabValue === 1 ? 'No accepted applications yet' : 
               'No rejected applications'}
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              {tabValue === 0 
                ? `No pending applications for ${projects.find(p => p.id === selectedProjectId)?.title || 'this project'}.`
                : 'Applications you respond to will show up here.'}
            </Typography>
          </Box>
        </Box>
      ) : (
        /* Applications Grid - 3 cards per row */
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          pr: 1,
        }}>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}>
            {/* For FREE users on pending tab, only show first 2 applications */}
            {(userPlan === 'FREE' && tabValue === 0 
              ? filteredApplications.slice(0, FREE_VISIBLE_LIMIT) 
              : filteredApplications
            ).map((app, index) => {
              const applicant = app.applicant || {};
              const timeSince = getTimeSince(app.created_at);
              
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: SLATE_200,
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        borderColor: TEAL,
                        boxShadow: `0 8px 24px ${alpha(TEAL, 0.15)}`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {/* Header with Avatar and Time */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
                        <Avatar
                          src={applicant.profile_picture_url}
                          sx={{ 
                            width: { xs: 48, sm: 56 }, 
                            height: { xs: 48, sm: 56 }, 
                            bgcolor: alpha(SKY, 0.1),
                            color: SKY,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            fontWeight: 700,
                          }}
                        >
                          {applicant.name?.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900, wordBreak: 'break-word', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                              {applicant.name}
                            </Typography>
                            {applicant.verification?.tier !== 'UNVERIFIED' && (
                              <Verified sx={{ fontSize: 16, color: TEAL }} />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption" sx={{ color: SLATE_400 }}>
                              {timeSince}
                            </Typography>
                            {applicant.location && (
                              <>
                                <Typography variant="caption" sx={{ color: SLATE_400 }}>•</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  <LocationOn sx={{ fontSize: 12, color: SLATE_400 }} />
                                  <Typography variant="caption" sx={{ color: SLATE_400 }}>
                                    {applicant.location}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Headline */}
                      {applicant.headline && (
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
                          {applicant.headline}
                        </Typography>
                      )}

                      {/* Verification badges - only show if verified */}
                      {(applicant.linkedin_verified || applicant.github_verified) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                          {applicant.linkedin_verified && (
                            <Chip
                              icon={<LinkedIn sx={{ fontSize: 14 }} />}
                              label="LinkedIn Verified"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                bgcolor: alpha('#0077b5', 0.1),
                                color: '#0077b5',
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: '#0077b5' },
                              }}
                            />
                          )}
                          {applicant.github_verified && (
                            <Chip
                              icon={<GitHub sx={{ fontSize: 14 }} />}
                              label="GitHub"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.65rem',
                                bgcolor: alpha('#333', 0.1),
                                color: '#333',
                                fontWeight: 600,
                                '& .MuiChip-icon': { color: '#333' },
                              }}
                            />
                          )}
                        </Box>
                      )}

                      {/* Skills Preview */}
                      {applicant.skills && applicant.skills.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {applicant.skills.slice(0, 3).map((skill, idx) => (
                            <Chip
                              key={idx}
                              label={skill}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.7rem',
                                bgcolor: alpha(SLATE_400, 0.1),
                                color: SLATE_500,
                              }}
                            />
                          ))}
                          {applicant.skills.length > 3 && (
                            <Chip
                              label={`+${applicant.skills.length - 3}`}
                              size="small"
                              sx={{ height: 22, fontSize: '0.7rem', bgcolor: BG, color: SLATE_400 }}
                            />
                          )}
                        </Box>
                      )}

                      {/* Spacer to push actions to bottom */}
                      <Box sx={{ flex: 1 }} />

                      {/* Actions (only for pending) */}
                      {app.status === 'pending' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 'auto', flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{ 
                              flex: 1,
                              minWidth: { xs: 0, sm: 'auto' },
                              bgcolor: TEAL, 
                              fontWeight: 600,
                              '&:hover': { bgcolor: TEAL_LIGHT },
                              fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                            }}
                            startIcon={<CheckCircle sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRespond(app.id, 'accept');
                            }}
                            disabled={responding === app.id}
                          >
                            {responding === app.id ? <CircularProgress size={16} color="inherit" /> : 'Accept'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRejectDialog(app);
                            }}
                            disabled={responding === app.id}
                            sx={{ 
                              borderColor: SLATE_200, 
                              color: SLATE_500,
                              fontWeight: 600,
                              minWidth: 'auto',
                              px: 1.5,
                              '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
                            }}
                          >
                            <Close sx={{ fontSize: 18 }} />
                          </Button>
                        </Box>
                      )}

                      {/* Status badge for non-pending */}
                      {app.status !== 'pending' && (
                        <Chip
                          label={app.status}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            bgcolor: app.status === 'accepted' ? alpha(TEAL, 0.1) : alpha(SLATE_400, 0.1),
                            color: app.status === 'accepted' ? TEAL : SLATE_500,
                            fontWeight: 600,
                            alignSelf: 'flex-start',
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
            
            {/* Upgrade Card - shown as 3rd card for FREE users with more applications */}
            {userPlan === 'FREE' && tabValue === 0 && filteredApplications.length > FREE_VISIBLE_LIMIT && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card
                  sx={{
                    border: '2px dashed',
                    borderColor: alpha(TEAL, 0.3),
                    bgcolor: alpha(TEAL, 0.02),
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: { xs: 240, sm: 280 },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        bgcolor: alpha(TEAL, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      <Lock sx={{ fontSize: 24, color: TEAL }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5 }}>
                      +{filteredApplications.length - FREE_VISIBLE_LIMIT} more {filteredApplications.length - FREE_VISIBLE_LIMIT === 1 ? 'applicant' : 'applicants'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: SLATE_500, mb: 2, px: 1 }}>
                      Upgrade to Pro to view all interested profiles and never miss a great match
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                      <Typography sx={{ fontSize: '0.85rem', color: SLATE_400, textDecoration: 'line-through' }}>
                        $15
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: SLATE_500 }}>
                        /mo
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleDirectCheckout}
                      disabled={checkoutLoading}
                      startIcon={checkoutLoading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesome sx={{ fontSize: 16 }} />}
                      sx={{
                        bgcolor: TEAL,
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 2,
                        '&:hover': { bgcolor: TEAL_LIGHT },
                        '&.Mui-disabled': {
                          bgcolor: alpha(TEAL, 0.6),
                          color: '#fff',
                        },
                      }}
                    >
                      {checkoutLoading ? 'Loading...' : 'Unlock All'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Box>
        </Box>
      )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            mx: { xs: 1, sm: 3 },
            width: { xs: 'calc(100% - 16px)', sm: '100%' },
            maxHeight: { xs: '95vh', sm: '90vh' },
          } 
        }}
      >
        {selectedApp && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200, pb: 2, px: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Application Details
                </Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
              {/* Applicant Header */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: { xs: 2, sm: 3 }, mb: 3 }}>
                <Avatar
                  src={selectedApp.applicant?.profile_picture_url}
                  sx={{ width: { xs: 64, sm: 80 }, height: { xs: 64, sm: 80 }, bgcolor: alpha(SKY, 0.1), color: SKY, fontSize: { xs: '1.5rem', sm: '2rem' } }}
                >
                  {selectedApp.applicant?.name?.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, wordBreak: 'break-word', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      {selectedApp.applicant?.name}
                    </Typography>
                    {selectedApp.applicant?.verification?.tier !== 'UNVERIFIED' && (
                      <Verified sx={{ color: TEAL }} />
                    )}
                  </Box>
                  {selectedApp.applicant?.headline && (
                    <Typography variant="body1" sx={{ color: SLATE_500, mb: 1 }}>
                      {selectedApp.applicant.headline}
                    </Typography>
                  )}
                  {selectedApp.applicant?.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 0.5 }}>
                      <LocationOn sx={{ fontSize: 16, color: SLATE_400 }} />
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>
                        {selectedApp.applicant.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Project they applied to */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(SKY, 0.05),
                border: '1px solid',
                borderColor: alpha(SKY, 0.2),
                mb: 3,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Business sx={{ color: SKY }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SKY }}>
                    Applied to your project
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {selectedApp.project?.title}
                </Typography>
              </Box>

              {/* Application Content */}
              {selectedApp.interest_reason && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                    Why they're interested
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                    {selectedApp.interest_reason}
                  </Typography>
                </Box>
              )}

              {selectedApp.value_proposition && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                    What they bring
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                    {selectedApp.value_proposition}
                  </Typography>
                </Box>
              )}

              {/* Custom Question Answers */}
              {selectedApp.question_answers && Object.keys(selectedApp.question_answers).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Psychology sx={{ color: TEAL }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                      Application Answers
                    </Typography>
                  </Box>
                  {Object.entries(selectedApp.question_answers).map(([question, answer], idx) => (
                    <Box 
                      key={idx} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: alpha(TEAL, 0.03),
                        border: '1px solid',
                        borderColor: alpha(TEAL, 0.1),
                        mb: 2,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                        Q: {question}
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                        {answer}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Media Intros */}
              {(selectedApp.video_intro_url || selectedApp.voice_intro_url) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
                    Personal Introduction
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {selectedApp.video_intro_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={selectedApp.video_intro_url}
                        target="_blank"
                        startIcon={<Videocam />}
                        sx={{ borderColor: alpha(SKY, 0.3), color: SKY, flex: { xs: 1, sm: 'none' } }}
                      >
                        Watch Video
                      </Button>
                    )}
                    {selectedApp.voice_intro_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={selectedApp.voice_intro_url}
                        target="_blank"
                        startIcon={<Mic />}
                        sx={{ borderColor: alpha(TEAL, 0.3), color: TEAL, flex: { xs: 1, sm: 'none' } }}
                      >
                        Listen to Voice
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Expandable Full Profile */}
              <Divider sx={{ my: 2 }} />
              <Button
                fullWidth
                onClick={() => setExpandedProfile(!expandedProfile)}
                endIcon={expandedProfile ? <ExpandLess /> : <ExpandMore />}
                sx={{ color: SLATE_500, justifyContent: 'space-between', textTransform: 'none' }}
              >
                {expandedProfile ? 'Hide Full Profile' : 'View Full Profile'}
              </Button>
              
              <Collapse in={expandedProfile}>
                <Box sx={{ pt: 2 }}>
                  {selectedApp.applicant?.bio && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: SLATE_900 }}>
                        About
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                        {selectedApp.applicant.bio}
                      </Typography>
                    </Box>
                  )}

                  {selectedApp.applicant?.skills && selectedApp.applicant.skills.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selectedApp.applicant.skills.map((skill, idx) => (
                          <Chip
                            key={idx}
                            label={skill}
                            size="small"
                            sx={{ bgcolor: alpha(SLATE_400, 0.1), color: SLATE_500 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {selectedApp.applicant?.work_preferences && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                        <Work sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                        Work Preferences
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedApp.applicant.work_preferences.commitment && (
                          <Chip 
                            label={selectedApp.applicant.work_preferences.commitment.replace('_', ' ')} 
                            size="small" 
                            sx={{ textTransform: 'capitalize', bgcolor: alpha(TEAL, 0.1), color: TEAL }}
                          />
                        )}
                        {selectedApp.applicant.work_preferences.location_preference && (
                          <Chip 
                            label={selectedApp.applicant.work_preferences.location_preference.replace('_', ' ')} 
                            size="small" 
                            sx={{ textTransform: 'capitalize', bgcolor: alpha(SKY, 0.1), color: SKY }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Social Links */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {selectedApp.applicant?.linkedin_url && (
                      <IconButton 
                        component="a" 
                        href={selectedApp.applicant.linkedin_url}
                        target="_blank"
                        size="small"
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <LinkedIn />
                      </IconButton>
                    )}
                    {selectedApp.applicant?.github_url && (
                      <IconButton 
                        component="a" 
                        href={selectedApp.applicant.github_url}
                        target="_blank"
                        size="small"
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <GitHub />
                      </IconButton>
                    )}
                    {selectedApp.applicant?.website_url && (
                      <IconButton 
                        component="a" 
                        href={selectedApp.applicant.website_url}
                        target="_blank"
                        size="small"
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <Language />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Collapse>
            </DialogContent>
            
            {selectedApp.status === 'pending' && (
              <DialogActions sx={{ 
                px: { xs: 2, sm: 3 }, 
                pb: 2, 
                borderTop: '1px solid', 
                borderColor: SLATE_200, 
                gap: 1,
                flexDirection: { xs: 'column', sm: 'row' },
              }}>
                <Button
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenRejectDialog(selectedApp);
                  }}
                  fullWidth
                  sx={{ flex: 1, borderColor: SLATE_200, color: SLATE_500, '&:hover': { borderColor: '#ef4444', color: '#ef4444' }, order: { xs: 2, sm: 1 } }}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  startIcon={responding === selectedApp.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                  onClick={() => handleRespond(selectedApp.id, 'accept')}
                  disabled={responding === selectedApp.id}
                  fullWidth
                  sx={{ flex: 1, bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT }, order: { xs: 1, sm: 2 } }}
                >
                  Accept
                </Button>
              </DialogActions>
            )}
          </>
        )}
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
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
            Reject Application
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
            Would you like to provide feedback? (optional)
          </Typography>
          <TextField
            label="Reason for rejection"
            multiline
            rows={3}
            fullWidth
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="This helps the applicant improve their next application..."
          />
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 },
        }}>
          <Button 
            onClick={() => setRejectDialogOpen(false)} 
            sx={{ color: SLATE_500, order: { xs: 2, sm: 1 } }}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleRespond(appToReject?.id, 'reject', rejectionReason)}
            disabled={responding === appToReject?.id}
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, order: { xs: 1, sm: 2 } }}
            fullWidth
          >
            {responding === appToReject?.id ? <CircularProgress size={16} color="inherit" /> : 'Reject Application'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* First Match Coaching */}
      <FirstMatchCoaching
        matchId={newMatchId}
        open={coachingOpen}
        onClose={() => {
          setCoachingOpen(false);
          setNewMatchId(null);
        }}
        onOpenChat={() => {
          setCoachingOpen(false);
          navigate('/workspaces');
        }}
        onStartFounderDate={() => {
          setCoachingOpen(false);
          navigate('/workspaces');
        }}
      />
    </Box>
  );
};

export default OwnerApplications;

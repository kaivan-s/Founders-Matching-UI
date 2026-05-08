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
  const [tabValue, setTabValue] = useState(0);
  
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

  const filteredApplications = applications.filter(app => {
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
      py: 3,
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
          Applications
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
          {stats.pending} pending {stats.pending === 1 ? 'application' : 'applications'} to your projects
        </Typography>
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
              {stats.pending > 0 && (
                <Chip 
                  label={stats.pending} 
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
        }}>
          <Box
            sx={{
              textAlign: 'center',
              bgcolor: '#fff',
              borderRadius: 2,
              p: 6,
              border: '1px solid',
              borderColor: SLATE_200,
              maxWidth: '400px',
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
                ? 'When founders apply to your projects, they\'ll appear here.'
                : 'Applications you respond to will show up here.'}
            </Typography>
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
                const applicant = app.applicant || {};
                const project = app.project || {};
                const timeSince = getTimeSince(app.created_at);
                
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
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: SLATE_200,
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: TEAL,
                          boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                        },
                      }}
                      onClick={() => handleOpenDetail(app)}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          {/* Avatar */}
                          <Avatar
                            src={applicant.profile_picture_url}
                            sx={{ 
                              width: 56, 
                              height: 56, 
                              bgcolor: alpha(SKY, 0.1),
                              color: SKY,
                              fontSize: '1.25rem',
                              fontWeight: 700,
                            }}
                          >
                            {applicant.name?.split(' ').map(n => n[0]).join('')}
                          </Avatar>

                          {/* Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                                {applicant.name}
                              </Typography>
                              {applicant.verification?.tier !== 'UNVERIFIED' && (
                                <Verified sx={{ fontSize: 16, color: TEAL }} />
                              )}
                              <Typography variant="caption" sx={{ color: SLATE_400 }}>
                                • {timeSince}
                              </Typography>
                            </Box>

                            {applicant.headline && (
                              <Typography variant="body2" sx={{ color: SLATE_500, mb: 1 }}>
                                {applicant.headline}
                              </Typography>
                            )}

                            {/* Project applied to */}
                            <Box sx={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: 0.5,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              bgcolor: alpha(SKY, 0.1),
                              mb: 1,
                            }}>
                              <Business sx={{ fontSize: 14, color: SKY }} />
                              <Typography variant="caption" sx={{ color: SKY, fontWeight: 600 }}>
                                For: {project.title}
                              </Typography>
                            </Box>

                            {/* Skills Preview */}
                            {applicant.skills && applicant.skills.length > 0 && (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {applicant.skills.slice(0, 4).map((skill, idx) => (
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
                                {applicant.skills.length > 4 && (
                                  <Chip
                                    label={`+${applicant.skills.length - 4}`}
                                    size="small"
                                    sx={{ height: 22, fontSize: '0.7rem', bgcolor: BG, color: SLATE_400 }}
                                  />
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Actions (only for pending) */}
                          {app.status === 'pending' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRespond(app.id, 'accept');
                                }}
                                disabled={responding === app.id}
                                sx={{ 
                                  bgcolor: TEAL, 
                                  fontWeight: 600,
                                  '&:hover': { bgcolor: TEAL_LIGHT },
                                }}
                              >
                                {responding === app.id ? <CircularProgress size={16} color="inherit" /> : 'Accept'}
                              </Button>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Close />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRejectDialog(app);
                                }}
                                disabled={responding === app.id}
                                sx={{ 
                                  borderColor: SLATE_200, 
                                  color: SLATE_500,
                                  fontWeight: 600,
                                  '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
                                }}
                              >
                                Reject
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
                              }}
                            />
                          )}
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

      {/* Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        {selectedApp && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200, pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Application Details
                </Typography>
                <IconButton onClick={() => setDetailDialogOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              {/* Applicant Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Avatar
                  src={selectedApp.applicant?.profile_picture_url}
                  sx={{ width: 80, height: 80, bgcolor: alpha(SKY, 0.1), color: SKY, fontSize: '2rem' }}
                >
                  {selectedApp.applicant?.name?.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {selectedApp.video_intro_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={selectedApp.video_intro_url}
                        target="_blank"
                        startIcon={<Videocam />}
                        sx={{ borderColor: alpha(SKY, 0.3), color: SKY }}
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
                        sx={{ borderColor: alpha(TEAL, 0.3), color: TEAL }}
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
              <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid', borderColor: SLATE_200, gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Close />}
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenRejectDialog(selectedApp);
                  }}
                  sx={{ flex: 1, borderColor: SLATE_200, color: SLATE_500, '&:hover': { borderColor: '#ef4444', color: '#ef4444' } }}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  startIcon={responding === selectedApp.id ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                  onClick={() => handleRespond(selectedApp.id, 'accept')}
                  disabled={responding === selectedApp.id}
                  sx={{ flex: 1, bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
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
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Reject Application
          </Typography>
        </DialogTitle>
        <DialogContent>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} sx={{ color: SLATE_500 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleRespond(appToReject?.id, 'reject', rejectionReason)}
            disabled={responding === appToReject?.id}
            sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import { API_BASE } from '../config/api';
import {
  Business,
  People,
  CheckCircle,
  Schedule,
  TrendingUp,
  Message,
  Assignment,
  Visibility,
  Close,
  Notifications,
  NotificationsActive,
  CheckCircleOutline,
  Circle,
  Edit,
  Pending,
  Cancel,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import PartnerNavigation from './PartnerNavigation';
import PartnerOnboardingWizard from './PartnerOnboardingWizard';
import { supabase } from '../config/supabase';

const RequestDetailsDialog = ({ open, onClose, request, onRespond }) => {
  const [tabValue, setTabValue] = useState(0);
  const workspace = request?.workspace || {};
  const details = request?.workspace_details || {};
  const kpis = details.kpis || {};
  const decisions = details.decisions || {};
  const participants = details.participants || {};
  const projects = details.projects || [];

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {workspace.title || 'Workspace Details'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              From: {request?.founder?.name || 'Founder'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, flexShrink: 0 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Projects (${projects.length || 0})`} icon={<Business />} iconPosition="start" />
            <Tab label={`KPIs (${kpis.total || 0})`} icon={<TrendingUp />} iconPosition="start" />
            <Tab label={`Decisions (${decisions.total || 0})`} icon={<Assignment />} iconPosition="start" />
            <Tab label={`Founders (${participants.total || 0})`} icon={<People />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Projects Tab */}
        {tabValue === 0 && (
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {projects.length > 0 ? (
              <>
                {projects.map((project, idx) => (
                  <Box key={idx} sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Business color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {project.title || 'Untitled Project'}
                      </Typography>
                      {project.stage && (
                        <Chip 
                          label={project.stage} 
                          size="small" 
                          variant="outlined"
                          sx={{ ml: 'auto' }}
                        />
                      )}
                    </Box>
                    {project.description ? (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {project.description}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No description provided
                      </Typography>
                    )}
                  </Box>
                ))}
              </>
            ) : (
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2, fontStyle: 'italic' }}>
                  No project information available
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* KPIs Tab */}
        {tabValue === 1 && (
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {kpis.total > 0 ? (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  {kpis.done > 0 && (
                    <Chip label={`${kpis.done} Done`} size="small" color="success" />
                  )}
                  {kpis.in_progress > 0 && (
                    <Chip label={`${kpis.in_progress} In Progress`} size="small" color="primary" />
                  )}
                  {kpis.not_started > 0 && (
                    <Chip label={`${kpis.not_started} Not Started`} size="small" variant="outlined" />
                  )}
                </Box>
                <List>
                  {kpis.all && kpis.all.map((kpi, idx) => (
                    <ListItem key={idx} sx={{ border: '1px solid #e2e8f0', borderRadius: 1, mb: 1 }}>
                      <ListItemText
                        primary={kpi.label}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={kpi.status.replace('_', ' ')} 
                              size="small" 
                              color={
                                kpi.status === 'done' ? 'success' : 
                                kpi.status === 'in_progress' ? 'primary' : 
                                'default'
                              }
                              sx={{ mr: 1 }}
                            />
                            {(kpi.target_value || kpi.target_date) && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1, display: 'block', mt: 0.5 }}>
                                {kpi.target_value && <>Target: {kpi.target_value}</>}
                                {kpi.target_value && kpi.target_date && <> | </>}
                                {kpi.target_date && <>Target Date: {new Date(kpi.target_date).toLocaleDateString()}</>}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No KPIs defined yet
              </Typography>
            )}
          </Box>
        )}

        {/* Decisions Tab */}
        {tabValue === 2 && (
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {decisions.total > 0 ? (
              <List>
                {decisions.all && decisions.all.map((decision, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid #e2e8f0', borderRadius: 1, mb: 1 }}>
                    <ListItemText
                      primary={decision.content}
                      secondary={
                        <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                          {decision.tag && (
                            <Chip 
                              label={decision.tag} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {decision.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(decision.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No decisions recorded yet
              </Typography>
            )}
          </Box>
        )}

        {/* Founders Tab */}
        {tabValue === 3 && (
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {participants.total > 0 ? (
              <List>
                {participants.founders && participants.founders.map((founder, idx) => (
                  <ListItem key={idx} sx={{ border: '1px solid #e2e8f0', borderRadius: 1, mb: 1 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#14b8a6' }}>
                        {founder.name?.[0] || 'F'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={founder.name}
                      secondary="Founder"
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No founders listed
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexShrink: 0 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            onRespond(request.id, 'decline');
            onClose();
          }}
        >
          Decline
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            onRespond(request.id, 'accept');
            onClose();
          }}
          sx={{
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
          }}
        >
          Accept
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RequestCard = ({ request, onRespond }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const workspace = request.workspace || {};
  const details = request.workspace_details || {};
  const kpis = details.kpis || {};
  const decisions = details.decisions || {};
  const participants = details.participants || {};

  return (
    <>
      <Paper 
        sx={{ 
          border: '1px solid #e2e8f0',
          borderRadius: 2,
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#0d9488', width: 56, height: 56 }}> {/* Teal */}
              {workspace.title?.[0] || 'W'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {workspace.title || 'Workspace'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    From: {request.founder?.name || 'Founder'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip 
                      label={`Stage: ${workspace.stage || 'N/A'}`} 
                      size="small" 
                      variant="outlined"
                    />
                    {kpis.total > 0 && (
                      <Chip 
                        icon={<TrendingUp />}
                        label={`${kpis.total} KPIs`} 
                        size="small" 
                        color="primary"
                      />
                    )}
                    {decisions.total > 0 && (
                      <Chip 
                        icon={<Assignment />}
                        label={`${decisions.total} Decisions`} 
                        size="small" 
                        color="secondary"
                      />
                    )}
                    {participants.total > 0 && (
                      <Chip 
                        icon={<People />}
                        label={`${participants.total} Founders`} 
                        size="small" 
                      />
                    )}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => setDialogOpen(true)}
                >
                  View Details
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => onRespond(request.id, 'decline')}
                >
                  Decline
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => onRespond(request.id, 'accept')}
                  sx={{
                    background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
                  }}
                >
                  Accept
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <RequestDetailsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        request={request}
        onRespond={onRespond}
      />
    </>
  );
};

const PartnerDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceScorecards, setWorkspaceScorecards] = useState({}); // { workspaceId: scorecard }
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [founderId, setFounderId] = useState(null);
  const [workspaceNotificationsDialogOpen, setWorkspaceNotificationsDialogOpen] = useState(false);
  const [selectedWorkspaceForNotifications, setSelectedWorkspaceForNotifications] = useState(null);
  const [editApplicationOpen, setEditApplicationOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Fetch founder ID for real-time subscriptions
  useEffect(() => {
    const fetchFounderId = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_BASE}/profile/check`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.has_profile && data.profile) {
            setFounderId(data.profile.id);
          }
        }
      } catch (err) {
        console.error('Error fetching founder ID:', err);
      }
    };
    
    fetchFounderId();
  }, [user]);

  // Set up real-time subscriptions for notifications
  useEffect(() => {
    if (!founderId || !user?.id) return;

    const fetchNotifications = async () => {
      try {
        const notificationsResponse = await fetch(`${API_BASE}/accountability-partners/notifications`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });

        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json();
          setNotifications(notificationsData || []);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Set up Supabase Realtime subscription for notifications
    const notificationsChannel = supabase
      .channel(`partner_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${founderId}`,
        },
        (payload) => {
          console.log('🔔 Realtime notification event received:', payload);
          // Refresh notifications when changes occur
          fetchNotifications();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Partner notifications subscription status:', status);
      });

    // Fallback: Refresh when user returns to the page
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notificationsChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [founderId, user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch partner profile
      const profileResponse = await fetch(`${API_BASE}/accountability-partners/profile`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData && Object.keys(profileData).length > 0) {
          setProfile(profileData);
          
          // Fetch partner requests only if profile exists
          const requestsResponse = await fetch(`${API_BASE}/accountability-partners/requests`, {
            headers: {
              'X-Clerk-User-Id': user.id,
            },
          });

          if (requestsResponse.ok) {
            const requestsData = await requestsResponse.json();
            setRequests(requestsData || []);
          }

          // Fetch active workspaces where user is a partner
          const workspacesResponse = await fetch(`${API_BASE}/accountability-partners/workspaces`, {
            headers: {
              'X-Clerk-User-Id': user.id,
            },
          });

          if (workspacesResponse.ok) {
            const workspacesData = await workspacesResponse.json();
            setWorkspaces(workspacesData || []);
            
            // Fetch scorecards for each workspace
            const scorecardsMap = {};
            for (const workspace of workspacesData || []) {
              try {
                const scorecardResponse = await fetch(
                  `${API_BASE}/workspaces/${workspace.id}/partner-impact-scorecard`,
                  {
                    headers: {
                      'X-Clerk-User-Id': user.id,
                    },
                  }
                );
                if (scorecardResponse.ok) {
                  const scorecardData = await scorecardResponse.json();
                  if (scorecardData.has_partner) {
                    scorecardsMap[workspace.id] = scorecardData;
                  }
                }
              } catch (e) {
                console.error(`Error fetching scorecard for workspace ${workspace.id}:`, e);
              }
            }
            setWorkspaceScorecards(scorecardsMap);
          }

          // Fetch notifications from all workspaces
          const notificationsResponse = await fetch(`${API_BASE}/accountability-partners/notifications`, {
            headers: {
              'X-Clerk-User-Id': user.id,
            },
          });

          if (notificationsResponse.ok) {
            const notificationsData = await notificationsResponse.json();
            setNotifications(notificationsData || []);
          }
        } else {
          // Profile response was ok but empty - might still be creating
          setError('Partner profile is being created. Please refresh in a moment.');
        }
      } else if (profileResponse.status === 404) {
        // Profile doesn't exist yet - user needs to complete onboarding
        setError('Partner profile not found. Please complete onboarding first.');
      } else {
        // Other error
        const errorData = await profileResponse.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load partner profile');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Don't show error if still loading
  if (!loading && !profile && !error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          Partner profile not found. Please complete onboarding first.
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      </Box>
    );
  }

  // Show pending/rejected states
  const status = profile?.status || 'PENDING';
  
  if (status === 'PENDING') {
    return (
      <Box sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <PartnerNavigation />
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: { xs: 2, md: 4 },
          maxWidth: 800,
          mx: 'auto',
          width: '100%'
        }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Pending sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Your accountability partner application is under review.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                We'll email you once it's approved.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditApplicationOpen(true)}
                sx={{ mb: 3 }}
              >
                Edit Application
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Application Summary
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Headline</Typography>
                  <Typography variant="body1">{profile.headline || 'Not set'}</Typography>
                </Box>
                
                {profile.linkedin_url && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">LinkedIn</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon fontSize="small" />
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {profile.linkedin_url}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {profile.twitter_url && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">X/Twitter</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon fontSize="small" />
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href={profile.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {profile.twitter_url}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {profile.bio && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
                    <Typography variant="body1">{profile.bio}</Typography>
                  </Box>
                )}
                
                {(profile.expertise_stages?.length > 0 || profile.domains?.length > 0) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile.expertise_stages?.map((stage, idx) => (
                        <Chip key={idx} label={stage} size="small" />
                      ))}
                      {profile.domains?.map((domain, idx) => (
                        <Chip key={idx} label={domain} size="small" color="secondary" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <PartnerOnboardingWizard
            open={editApplicationOpen}
            onClose={() => setEditApplicationOpen(false)}
            existingProfile={profile}
            onComplete={(updatedProfile) => {
              setProfile(updatedProfile);
              setEditApplicationOpen(false);
              fetchDashboardData();
            }}
          />
        </Box>
      </Box>
    );
  }

  if (status === 'REJECTED') {
    return (
      <Box sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <PartnerNavigation />
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: { xs: 2, md: 4 },
          maxWidth: 800,
          mx: 'auto',
          width: '100%'
        }}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Cancel sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Your application was not approved right now.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                You can update details and re-submit.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditApplicationOpen(true)}
              >
                Update and Re-submit
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Application Summary
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Headline</Typography>
                  <Typography variant="body1">{profile.headline || 'Not set'}</Typography>
                </Box>
                
                {profile.linkedin_url && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">LinkedIn</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon fontSize="small" />
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href={profile.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {profile.linkedin_url}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {profile.twitter_url && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">X/Twitter</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinkIcon fontSize="small" />
                      <Typography 
                        variant="body1" 
                        component="a" 
                        href={profile.twitter_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {profile.twitter_url}
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {profile.bio && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
                    <Typography variant="body1">{profile.bio}</Typography>
                  </Box>
                )}
                
                {(profile.expertise_stages?.length > 0 || profile.domains?.length > 0) && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Tags</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {profile.expertise_stages?.map((stage, idx) => (
                        <Chip key={idx} label={stage} size="small" />
                      ))}
                      {profile.domains?.map((domain, idx) => (
                        <Chip key={idx} label={domain} size="small" color="secondary" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          <PartnerOnboardingWizard
            open={editApplicationOpen}
            onClose={() => setEditApplicationOpen(false)}
            existingProfile={profile}
            onComplete={(updatedProfile) => {
              setProfile(updatedProfile);
              setEditApplicationOpen(false);
              fetchDashboardData();
            }}
          />
        </Box>
      </Box>
    );
  }

  // Status is APPROVED - show full dashboard
  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Partner Navigation */}
      <PartnerNavigation />
      
      {/* Dashboard Content */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        p: { xs: 2, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        width: '100%'
      }}>
        {/* Header */}
        {/* <Box sx={{ mb: 4 }}> */}
          {/* <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Accountability Partner Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your partnerships and help founders stay accountable
          </Typography> */}
        {/* </Box> */}

      {/* Profile Summary Card */}
      {profile && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#0d9488' }}> {/* Teal */}
                {profile.user?.name?.[0] || 'P'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {profile.user?.name || 'Accountability Partner'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.headline}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    label={`${profile.current_active_workspaces || 0}/${profile.max_active_workspaces} Active`}
                    color="primary"
                    size="small"
                  />
                  <Chip 
                    label={profile.preferred_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'}
                    size="small"
                  />
                  {profile.is_discoverable && (
                    <Chip 
                      label="Discoverable"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(13, 148, 136, 0.1)', // Teal
                  color: '#0d9488'
                }}>
                  <Business />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {profile?.current_active_workspaces || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Workspaces
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(30, 58, 138, 0.1)', // Navy
                  color: '#1e3a8a'
                }}>
                  <Message />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {requests.filter(r => r.status === 'PENDING').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981'
                }}>
                  <CheckCircle />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {requests.filter(r => r.status === 'ACCEPTED').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Accepted Requests
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b'
                }}>
                  <Schedule />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {profile?.max_active_workspaces - (profile?.current_active_workspaces || 0) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available Slots
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Requests */}
      {requests.filter(r => r.status === 'PENDING').length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Pending Partner Requests
            </Typography>
            {requests
              .filter(r => r.status === 'PENDING')
              .map((request) => (
                <RequestCard 
                  key={request.id} 
                  request={request} 
                  onRespond={handleRespondToRequest}
                />
              ))}
          </CardContent>
        </Card>
      )}

      {/* Active Workspaces */}
      <Card sx={{ maxHeight: '500px', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Active Workspaces
          </Typography>
        </CardContent>
        <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
          {workspaces.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                You're not currently active in any workspaces
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Founders will be able to request you from the marketplace
              </Typography>
            </Box>
          ) : (
            <List>
              {workspaces.map((workspace) => (
                <ListItem
                  key={workspace.id}
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    mb: 1,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#0d9488' }}> {/* Teal */}
                      {workspace.title?.[0] || 'W'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={workspace.title || 'Workspace'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Stage: {workspace.stage || 'N/A'}
                        </Typography>
                        {workspace.projects && workspace.projects.length > 0 && (
                          <Box sx={{ mt: 0.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {workspace.projects.map((project, idx) => (
                              <Chip
                                key={idx}
                                label={project.title || 'Untitled Project'}
                                size="small"
                                icon={<Business />}
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                        {workspaceScorecards[workspace.id] && (
                          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={`On-time check-ins: ${workspaceScorecards[workspace.id].metrics.on_time_checkins.current_rate.toFixed(0)}%`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={`Important tasks/week: ${workspaceScorecards[workspace.id].metrics.important_tasks.per_week_current.toFixed(1)}`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                            <Chip
                              label={`KPI progress: ${workspaceScorecards[workspace.id].metrics.kpi_progress.average_progress_pct.toFixed(0)}%`}
                              size="small"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(() => {
                      const workspaceNotifications = notifications.filter(n => 
                        (n.workspace_id === workspace.id || n.workspace?.id === workspace.id) && !n.read_at
                      );
                      const unreadCount = workspaceNotifications.length;
                      
                      return unreadCount > 0 ? (
                        <Badge badgeContent={unreadCount} color="primary">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkspaceForNotifications(workspace);
                              setWorkspaceNotificationsDialogOpen(true);
                            }}
                            sx={{ color: 'primary.main' }}
                          >
                            <Notifications />
                          </IconButton>
                        </Badge>
                      ) : null;
                    })()}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/partner/workspaces/${workspace.id}`)}
                    >
                      View Workspace
                    </Button>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Card>

      {/* Workspace Notifications Dialog */}
      {selectedWorkspaceForNotifications && (
        <Dialog
          open={workspaceNotificationsDialogOpen}
          onClose={() => {
            setWorkspaceNotificationsDialogOpen(false);
            setSelectedWorkspaceForNotifications(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications color="primary" />
                {selectedWorkspaceForNotifications.title || 'Workspace'} Updates
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setWorkspaceNotificationsDialogOpen(false);
                  setSelectedWorkspaceForNotifications(null);
                }}
              >
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {(() => {
              const workspaceNotifications = notifications.filter(n => 
                (n.workspace_id === selectedWorkspaceForNotifications.id || n.workspace?.id === selectedWorkspaceForNotifications.id) && !n.read_at
              );
              
              if (workspaceNotifications.length === 0) {
                return (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No unread notifications for this workspace
                    </Typography>
                  </Box>
                );
              }

              return (
                <List>
                  {workspaceNotifications.map((notification) => (
                    <Paper
                      key={notification.id}
                      sx={{
                        mb: 1,
                        p: 2,
                        border: '1px solid #e2e8f0',
                        borderRadius: 1,
                        bgcolor: 'rgba(14, 165, 233, 0.05)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Circle sx={{ fontSize: 8, color: 'primary.main', mt: 1, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {notification.title}
                          </Typography>
                          {notification.created_at && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {new Date(notification.created_at).toLocaleString()}
                            </Typography>
                          )}
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleMarkAsRead(notification.id)}
                          sx={{ flexShrink: 0 }}
                        >
                          <CheckCircleOutline fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </List>
              );
            })()}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setWorkspaceNotificationsDialogOpen(false);
                setSelectedWorkspaceForNotifications(null);
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
      </Box>
    </Box>
  );

  async function handleRespondToRequest(requestId, response) {
    try {
      const res = await fetch(`${API_BASE}/accountability-partners/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ response }),
      });

      if (res.ok) {
        fetchDashboardData(); // Refresh data
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to respond to request');
      }
    } catch (err) {
      console.error('Error responding to request:', err);
      alert('Failed to respond to request');
    }
  }

  async function handleMarkAsRead(notificationId) {
    try {
      const res = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (res.ok) {
        // Remove notification from local state (delete it)
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

};

export default PartnerDashboard;

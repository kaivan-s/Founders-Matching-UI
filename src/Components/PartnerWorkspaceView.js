import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Assignment,
  AccountBalance,
  Task,
  Update,
  Business,
  Person,
} from '@mui/icons-material';
import PartnerNavigation from './PartnerNavigation';

const PartnerWorkspaceView = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [checkinReviews, setCheckinReviews] = useState({}); // { checkinId: { verdict, comment } }
  const [savingReview, setSavingReview] = useState({}); // { checkinId: true/false }
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    if (user && workspaceId) {
      fetchWorkspaceData();
    }
  }, [user, workspaceId]);

  const fetchWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch workspace details
      const workspaceResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!workspaceResponse.ok) {
        throw new Error('Failed to load workspace');
      }

      const workspaceData = await workspaceResponse.json();
      setWorkspace(workspaceData);

      // Fetch KPIs
      const kpisResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/kpis`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (kpisResponse.ok) {
        const kpisData = await kpisResponse.json();
        setKpis(kpisData || []);
      }

      // Fetch decisions
      const decisionsResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (decisionsResponse.ok) {
        const decisionsData = await decisionsResponse.json();
        setDecisions(decisionsData || []);
      }

      // Fetch checkins (updates)
      const checkinsResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/checkins?limit=10`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (checkinsResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        setCheckins(checkinsData || []);
        
        // Fetch existing reviews for each check-in
        const reviewsMap = {};
        for (const checkin of checkinsData || []) {
          try {
            const reviewResponse = await fetch(
              `${API_BASE}/workspaces/${workspaceId}/checkins/${checkin.id}/partner-review`,
              {
                headers: {
                  'X-Clerk-User-Id': user.id,
                },
              }
            );
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              if (reviewData) {
                reviewsMap[checkin.id] = {
                  verdict: reviewData.verdict,
                  comment: reviewData.comment || '',
                };
              }
            }
          } catch (e) {
            console.error(`Error fetching review for check-in ${checkin.id}:`, e);
          }
        }
        setCheckinReviews(reviewsMap);
      }

      // Fetch tasks if endpoint exists
      try {
        const tasksResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/tasks`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData || []);
        }
      } catch (e) {
        console.log('Tasks endpoint not available');
      }

      // Get project info from workspace data
      if (workspaceData.projects) {
        setProjects(workspaceData.projects || []);
      }

      // Fetch participants separately to ensure we get full data
      const participantsResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/participants`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData || []);
      } else {
        // Fallback to participants from workspace data if endpoint fails
        if (workspaceData.participants) {
          setParticipants(workspaceData.participants || []);
        }
      }

    } catch (err) {
      console.error('Error fetching workspace data:', err);
      setError(err.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleReviewChange = (checkinId, field, value) => {
    setCheckinReviews(prev => ({
      ...prev,
      [checkinId]: {
        ...prev[checkinId],
        [field]: value,
      },
    }));
  };

  const handleSaveReview = async (checkinId) => {
    const review = checkinReviews[checkinId];
    if (!review || !review.verdict) {
      setSnackbar({ open: true, message: 'Please select a verdict' });
      return;
    }

    setSavingReview(prev => ({ ...prev, [checkinId]: true }));
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/checkins/${checkinId}/partner-review`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({
            verdict: review.verdict,
            comment: review.comment || '',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save review');
      }

      setSnackbar({ open: true, message: 'Review saved successfully!' });
    } catch (err) {
      setSnackbar({ open: true, message: `Error: ${err.message}` });
    } finally {
      setSavingReview(prev => ({ ...prev, [checkinId]: false }));
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
        <Button onClick={() => navigate('/partner/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Workspace not found</Alert>
        <Button onClick={() => navigate('/partner/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  // Filter decisions for equity-related ones
  const equityDecisions = decisions.filter(d => 
    d.tag?.toLowerCase().includes('equity') || 
    d.content?.toLowerCase().includes('equity') ||
    d.content?.toLowerCase().includes('split') ||
    d.content?.toLowerCase().includes('%')
  );

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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        p: { xs: 2, md: 4 },
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        height: 'calc(100vh - 64px)' // Subtract navigation height
      }}>
        {/* Header - Fixed */}
        <Box sx={{ mb: 3, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/partner/dashboard')}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              {workspace.title || 'Workspace'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Stage: {workspace.stage || 'N/A'}
            </Typography>
          </Box>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {/* Projects Info */}
          {projects.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Projects
                </Typography>
                {projects.map((project, idx) => (
                  <Box key={idx} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Business color="primary" />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {project.title || 'Untitled Project'}
                      </Typography>
                      {project.stage && (
                        <Chip label={project.stage} size="small" variant="outlined" />
                      )}
                    </Box>
                    {project.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                        {project.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Overview" icon={<Update />} iconPosition="start" />
                <Tab label={`KPIs (${kpis.length})`} icon={<TrendingUp />} iconPosition="start" />
                <Tab label={`Decisions (${decisions.length})`} icon={<Assignment />} iconPosition="start" />
                <Tab label={`Equity Changes (${equityDecisions.length})`} icon={<AccountBalance />} iconPosition="start" />
                <Tab label={`Tasks (${tasks.length})`} icon={<Task />} iconPosition="start" />
              </Tabs>
            </Box>

            <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {/* Overview Tab */}
            {tabValue === 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Recent Updates
                </Typography>
                {checkins.length > 0 ? (
                  <List>
                    {checkins.map((checkin) => {
                      const review = checkinReviews[checkin.id] || { verdict: '', comment: '' };
                      return (
                        <Paper key={checkin.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Week of {new Date(checkin.week_start).toLocaleDateString()}
                            </Typography>
                            <Chip
                              label={checkin.status?.replace('_', ' ') || 'N/A'}
                              size="small"
                              color={
                                checkin.status === 'on_track' ? 'success' :
                                checkin.status === 'slightly_behind' ? 'warning' : 'error'
                              }
                            />
                          </Box>
                          {checkin.summary && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {checkin.summary}
                            </Typography>
                          )}
                          {checkin.progress_percent !== null && (
                            <Typography variant="caption" color="text.secondary">
                              Progress: {checkin.progress_percent}%
                            </Typography>
                          )}
                          {checkin.created_at && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              Posted: {new Date(checkin.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                          
                          {/* Partner Review Section */}
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Partner Review
                            </Typography>
                            <FormControl component="fieldset" sx={{ mb: 2, width: '100%' }}>
                              <RadioGroup
                                row
                                value={review.verdict}
                                onChange={(e) => handleReviewChange(checkin.id, 'verdict', e.target.value)}
                                sx={{ gap: 2 }}
                              >
                                <FormControlLabel 
                                  value="ON_TRACK" 
                                  control={<Radio size="small" />} 
                                  label={
                                    <Chip 
                                      label="On track" 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: review.verdict === 'ON_TRACK' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                                        color: review.verdict === 'ON_TRACK' ? '#22c55e' : 'inherit',
                                        border: review.verdict === 'ON_TRACK' ? '1px solid #22c55e' : '1px solid #e2e8f0',
                                      }}
                                    />
                                  }
                                />
                                <FormControlLabel 
                                  value="AT_RISK" 
                                  control={<Radio size="small" />} 
                                  label={
                                    <Chip 
                                      label="At risk" 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: review.verdict === 'AT_RISK' ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                                        color: review.verdict === 'AT_RISK' ? '#fbbf24' : 'inherit',
                                        border: review.verdict === 'AT_RISK' ? '1px solid #fbbf24' : '1px solid #e2e8f0',
                                      }}
                                    />
                                  }
                                />
                                <FormControlLabel 
                                  value="OFF_TRACK" 
                                  control={<Radio size="small" />} 
                                  label={
                                    <Chip 
                                      label="Off track" 
                                      size="small" 
                                      sx={{ 
                                        bgcolor: review.verdict === 'OFF_TRACK' ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        color: review.verdict === 'OFF_TRACK' ? '#ef4444' : 'inherit',
                                        border: review.verdict === 'OFF_TRACK' ? '1px solid #ef4444' : '1px solid #e2e8f0',
                                      }}
                                    />
                                  }
                                />
                              </RadioGroup>
                            </FormControl>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              placeholder="Share a short note or question (optional)"
                              value={review.comment}
                              onChange={(e) => handleReviewChange(checkin.id, 'comment', e.target.value)}
                              inputProps={{ maxLength: 500 }}
                              sx={{ mb: 2 }}
                            />
                            <Button
                              variant="contained"
                              onClick={() => handleSaveReview(checkin.id)}
                              disabled={!review.verdict || savingReview[checkin.id]}
                              sx={{
                                bgcolor: '#14b8a6',
                                '&:hover': { bgcolor: '#0d9488' },
                              }}
                            >
                              {savingReview[checkin.id] ? 'Saving...' : 'Save Review'}
                            </Button>
                          </Box>
                        </Paper>
                      );
                    })}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No updates yet
                  </Typography>
                )}

                {/* Participants */}
                {participants.length > 0 && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Founders
                    </Typography>
                    <List>
                      {participants.map((participant, idx) => {
                        const userName = participant.user?.name || participant.name || 'Founder';
                        const userRole = participant.role || (participant.role_label || 'Founder');
                        return (
                          <ListItem key={participant.id || idx}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: '#14b8a6' }}>
                                {userName[0] || 'F'}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={userName}
                              secondary={userRole === 'ACCOUNTABILITY_PARTNER' ? 'Accountability Partner' : userRole}
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}
              </Box>
            )}

            {/* KPIs Tab */}
            {tabValue === 1 && (
              <Box>
                {kpis.length > 0 ? (
                  <List>
                    {kpis.map((kpi) => (
                      <Paper key={kpi.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {kpi.label}
                          </Typography>
                          <Chip
                            label={kpi.status?.replace('_', ' ') || 'N/A'}
                            size="small"
                            color={
                              kpi.status === 'done' ? 'success' :
                              kpi.status === 'in_progress' ? 'primary' : 'default'
                            }
                          />
                        </Box>
                        {kpi.target_value && (
                          <Typography variant="body2" color="text.secondary">
                            Target: {kpi.target_value}
                          </Typography>
                        )}
                        {kpi.target_date && (
                          <Typography variant="body2" color="text.secondary">
                            Target Date: {new Date(kpi.target_date).toLocaleDateString()}
                          </Typography>
                        )}
                        {kpi.owner && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Owner: {kpi.owner.name || 'N/A'}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No KPIs defined yet
                  </Typography>
                )}
              </Box>
            )}

            {/* Decisions Tab */}
            {tabValue === 2 && (
              <Box>
                {decisions.length > 0 ? (
                  <List>
                    {decisions.map((decision) => (
                      <Paper key={decision.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                          {decision.content}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {decision.tag && (
                            <Chip label={decision.tag} size="small" variant="outlined" />
                          )}
                          {decision.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(decision.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No decisions recorded yet
                  </Typography>
                )}
              </Box>
            )}

            {/* Equity Changes Tab */}
            {tabValue === 3 && (
              <Box>
                {equityDecisions.length > 0 ? (
                  <List>
                    {equityDecisions.map((decision) => (
                      <Paper key={decision.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0', bgcolor: 'rgba(245, 158, 11, 0.05)' }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                          {decision.content}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {decision.tag && (
                            <Chip label={decision.tag} size="small" color="warning" />
                          )}
                          {decision.created_at && (
                            <Typography variant="caption" color="text.secondary">
                              {new Date(decision.created_at).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No equity-related changes recorded yet
                  </Typography>
                )}
              </Box>
            )}

            {/* Tasks Tab */}
            {tabValue === 4 && (
              <Box>
                {tasks.length > 0 ? (
                  <List>
                    {tasks.map((task) => (
                      <Paper key={task.id} sx={{ mb: 2, p: 2, border: '1px solid #e2e8f0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {task.title || task.name || 'Task'}
                          </Typography>
                          {task.status && (
                            <Chip
                              label={task.status}
                              size="small"
                              color={
                                task.status === 'completed' ? 'success' :
                                task.status === 'in_progress' ? 'primary' : 'default'
                              }
                            />
                          )}
                        </Box>
                        {task.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {task.description}
                          </Typography>
                        )}
                        {task.due_date && (
                          <Typography variant="caption" color="text.secondary">
                            Due: {new Date(task.due_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No tasks assigned yet
                  </Typography>
                )}
              </Box>
            )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default PartnerWorkspaceView;


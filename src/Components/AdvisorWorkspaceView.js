import React, { useState, useEffect, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Rating,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  alpha,
} from '@mui/material';
import {
  ArrowBack,
  TrendingUp,
  Send,
  CalendarMonth,
  Close,
  Message,
  Group,
} from '@mui/icons-material';

const AdvisorWorkspaceView = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [participants, setParticipants] = useState([]);
  
  // Activity feed state
  const [feedPosts, setFeedPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [postingMessage, setPostingMessage] = useState(false);
  
  // Meeting state
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    duration_minutes: 60,
    attendees: [],
    summary: '',
    action_items: '',
  });
  const [savingMeeting, setSavingMeeting] = useState(false);
  
  // Check-in state
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    rating: 0,
    meeting_expectations: '',
    comment: '',
  });
  const [savingCheckin, setSavingCheckin] = useState(false);

  const fetchWorkspaceData = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch workspace details
      const workspaceResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (!workspaceResponse.ok) {
        throw new Error('Failed to load workspace');
      }

      const workspaceData = await workspaceResponse.json();
      setWorkspace(workspaceData);

      // Fetch KPIs
      const kpisResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/kpis`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (kpisResponse.ok) {
        setKpis(await kpisResponse.json() || []);
      }

      // Fetch participants with roles
      const participantsResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/participants-with-roles`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData || []);
        // Pre-select all participants for meetings
        setMeetingForm(prev => ({
          ...prev,
          attendees: participantsData.map(p => p.id),
        }));
      }

      // Fetch activity feed
      await fetchFeed();
      
      // Check if check-in is due
      await fetchCheckinStatus();

    } catch (err) {
      setError(err.message || 'Failed to load workspace data');
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId]);

  const fetchFeed = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    setFeedLoading(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/feed`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        setFeedPosts(await response.json() || []);
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [user?.id, workspaceId]);

  const fetchCheckinStatus = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/engagement-checkins/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const status = await response.json();
        setCheckinStatus(status);
        // Auto-open check-in dialog if due
        if (status.checkin_due) {
          setCheckinDialogOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch check-in status:', err);
    }
  }, [user?.id, workspaceId]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handlePostMessage = async () => {
    if (!newPostContent.trim() || postingMessage) return;
    
    setPostingMessage(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ content: newPostContent.trim() }),
      });
      
      if (response.ok) {
        const post = await response.json();
        setFeedPosts(prev => [post, ...prev]);
        setNewPostContent('');
      }
    } catch (err) {
      console.error('Failed to post message:', err);
    } finally {
      setPostingMessage(false);
    }
  };

  const handleLogMeeting = async () => {
    if (savingMeeting) return;
    
    setSavingMeeting(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(meetingForm),
      });
      
      if (response.ok) {
        setMeetingDialogOpen(false);
        setMeetingForm({
          meeting_date: new Date().toISOString().split('T')[0],
          duration_minutes: 60,
          attendees: participants.map(p => p.id),
          summary: '',
          action_items: '',
        });
        await fetchFeed(); // Refresh feed to show meeting note
      }
    } catch (err) {
      console.error('Failed to log meeting:', err);
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleSubmitCheckin = async () => {
    if (savingCheckin || !checkinForm.rating || !checkinForm.meeting_expectations) return;
    
    setSavingCheckin(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/engagement-checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(checkinForm),
      });
      
      if (response.ok) {
        setCheckinDialogOpen(false);
        setCheckinStatus(prev => ({ ...prev, checkin_due: false, already_completed: true }));
        setCheckinForm({ rating: 0, meeting_expectations: '', comment: '' });
      }
    } catch (err) {
      console.error('Failed to submit check-in:', err);
    } finally {
      setSavingCheckin(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#14b8a6' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate('/advisor/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Workspace not found</Alert>
        <Button onClick={() => navigate('/advisor/dashboard')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/advisor/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {workspace.title || 'Workspace'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {workspace.stage && <Chip label={workspace.stage} size="small" sx={{ mr: 1 }} />}
              {participants.filter(p => p.role === 'FOUNDER').length} founders
            </Typography>
          </Box>
          {checkinStatus?.checkin_due && (
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={() => setCheckinDialogOpen(true)}
            >
              Check-in Due
            </Button>
          )}
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 },
              '& .Mui-selected': { color: '#14b8a6' },
              '& .MuiTabs-indicator': { backgroundColor: '#14b8a6' },
            }}
          >
            <Tab icon={<Message sx={{ fontSize: 18 }} />} iconPosition="start" label="Activity" />
            <Tab icon={<TrendingUp sx={{ fontSize: 18 }} />} iconPosition="start" label={`KPIs (${kpis.length})`} />
            <Tab icon={<Group sx={{ fontSize: 18 }} />} iconPosition="start" label="Team" />
          </Tabs>
        </Paper>

        {/* Activity Tab */}
        {tabValue === 0 && (
          <Box>
            {/* Post Message */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  maxRows={4}
                  placeholder="Share an update, question, or advice..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={handlePostMessage}
                    disabled={!newPostContent.trim() || postingMessage}
                    sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
                  >
                    <Send />
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setMeetingDialogOpen(true)}
                    sx={{ borderColor: '#14b8a6', color: '#14b8a6' }}
                  >
                    <CalendarMonth />
                  </Button>
                </Box>
              </Box>
            </Paper>

            {/* Feed Posts */}
            {feedLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : feedPosts.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {feedPosts.map((post) => (
                  <Paper key={post.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Avatar sx={{ bgcolor: post.author_role === 'advisor' ? '#14b8a6' : '#3b82f6', width: 36, height: 36 }}>
                        {post.author?.name?.[0] || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {post.author?.name || 'Unknown'}
                          </Typography>
                          <Chip 
                            label={post.author_role === 'advisor' ? 'Advisor' : 'Founder'} 
                            size="small" 
                            sx={{ 
                              height: 20, 
                              fontSize: '0.7rem',
                              bgcolor: post.author_role === 'advisor' ? alpha('#14b8a6', 0.1) : alpha('#3b82f6', 0.1),
                              color: post.author_role === 'advisor' ? '#14b8a6' : '#3b82f6',
                            }} 
                          />
                          {post.post_type === 'meeting_note' && (
                            <Chip 
                              icon={<CalendarMonth sx={{ fontSize: 14 }} />}
                              label="Meeting" 
                              size="small" 
                              sx={{ height: 20, fontSize: '0.7rem' }} 
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(post.created_at)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {post.content}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Replies */}
                    {post.replies?.length > 0 && (
                      <Box sx={{ ml: 6, mt: 2, pl: 2, borderLeft: '2px solid #e2e8f0' }}>
                        {post.replies.map((reply) => (
                          <Box key={reply.id} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {reply.author?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(reply.created_at)}
                              </Typography>
                            </Box>
                            <Typography variant="body2">{reply.content}</Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No activity yet. Start by posting an update or logging a meeting.
                </Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* KPIs Tab */}
        {tabValue === 1 && (
          <Box>
            {kpis.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {kpis.map((kpi) => (
                  <Paper key={kpi.id} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {kpi.label}
                        </Typography>
                        {kpi.target_value && (
                          <Typography variant="body2" color="text.secondary">
                            Target: {kpi.target_value}
                          </Typography>
                        )}
                        {kpi.owner?.name && (
                          <Typography variant="caption" color="text.secondary">
                            Owner: {kpi.owner.name}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={kpi.status?.replace('_', ' ') || 'pending'}
                          size="small"
                          color={kpi.status === 'done' ? 'success' : kpi.status === 'in_progress' ? 'primary' : 'default'}
                        />
                        {kpi.target_date && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Due: {new Date(kpi.target_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No KPIs defined yet.</Typography>
              </Paper>
            )}
          </Box>
        )}

        {/* Team Tab */}
        {tabValue === 2 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Team Members</Typography>
            <List>
              {participants.map((participant) => (
                <ListItem key={participant.id}>
                  <ListItemAvatar>
                    <Avatar 
                      src={participant.profile_picture}
                      sx={{ bgcolor: participant.role === 'ADVISOR' ? '#14b8a6' : '#3b82f6' }}
                    >
                      {participant.name?.[0] || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name}
                    secondary={participant.role === 'ADVISOR' ? 'Advisor' : 'Founder'}
                  />
                  {participant.role === 'ADVISOR' && (
                    <Chip label="You" size="small" sx={{ bgcolor: alpha('#14b8a6', 0.1), color: '#14b8a6' }} />
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* Log Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onClose={() => setMeetingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Log a Meeting
          <IconButton onClick={() => setMeetingDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={meetingForm.meeting_date}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, meeting_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              value={meetingForm.duration_minutes}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
              fullWidth
            />
            <TextField
              label="Summary"
              multiline
              rows={3}
              value={meetingForm.summary}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="What was discussed?"
              fullWidth
            />
            <TextField
              label="Action Items"
              multiline
              rows={2}
              value={meetingForm.action_items}
              onChange={(e) => setMeetingForm(prev => ({ ...prev, action_items: e.target.value }))}
              placeholder="Any follow-up tasks?"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMeetingDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleLogMeeting}
            disabled={savingMeeting || !meetingForm.meeting_date || !meetingForm.duration_minutes}
            sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
          >
            {savingMeeting ? 'Saving...' : 'Log Meeting'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Monthly Check-in Dialog */}
      <Dialog open={checkinDialogOpen} onClose={() => setCheckinDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Monthly Check-in
          <IconButton onClick={() => setCheckinDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            How is your engagement with this workspace going?
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Overall Rating</Typography>
              <Rating
                value={checkinForm.rating}
                onChange={(e, value) => setCheckinForm(prev => ({ ...prev, rating: value }))}
                size="large"
              />
            </Box>
            
            <FormControl>
              <FormLabel>Is the engagement meeting expectations?</FormLabel>
              <RadioGroup
                value={checkinForm.meeting_expectations}
                onChange={(e) => setCheckinForm(prev => ({ ...prev, meeting_expectations: e.target.value }))}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes, fully" />
                <FormControlLabel value="partially" control={<Radio />} label="Partially" />
                <FormControlLabel value="no" control={<Radio />} label="No, needs improvement" />
              </RadioGroup>
            </FormControl>
            
            <TextField
              label="Additional Comments (optional)"
              multiline
              rows={3}
              value={checkinForm.comment}
              onChange={(e) => setCheckinForm(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Any feedback or concerns?"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckinDialogOpen(false)}>Skip for Now</Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitCheckin}
            disabled={savingCheckin || !checkinForm.rating || !checkinForm.meeting_expectations}
            sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
          >
            {savingCheckin ? 'Submitting...' : 'Submit Check-in'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvisorWorkspaceView;

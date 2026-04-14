import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  alpha,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  CheckCircle,
  LinkOff,
  Send,
  Settings,
  Notifications,
  Refresh,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';

const SlackIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.52-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 0 1 2.521 2.52A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.312z" fill="#E01E5A"/>
  </svg>
);

const NotionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.886.747-.933l3.222-.186zM2.168 1.108L16.06.054c1.682-.14 2.102.093 2.802.606l3.876 2.754c.56.42.747.793.747 1.353v15.778c0 .98-.373 1.587-1.68 1.68l-15.458.933c-.98.047-1.448-.093-1.962-.7l-3.083-4.012c-.56-.746-.793-1.306-.793-1.959V2.948c0-.793.373-1.493 1.168-1.587l.49-.253z" fill="#000"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" fill="#4285F4"/>
  </svg>
);

const WorkspaceIntegrations = ({ workspaceId }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState({});
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(null);

  const fetchIntegrations = useCallback(async () => {
    if (!user?.id || !workspaceId) return;

    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId]);

  useEffect(() => {
    fetchIntegrations();
    
    // Check URL params for connection status
    const params = new URLSearchParams(window.location.search);
    if (params.get('slack') === 'connected') {
      setSnackbar({ open: true, message: 'Slack connected successfully!', severity: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error')) {
      setSnackbar({ open: true, message: 'Failed to connect. Please try again.', severity: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchIntegrations]);

  const handleConnectSlack = async () => {
    setActionLoading('slack_connect');
    try {
      const response = await fetch(`${API_BASE}/integrations/slack/auth-url?workspace_id=${workspaceId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      } else {
        setSnackbar({ open: true, message: 'Failed to start Slack connection', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Connection error', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateChannel = async () => {
    setActionLoading('slack_channel');
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/slack/channel`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        setSnackbar({ open: true, message: `Channel #${data.channel_name} created!`, severity: 'success' });
        fetchIntegrations();
      } else {
        setSnackbar({ open: true, message: 'Failed to create channel', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error creating channel', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectSlack = async () => {
    if (!window.confirm('Are you sure you want to disconnect Slack?')) return;

    setActionLoading('slack_disconnect');
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/slack`, {
        method: 'DELETE',
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Slack disconnected', severity: 'success' });
        fetchIntegrations();
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error disconnecting', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestNotification = async () => {
    setActionLoading('slack_test');
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/slack/test`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Test notification sent!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to send test', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error sending test', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSlackSettings = async (key, value) => {
    const currentSettings = integrations.slack?.settings?.notifications || {};
    const newSettings = { ...currentSettings, [key]: value };

    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/slack/settings`, {
        method: 'PUT',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notifications: newSettings }),
      });

      if (response.ok) {
        setIntegrations(prev => ({
          ...prev,
          slack: {
            ...prev.slack,
            settings: { ...prev.slack.settings, notifications: newSettings },
          },
        }));
      }
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const slack = integrations.slack || {};
  const slackNotifications = slack.settings?.notifications || {};

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Integrations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect your favorite tools to collaborate with your co-founder
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Slack Integration */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: slack.connected ? TEAL : SLATE_200,
          bgcolor: slack.connected ? alpha(TEAL, 0.02) : 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#4A154B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <SlackIcon />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Slack
              </Typography>
              {slack.connected && (
                <Chip
                  icon={<CheckCircle sx={{ fontSize: 14 }} />}
                  label="Connected"
                  size="small"
                  sx={{
                    bgcolor: alpha(TEAL, 0.1),
                    color: TEAL,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              )}
            </Box>

            {slack.connected ? (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Connected to <strong>{slack.team_name}</strong>
                  {slack.channel_name && (
                    <> • Channel: <strong>#{slack.channel_name}</strong></>
                  )}
                </Typography>

                {!slack.channel_id && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleCreateChannel}
                    disabled={actionLoading === 'slack_channel'}
                    sx={{ mb: 2, bgcolor: '#4A154B', '&:hover': { bgcolor: '#3a1039' } }}
                  >
                    {actionLoading === 'slack_channel' ? (
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                    ) : (
                      'Create Partnership Channel'
                    )}
                  </Button>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Notifications sx={{ fontSize: 18 }} />
                  Notification Settings
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slackNotifications.checkin_reminders !== false}
                        onChange={(e) => handleUpdateSlackSettings('checkin_reminders', e.target.checked)}
                        size="small"
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL } }}
                      />
                    }
                    label={<Typography variant="body2">Weekly check-in reminders</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slackNotifications.equity_updates !== false}
                        onChange={(e) => handleUpdateSlackSettings('equity_updates', e.target.checked)}
                        size="small"
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL } }}
                      />
                    }
                    label={<Typography variant="body2">Equity agreement updates</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={slackNotifications.advisor_activity !== false}
                        onChange={(e) => handleUpdateSlackSettings('advisor_activity', e.target.checked)}
                        size="small"
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: TEAL } }}
                      />
                    }
                    label={<Typography variant="body2">Advisor activity</Typography>}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Send sx={{ fontSize: 16 }} />}
                    onClick={handleTestNotification}
                    disabled={!slack.channel_id || actionLoading === 'slack_test'}
                  >
                    {actionLoading === 'slack_test' ? 'Sending...' : 'Send Test'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<LinkOff sx={{ fontSize: 16 }} />}
                    onClick={handleDisconnectSlack}
                    disabled={actionLoading === 'slack_disconnect'}
                  >
                    Disconnect
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Get check-in reminders, equity updates, and team notifications in Slack
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleConnectSlack}
                  disabled={actionLoading === 'slack_connect'}
                  sx={{ bgcolor: '#4A154B', '&:hover': { bgcolor: '#3a1039' } }}
                >
                  {actionLoading === 'slack_connect' ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    'Connect Slack'
                  )}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Notion Integration - Coming Soon */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: SLATE_200,
          opacity: 0.7,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <NotionIcon />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Notion
              </Typography>
              <Chip
                label="Coming Soon"
                size="small"
                sx={{
                  bgcolor: alpha(SLATE_500, 0.1),
                  color: SLATE_500,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Auto-create a partnership workspace with tasks, docs, and meeting notes
            </Typography>
            <Button variant="outlined" disabled>
              Connect Notion
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Google Calendar Integration - Coming Soon */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: SLATE_200,
          opacity: 0.7,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: SLATE_200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CalendarIcon />
          </Box>

          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Google Calendar
              </Typography>
              <Chip
                label="Coming Soon"
                size="small"
                sx={{
                  bgcolor: alpha(SLATE_500, 0.1),
                  color: SLATE_500,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Schedule partnership meetings and sync check-in deadlines
            </Typography>
            <Button variant="outlined" disabled>
              Connect Google Calendar
            </Button>
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WorkspaceIntegrations;

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  alpha,
  Grid,
  Snackbar,
  Collapse,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  LinkOff,
  Send,
  Notifications,
  ExpandMore,
  ExpandLess,
  PersonAdd,
  Check,
  OpenInNew,
  Add,
  Lock,
  StarBorder,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../config/api';

const TEAL = '#0d9488';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const AMBER_500 = '#f59e0b';

const SlackIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.124 2.521a2.528 2.528 0 0 1 2.52-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.52V8.834zm-1.271 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.166 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.124a2.528 2.528 0 0 1 2.521 2.52A2.528 2.528 0 0 1 15.166 24a2.528 2.528 0 0 1-2.521-2.522v-2.52h2.521zm0-1.271a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.166a2.528 2.528 0 0 1-2.522 2.521h-6.312z" fill="#E01E5A"/>
  </svg>
);

const NotionIcon = ({ color = '#000' }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.886.747-.933l3.222-.186zM2.168 1.108L16.06.054c1.682-.14 2.102.093 2.802.606l3.876 2.754c.56.42.747.793.747 1.353v15.778c0 .98-.373 1.587-1.68 1.68l-15.458.933c-.98.047-1.448-.093-1.962-.7l-3.083-4.012c-.56-.746-.793-1.306-.793-1.959V2.948c0-.793.373-1.493 1.168-1.587l.49-.253z" fill={color}/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" fill="#4285F4"/>
  </svg>
);

const IntegrationCard = ({ 
  icon, 
  name, 
  description, 
  connected, 
  comingSoon,
  brandColor,
  children,
  footer,
  onConnect,
  connectLoading,
  headerExtra,
  showSettings = true,
  hasAccess = true,
  onUpgrade,
}) => {
  const [expanded, setExpanded] = useState(connected);
  const requiresUpgrade = !hasAccess && !connected;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: connected ? alpha(TEAL, 0.3) : (requiresUpgrade ? alpha(AMBER_500, 0.3) : SLATE_200),
        bgcolor: connected ? alpha(TEAL, 0.02) : (requiresUpgrade ? alpha(AMBER_500, 0.02) : '#fff'),
        transition: 'all 0.2s ease',
        opacity: comingSoon ? 0.7 : 1,
        '&:hover': {
          borderColor: comingSoon ? SLATE_200 : (connected ? TEAL : (requiresUpgrade ? AMBER_500 : brandColor)),
          boxShadow: comingSoon ? 'none' : `0 4px 20px ${alpha(requiresUpgrade ? AMBER_500 : brandColor, 0.15)}`,
          transform: comingSoon ? 'none' : 'translateY(-2px)',
        },
      }}
    >
      <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header - fixed height for alignment */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2, minHeight: 100 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              bgcolor: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {name}
              </Typography>
              {connected && (
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
                    '& .MuiChip-icon': { color: TEAL },
                  }}
                />
              )}
              {comingSoon && (
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
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
            {headerExtra}
          </Box>
        </Box>

        {/* Connected content or Connect button */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {connected && showSettings ? (
            <>
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                sx={{ 
                  alignSelf: 'flex-start', 
                  textTransform: 'none', 
                  color: SLATE_500,
                  mb: expanded ? 1 : 0,
                  ml: -0.5,
                }}
              >
                {expanded ? 'Hide options' : 'Show options'}
              </Button>
              <Collapse in={expanded}>
                <Box sx={{ pt: 1 }}>
                  {children}
                </Box>
              </Collapse>
              {expanded && footer && (
                <Box sx={{ mt: 'auto' }}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {footer}
                  </Box>
                </Box>
              )}
            </>
          ) : connected ? (
            <>
              <Box sx={{ pt: 1 }}>
                {children}
              </Box>
              {footer && (
                <Box sx={{ mt: 'auto' }}>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {footer}
                  </Box>
                </Box>
              )}
            </>
          ) : requiresUpgrade ? (
            <Box sx={{ mt: 2 }}>
              <Alert 
                severity="warning" 
                icon={<Lock sx={{ fontSize: 20 }} />}
                sx={{ 
                  mb: 2, 
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Pro Feature
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Upgrade to Pro to connect {name} and sync your workspace.
                </Typography>
              </Alert>
              <Button
                variant="contained"
                onClick={onUpgrade}
                startIcon={<StarBorder />}
                sx={{
                  bgcolor: AMBER_500,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: alpha(AMBER_500, 0.85) },
                }}
              >
                Upgrade to Pro
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={onConnect}
              disabled={comingSoon || connectLoading}
              sx={{
                mt: 2,
                bgcolor: brandColor,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: alpha(brandColor, 0.85) },
                '&:disabled': { bgcolor: SLATE_200 },
              }}
            >
              {connectLoading ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : comingSoon ? (
                'Coming Soon'
              ) : (
                `Connect ${name}`
              )}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const ConnectedUsersDisplay = ({ connectedUsers, currentUserConnected }) => {
  if (!connectedUsers || connectedUsers.length === 0) return null;

  return (
    <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      <AvatarGroup max={2} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
        {connectedUsers.map((u, i) => (
          <Tooltip key={i} title={u.name || 'Co-founder'}>
            <Avatar sx={{ bgcolor: i === 0 ? TEAL : AMBER_500, width: 24, height: 24 }}>
              {(u.name || 'C')[0].toUpperCase()}
            </Avatar>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Typography variant="caption" sx={{ color: SLATE_500 }}>
        {connectedUsers.length === 1 
          ? `${connectedUsers[0]?.name || 'Co-founder'} connected`
          : `${connectedUsers.length} co-founders connected`
        }
      </Typography>
      {connectedUsers.length === 1 && !currentUserConnected && (
        <Chip
          size="small"
          label="You: pending"
          sx={{ 
            height: 20, 
            fontSize: '0.65rem',
            bgcolor: alpha(AMBER_500, 0.1),
            color: AMBER_500,
          }}
        />
      )}
      {currentUserConnected && (
        <Chip
          size="small"
          icon={<Check sx={{ fontSize: 12 }} />}
          label="You're connected"
          sx={{ 
            height: 20, 
            fontSize: '0.65rem',
            bgcolor: alpha(TEAL, 0.1),
            color: TEAL,
            '& .MuiChip-icon': { color: TEAL },
          }}
        />
      )}
    </Box>
  );
};

const WorkspaceIntegrations = ({ workspaceId }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState({});
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [actionLoading, setActionLoading] = useState(null);

  const handleUpgrade = () => {
    navigate('/billing');
  };

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
    
    const params = new URLSearchParams(window.location.search);
    
    // Handle Slack callbacks
    if (params.get('slack') === 'connected') {
      setSnackbar({ open: true, message: 'Slack connected successfully!', severity: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error') === 'slack_mismatch') {
      const message = params.get('message') || 'Your co-founder connected to a different Slack workspace.';
      setSnackbar({ open: true, message: decodeURIComponent(message), severity: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Handle Notion callbacks
    if (params.get('notion') === 'connected') {
      setSnackbar({ open: true, message: 'Notion connected successfully!', severity: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error') === 'notion_mismatch') {
      const message = params.get('message') || 'Your co-founder connected to a different Notion workspace.';
      setSnackbar({ open: true, message: decodeURIComponent(message), severity: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Generic error
    if (params.get('error') && !params.get('error').includes('mismatch')) {
      setSnackbar({ open: true, message: 'Failed to connect. Please try again.', severity: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchIntegrations]);

  // Slack handlers
  const handleConnectSlack = async () => {
    setActionLoading('slack_connect');
    try {
      const response = await fetch(`${API_BASE}/integrations/slack/auth-url?workspace_id=${workspaceId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      } else if (response.status === 403) {
        const data = await response.json();
        if (data.upgrade_required) {
          setSnackbar({ open: true, message: 'Upgrade to Pro to use Slack integration', severity: 'warning' });
        } else {
          setSnackbar({ open: true, message: data.error || 'Access denied', severity: 'error' });
        }
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
    if (!window.confirm('Are you sure you want to disconnect Slack? This will affect both co-founders.')) return;

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

  // Notion handlers
  const handleConnectNotion = async () => {
    setActionLoading('notion_connect');
    try {
      const response = await fetch(`${API_BASE}/integrations/notion/auth-url?workspace_id=${workspaceId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      } else if (response.status === 403) {
        const data = await response.json();
        if (data.upgrade_required) {
          setSnackbar({ open: true, message: 'Upgrade to Pro to use Notion integration', severity: 'warning' });
        } else {
          setSnackbar({ open: true, message: data.error || 'Access denied', severity: 'error' });
        }
      } else {
        setSnackbar({ open: true, message: 'Failed to start Notion connection', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Connection error', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNotionWorkspace = async () => {
    setActionLoading('notion_workspace');
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/notion/create-workspace`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Notion workspace created!', severity: 'success' });
        fetchIntegrations();
      } else {
        const data = await response.json();
        setSnackbar({ open: true, message: data.error || 'Failed to create workspace', severity: 'error' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error creating workspace', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnectNotion = async () => {
    if (!window.confirm('Are you sure you want to disconnect Notion? This will affect both co-founders.')) return;

    setActionLoading('notion_disconnect');
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/integrations/notion`, {
        method: 'DELETE',
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        setSnackbar({ open: true, message: 'Notion disconnected', severity: 'success' });
        fetchIntegrations();
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Error disconnecting', severity: 'error' });
    } finally {
      setActionLoading(null);
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
  const notion = integrations.notion || {};
  const featureAccess = integrations.feature_access || {};
  const slackNotifications = slack.settings?.notifications || {};

  // Build descriptions
  let slackDescription = 'Get check-in reminders, equity updates, and team notifications';
  if (slack.connected) {
    slackDescription = `Connected to ${slack.team_name}${slack.channel_name ? ` • #${slack.channel_name}` : ''}`;
  }

  let notionDescription = 'Auto-create a partnership workspace with tasks, decisions, and meeting notes';
  if (notion.connected) {
    notionDescription = `Connected to ${notion.workspace_name}`;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
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

      {/* Integration Cards Grid */}
      <Grid container spacing={3}>
        {/* Slack */}
        <Grid item xs={12} md={6} lg={4}>
          <IntegrationCard
            icon={<SlackIcon />}
            name="Slack"
            description={slackDescription}
            connected={slack.connected}
            brandColor="#4A154B"
            onConnect={handleConnectSlack}
            connectLoading={actionLoading === 'slack_connect'}
            hasAccess={featureAccess.slackIntegration !== false}
            onUpgrade={handleUpgrade}
            headerExtra={
              <ConnectedUsersDisplay 
                connectedUsers={slack.connected_users} 
                currentUserConnected={slack.current_user_connected} 
              />
            }
            footer={
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Send sx={{ fontSize: 16 }} />}
                  onClick={handleTestNotification}
                  disabled={!slack.channel_id || actionLoading === 'slack_test'}
                  sx={{ textTransform: 'none' }}
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
                  sx={{ textTransform: 'none' }}
                >
                  Disconnect
                </Button>
              </>
            }
          >
            {/* Alert for second co-founder to connect */}
            {slack.connected && !slack.current_user_connected && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2, borderRadius: 2 }}
                action={
                  <Button 
                    size="small" 
                    color="inherit"
                    onClick={handleConnectSlack}
                    disabled={actionLoading === 'slack_connect'}
                    startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                  >
                    Connect
                  </Button>
                }
              >
                <Typography variant="body2">
                  Your co-founder connected Slack. Connect your account to join the channel.
                </Typography>
              </Alert>
            )}

            {/* Channel not created */}
            {slack.connected && !slack.channel_id && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  Channel wasn't created.{' '}
                  <Button
                    size="small"
                    onClick={handleCreateChannel}
                    disabled={actionLoading === 'slack_channel'}
                    sx={{ ml: 1, textTransform: 'none' }}
                  >
                    {actionLoading === 'slack_channel' ? 'Creating...' : 'Create Now'}
                  </Button>
                </Typography>
              </Alert>
            )}

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: SLATE_100, minHeight: 120 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications sx={{ fontSize: 18, color: TEAL }} />
                Notification Settings
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
            </Box>
          </IntegrationCard>
        </Grid>

        {/* Notion */}
        <Grid item xs={12} md={6} lg={4}>
          <IntegrationCard
            icon={<NotionIcon color="#fff" />}
            name="Notion"
            description={notionDescription}
            connected={notion.connected}
            brandColor="#000000"
            onConnect={handleConnectNotion}
            connectLoading={actionLoading === 'notion_connect'}
            showSettings={notion.connected}
            hasAccess={featureAccess.notionIntegration !== false}
            onUpgrade={handleUpgrade}
            headerExtra={
              <ConnectedUsersDisplay 
                connectedUsers={notion.connected_users} 
                currentUserConnected={notion.current_user_connected} 
              />
            }
            footer={
              <>
                {notion.has_workspace && notion.partnership_page_url && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<OpenInNew sx={{ fontSize: 16 }} />}
                    href={notion.partnership_page_url}
                    target="_blank"
                    sx={{ textTransform: 'none' }}
                  >
                    Open in Notion
                  </Button>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<LinkOff sx={{ fontSize: 16 }} />}
                  onClick={handleDisconnectNotion}
                  disabled={actionLoading === 'notion_disconnect'}
                  sx={{ textTransform: 'none' }}
                >
                  Disconnect
                </Button>
              </>
            }
          >
            {/* Alert for second co-founder to connect */}
            {notion.connected && !notion.current_user_connected && (
              <Alert 
                severity="warning" 
                sx={{ mb: 2, borderRadius: 2 }}
                action={
                  <Button 
                    size="small" 
                    color="inherit"
                    onClick={handleConnectNotion}
                    disabled={actionLoading === 'notion_connect'}
                    startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                  >
                    Connect
                  </Button>
                }
              >
                <Typography variant="body2">
                  Your co-founder connected Notion. Connect to the same workspace.
                </Typography>
              </Alert>
            )}

            {/* Workspace not created */}
            {notion.connected && !notion.has_workspace && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2">
                  Partnership workspace not created yet.{' '}
                  <Button
                    size="small"
                    onClick={handleCreateNotionWorkspace}
                    disabled={actionLoading === 'notion_workspace'}
                    startIcon={<Add sx={{ fontSize: 16 }} />}
                    sx={{ ml: 1, textTransform: 'none' }}
                  >
                    {actionLoading === 'notion_workspace' ? 'Creating...' : 'Create Now'}
                  </Button>
                </Typography>
              </Alert>
            )}

            {/* Show workspace info */}
            {notion.connected && notion.has_workspace && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: SLATE_100, minHeight: 120 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Partnership Hub
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your shared Notion workspace includes Tasks, Decisions, and Meeting Notes databases.
                </Typography>
              </Box>
            )}
          </IntegrationCard>
        </Grid>

        {/* Google Calendar */}
        <Grid item xs={12} md={6} lg={4}>
          <IntegrationCard
            icon={<CalendarIcon />}
            name="Google Calendar"
            description="Schedule partnership meetings and sync check-in deadlines"
            connected={false}
            comingSoon
            brandColor="#4285F4"
          />
        </Grid>
      </Grid>

      {/* Tip Box */}
      <Box sx={{ 
        mt: 4, 
        p: 2.5, 
        borderRadius: 2, 
        bgcolor: alpha(TEAL, 0.05), 
        border: '1px solid',
        borderColor: alpha(TEAL, 0.15),
      }}>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
          <strong style={{ color: TEAL }}>Tip:</strong> Both co-founders should connect to the same Slack and Notion workspaces to collaborate effectively.
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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

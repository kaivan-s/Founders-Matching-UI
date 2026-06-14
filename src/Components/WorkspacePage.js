import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams, useNavigate, Routes, Route, Navigate, useMatch } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { API_BASE } from '../config/api';
import { 
  Edit, 
  ArrowBack, 
  TrendingUp,
  Groups,
  Handshake,
  CheckCircleOutline,
  Link as LinkIcon,
  Dashboard,
  ChatBubbleOutline,
  InfoOutlined,
  AutoAwesome,
  MoreVert,
  ExitToApp,
  Warning,
  Archive,
  Cancel,
} from '@mui/icons-material';
import { useWorkspace, useWorkspaceParticipants, useWorkspaceRoles } from '../hooks/useWorkspace';
import { WorkspaceProvider } from '../contexts/WorkspaceContext';
import WorkspaceOverview from './WorkspaceTabs/WorkspaceOverview';
import WorkspaceEquityRoles from './WorkspaceTabs/WorkspaceEquityRoles';
import WorkspaceAdvisors from './WorkspaceTabs/WorkspaceAdvisors';
import WorkspaceSummary from './WorkspaceTabs/WorkspaceSummary';
import WorkspaceIntegrations from './WorkspaceTabs/WorkspaceIntegrations';
import WorkspaceInsights from './WorkspaceTabs/WorkspaceInsights';
import WorkspaceChat from './WorkspaceChat';
// Optional: Import NotificationBell for in-workspace notifications
// import NotificationBell from './NotificationBell';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { workspace, loading, error, updateWorkspace } = useWorkspace(workspaceId);
  const { participants } = useWorkspaceParticipants(workspaceId);
  const { roles } = useWorkspaceRoles(workspaceId);
  const [workspacePlan, setWorkspacePlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [setupBannerDismissed, setSetupBannerDismissed] = useState(false);
  
  // Dissolution state
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);
  const [dissolutionDialogOpen, setDissolutionDialogOpen] = useState(false);
  const [dissolutionConfirmDialogOpen, setDissolutionConfirmDialogOpen] = useState(false);
  const [dissolutionCancelDialogOpen, setDissolutionCancelDialogOpen] = useState(false);
  const [dissolutionReason, setDissolutionReason] = useState('');
  const [dissolutionLoading, setDissolutionLoading] = useState(false);
  const [dissolutionError, setDissolutionError] = useState(null);
  
  // Use React Router's useMatch to properly detect active route
  const overviewMatch = useMatch(`/workspaces/${workspaceId}/overview`);
  const chatMatch = useMatch(`/workspaces/${workspaceId}/chat`);
  const equityRolesMatch = useMatch(`/workspaces/${workspaceId}/equity-roles`);
  const advisorsMatch = useMatch(`/workspaces/${workspaceId}/advisors`);
  const summaryMatch = useMatch(`/workspaces/${workspaceId}/summary`);
  const integrationsMatch = useMatch(`/workspaces/${workspaceId}/integrations`);
  const insightsMatch = useMatch(`/workspaces/${workspaceId}/insights`);
  
  // Determine active tab based on route matches
  // Tabs: 0=Overview, 1=Chat, 2=Equity & Roles, 3=Advisors, 4=Integrations, 5=Insights
  const activeTab = useMemo(() => {
    if (overviewMatch || summaryMatch) return 0; // Summary merged into Overview
    if (chatMatch) return 1;
    if (equityRolesMatch) return 2;
    if (advisorsMatch) return 3;
    if (integrationsMatch) return 4;
    if (insightsMatch) return 5;
    return 0; // Default to overview
  }, [overviewMatch, chatMatch, equityRolesMatch, advisorsMatch, summaryMatch, integrationsMatch, insightsMatch]);

  // Check what setup items are incomplete
  const setupStatus = useMemo(() => {
    if (!participants || participants.length === 0 || !user?.id) return null;
    
    // Find current user's participant record (match by clerk_user_id)
    const currentUserParticipant = participants.find(p => 
      p.user?.clerk_user_id === user.id || p.clerk_user_id === user.id
    );
    
    if (!currentUserParticipant) return null;
    
    // Skip for advisors
    if (currentUserParticipant.role === 'ADVISOR') return null;
    
    const items = [];
    
    // Check if current user has set their profile (commitment hours, role, etc.)
    const currentUserRole = roles?.find(r => r.user_id === currentUserParticipant.user_id);
    const hasFilledProfile = currentUserParticipant.weekly_commitment_hours || currentUserRole?.role_title;
    
    if (!hasFilledProfile) {
      items.push({ 
        label: 'Complete your profile', 
        tab: 0, 
        section: 'founders-section' 
      });
    }
    
    return {
      isComplete: items.length === 0,
      items,
    };
  }, [participants, roles, user?.id]);

  // Fetch workspace plan tier
  useEffect(() => {
    const fetchWorkspacePlan = async () => {
      if (!user?.id || !workspaceId) return;
      setPlanLoading(true);
      try {
        const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/check-feature?feature=workspaceFeatures.equityFull`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setWorkspacePlan(data.workspace_plan || 'FREE');
        } else {
          setWorkspacePlan('FREE');
        }
      } catch (err) {
        setWorkspacePlan('FREE');
      } finally {
        setPlanLoading(false);
      }
    };
    if (user?.id && workspaceId) {
      fetchWorkspacePlan();
    }
  }, [user?.id, workspaceId]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingStage, setEditingStage] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [stageValue, setStageValue] = useState('');

  const handleTabChange = (event, newValue) => {
    const routes = ['overview', 'chat', 'equity-roles', 'advisors', 'integrations', 'insights'];
    const newPath = `/workspaces/${workspaceId}/${routes[newValue]}`;
    navigate(newPath, { replace: false });
  };

  const handleEditTitle = () => {
    setTitleValue(workspace?.title || '');
    setEditingTitle(true);
  };

  const handleSaveTitle = async () => {
    try {
      const result = await updateWorkspace({ title: titleValue });
      setEditingTitle(false);
    } catch (err) {
      alert('Failed to update title. Please try again.');
    }
  };

  const handleEditStage = () => {
    setStageValue(workspace?.stage || 'idea');
    setEditingStage(true);
  };

  const handleSaveStage = async () => {
    try {
      const result = await updateWorkspace({ stage: stageValue });
      setEditingStage(false);
    } catch (err) {
      alert('Failed to update stage. Please try again.');
    }
  };

  const handleSetupItemClick = (item) => {
    // Navigate to the correct tab
    const routes = ['overview', 'chat', 'equity-roles', 'advisors', 'integrations', 'insights'];
    navigate(`/workspaces/${workspaceId}/${routes[item.tab]}`);
    
    // Scroll to the section after a short delay to allow navigation
    setTimeout(() => {
      const section = document.getElementById(item.section);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getLastUpdated = () => {
    if (!workspace?.updated_at) return '';
    const updated = new Date(workspace.updated_at);
    const now = new Date();
    const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  // Dissolution handlers
  const handleRequestDissolution = async () => {
    if (!workspace?.match_id || !user?.id) return;
    
    setDissolutionLoading(true);
    setDissolutionError(null);
    
    try {
      const response = await fetch(`${API_BASE}/matches/${workspace.match_id}/dissolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ reason: dissolutionReason }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request dissolution');
      }
      
      setDissolutionDialogOpen(false);
      setDissolutionReason('');
      // Refresh workspace to show updated status
      window.location.reload();
    } catch (err) {
      setDissolutionError(err.message);
    } finally {
      setDissolutionLoading(false);
    }
  };

  const handleConfirmDissolution = async () => {
    if (!workspace?.match_id || !user?.id) return;
    
    setDissolutionLoading(true);
    setDissolutionError(null);
    
    try {
      const response = await fetch(`${API_BASE}/matches/${workspace.match_id}/dissolution/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to confirm dissolution');
      }
      
      setDissolutionConfirmDialogOpen(false);
      // Redirect to workspaces list
      navigate('/workspaces');
    } catch (err) {
      setDissolutionError(err.message);
    } finally {
      setDissolutionLoading(false);
    }
  };

  const handleCancelDissolution = async () => {
    if (!workspace?.match_id || !user?.id) return;
    
    setDissolutionLoading(true);
    setDissolutionError(null);
    
    try {
      const response = await fetch(`${API_BASE}/matches/${workspace.match_id}/dissolution/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel dissolution');
      }
      
      setDissolutionCancelDialogOpen(false);
      // Refresh workspace to show updated status
      window.location.reload();
    } catch (err) {
      setDissolutionError(err.message);
    } finally {
      setDissolutionLoading(false);
    }
  };

  // Check if current user initiated the dissolution
  const isCurrentUserDissolutionRequester = useMemo(() => {
    if (!workspace || !participants || !user?.id) return false;
    const currentUserParticipant = participants.find(p => p.user?.clerk_user_id === user.id);
    return workspace.dissolution_requested_by === currentUserParticipant?.user_id;
  }, [workspace, participants, user?.id]);

  // Format cooloff end date
  const formatCooloffDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getStageLabel = (stage) => {
    const labels = {
      idea: 'Idea',
      mvp: 'MVP',
      revenue: 'Revenue',
      other: 'Other'
    };
    return labels[stage] || stage;
  };

  const getStageColor = (stage) => {
    const colors = {
      idea: { bg: 'rgba(147, 51, 234, 0.1)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.2)' },
      mvp: { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' },
      revenue: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.2)' },
      other: { bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.2)' }
    };
    return colors[stage] || colors.other;
  };

  const tabIcons = [
    <TrendingUp fontSize="small" />,
    <ChatBubbleOutline fontSize="small" />,
    <Groups fontSize="small" />,
    <Handshake fontSize="small" />,
    <LinkIcon fontSize="small" />,
    <AutoAwesome fontSize="small" />,
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" px={2}>
        <Alert severity="error" sx={{ maxWidth: '500px' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!workspace) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <Typography>Workspace not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Compact Header Bar */}
      <Box sx={{ 
        bgcolor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: '#e2e8f0',
        px: { xs: 2, sm: 3, md: 4 },
        py: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
          <Tooltip title="Back to workspaces">
              <IconButton 
              onClick={() => navigate('/workspaces')}
                size="small"
                sx={{ 
                  color: '#64748b',
                  bgcolor: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  '&:hover': { 
                    bgcolor: '#f8fafc',
                    color: '#1e3a8a',
                    borderColor: '#cbd5e1'
                  }
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
            </Tooltip>
          
          {/* Optional: Add NotificationBell here for in-workspace notifications */}
          {/* <NotificationBell workspaceId={workspaceId} clerkUserId={user.id} /> */}
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              {editingTitle ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap', minWidth: { xs: '100%', sm: 'auto' } }}>
                  <TextField
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    size="small"
                    placeholder="Enter workspace title"
                    sx={{ 
                      flex: 1, 
                      maxWidth: { xs: '100%', sm: 400 },
                      minWidth: { xs: '100%', sm: 200 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: { xs: '1rem', sm: '1.125rem' },
                        fontWeight: 600,
                      }
                    }}
                    autoFocus
                  />
                  <Button 
                    size="small" 
                    onClick={handleSaveTitle} 
                    variant="contained"
                    sx={{
                      bgcolor: '#0d9488',
                      boxShadow: 'none',
                      '&:hover': {
                        bgcolor: '#14b8a6',
                        boxShadow: 'none',
                      }
                    }}
                  >
                    Save
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setEditingTitle(false)}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </Box>
              ) : (
                <>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#1e3a8a',
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                      letterSpacing: '-0.01em',
                      wordBreak: 'break-word',
                    }}
                  >
                    {workspace.title || 'Untitled Workspace'}
                  </Typography>
                  <Tooltip title="Edit title">
                    <IconButton 
                      size="small" 
                      onClick={handleEditTitle}
                      sx={{ 
                        p: 0.5,
                        color: '#94a3b8', 
                        '&:hover': { 
                          color: '#1e3a8a',
                          bgcolor: 'transparent'
                        } 
                      }}
                    >
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                ml: { xs: 0, sm: 'auto' },
                flexWrap: 'wrap',
              }}>
                {editingStage ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={stageValue}
                        onChange={(e) => setStageValue(e.target.value)}
                        sx={{ fontSize: '0.875rem' }}
                      >
                        <MenuItem value="idea">Idea</MenuItem>
                        <MenuItem value="mvp">MVP</MenuItem>
                        <MenuItem value="revenue">Revenue</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                    <IconButton 
                      size="small"
                      onClick={handleSaveStage}
                      color="success"
                    >
                      <CheckCircleOutline fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setEditingStage(false)}
                      color="error"
                    >
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>×</Typography>
                    </IconButton>
                  </Box>
                ) : (
                  <>
                    <Tooltip title="Click to change stage">
                      <Chip
                        label={getStageLabel(workspace.stage)}
                        size="small"
                        sx={{
                          bgcolor: getStageColor(workspace.stage).bg,
                          color: getStageColor(workspace.stage).color,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          border: `1px solid ${getStageColor(workspace.stage).border}`,
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          }
                        }}
                        onClick={handleEditStage}
                      />
                    </Tooltip>
                    {!planLoading && workspacePlan && workspacePlan !== 'FREE' && (
                      <Chip
                        label={workspacePlan === 'PRO' ? 'Pro Workspace' : 'Pro+ Workspace'}
                        size="small"
                        sx={{
                          bgcolor: workspacePlan === 'PRO_PLUS' ? '#7c3aed' : '#1e3a8a',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          height: 24,
                          '&:hover': {
                            bgcolor: workspacePlan === 'PRO_PLUS' ? '#6d28d9' : '#1e40af',
                          }
                        }}
                      />
                    )}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        display: { xs: 'none', md: 'block' }
                      }}
                    >
                      Updated {getLastUpdated()}
                    </Typography>
                    
                    {/* Settings Menu */}
                    {!workspace?.is_archived && workspace?.dissolution_status !== 'requested' && (
                      <>
                        <Tooltip title="Workspace settings">
                          <IconButton
                            size="small"
                            onClick={(e) => setSettingsMenuAnchor(e.currentTarget)}
                            sx={{ 
                              color: '#94a3b8',
                              '&:hover': { color: '#64748b', bgcolor: '#f1f5f9' }
                            }}
                          >
                            <MoreVert fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Menu
                          anchorEl={settingsMenuAnchor}
                          open={Boolean(settingsMenuAnchor)}
                          onClose={() => setSettingsMenuAnchor(null)}
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                          <MenuItem 
                            onClick={() => {
                              setSettingsMenuAnchor(null);
                              setDissolutionDialogOpen(true);
                            }}
                            sx={{ color: '#dc2626' }}
                          >
                            <ListItemIcon>
                              <ExitToApp fontSize="small" sx={{ color: '#dc2626' }} />
                            </ListItemIcon>
                            <ListItemText primary="End Partnership" />
                          </MenuItem>
                        </Menu>
                      </>
                    )}
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Integrated Tab Navigation */}
      <Box sx={{ 
        bgcolor: '#ffffff',
        borderBottom: '1px solid',
        borderColor: '#e2e8f0',
        px: { xs: 1, sm: 2, md: 4 },
      }}>
        <Tabs 
          value={activeTab >= 0 ? activeTab : false} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 48,
            '& .MuiTabs-flexContainer': {
              gap: { xs: 0, sm: 2 },
            },
            '& .MuiTab-root': {
              minHeight: 48,
              px: 1,
              mr: 2,
              '&:hover': {
                color: '#1e3a8a',
                bgcolor: 'transparent',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              backgroundColor: '#0d9488',
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[0]}
                <span>Home</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[1]}
                <span>Chat</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[2]}
                <span>Equity & Roles</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[3]}
                <span>Advisors</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[4]}
                <span>Integrations</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[5]}
                <span>Insights</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* Setup Completion Banner */}
      {setupStatus && !setupStatus.isComplete && !setupBannerDismissed && (
        <Box sx={{ 
          bgcolor: '#fffbeb',
          borderBottom: '1px solid #fcd34d',
          px: { xs: 2, sm: 3, md: 4 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2 },
          flexWrap: 'wrap',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, flexWrap: 'wrap' }}>
            <InfoOutlined sx={{ color: '#d97706', fontSize: 20, display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Complete your workspace setup:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', sm: 'auto' }, mt: { xs: 1, sm: 0 } }}>
              {setupStatus.items.map((item, idx) => (
                <Chip
                  key={idx}
                  label={item.label}
                  size="small"
                  onClick={() => handleSetupItemClick(item)}
                  sx={{
                    bgcolor: '#fef3c7',
                    color: '#92400e',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: '#fde68a',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
          <IconButton 
            size="small" 
            onClick={() => setSetupBannerDismissed(true)}
            sx={{ color: '#92400e' }}
          >
            <Typography sx={{ fontSize: 16, fontWeight: 'bold' }}>×</Typography>
          </IconButton>
        </Box>
      )}

      {/* Archived Workspace Banner */}
      {workspace?.is_archived && (
        <Box sx={{ 
          bgcolor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}>
          <Archive sx={{ color: '#dc2626', fontSize: 24 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#991b1b', fontWeight: 600 }}>
              This workspace has been archived
            </Typography>
            <Typography variant="body2" sx={{ color: '#b91c1c' }}>
              The partnership was dissolved on {formatCooloffDate(workspace.archived_at)}. This workspace is now read-only.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Dissolution Pending Banner */}
      {workspace?.dissolution_status === 'requested' && !workspace?.is_archived && (
        <Box sx={{ 
          bgcolor: '#fef3c7',
          borderBottom: '1px solid #fcd34d',
          px: { xs: 2, sm: 3, md: 4 },
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
        }}>
          <Warning sx={{ color: '#d97706', fontSize: 24 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: '#92400e', fontWeight: 600 }}>
              Partnership dissolution requested
            </Typography>
            <Typography variant="body2" sx={{ color: '#a16207' }}>
              {isCurrentUserDissolutionRequester 
                ? `You requested to end this partnership. It will be dissolved on ${formatCooloffDate(workspace.dissolution_cooloff_ends_at)} unless you cancel.`
                : `Your partner has requested to end this partnership. It will be dissolved on ${formatCooloffDate(workspace.dissolution_cooloff_ends_at)}.`
              }
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {isCurrentUserDissolutionRequester ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<Cancel />}
                onClick={() => setDissolutionCancelDialogOpen(true)}
                sx={{ 
                  borderColor: '#d97706',
                  color: '#92400e',
                  '&:hover': { borderColor: '#b45309', bgcolor: '#fef3c7' }
                }}
              >
                Cancel Request
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => setDissolutionConfirmDialogOpen(true)}
                sx={{ 
                  bgcolor: '#dc2626',
                  '&:hover': { bgcolor: '#b91c1c' }
                }}
              >
                Confirm End
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Content Area with smooth transitions */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto',
        background: 'linear-gradient(180deg, #fafbfc 0%, #f3f4f6 100%)',
      }}>
        <Box sx={{ 
          px: { xs: 2, sm: 3, md: 4 }, 
          py: { xs: 2, sm: 3 },
          animation: 'fadeIn 0.3s ease-in-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' }
          }
        }}>
          {/* WorkspaceProvider consolidates data fetching for all tabs */}
          <WorkspaceProvider workspaceId={workspaceId}>
            <Routes>
              <Route path="overview" element={<WorkspaceOverview workspaceId={workspaceId} workspace={workspace} onNavigateTab={(tab) => {
                const routes = ['overview', 'chat', 'equity-roles', 'advisors', 'integrations', 'insights'];
                navigate(`/workspaces/${workspaceId}/${routes[tab]}`, { replace: false });
              }} />} />
              <Route path="chat" element={
                workspace?.match_id ? (
                  <Box sx={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
                    <WorkspaceChat 
                      matchId={workspace.match_id} 
                      currentFounderId={workspace?.participants?.find(p => p.user?.clerk_user_id === user?.id)?.user_id}
                    />
                  </Box>
                ) : (
                  <Box sx={{ p: 6, textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
                    <ChatBubbleOutline sx={{ fontSize: 48, color: '#94a3b8', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 1 }}>
                      Chat with your co-founder
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Once you're matched with a co-founder, you'll be able to chat here directly.
                    </Typography>
                  </Box>
                )
              } />
              <Route path="equity-roles" element={<WorkspaceEquityRoles workspaceId={workspaceId} />} />
              <Route path="advisors" element={<WorkspaceAdvisors workspaceId={workspaceId} />} />
              <Route path="summary" element={<Navigate to="overview" replace />} />
              <Route path="integrations" element={<WorkspaceIntegrations workspaceId={workspaceId} />} />
              <Route path="insights" element={<WorkspaceInsights workspaceId={workspaceId} />} />
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="*" element={<Navigate to="overview" replace />} />
            </Routes>
          </WorkspaceProvider>
        </Box>
      </Box>

      {/* Request Dissolution Dialog */}
      <Dialog 
        open={dissolutionDialogOpen} 
        onClose={() => !dissolutionLoading && setDissolutionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          End Partnership
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to end this partnership? This will start a <strong>7-day cooling-off period</strong>.
          </Typography>
          <Box sx={{ bgcolor: '#fef3c7', p: 2, borderRadius: 1, mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#92400e', fontWeight: 500, mb: 1 }}>
              What happens next:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#a16207' }}>
              <li>Your partner will be notified immediately</li>
              <li>They can confirm to end the partnership right away</li>
              <li>Or it will automatically end after 7 days</li>
              <li>You can cancel this request anytime during the 7 days</li>
              <li>Your workspace data will be preserved in read-only mode</li>
            </ul>
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason (optional)"
            placeholder="Share why you want to end this partnership..."
            value={dissolutionReason}
            onChange={(e) => setDissolutionReason(e.target.value)}
            sx={{ mb: 2 }}
          />
          {dissolutionError && (
            <Alert severity="error" sx={{ mb: 2 }}>{dissolutionError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDissolutionDialogOpen(false)}
            disabled={dissolutionLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRequestDissolution}
            variant="contained"
            disabled={dissolutionLoading}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
          >
            {dissolutionLoading ? 'Requesting...' : 'Request Dissolution'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dissolution Dialog (for the other party) */}
      <Dialog 
        open={dissolutionConfirmDialogOpen} 
        onClose={() => !dissolutionLoading && setDissolutionConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#dc2626', fontWeight: 600 }}>
          Confirm End Partnership
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Your partner has requested to end this partnership. If you confirm, the partnership will end <strong>immediately</strong>.
          </Typography>
          <Box sx={{ bgcolor: '#fef2f2', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#991b1b' }}>
              <strong>Note:</strong> Your workspace will become read-only, but all data (equity records, documents, chat history) will be preserved and accessible.
            </Typography>
          </Box>
          {workspace?.dissolution_reason && (
            <Box sx={{ bgcolor: '#f1f5f9', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                Their reason:
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155', mt: 0.5 }}>
                {workspace.dissolution_reason}
              </Typography>
            </Box>
          )}
          {dissolutionError && (
            <Alert severity="error" sx={{ mb: 2 }}>{dissolutionError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDissolutionConfirmDialogOpen(false)}
            disabled={dissolutionLoading}
          >
            Wait (Let it expire)
          </Button>
          <Button 
            onClick={handleConfirmDissolution}
            variant="contained"
            disabled={dissolutionLoading}
            sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}
          >
            {dissolutionLoading ? 'Confirming...' : 'Confirm End Partnership'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dissolution Dialog (for the requester) */}
      <Dialog 
        open={dissolutionCancelDialogOpen} 
        onClose={() => !dissolutionLoading && setDissolutionCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Cancel Dissolution Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to cancel your dissolution request? Your partnership will continue as normal.
          </Typography>
          {dissolutionError && (
            <Alert severity="error" sx={{ mb: 2 }}>{dissolutionError}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDissolutionCancelDialogOpen(false)}
            disabled={dissolutionLoading}
          >
            Keep Request
          </Button>
          <Button 
            onClick={handleCancelDissolution}
            variant="contained"
            disabled={dissolutionLoading}
            color="primary"
          >
            {dissolutionLoading ? 'Cancelling...' : 'Cancel Dissolution Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspacePage;


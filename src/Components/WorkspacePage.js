import React, { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams, useNavigate, useLocation, Routes, Route, Navigate, useMatch } from 'react-router-dom';
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
} from '@mui/material';
import { API_BASE } from '../config/api';
import { 
  Edit, 
  ArrowBack, 
  Schedule,
  TrendingUp,
  Groups,
  CheckCircleOutline,
  ChatBubbleOutline,
  Assignment,
  Folder
} from '@mui/icons-material';
import { useWorkspace } from '../hooks/useWorkspace';
import WorkspaceOverview from './WorkspaceTabs/WorkspaceOverview';
import WorkspaceDecisions from './WorkspaceTabs/WorkspaceDecisions';
import WorkspaceEquityRoles from './WorkspaceTabs/WorkspaceEquityRoles';
import WorkspaceCommitments from './WorkspaceTabs/WorkspaceCommitments';
import WorkspaceTasks from './WorkspaceTabs/WorkspaceTasks';
import WorkspaceChat from './WorkspaceChat';
import WorkspaceAccountability from './WorkspaceTabs/WorkspaceAccountability';
import WorkspaceDocuments from './WorkspaceTabs/WorkspaceDocuments';
// Optional: Import NotificationBell for in-workspace notifications
// import NotificationBell from './NotificationBell';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { workspace, loading, error, updateWorkspace } = useWorkspace(workspaceId);
  const [currentFounderId, setCurrentFounderId] = useState(null);
  
  // Use React Router's useMatch to properly detect active route
  const overviewMatch = useMatch(`/workspaces/${workspaceId}/overview`);
  const decisionsMatch = useMatch(`/workspaces/${workspaceId}/decisions`);
  const equityRolesMatch = useMatch(`/workspaces/${workspaceId}/equity-roles`);
  const commitmentsMatch = useMatch(`/workspaces/${workspaceId}/commitments`);
  const tasksMatch = useMatch(`/workspaces/${workspaceId}/tasks`);
  const chatMatch = useMatch(`/workspaces/${workspaceId}/chat`);
  const accountabilityMatch = useMatch(`/workspaces/${workspaceId}/accountability`);
  const documentsMatch = useMatch(`/workspaces/${workspaceId}/documents`);
  
  // Determine active tab based on route matches
  const activeTab = useMemo(() => {
    if (overviewMatch) return 0;
    if (decisionsMatch) return 1;
    if (equityRolesMatch) return 2;
    if (commitmentsMatch) return 3;
    if (tasksMatch) return 4;
    if (documentsMatch) return 5;
    if (chatMatch) return 6;
    if (accountabilityMatch) return 7;
    return 0; // Default to overview
  }, [overviewMatch, decisionsMatch, equityRolesMatch, commitmentsMatch, tasksMatch, documentsMatch, chatMatch, accountabilityMatch]);

  useEffect(() => {
    // Fetch current founder ID
    const fetchFounderId = async () => {
      try {
        const response = await fetch(`${API_BASE}/profile/check`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.profile && data.profile.id) {
            setCurrentFounderId(data.profile.id);
          }
        }
      } catch (err) {
        console.error('Error fetching founder ID:', err);
      }
    };
    if (user) {
      fetchFounderId();
    }
  }, [user]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingStage, setEditingStage] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [stageValue, setStageValue] = useState('');

  const handleTabChange = (event, newValue) => {
    const routes = ['overview', 'decisions', 'equity-roles', 'commitments', 'tasks', 'documents', 'chat', 'accountability'];
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
      console.error('Failed to update title:', err);
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
      console.error('Failed to update stage:', err);
      alert('Failed to update stage. Please try again.');
    }
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
    <CheckCircleOutline fontSize="small" />,
    <Groups fontSize="small" />,
    <Schedule fontSize="small" />,
    <Assignment fontSize="small" />,
    <Folder fontSize="small" />,
    <ChatBubbleOutline fontSize="small" />,
    <Groups fontSize="small" />
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {editingTitle ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  <TextField
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    size="small"
                    placeholder="Enter workspace title"
                    sx={{ 
                      flex: 1, 
                      maxWidth: 400,
                      '& .MuiOutlinedInput-root': {
                        fontSize: '1.125rem',
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
                      fontSize: '1.125rem',
                      letterSpacing: '-0.01em',
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
                ml: 'auto'
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
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        display: { xs: 'none', sm: 'block' }
                      }}
                    >
                      Updated {getLastUpdated()}
                    </Typography>
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
          value={activeTab} 
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
                <span>Overview</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[1]}
                <span>Decisions</span>
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
                <span>Commitments & KPIs</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[4]}
                <span>Tasks</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[5]}
                <span>Documents</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[6]}
                <span>Chat</span>
              </Box>
            }
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                {tabIcons[7]}
                <span>Accountability</span>
              </Box>
            }
          />
        </Tabs>
      </Box>

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
          <Routes>
            <Route path="overview" element={<WorkspaceOverview workspaceId={workspaceId} workspace={workspace} onNavigateTab={(tab) => {
              const routes = ['overview', 'decisions', 'equity-roles', 'commitments', 'tasks', 'documents', 'chat', 'accountability'];
              navigate(`/workspaces/${workspaceId}/${routes[tab]}`, { replace: false });
            }} />} />
            <Route path="decisions" element={<WorkspaceDecisions workspaceId={workspaceId} />} />
            <Route path="equity-roles" element={<WorkspaceEquityRoles workspaceId={workspaceId} />} />
            <Route path="commitments" element={<WorkspaceCommitments workspaceId={workspaceId} />} />
            <Route path="tasks" element={<WorkspaceTasks workspaceId={workspaceId} />} />
            <Route path="documents" element={<WorkspaceDocuments workspaceId={workspaceId} />} />
            <Route path="chat" element={
            <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 400 }}>
              <WorkspaceChat matchId={workspace?.match_id} currentFounderId={currentFounderId} />
            </Box>
            } />
            <Route path="accountability" element={<WorkspaceAccountability workspaceId={workspaceId} />} />
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default WorkspacePage;


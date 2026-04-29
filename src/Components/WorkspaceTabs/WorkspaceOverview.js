import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  Chip,
  Grid,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { 
  Edit, 
  AccessTime, 
  Language,
  Person,
  TrendingUp,
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Groups,
  Flag,
  Business,
  Close,
  CheckCircleOutline,
  Warning,
  ArrowForward,
  CalendarToday,
  ExitToApp,
  SentimentVeryDissatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  SentimentSatisfied,
  SentimentVerySatisfied,
  Create,
  VideoCall,
  PlayArrow,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceParticipants } from '../../hooks/useWorkspace';
import { useWorkspaceEquity } from '../../hooks/useWorkspace';
import { useWorkspaceRoles } from '../../hooks/useWorkspace';
import { useWorkspaceCheckins } from '../../hooks/useWorkspace';
import { API_BASE } from '../../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const WorkspaceOverview = ({ workspaceId, workspace, onNavigateTab }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { participants: allParticipants, loading: participantsLoading, updateParticipant } = useWorkspaceParticipants(workspaceId);
  
  const participants = allParticipants?.filter(p => p.role !== 'ADVISOR') || [];
  const { equity, loading: equityLoading } = useWorkspaceEquity(workspaceId);
  const { roles, loading: rolesLoading } = useWorkspaceRoles(workspaceId);
  const { checkins, loading: checkinsLoading } = useWorkspaceCheckins(workspaceId, 10);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editForm, setEditForm] = useState({ weekly_commitment_hours: '', timezone: '' });
  const [compatibilityDrawerOpen, setCompatibilityDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  const [equityScenarios, setEquityScenarios] = useState([]);
  const [equityScenariosLoading, setEquityScenariosLoading] = useState(true);
  
  // Dissolve partnership state
  const [dissolveDialogOpen, setDissolveDialogOpen] = useState(false);
  const [dissolving, setDissolving] = useState(false);
  const [dissolveError, setDissolveError] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  
  // Weekly partner check-in state
  const [checkinDialogOpen, setCheckinDialogOpen] = useState(false);
  const [checkinStatus, setCheckinStatus] = useState(null);
  const [checkinStatusLoading, setCheckinStatusLoading] = useState(true);
  const [currentWeekCheckins, setCurrentWeekCheckins] = useState(null);
  const [healthTrend, setHealthTrend] = useState([]);
  const [recentCheckins, setRecentCheckins] = useState([]);
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [checkinForm, setCheckinForm] = useState({
    accomplishments: '',
    blockers: '',
    next_week_focus: '',
    partnership_health: 4,
    cofounder_shoutout: '',
  });
  
  // Founder Date state
  const [founderDates, setFounderDates] = useState([]);
  const [founderDatesLoading, setFounderDatesLoading] = useState(true);
  const [startingFounderDate, setStartingFounderDate] = useState(false);
  
  // Fetch founder dates
  useEffect(() => {
    const fetchFounderDates = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`${API_BASE}/founder-dates`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (res.ok) {
          const data = await res.json();
          setFounderDates(data.founder_dates || []);
        }
      } catch (err) {
        console.error('Error fetching founder dates:', err);
      } finally {
        setFounderDatesLoading(false);
      }
    };
    fetchFounderDates();
  }, [user?.id]);
  
  // Start a founder date
  const handleStartFounderDate = async () => {
    if (!user?.id || !workspace?.match_id) return;
    
    const otherParticipant = participants.find(p => p.user?.clerk_user_id !== user.id);
    if (!otherParticipant) return;
    
    setStartingFounderDate(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          other_founder_id: otherParticipant.user_id,
          match_id: workspace.match_id,
          project_id: workspace.project_id,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        navigate(`/founder-dates/${data.id}`);
      }
    } catch (err) {
      console.error('Error starting founder date:', err);
    } finally {
      setStartingFounderDate(false);
    }
  };
  
  const handleDissolvePartnership = async () => {
    if (!workspace?.match_id) {
      setDissolveError('Cannot dissolve: No match associated with this workspace');
      return;
    }
    
    setDissolving(true);
    setDissolveError(null);
    
    try {
      const response = await fetch(`${API_BASE}/matches/${workspace.match_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user?.id,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to dissolve partnership');
      }
      
      // Success - redirect to dashboard
      setDissolveDialogOpen(false);
      navigate('/home', { replace: true });
      
    } catch (err) {
      setDissolveError(err.message);
    } finally {
      setDissolving(false);
    }
  };
  
  const fetchEquityScenarios = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    try {
      setEquityScenariosLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/scenarios`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setEquityScenarios(data.scenarios || []);
      }
    } catch (err) {
      // Error fetching equity scenarios
    } finally {
      setEquityScenariosLoading(false);
    }
  }, [user?.id, workspaceId]);
  
  useEffect(() => {
    fetchEquityScenarios();
  }, [fetchEquityScenarios]);
  
  // Weekly check-in functions
  const fetchCheckinStatus = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    try {
      setCheckinStatusLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/partner-checkins/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setCheckinStatus(data);
      }
    } catch (err) {
      console.error('Error fetching check-in status:', err);
    } finally {
      setCheckinStatusLoading(false);
    }
  }, [user?.id, workspaceId]);
  
  const fetchCurrentWeekCheckins = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/partner-checkins/current-week`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentWeekCheckins(data);
      }
    } catch (err) {
      console.error('Error fetching current week check-ins:', err);
    }
  }, [user?.id, workspaceId]);
  
  const fetchHealthTrend = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/partner-checkins/health-trend?weeks=8`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setHealthTrend(data);
      }
    } catch (err) {
      console.error('Error fetching health trend:', err);
    }
  }, [user?.id, workspaceId]);
  
  const fetchRecentCheckins = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/partner-checkins?limit=6`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentCheckins(data);
      }
    } catch (err) {
      console.error('Error fetching recent check-ins:', err);
    }
  }, [user?.id, workspaceId]);
  
  useEffect(() => {
    fetchCheckinStatus();
    fetchCurrentWeekCheckins();
    fetchHealthTrend();
    fetchRecentCheckins();
  }, [fetchCheckinStatus, fetchCurrentWeekCheckins, fetchHealthTrend, fetchRecentCheckins]);
  
  const handleSubmitCheckin = async () => {
    if (!checkinForm.accomplishments.trim() || !checkinForm.next_week_focus.trim()) {
      return;
    }
    
    setCheckinSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/partner-checkins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(checkinForm),
      });
      
      if (response.ok) {
        setCheckinDialogOpen(false);
        setCheckinForm({
          accomplishments: '',
          blockers: '',
          next_week_focus: '',
          partnership_health: 4,
          cofounder_shoutout: '',
        });
        // Refresh data
        fetchCheckinStatus();
        fetchCurrentWeekCheckins();
        fetchHealthTrend();
        fetchRecentCheckins();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit check-in');
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      alert('Failed to submit check-in');
    } finally {
      setCheckinSubmitting(false);
    }
  };
  
  const getHealthEmoji = (health) => {
    const emojis = ['', '😟', '😐', '🙂', '😊', '🤩'];
    return emojis[health] || '🙂';
  };
  
  const getHealthLabel = (health) => {
    const labels = ['', 'Struggling', 'Needs Work', 'Okay', 'Good', 'Great'];
    return labels[health] || 'Okay';
  };
  
  const getHealthColor = (health) => {
    const colors = ['', '#ef4444', '#f59e0b', '#94a3b8', '#22c55e', '#0d9488'];
    return colors[health] || SLATE_400;
  };
  
  const getDaysSinceLastCheckin = () => {
    if (!checkinStatus?.last_checkin_date) return null;
    const lastDate = new Date(checkinStatus.last_checkin_date);
    const now = new Date();
    const diffTime = Math.abs(now - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEditParticipant = (participant) => {
    setEditForm({
      weekly_commitment_hours: participant.weekly_commitment_hours || '',
      timezone: participant.timezone || '',
    });
    setEditingParticipant(participant.user_id);
  };

  const handleSaveParticipant = async () => {
    try {
      await updateParticipant(editingParticipant, editForm);
      setEditingParticipant(null);
    } catch (err) {
      // Error updating participant
    }
  };

  const milestones = useMemo(() => {
    const hasApprovedScenario = equityScenarios.some(s => s.status === 'approved');
    const hasOldEquityCurrent = equity?.current !== null && equity?.current !== undefined;
    const equityAgreed = hasApprovedScenario || hasOldEquityCurrent;
    
    const rolesDefined = roles && roles.length >= 2 && roles.every(r => r.role_title);
    
    const completed = [equityAgreed, rolesDefined].filter(Boolean).length;
    const progress = (completed / 2) * 100;
    
    return {
      equityAgreed,
      rolesDefined,
      completed,
      progress,
    };
  }, [equity, roles, equityScenarios]);

  const currentFocus = useMemo(() => {
    if (!milestones.equityAgreed) {
      return {
        text: "Finalize your equity split and vesting.",
        action: "Go to Equity & Roles →",
        tabIndex: 1,
      };
    }
    if (!milestones.rolesDefined) {
      return {
        text: "Define roles and responsibilities for each founder.",
        action: "Go to Equity & Roles →",
        tabIndex: 1,
      };
    }
    return {
      text: "Your equity is set. Focus on building together!",
      action: null,
      tabIndex: null,
    };
  }, [milestones]);

  const healthStatus = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    const recentCheckin = checkins?.some(c => new Date(c.created_at).getTime() >= sevenDaysAgo);
    const checkinIn14Days = checkins?.some(c => new Date(c.created_at).getTime() >= fourteenDaysAgo);
    
    if (recentCheckin) {
      return { status: 'healthy', label: 'Healthy', color: TEAL };
    }
    
    if (checkinIn14Days) {
      return { status: 'quiet', label: 'Quiet', color: '#f59e0b' };
    }
    
    return { status: 'at_risk', label: 'At risk', color: '#ef4444' };
  }, [checkins]);

  const thisWeekSummary = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekCheckins = checkins?.filter(c => {
      const checkinDate = new Date(c.created_at);
      return checkinDate >= weekStart;
    }).length || 0;
    
    if (weekCheckins === 0) {
      return "This week: no check-ins yet.";
    }
    
    return `This week: ${weekCheckins} check-in${weekCheckins > 1 ? 's' : ''}`;
  }, [checkins]);

  const handleOpenCompatibility = (participant) => {
    setSelectedParticipant(participant);
    setCompatibilityDrawerOpen(true);
  };

  const getCompatibilityInsights = (participant) => {
    return {
      matches: [
        "Same funding approach",
        "Similar work intensity",
        "Aligned on equity split",
      ],
      warnings: participant.user?.email?.includes('@') ? [] : [
        "You prefer bootstrap, they prefer VC-backed – discuss funding early.",
      ],
    };
  };

  return (
    <Box sx={{ maxWidth: '1400px', mx: 'auto', p: 3 }}>
      {/* Quick Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2, 
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: SLATE_200,
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(SKY, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Business sx={{ fontSize: 20, color: SKY }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Stage
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {workspace?.stage ? workspace.stage.charAt(0).toUpperCase() + workspace.stage.slice(1) : 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2,
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: SLATE_200,
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(TEAL, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Groups sx={{ fontSize: 20, color: TEAL }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Co-founders
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {participants?.length || 0} members
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2,
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: healthStatus.color,
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(healthStatus.color, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {healthStatus.status === 'healthy' ? (
                  <SentimentSatisfied sx={{ fontSize: 20, color: healthStatus.color }} />
                ) : healthStatus.status === 'quiet' ? (
                  <SentimentNeutral sx={{ fontSize: 20, color: healthStatus.color }} />
                ) : (
                  <SentimentDissatisfied sx={{ fontSize: 20, color: healthStatus.color }} />
                )}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Health
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: healthStatus.color }}>
                  {healthStatus.label}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ 
            p: 2,
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: SLATE_200,
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(milestones.progress === 100 ? TEAL : '#f59e0b', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {milestones.progress === 100 ? (
                  <CheckCircle sx={{ fontSize: 20, color: TEAL }} />
                ) : (
                  <Flag sx={{ fontSize: 20, color: '#f59e0b' }} />
                )}
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Setup
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {Math.round(milestones.progress)}% complete
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Founder Date Card */}
      {(() => {
        const activeFounderDate = founderDates.find(fd => fd.status === 'ACTIVE');
        const otherParticipant = participants.find(p => p.user?.clerk_user_id !== user?.id);
        
        if (founderDatesLoading) return null;
        
        return (
          <Box sx={{
            mb: 3,
            p: 2.5,
            bgcolor: activeFounderDate ? alpha('#6366f1', 0.08) : '#fff',
            border: '1px solid',
            borderColor: activeFounderDate ? alpha('#6366f1', 0.2) : SLATE_200,
            borderRadius: 2,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha('#6366f1', 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <VideoCall sx={{ fontSize: 24, color: '#6366f1' }} />
                </Box>
                <Box>
                  {activeFounderDate ? (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        Founder Date in Progress
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>
                        Stage {activeFounderDate.current_stage}/3 with {activeFounderDate.other_founder?.name?.split(' ')[0]}
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        Founder Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>
                        Evaluate co-founder fit through structured calls
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
              
              {activeFounderDate ? (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PlayArrow />}
                  onClick={() => navigate(`/founder-dates/${activeFounderDate.id}`)}
                  sx={{
                    textTransform: 'none',
                    bgcolor: '#6366f1',
                    '&:hover': { bgcolor: '#5558dd' },
                  }}
                >
                  Continue
                </Button>
              ) : otherParticipant ? (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={startingFounderDate ? <CircularProgress size={16} /> : <VideoCall />}
                  onClick={handleStartFounderDate}
                  disabled={startingFounderDate}
                  sx={{
                    textTransform: 'none',
                    borderColor: '#6366f1',
                    color: '#6366f1',
                    '&:hover': { borderColor: '#5558dd', bgcolor: alpha('#6366f1', 0.05) },
                  }}
                >
                  Start
                </Button>
              ) : null}
            </Box>
            
            {activeFounderDate?.next_action && (
              <Box sx={{
                mt: 2,
                pt: 2,
                borderTop: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <Schedule sx={{ fontSize: 16, color: '#f59e0b' }} />
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  Next: {activeFounderDate.next_action.description}
                </Typography>
              </Box>
            )}
          </Box>
        );
      })()}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Partnership Overview */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ 
            bgcolor: '#fff',
            borderRadius: 2,
            border: '1px solid',
            borderColor: SLATE_200,
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <TrendingUp sx={{ color: TEAL, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Partnership Overview
              </Typography>
            </Box>
            
            {/* 90-day Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500 }}>
                  90-day partnership progress
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 600 }}>
                  {Math.round(milestones.progress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={milestones.progress}
                sx={{
                  height: 10,
                  borderRadius: 1,
                  bgcolor: alpha(TEAL, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: TEAL,
                    borderRadius: 1,
                  }
                }}
              />
            </Box>

            {/* Milestone Chips */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
              <Chip
                icon={milestones.equityAgreed ? <CheckCircle sx={{ fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                label="Equity agreed"
                sx={{
                  bgcolor: milestones.equityAgreed ? alpha(TEAL, 0.1) : alpha(SLATE_400, 0.1),
                  color: milestones.equityAgreed ? TEAL : SLATE_500,
                  border: `1px solid ${milestones.equityAgreed ? alpha(TEAL, 0.3) : alpha(SLATE_400, 0.3)}`,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: milestones.equityAgreed ? TEAL : SLATE_400,
                  }
                }}
              />
              <Chip
                icon={milestones.rolesDefined ? <CheckCircle sx={{ fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                label="Roles defined"
                sx={{
                  bgcolor: milestones.rolesDefined ? alpha(TEAL, 0.1) : alpha(SLATE_400, 0.1),
                  color: milestones.rolesDefined ? TEAL : SLATE_500,
                  border: `1px solid ${milestones.rolesDefined ? alpha(TEAL, 0.3) : alpha(SLATE_400, 0.3)}`,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: milestones.rolesDefined ? TEAL : SLATE_400,
                  }
                }}
              />
            </Box>

            {/* Current Focus */}
            <Box sx={{ 
              p: 2.5,
              bgcolor: alpha(TEAL, 0.05),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(TEAL, 0.2),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Flag sx={{ fontSize: 18, color: TEAL }} />
                  <Typography variant="subtitle2" sx={{ color: SLATE_500, fontWeight: 600 }}>
                    Current focus
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: SLATE_900, fontWeight: 500 }}>
                  {currentFocus.text}
                </Typography>
              </Box>
              {currentFocus.action && (
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => onNavigateTab && onNavigateTab(currentFocus.tabIndex)}
                  sx={{
                    color: TEAL,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: alpha(TEAL, 0.1),
                    }
                  }}
                >
                  {currentFocus.action}
                </Button>
              )}
            </Box>
          </Box>
        </Grid>

        {/* Activity / Health */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ 
            bgcolor: '#fff',
            borderRadius: 2,
            border: '1px solid',
            borderColor: SLATE_200,
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccessTime sx={{ color: TEAL, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  Activity / Health
                </Typography>
              </Box>
              <Chip
                label={healthStatus.label}
                size="small"
                sx={{
                  bgcolor: alpha(healthStatus.color, 0.1),
                  color: healthStatus.color,
                  border: `1px solid ${alpha(healthStatus.color, 0.3)}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
              <Box sx={{ 
                p: 2, 
                bgcolor: BG,
                borderRadius: 2,
                border: '1px solid',
                borderColor: SLATE_200,
              }}>
                <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mb: 0.5 }}>
                  Last updated
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 500 }}>
                  {workspace?.updated_at ? new Date(workspace.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Never'}
                </Typography>
              </Box>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: BG,
                borderRadius: 2,
                border: '1px solid',
                borderColor: SLATE_200,
              }}>
                <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mb: 0.5 }}>
                  Created
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 500 }}>
                  {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'Unknown'}
                </Typography>
              </Box>

              <Box sx={{ 
                p: 2, 
                bgcolor: alpha(TEAL, 0.05),
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(TEAL, 0.2),
              }}>
                <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 500 }}>
                  {thisWeekSummary}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Founders */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Groups sx={{ color: TEAL, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Founders
              </Typography>
            </Box>
            <Grid container spacing={3} sx={{ flex: 1 }}>
              {participantsLoading ? (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress sx={{ color: TEAL }} />
                  </Box>
                </Grid>
              ) : (
                participants?.map((participant) => {
                  const role = roles?.find(r => r.user_id === participant.user_id);
                  return (
                    <Grid item xs={12} md={6} key={participant.user_id}>
                      <Box sx={{ 
                        bgcolor: '#fff',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: SLATE_200,
                        p: 3,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: `0 4px 12px ${alpha(SLATE_900, 0.1)}`,
                          transform: 'translateY(-2px)',
                        }
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                            <Avatar
                              sx={{
                                width: 48,
                                height: 48,
                                bgcolor: alpha(TEAL, 0.1),
                                color: TEAL,
                                fontWeight: 600,
                                fontSize: '1.125rem',
                              }}
                            >
                              {participant.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '1.125rem' }}>
                                {participant.user?.name || 'Unknown'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: SLATE_500, fontSize: '0.875rem' }}>
                                {participant.user?.email || ''}
                              </Typography>
                            </Box>
                          </Box>
                          {!editingParticipant && (
                            <Tooltip title="Edit details">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditParticipant(participant)}
                                sx={{ 
                                  color: SLATE_400,
                                  '&:hover': { 
                                    color: TEAL,
                                    bgcolor: alpha(TEAL, 0.1)
                                  }
                                }}
                              >
                                <Edit sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        {editingParticipant === participant.user_id ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                            <TextField
                              size="small"
                              type="number"
                              placeholder="Hours/week"
                              value={editForm.weekly_commitment_hours}
                              onChange={(e) => setEditForm({ ...editForm, weekly_commitment_hours: e.target.value })}
                            />
                            <TextField
                              size="small"
                              placeholder="Timezone"
                              value={editForm.timezone}
                              onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Button 
                                size="small" 
                                variant="contained" 
                                onClick={handleSaveParticipant}
                                sx={{
                                  bgcolor: TEAL,
                                  '&:hover': { bgcolor: TEAL_LIGHT },
                                  textTransform: 'none',
                                  fontWeight: 600,
                                }}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={() => setEditingParticipant(null)}
                                sx={{ textTransform: 'none', color: SLATE_500 }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, flex: 1 }}>
                              {role?.role_title && (
                                <Chip 
                                  size="small" 
                                  icon={<Person sx={{ fontSize: 14 }} />}
                                  label={`Role: ${role.role_title}`}
                                  sx={{ 
                                    bgcolor: alpha(SKY, 0.1),
                                    color: SKY,
                                    border: `1px solid ${alpha(SKY, 0.3)}`,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    width: 'fit-content',
                                    height: 24,
                                  }}
                                />
                              )}
                              {participant.weekly_commitment_hours && (
                                <Chip 
                                  size="small" 
                                  icon={<AccessTime sx={{ fontSize: 14 }} />}
                                  label={`Commitment: ${participant.weekly_commitment_hours} hrs/week`}
                                  sx={{ 
                                    bgcolor: alpha(SLATE_400, 0.1),
                                    color: SLATE_500,
                                    border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    width: 'fit-content',
                                    height: 24,
                                  }}
                                />
                              )}
                              {participant.timezone && (
                                <Chip 
                                  size="small" 
                                  icon={<Language sx={{ fontSize: 14 }} />}
                                  label={`Timezone: ${participant.timezone}`}
                                  sx={{ 
                                    bgcolor: alpha(SLATE_400, 0.1),
                                    color: SLATE_500,
                                    border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    width: 'fit-content',
                                    height: 24,
                                  }}
                                />
                              )}
                              {!role?.role_title && !participant.weekly_commitment_hours && !participant.timezone && (
                                <Typography variant="caption" sx={{ color: SLATE_400, fontStyle: 'italic' }}>
                                  Add commitment hours and timezone to complete your profile. Define roles in Equity & Roles tab.
                                </Typography>
                              )}
                            </Box>

                            <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
                              <Button
                                size="small"
                                onClick={() => handleOpenCompatibility(participant)}
                                sx={{
                                  color: TEAL,
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  fontSize: '0.875rem',
                                  '&:hover': {
                                    bgcolor: alpha(TEAL, 0.1),
                                  }
                                }}
                              >
                                View compatibility →
                              </Button>
                            </Box>
                          </>
                        )}
                      </Box>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>
        </Grid>

        {/* Weekly Check-ins */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ height: 40, mb: 2.5 }} />
            <Box sx={{ 
              bgcolor: '#fff',
              borderRadius: 2,
              border: '1px solid',
              borderColor: SLATE_200,
              p: 3,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <CalendarToday sx={{ color: TEAL, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  Weekly Check-ins
                </Typography>
              </Box>
              
              {/* Check-in Status Card */}
              {checkinStatusLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} sx={{ color: TEAL }} />
                </Box>
              ) : !checkinStatus?.has_submitted_this_week ? (
                <Box sx={{ 
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.05),
                  border: '1px solid',
                  borderColor: alpha(TEAL, 0.2),
                  mb: 2,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Create sx={{ color: TEAL, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: TEAL }}>
                      Check-in due!
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: SLATE_500, mb: 2, fontSize: '0.85rem' }}>
                    {getDaysSinceLastCheckin() ? `Last check-in: ${getDaysSinceLastCheckin()} days ago` : 'Start your first weekly check-in'}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setCheckinDialogOpen(true)}
                    sx={{
                      bgcolor: TEAL,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: TEAL_LIGHT },
                    }}
                  >
                    Complete Check-in
                  </Button>
                </Box>
              ) : (
                <Box sx={{ 
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha('#22c55e', 0.05),
                  border: '1px solid',
                  borderColor: alpha('#22c55e', 0.2),
                  mb: 2,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle sx={{ color: '#22c55e', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#22c55e' }}>
                      Check-in complete for this week!
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {/* Health Trend */}
              {healthTrend.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block', mb: 1 }}>
                    Partnership Health Trend
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    {healthTrend.slice(-6).map((week, idx) => (
                      <Tooltip key={idx} title={`Week of ${week.week_of}: ${getHealthLabel(Math.round(week.average_health))}`}>
                        <Box sx={{ 
                          fontSize: '1.2rem', 
                          cursor: 'pointer',
                          opacity: idx === healthTrend.slice(-6).length - 1 ? 1 : 0.6,
                        }}>
                          {getHealthEmoji(Math.round(week.average_health))}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 1.5 }} />
              
              {/* This Week's Check-ins */}
              <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block', mb: 1.5 }}>
                This Week
              </Typography>
              
              {currentWeekCheckins?.partner_checkins?.length > 0 || currentWeekCheckins?.user_checkin ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {currentWeekCheckins?.user_checkin && (
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(TEAL, 0.03),
                      border: '1px solid',
                      borderColor: alpha(TEAL, 0.1),
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Avatar 
                          src={currentWeekCheckins.user_checkin.user?.profile_photo_url} 
                          sx={{ width: 20, height: 20 }}
                        >
                          {currentWeekCheckins.user_checkin.user?.name?.[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '0.8rem' }}>
                          You
                        </Typography>
                        <Typography sx={{ ml: 'auto', fontSize: '1rem' }}>
                          {getHealthEmoji(currentWeekCheckins.user_checkin.partnership_health)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: SLATE_500, fontSize: '0.75rem', lineHeight: 1.4 }}>
                        {currentWeekCheckins.user_checkin.accomplishments?.substring(0, 80)}
                        {currentWeekCheckins.user_checkin.accomplishments?.length > 80 && '...'}
                      </Typography>
                    </Box>
                  )}
                  
                  {currentWeekCheckins?.partner_checkins?.map((checkin) => (
                    <Box key={checkin.id} sx={{ 
                      p: 1.5, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(SKY, 0.03),
                      border: '1px solid',
                      borderColor: alpha(SKY, 0.1),
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Avatar 
                          src={checkin.user?.profile_photo_url} 
                          sx={{ width: 20, height: 20 }}
                        >
                          {checkin.user?.name?.[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '0.8rem' }}>
                          {checkin.user?.name || 'Co-founder'}
                        </Typography>
                        <Typography sx={{ ml: 'auto', fontSize: '1rem' }}>
                          {getHealthEmoji(checkin.partnership_health)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: SLATE_500, fontSize: '0.75rem', lineHeight: 1.4 }}>
                        {checkin.accomplishments?.substring(0, 80)}
                        {checkin.accomplishments?.length > 80 && '...'}
                      </Typography>
                      {checkin.cofounder_shoutout && (
                        <Typography variant="body2" sx={{ 
                          color: TEAL, 
                          fontSize: '0.75rem', 
                          mt: 0.5,
                          fontStyle: 'italic',
                        }}>
                          ✨ "{checkin.cofounder_shoutout}"
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: SLATE_400, fontStyle: 'italic', fontSize: '0.85rem' }}>
                  No check-ins yet this week
                </Typography>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Danger Zone - Dissolve Partnership */}
      <Box sx={{ 
        mt: 6, 
        p: 3, 
        borderRadius: 3, 
        border: '1px solid', 
        borderColor: '#fecaca',
        bgcolor: '#fef2f2',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Warning sx={{ color: '#dc2626', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#dc2626' }}>
            Danger Zone
          </Typography>
        </Box>
        
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
          Dissolving this partnership will permanently delete the workspace, all associated data, 
          and remove the match. This action cannot be undone. If there's an advisor attached, 
          they will be freed up to take on other projects.
        </Typography>
        
        <Button
          variant="outlined"
          color="error"
          startIcon={<ExitToApp />}
          onClick={() => {
            setDissolveDialogOpen(true);
            setConfirmText('');
            setDissolveError(null);
          }}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#dc2626',
            color: '#dc2626',
            '&:hover': {
              bgcolor: '#fee2e2',
              borderColor: '#b91c1c',
            },
          }}
        >
          Dissolve Partnership
        </Button>
      </Box>

      {/* Dissolve Partnership Confirmation Dialog */}
      <Dialog 
        open={dissolveDialogOpen} 
        onClose={() => !dissolving && setDissolveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          color: '#dc2626',
          fontWeight: 600,
        }}>
          <Warning sx={{ color: '#dc2626' }} />
          Dissolve Partnership
        </DialogTitle>
        <DialogContent>
          {dissolveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dissolveError}
            </Alert>
          )}
          
          <Typography variant="body1" sx={{ mb: 2, color: SLATE_900 }}>
            Are you sure you want to dissolve this partnership? This will:
          </Typography>
          
          <Box sx={{ mb: 3, pl: 2 }}>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 1 }}>
              • Delete this workspace and all its data (chat, tasks, documents, decisions, KPIs)
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 1 }}>
              • Remove the match between co-founders
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 1 }}>
              • Free up any attached advisors
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 1 }}>
              • Restore the project to "seeking co-founder" status (if applicable)
            </Typography>
          </Box>
          
          <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 500, mb: 2 }}>
            This action cannot be undone. Type <strong>DISSOLVE</strong> to confirm.
          </Typography>
          
          <TextField
            fullWidth
            size="small"
            placeholder="Type DISSOLVE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={dissolving}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused fieldset': {
                  borderColor: '#dc2626',
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button 
            onClick={() => setDissolveDialogOpen(false)}
            disabled={dissolving}
            sx={{ textTransform: 'none', color: SLATE_500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDissolvePartnership}
            disabled={dissolving || confirmText !== 'DISSOLVE'}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
              '&:disabled': { bgcolor: '#fca5a5' },
            }}
          >
            {dissolving ? (
              <>
                <CircularProgress size={16} sx={{ color: '#fff', mr: 1 }} />
                Dissolving...
              </>
            ) : (
              'Dissolve Partnership'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compatibility Drawer */}
      <Drawer
        anchor="right"
        open={compatibilityDrawerOpen}
        onClose={() => setCompatibilityDrawerOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            borderRadius: '16px 0 0 16px',
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
              Compatibility
            </Typography>
            <IconButton onClick={() => setCompatibilityDrawerOpen(false)} size="small" sx={{ color: SLATE_500 }}>
              <Close />
            </IconButton>
          </Box>
          
          {selectedParticipant && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: alpha(TEAL, 0.1),
                    color: TEAL,
                  }}
                >
                  {selectedParticipant.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {selectedParticipant.user?.name || 'Unknown'}
                </Typography>
              </Box>

              {(() => {
                const insights = getCompatibilityInsights(selectedParticipant);
                return (
                  <>
                    {insights.matches.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: SLATE_500, mb: 1.5, fontWeight: 600 }}>
                          Aligned on:
                        </Typography>
                        {insights.matches.map((match, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircleOutline sx={{ fontSize: 18, color: TEAL }} />
                            <Typography variant="body2" sx={{ color: SLATE_900 }}>
                              {match}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {insights.warnings.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: SLATE_500, mb: 1.5, fontWeight: 600 }}>
                          Discuss early:
                        </Typography>
                        {insights.warnings.map((warning, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <Warning sx={{ fontSize: 18, color: '#f59e0b', mt: 0.25 }} />
                            <Typography variant="body2" sx={{ color: SLATE_900 }}>
                              {warning}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </Box>
      </Drawer>
      
      {/* Weekly Check-in Dialog */}
      <Dialog 
        open={checkinDialogOpen} 
        onClose={() => !checkinSubmitting && setCheckinDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          pb: 1,
        }}>
          <CalendarToday sx={{ color: TEAL }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
              Weekly Check-in
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_500 }}>
              Week of {checkinStatus?.current_week || 'this week'}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Accomplishments */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                What did you accomplish this week? *
              </Typography>
              <TextField
                multiline
                rows={3}
                fullWidth
                placeholder="e.g., Shipped the new landing page, had 3 customer calls..."
                value={checkinForm.accomplishments}
                onChange={(e) => setCheckinForm({ ...checkinForm, accomplishments: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  } 
                }}
              />
            </Box>
            
            {/* Blockers */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                Any blockers or concerns?
              </Typography>
              <TextField
                multiline
                rows={2}
                fullWidth
                placeholder="Optional - anything slowing you down?"
                value={checkinForm.blockers}
                onChange={(e) => setCheckinForm({ ...checkinForm, blockers: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  } 
                }}
              />
            </Box>
            
            {/* Next Week Focus */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                What are you focusing on next week? *
              </Typography>
              <TextField
                multiline
                rows={2}
                fullWidth
                placeholder="e.g., Finish payment integration, user testing..."
                value={checkinForm.next_week_focus}
                onChange={(e) => setCheckinForm({ ...checkinForm, next_week_focus: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  } 
                }}
              />
            </Box>
            
            {/* Partnership Health */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1.5 }}>
                How's the partnership going? *
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((health) => (
                  <Tooltip key={health} title={getHealthLabel(health)}>
                    <IconButton
                      onClick={() => setCheckinForm({ ...checkinForm, partnership_health: health })}
                      sx={{
                        fontSize: '2rem',
                        bgcolor: checkinForm.partnership_health === health ? alpha(getHealthColor(health), 0.15) : 'transparent',
                        border: checkinForm.partnership_health === health ? `2px solid ${getHealthColor(health)}` : '2px solid transparent',
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(getHealthColor(health), 0.1),
                        }
                      }}
                    >
                      {getHealthEmoji(health)}
                    </IconButton>
                  </Tooltip>
                ))}
              </Box>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: getHealthColor(checkinForm.partnership_health), mt: 1, fontWeight: 600 }}>
                {getHealthLabel(checkinForm.partnership_health)}
              </Typography>
            </Box>
            
            {/* Shoutout (optional) */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                ✨ Shoutout to your co-founder
              </Typography>
              <TextField
                fullWidth
                placeholder="Optional - something positive about working together this week"
                value={checkinForm.cofounder_shoutout}
                onChange={(e) => setCheckinForm({ ...checkinForm, cofounder_shoutout: e.target.value })}
                sx={{ 
                  '& .MuiOutlinedInput-root': { 
                    borderRadius: 2,
                    fontSize: '0.9rem',
                  } 
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
          <Button 
            onClick={() => setCheckinDialogOpen(false)}
            disabled={checkinSubmitting}
            sx={{ textTransform: 'none', color: SLATE_500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCheckin}
            disabled={checkinSubmitting || !checkinForm.accomplishments.trim() || !checkinForm.next_week_focus.trim()}
            sx={{
              bgcolor: TEAL,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              '&:hover': { bgcolor: TEAL_LIGHT },
            }}
          >
            {checkinSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Submit Check-in'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceOverview;

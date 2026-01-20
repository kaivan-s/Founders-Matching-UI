import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  IconButton,
  Chip,
  Grid,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Link,
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
  ErrorOutline,
  ArrowForward,
  CalendarToday,
} from '@mui/icons-material';
import { useWorkspaceParticipants } from '../../hooks/useWorkspace';
import { useWorkspaceKPIs } from '../../hooks/useWorkspace';
import { useWorkspaceEquity } from '../../hooks/useWorkspace';
import { useWorkspaceRoles } from '../../hooks/useWorkspace';
import { useWorkspaceCheckins } from '../../hooks/useWorkspace';
import { useWorkspaceDecisions } from '../../hooks/useWorkspace';

const WorkspaceOverview = ({ workspaceId, workspace, onNavigateTab }) => {
  const { participants: allParticipants, loading: participantsLoading, updateParticipant } = useWorkspaceParticipants(workspaceId);
  
  // Filter out advisors from founders section - only show founders/co-founders
  const participants = allParticipants?.filter(p => p.role !== 'ADVISOR') || [];
  const { kpis, loading: kpisLoading } = useWorkspaceKPIs(workspaceId);
  const { equity, loading: equityLoading } = useWorkspaceEquity(workspaceId);
  const { roles, loading: rolesLoading } = useWorkspaceRoles(workspaceId);
  const { checkins, loading: checkinsLoading } = useWorkspaceCheckins(workspaceId, 10);
  const { decisions, loading: decisionsLoading } = useWorkspaceDecisions(workspaceId);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [editForm, setEditForm] = useState({ weekly_commitment_hours: '', timezone: '' });
  const [compatibilityDrawerOpen, setCompatibilityDrawerOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);

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

  // Calculate 90-day progress milestones
  const milestones = useMemo(() => {
    const equityAgreed = equity?.current !== null && equity?.current !== undefined;
    const rolesDefined = roles && roles.length >= 2 && roles.every(r => r.role_title);
    const first3KPIsSet = kpis && kpis.length >= 3;
    
    const completed = [equityAgreed, rolesDefined, first3KPIsSet].filter(Boolean).length;
    const progress = (completed / 3) * 100;
    
    return {
      equityAgreed,
      rolesDefined,
      first3KPIsSet,
      completed,
      progress,
    };
  }, [equity, roles, kpis]);

  // Calculate current focus
  const currentFocus = useMemo(() => {
    if (!milestones.first3KPIsSet) {
      return {
        text: "Set your first 3 KPIs for the next 30 days.",
        action: "Go to Commitments & KPIs →",
        tabIndex: 3, // Commitments tab
      };
    }
    if (!milestones.equityAgreed) {
      return {
        text: "Finalize your equity split and vesting.",
        action: "Go to Equity & Roles →",
        tabIndex: 2, // Equity & Roles tab
      };
    }
    if (!milestones.rolesDefined) {
      return {
        text: "Define roles and responsibilities for each founder.",
        action: "Go to Equity & Roles →",
        tabIndex: 2,
      };
    }
    // All milestones met, show active KPI
    const activeKPI = kpis?.find(k => k.status === 'in_progress');
    if (activeKPI) {
      return {
        text: activeKPI.title,
        action: null,
        tabIndex: null,
      };
    }
    return {
      text: "All milestones complete! Set new KPIs to keep momentum.",
      action: "Go to Commitments & KPIs →",
      tabIndex: 3,
    };
  }, [milestones, kpis]);

  // Calculate health status based on meaningful partnership activities
  const healthStatus = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    // Check for recent meaningful activities
    const recentCheckin = checkins?.some(c => new Date(c.created_at).getTime() >= sevenDaysAgo);
    const recentDecision = decisions?.some(d => new Date(d.created_at).getTime() >= sevenDaysAgo);
    const recentKPIUpdate = kpis?.some(k => {
      const updatedAt = k.updated_at ? new Date(k.updated_at).getTime() : null;
      return updatedAt && updatedAt >= sevenDaysAgo;
    });
    
    // Check for activities in the last 14 days (for "Quiet" status)
    const checkinIn14Days = checkins?.some(c => new Date(c.created_at).getTime() >= fourteenDaysAgo);
    const decisionIn14Days = decisions?.some(d => new Date(d.created_at).getTime() >= fourteenDaysAgo);
    const kpiUpdateIn14Days = kpis?.some(k => {
      const updatedAt = k.updated_at ? new Date(k.updated_at).getTime() : null;
      return updatedAt && updatedAt >= fourteenDaysAgo;
    });
    
    // Healthy: Recent check-in, decision, or KPI update in last 7 days
    if (recentCheckin || recentDecision || recentKPIUpdate) {
      return { status: 'healthy', label: 'Healthy', color: '#10b981' };
    }
    
    // Quiet: Some activity in last 14 days but not in last 7 days
    if (checkinIn14Days || decisionIn14Days || kpiUpdateIn14Days) {
      return { status: 'quiet', label: 'Quiet', color: '#f59e0b' };
    }
    
    // At risk: No meaningful activity in last 14 days
    return { status: 'at_risk', label: 'At risk', color: '#ef4444' };
  }, [checkins, decisions, kpis]);

  // Calculate this week summary
  const thisWeekSummary = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekCheckins = checkins?.filter(c => {
      const checkinDate = new Date(c.created_at);
      return checkinDate >= weekStart;
    }).length || 0;
    
    const weekDecisions = decisions?.filter(d => {
      const decisionDate = new Date(d.created_at);
      return decisionDate >= weekStart;
    }).length || 0;
    
    if (weekCheckins === 0 && weekDecisions === 0) {
      return "This week: no check-ins yet.";
    }
    
    const parts = [];
    if (weekCheckins > 0) parts.push(`${weekCheckins} check-in${weekCheckins > 1 ? 's' : ''}`);
    if (weekDecisions > 0) parts.push(`${weekDecisions} decision${weekDecisions > 1 ? 's' : ''} logged`);
    
    return `This week: ${parts.join(' · ')}`;
  }, [checkins, decisions]);

  // Calculate KPI summary by status
  const kpiSummary = useMemo(() => {
    if (!kpis) return { done: 0, in_progress: 0, not_started: 0 };
    
    return {
      done: kpis.filter(k => k.status === 'done').length,
      in_progress: kpis.filter(k => k.status === 'in_progress').length,
      not_started: kpis.filter(k => k.status === 'not_started' || !k.status).length,
    };
  }, [kpis]);

  // Get next rituals (upcoming KPIs with deadlines)
  const nextRituals = useMemo(() => {
    if (!kpis) return [];
    
    const upcoming = kpis
      .filter(kpi => kpi.status !== 'done' && kpi.target_date)
      .map(kpi => ({
        title: kpi.label || kpi.title || 'Untitled KPI',
        date: new Date(kpi.target_date),
        type: 'kpi',
        targetValue: kpi.target_value,
        status: kpi.status,
      }))
      .sort((a, b) => a.date - b.date)
      .slice(0, 3);
    
    return upcoming;
  }, [kpis]);

  const handleOpenCompatibility = (participant) => {
    setSelectedParticipant(participant);
    setCompatibilityDrawerOpen(true);
  };

  // Get compatibility insights (mock for now - would need actual compatibility data)
  const getCompatibilityInsights = (participant) => {
    // This would ideally come from the match/compatibility data
    // For now, return sample data
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
    <Box sx={{ maxWidth: '1400px', mx: 'auto', px: 2 }}>
      {/* KPI Status Cards - Smaller */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2, 
            background: 'linear-gradient(135deg, #fff 0%, #f0f9ff 100%)',
            border: '1px solid rgba(14, 165, 233, 0.1)',
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Business sx={{ fontSize: 18, color: '#0ea5e9' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                  Stage
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {workspace?.stage ? workspace.stage.charAt(0).toUpperCase() + workspace.stage.slice(1) : 'Not set'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2,
            background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)',
            border: '1px solid rgba(34, 197, 94, 0.1)',
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <CheckCircle sx={{ fontSize: 18, color: '#22c55e' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                  Completed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {kpiSummary.done} KPIs
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2,
            background: 'linear-gradient(135deg, #fff 0%, #fef3c7 100%)',
            border: '1px solid rgba(251, 191, 36, 0.1)',
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Schedule sx={{ fontSize: 18, color: '#fbbf24' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                  In Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {kpiSummary.in_progress} KPIs
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Paper sx={{ 
            p: 2,
            background: 'linear-gradient(135deg, #fff 0%, #f3f4f6 100%)',
            border: '1px solid rgba(100, 116, 139, 0.1)',
            borderRadius: 2,
            height: '100%',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <RadioButtonUnchecked sx={{ fontSize: 18, color: '#64748b' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block' }}>
                  Not Started
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  {kpiSummary.not_started} KPIs
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content - Two Rows */}
      <Grid container spacing={3}>
        {/* Row 1: Partnership Overview and Activity/Health */}
        <Grid item xs={12} lg={8}>
          {/* Partnership Overview Card */}
          <Card sx={{ 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
            borderRadius: 2,
            border: '1px solid rgba(226, 232, 240, 0.8)',
            background: '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <TrendingUp sx={{ color: '#0ea5e9', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  Partnership Overview
                </Typography>
              </Box>
              
              {/* 90-day Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                    90-day partnership progress
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>
                    {Math.round(milestones.progress)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={milestones.progress}
                  sx={{
                    height: 10,
                    borderRadius: 5,
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #0ea5e9 0%, #14b8a6 100%)',
                      borderRadius: 5,
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
                    bgcolor: milestones.equityAgreed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: milestones.equityAgreed ? '#22c55e' : '#64748b',
                    border: `1px solid ${milestones.equityAgreed ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: milestones.equityAgreed ? '#22c55e' : '#64748b',
                    }
                  }}
                />
                <Chip
                  icon={milestones.rolesDefined ? <CheckCircle sx={{ fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                  label="Roles defined"
                  sx={{
                    bgcolor: milestones.rolesDefined ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: milestones.rolesDefined ? '#22c55e' : '#64748b',
                    border: `1px solid ${milestones.rolesDefined ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: milestones.rolesDefined ? '#22c55e' : '#64748b',
                    }
                  }}
                />
                <Chip
                  icon={milestones.first3KPIsSet ? <CheckCircle sx={{ fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                  label="First 3 KPIs set"
                  sx={{
                    bgcolor: milestones.first3KPIsSet ? 'rgba(34, 197, 94, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                    color: milestones.first3KPIsSet ? '#22c55e' : '#64748b',
                    border: `1px solid ${milestones.first3KPIsSet ? 'rgba(34, 197, 94, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: milestones.first3KPIsSet ? '#22c55e' : '#64748b',
                    }
                  }}
                />
              </Box>

              {/* Current Focus */}
              <Box sx={{ 
                p: 2.5,
                bgcolor: 'rgba(14, 165, 233, 0.04)',
                borderRadius: 1.5,
                border: '1px solid rgba(14, 165, 233, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Flag sx={{ fontSize: 18, color: '#0ea5e9' }} />
                    <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600 }}>
                      Current focus
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: '#0f172a', fontWeight: 500 }}>
                    {currentFocus.text}
                  </Typography>
                </Box>
                {currentFocus.action && (
                  <Button
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    onClick={() => onNavigateTab && onNavigateTab(currentFocus.tabIndex)}
                    sx={{
                      color: '#0ea5e9',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(14, 165, 233, 0.08)',
                      }
                    }}
                  >
                    {currentFocus.action}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Activity / Health Card - Matches Partnership Overview height */}
          <Card sx={{ 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
            borderRadius: 2,
            border: '1px solid rgba(226, 232, 240, 0.8)',
            background: '#ffffff',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <CardContent sx={{ p: 2.5, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime sx={{ color: '#0ea5e9', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    Activity / Health
                  </Typography>
                </Box>
                <Chip
                  label={healthStatus.label}
                  size="small"
                  sx={{
                    bgcolor: `${healthStatus.color}15`,
                    color: healthStatus.color,
                    border: `1px solid ${healthStatus.color}40`,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1, justifyContent: 'center' }}>
                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: 'rgba(100, 116, 139, 0.05)',
                  borderRadius: 1.5,
                  border: '1px solid rgba(100, 116, 139, 0.1)',
                }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25 }}>
                    Last updated
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
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
                  p: 1.5, 
                  bgcolor: 'rgba(14, 165, 233, 0.04)',
                  borderRadius: 1.5,
                  border: '1px solid rgba(14, 165, 233, 0.1)',
                }}>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 0.25 }}>
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
                    {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Unknown'}
                  </Typography>
                </Box>

                <Box sx={{ 
                  p: 1.5, 
                  bgcolor: 'rgba(20, 184, 166, 0.04)',
                  borderRadius: 1.5,
                  border: '1px solid rgba(20, 184, 166, 0.1)',
                }}>
                  <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 500 }}>
                    {thisWeekSummary}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Row 2: Founders and Next Rituals */}
        <Grid item xs={12} lg={8}>
          {/* Founders Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <Groups sx={{ color: '#0ea5e9', fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                Founders
              </Typography>
            </Box>
            <Grid container spacing={3} sx={{ flex: 1 }}>
              {participantsLoading ? (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress size={24} />
                  </Box>
                </Grid>
              ) : (
                participants?.map((participant) => {
                  const role = roles?.find(r => r.user_id === participant.user_id);
                  return (
                    <Grid item xs={12} md={6} key={participant.user_id}>
                      <Card sx={{ 
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                        borderRadius: 2,
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        background: '#ffffff',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                          transform: 'translateY(-2px)',
                        }
                      }}>
                        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                              <Avatar
                                sx={{
                                  width: 48,
                                  height: 48,
                                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                  fontWeight: 600,
                                  fontSize: '1.125rem',
                                }}
                              >
                                {participant.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '1.125rem' }}>
                                  {participant.user?.name || 'Unknown'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
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
                                    color: '#94a3b8',
                                    '&:hover': { 
                                      color: '#0ea5e9',
                                      bgcolor: 'rgba(14, 165, 233, 0.05)'
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
                                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                  }}
                                >
                                  Save
                                </Button>
                                <Button 
                                  size="small" 
                                  onClick={() => setEditingParticipant(null)}
                                  sx={{ textTransform: 'none' }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <>
                              {/* Chips Row - Each on its own row */}
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, flex: 1 }}>
                                {/* First row: Role */}
                                {role?.role_title && (
                                  <Chip 
                                    size="small" 
                                    icon={<Person sx={{ fontSize: 14 }} />}
                                    label={`Role: ${role.role_title}`}
                                    sx={{ 
                                      bgcolor: 'rgba(14, 165, 233, 0.08)',
                                      color: '#0ea5e9',
                                      border: '1px solid rgba(14, 165, 233, 0.15)',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      width: 'fit-content',
                                    }}
                                  />
                                )}
                                {/* Second row: Commitment */}
                                {participant.weekly_commitment_hours && (
                                  <Chip 
                                    size="small" 
                                    icon={<AccessTime sx={{ fontSize: 14 }} />}
                                    label={`Commitment: ${participant.weekly_commitment_hours} hrs/week`}
                                    sx={{ 
                                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                                      color: '#64748b',
                                      border: '1px solid rgba(100, 116, 139, 0.15)',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      width: 'fit-content',
                                    }}
                                  />
                                )}
                                {/* Third row: Timezone */}
                                {participant.timezone && (
                                  <Chip 
                                    size="small" 
                                    icon={<Language sx={{ fontSize: 14 }} />}
                                    label={`Timezone: ${participant.timezone}`}
                                    sx={{ 
                                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                                      color: '#64748b',
                                      border: '1px solid rgba(100, 116, 139, 0.15)',
                                      fontWeight: 500,
                                      fontSize: '0.75rem',
                                      width: 'fit-content',
                                    }}
                                  />
                                )}
                                {!role?.role_title && !participant.weekly_commitment_hours && !participant.timezone && (
                                  <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                    Add commitment hours and timezone to complete your profile. Define roles in Equity & Roles tab.
                                  </Typography>
                                )}
                              </Box>

                              {/* View Compatibility Button */}
                              <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                                <Button
                                  size="small"
                                  onClick={() => handleOpenCompatibility(participant)}
                                  sx={{
                                    color: '#0ea5e9',
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    '&:hover': {
                                      bgcolor: 'rgba(14, 165, 233, 0.05)',
                                    }
                                  }}
                                >
                                  View compatibility →
                                </Button>
                              </Box>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Next Rituals Section - Aligned with Founders cards (not header) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Spacer to match Founders header height */}
            <Box sx={{ height: 40, mb: 2.5 }} />
            <Card sx={{ 
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
              borderRadius: 2,
              border: '1px solid rgba(226, 232, 240, 0.8)',
              background: '#ffffff',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header inside the card */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <CalendarToday sx={{ color: '#0ea5e9', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    Upcoming KPIs
                  </Typography>
                </Box>
                
                {/* Divider line */}
                <Divider sx={{ mb: 2.5 }} />
                
                {/* Content - Scrollable area with fixed height */}
                <Box sx={{ 
                  flex: 1, 
                  overflowY: 'auto',
                  maxHeight: '200px',
                  minHeight: '100px',
                }}>
                  {nextRituals.length > 0 ? (
                    <List sx={{ p: 0 }}>
                      {nextRituals.map((ritual, index) => (
                        <React.Fragment key={index}>
                          <ListItem sx={{ px: 0, py: 1.5 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#0f172a', mb: 0.5 }}>
                                  {ritual.title}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.875rem' }}>
                                  {ritual.date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              }
                            />
                          </ListItem>
                          {index < nextRituals.length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100px' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        No upcoming rituals yet.
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Add check-in button at bottom */}
                <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                  <Button
                    size="small"
                    endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                    onClick={() => onNavigateTab && onNavigateTab(3)}
                    sx={{
                      color: '#0ea5e9',
                      textTransform: 'none',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      '&:hover': {
                        bgcolor: 'rgba(14, 165, 233, 0.05)',
                      }
                    }}
                  >
                    Add a weekly check-in →
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* Compatibility Drawer */}
      <Drawer
        anchor="right"
        open={compatibilityDrawerOpen}
        onClose={() => setCompatibilityDrawerOpen(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Compatibility
            </Typography>
            <IconButton onClick={() => setCompatibilityDrawerOpen(false)} size="small">
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
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  }}
                >
                  {selectedParticipant.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {selectedParticipant.user?.name || 'Unknown'}
                </Typography>
              </Box>

              {(() => {
                const insights = getCompatibilityInsights(selectedParticipant);
                return (
                  <>
                    {insights.matches.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1.5, fontWeight: 600 }}>
                          Aligned on:
                        </Typography>
                        {insights.matches.map((match, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CheckCircleOutline sx={{ fontSize: 18, color: '#22c55e' }} />
                            <Typography variant="body2" sx={{ color: '#0f172a' }}>
                              {match}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}

                    {insights.warnings.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 1.5, fontWeight: 600 }}>
                          Discuss early:
                        </Typography>
                        {insights.warnings.map((warning, index) => (
                          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                            <Warning sx={{ fontSize: 18, color: '#f59e0b', mt: 0.25 }} />
                            <Typography variant="body2" sx={{ color: '#0f172a' }}>
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
    </Box>
  );
};

export default WorkspaceOverview;

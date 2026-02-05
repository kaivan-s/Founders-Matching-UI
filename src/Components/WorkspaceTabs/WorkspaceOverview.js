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
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { useWorkspaceParticipants } from '../../hooks/useWorkspace';
import { useWorkspaceKPIs } from '../../hooks/useWorkspace';
import { useWorkspaceEquity } from '../../hooks/useWorkspace';
import { useWorkspaceRoles } from '../../hooks/useWorkspace';
import { useWorkspaceCheckins } from '../../hooks/useWorkspace';
import { useWorkspaceDecisions } from '../../hooks/useWorkspace';
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
  const { participants: allParticipants, loading: participantsLoading, updateParticipant } = useWorkspaceParticipants(workspaceId);
  
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
  
  const [equityScenarios, setEquityScenarios] = useState([]);
  const [equityScenariosLoading, setEquityScenariosLoading] = useState(true);
  
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
  }, [equity, roles, kpis, equityScenarios]);

  const currentFocus = useMemo(() => {
    if (!milestones.first3KPIsSet) {
      return {
        text: "Set your first 3 KPIs for the next 30 days.",
        action: "Go to Commitments & KPIs →",
        tabIndex: 3,
      };
    }
    if (!milestones.equityAgreed) {
      return {
        text: "Finalize your equity split and vesting.",
        action: "Go to Equity & Roles →",
        tabIndex: 2,
      };
    }
    if (!milestones.rolesDefined) {
      return {
        text: "Define roles and responsibilities for each founder.",
        action: "Go to Equity & Roles →",
        tabIndex: 2,
      };
    }
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

  const healthStatus = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
    
    const recentCheckin = checkins?.some(c => new Date(c.created_at).getTime() >= sevenDaysAgo);
    const recentDecision = decisions?.some(d => new Date(d.created_at).getTime() >= sevenDaysAgo);
    const recentKPIUpdate = kpis?.some(k => {
      const updatedAt = k.updated_at ? new Date(k.updated_at).getTime() : null;
      return updatedAt && updatedAt >= sevenDaysAgo;
    });
    
    const checkinIn14Days = checkins?.some(c => new Date(c.created_at).getTime() >= fourteenDaysAgo);
    const decisionIn14Days = decisions?.some(d => new Date(d.created_at).getTime() >= fourteenDaysAgo);
    const kpiUpdateIn14Days = kpis?.some(k => {
      const updatedAt = k.updated_at ? new Date(k.updated_at).getTime() : null;
      return updatedAt && updatedAt >= fourteenDaysAgo;
    });
    
    if (recentCheckin || recentDecision || recentKPIUpdate) {
      return { status: 'healthy', label: 'Healthy', color: TEAL };
    }
    
    if (checkinIn14Days || decisionIn14Days || kpiUpdateIn14Days) {
      return { status: 'quiet', label: 'Quiet', color: '#f59e0b' };
    }
    
    return { status: 'at_risk', label: 'At risk', color: '#ef4444' };
  }, [checkins, decisions, kpis]);

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

  const kpiSummary = useMemo(() => {
    if (!kpis) return { done: 0, in_progress: 0, not_started: 0 };
    
    return {
      done: kpis.filter(k => k.status === 'done').length,
      in_progress: kpis.filter(k => k.status === 'in_progress').length,
      not_started: kpis.filter(k => k.status === 'not_started' || !k.status).length,
    };
  }, [kpis]);

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
      {/* KPI Status Cards */}
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
                <CheckCircle sx={{ fontSize: 20, color: TEAL }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Completed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {kpiSummary.done} KPIs
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
                bgcolor: alpha('#f59e0b', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Schedule sx={{ fontSize: 20, color: '#f59e0b' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  In Progress
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {kpiSummary.in_progress} KPIs
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
                bgcolor: alpha(SLATE_400, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <RadioButtonUnchecked sx={{ fontSize: 20, color: SLATE_400 }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, display: 'block' }}>
                  Not Started
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  {kpiSummary.not_started} KPIs
                </Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

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
              <Chip
                icon={milestones.first3KPIsSet ? <CheckCircle sx={{ fontSize: 16 }} /> : <RadioButtonUnchecked sx={{ fontSize: 16 }} />}
                label="First 3 KPIs set"
                sx={{
                  bgcolor: milestones.first3KPIsSet ? alpha(TEAL, 0.1) : alpha(SLATE_400, 0.1),
                  color: milestones.first3KPIsSet ? TEAL : SLATE_500,
                  border: `1px solid ${milestones.first3KPIsSet ? alpha(TEAL, 0.3) : alpha(SLATE_400, 0.3)}`,
                  fontWeight: 500,
                  '& .MuiChip-icon': {
                    color: milestones.first3KPIsSet ? TEAL : SLATE_400,
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

        {/* Upcoming KPIs */}
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <CalendarToday sx={{ color: TEAL, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  Upcoming KPIs
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2.5 }} />
              
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
                              <Typography variant="body2" sx={{ fontWeight: 500, color: SLATE_900, mb: 0.5 }}>
                                {ritual.title}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ color: SLATE_500, fontSize: '0.875rem' }}>
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
                    <Typography variant="body2" sx={{ color: SLATE_500 }}>
                      No upcoming KPIs yet.
                    </Typography>
                  </Box>
                )}
              </Box>
              
              <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                  onClick={() => onNavigateTab && onNavigateTab(3)}
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
                  Add a weekly check-in →
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

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
    </Box>
  );
};

export default WorkspaceOverview;

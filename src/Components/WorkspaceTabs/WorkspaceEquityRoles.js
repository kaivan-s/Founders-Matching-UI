import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material';
import { Add, Delete, CheckCircle, Description, Save, ContentCopy, HourglassEmpty, Cancel, Check, Close, Info } from '@mui/icons-material';
import { useWorkspaceEquity, useWorkspaceRoles, useWorkspaceParticipants } from '../../hooks/useWorkspace';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../../config/api';

const VESTING_PRESETS = [
  { label: '4 years, 1-year cliff', years: 4, cliffMonths: 12 },
  { label: '3 years, 1-year cliff', years: 3, cliffMonths: 12 },
  { label: 'Custom', years: null, cliffMonths: null },
];

const WorkspaceEquityRoles = ({ workspaceId }) => {
  const { user } = useUser();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const { equity, loading: equityLoading, createScenario, setCurrentScenario, refetch: refetchEquity } = useWorkspaceEquity(workspaceId);
  const { roles, loading: rolesLoading, upsertRole } = useWorkspaceRoles(workspaceId);
  const { participants: allParticipants } = useWorkspaceParticipants(workspaceId);
  
  // Filter out advisors - only show founders/co-founders in equity and roles
  const participants = allParticipants?.filter(p => p.role !== 'ADVISOR') || [];
  
  const [equityPercentages, setEquityPercentages] = useState({});
  const [vestingPreset, setVestingPreset] = useState('4 years, 1-year cliff');
  const [customVesting, setCustomVesting] = useState({ years: 4, cliffMonths: 12 });
  const [scenarioLabel, setScenarioLabel] = useState('');
  const [editingRoles, setEditingRoles] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [scenarioNotes, setScenarioNotes] = useState({});
  const [savingNote, setSavingNote] = useState({});
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState({});
  const [processingApproval, setProcessingApproval] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // For equity scenarios tabs
  const [activeRoleTab, setActiveRoleTab] = useState(0); // For roles tabs (one per founder)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch plan to check feature access
  useEffect(() => {
    if (user?.id) {
      fetchPlan();
    }
  }, [user?.id]);

  const fetchPlan = async () => {
    if (!user?.id) return;
    setPlanLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/my-plan`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const planData = await response.json();
        setPlan(planData);
      } else {
        // Default to FREE if fetch fails
        setPlan({ id: 'FREE', workspaceFeatures: { equityFull: false } });
      }
    } catch (err) {
      // Default to FREE on error
      setPlan({ id: 'FREE', workspaceFeatures: { equityFull: false } });
    } finally {
      setPlanLoading(false);
    }
  };

  // Fetch pending approvals for equity scenarios
  useEffect(() => {
    if (equity?.scenarios && user?.id) {
      fetchPendingApprovals();
    }
  }, [equity?.scenarios, user?.id]);

  const fetchPendingApprovals = async () => {
    if (!user?.id || !workspaceId) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/approvals/pending?workspace_id=${workspaceId}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );
      
      if (response.ok) {
        const approvals = await response.json();
        const approvalMap = {};
        approvals.forEach(approval => {
          if (approval.entity_type === 'EQUITY_SCENARIO') {
            approvalMap[approval.entity_id] = approval;
          }
        });
        setPendingApprovals(approvalMap);
      }
    } catch (error) {
      // Error fetching pending approvals
    }
  };

  const handleApproval = async (approvalId, action) => {
    setProcessingApproval(approvalId);
    
    try {
      const response = await fetch(
        `${API_BASE}/approvals/${approvalId}/${action}`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment: '' })
        }
      );

      if (response.ok) {
        // Refresh equity scenarios and approvals
        await refetchEquity();
        await fetchPendingApprovals();
        
        // If approving an equity scenario that should be current, update local state
        const approval = pendingApprovals[Object.keys(pendingApprovals).find(
          id => pendingApprovals[id].id === approvalId
        )];
        if (approval && approval.proposed_data?.is_current && action === 'approve') {
          // Update local equity percentages from the approved scenario
          const approvedData = approval.proposed_data.data;
          if (approvedData?.users) {
            const percentages = {};
            approvedData.users.forEach((u) => {
              percentages[u.userId] = u.percent;
            });
            setEquityPercentages(percentages);
          }
        }
      }
    } catch (error) {
      // Error processing approval
    } finally {
      setProcessingApproval(null);
    }
  };

  // Initialize equity percentages from current scenario or equal split
  useEffect(() => {
    if (participants && participants.length > 0) {
      if (equity?.current) {
        const currentData = equity.current.data;
        const percentages = {};
        currentData.users?.forEach((u) => {
          // Only include users who are founders (not advisors)
          if (participants.some(p => p.user_id === u.userId)) {
            percentages[u.userId] = u.percent;
          }
        });
        setEquityPercentages(percentages);
      } else {
        // Equal split among founders only
        const equalPercent = 100 / participants.length;
        const percentages = {};
        participants.forEach((p) => {
          percentages[p.user_id] = equalPercent;
        });
        setEquityPercentages(percentages);
      }
    }
  }, [participants, equity]);

  const handleEquityChange = (userId, value) => {
    setEquityPercentages(prev => ({ ...prev, [userId]: value }));
  };

  const getTotalPercentage = () => {
    return Object.values(equityPercentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  };

  const handleSaveScenario = async () => {
    if (!scenarioLabel.trim()) {
      setSuccessMessage('Please enter a scenario label');
      setSuccessDialogOpen(true);
      return;
    }

    const total = getTotalPercentage();
    if (Math.abs(total - 100) > 0.01) {
      setSuccessMessage(`Total must equal 100%. Current: ${total.toFixed(1)}%`);
      setSuccessDialogOpen(true);
      return;
    }

    setSubmitting(true);
    try {
      const vestingConfig = vestingPreset === 'Custom' 
        ? customVesting 
        : VESTING_PRESETS.find(p => p.label === vestingPreset);

      const scenarioData = {
        label: scenarioLabel,
        data: {
          users: Object.entries(equityPercentages).map(([userId, percent]) => ({
            userId,
            percent: parseFloat(percent),
          })),
          vesting: {
            years: vestingConfig.years,
            cliffMonths: vestingConfig.cliffMonths,
          },
        },
        is_current: false,
      };

      await createScenario(scenarioData);
      setScenarioLabel('');
      // Switch to Saved Scenarios tab after saving
      setActiveTab(1);
      await refetchEquity();
      setSuccessMessage('Scenario saved! Waiting for partner approval.');
      setSuccessDialogOpen(true);
    } catch (err) {
      setSuccessMessage('Failed to save scenario. Please try again.');
      setSuccessDialogOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetCurrent = async (scenarioId) => {
    try {
      await setCurrentScenario(scenarioId);
      // Refresh to show updated current state
      await refetchEquity();
    } catch (err) {
      // Error setting current scenario
    }
  };

  const handleRoleChange = (userId, field, value) => {
    setEditingRoles(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveRole = async (userId) => {
    // Get roleData from editing state or existing role (same logic as UI)
    const existingRole = getParticipantRole(userId);
    const editing = editingRoles[userId];
    const roleData = editing || existingRole || { role_title: '', responsibilities: '' };
    
    // Check if role_title exists and is not empty after trimming
    if (!roleData.role_title || !roleData.role_title.trim()) {
      setSuccessMessage('Role title is required');
      setSuccessDialogOpen(true);
      return;
    }

    try {
      await upsertRole(userId, {
        role_title: roleData.role_title.trim(),
        responsibilities: roleData.responsibilities?.trim() || '',
      });
      setEditingRoles(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setSuccessMessage('Role updated successfully!');
      setSuccessDialogOpen(true);
    } catch (err) {
      setSuccessMessage('Failed to update role. Please try again.');
      setSuccessDialogOpen(true);
    }
  };

  const getParticipantRole = (userId) => {
    return roles?.find(r => r.user_id === userId);
  };

  const handleUpdateScenarioNote = async (scenarioId, note) => {
    setSavingNote(prev => ({ ...prev, [scenarioId]: true }));
    try {
      const response = await fetch(`${API_BASE}/workspaces/equity-scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user?.id,
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      // Show success feedback
      setSavingNote(prev => ({ ...prev, [scenarioId]: 'saved' }));
      setTimeout(() => {
        setSavingNote(prev => ({ ...prev, [scenarioId]: false }));
      }, 2000);

      // Refresh equity data to get updated notes
      await refetchEquity();
    } catch (err) {
      setSavingNote(prev => ({ ...prev, [scenarioId]: false }));
    }
  };

  const handleGenerateDraft = async () => {
    setLoadingDraft(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/agreement-draft`, {
        method: 'GET',
        headers: {
          'X-Clerk-User-Id': user?.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate draft');
      }

      const draft = await response.json();
      setDraftData(draft);
      setDraftDialogOpen(true);
    } catch (err) {
      alert(err.message || 'Failed to generate agreement draft. Make sure you have a current equity scenario set.');
    } finally {
      setLoadingDraft(false);
    }
  };

  const copyDraftToClipboard = () => {
    if (!draftData) return;
    
    const text = formatDraftAsText(draftData);
    navigator.clipboard.writeText(text);
    alert('Draft copied to clipboard');
  };

  const formatDraftAsText = (draft) => {
    let text = `FOUNDERS' AGREEMENT DRAFT\n`;
    text += `${draft.disclaimer}\n\n`;
    text += `Workspace: ${draft.workspaceName}\n`;
    text += `Generated: ${new Date(draft.generatedAt).toLocaleString()}\n\n`;
    
    text += `EQUITY DISTRIBUTION\n`;
    text += `Vesting: ${draft.equity.vestingYears} years with ${draft.equity.cliffMonths}-month cliff\n\n`;
    draft.equity.owners.forEach(owner => {
      text += `${owner.name}: ${owner.percent}%\n`;
    });
    
    text += `\nROLES & RESPONSIBILITIES\n`;
    draft.roles.forEach(role => {
      text += `${role.name}: ${role.title}\n`;
      if (role.responsibilities) {
        text += `  Responsibilities: ${role.responsibilities}\n`;
      }
    });
    
    return text;
  };

  const formatScenarioPreview = (scenario) => {
    if (!scenario?.data) return '';
    
    const equityData = scenario.data;
    const users = equityData.users || [];
    const vesting = equityData.vesting || { years: 4, cliffMonths: 12 };
    
    let preview = 'EQUITY DISTRIBUTION\n';
    preview += `Vesting: ${vesting.years} years with ${vesting.cliffMonths}-month cliff\n\n`;
    
    users.forEach(userData => {
      const participant = participants?.find(p => p.user_id === userData.userId);
      const userName = participant?.user?.name || 'Unknown';
      preview += `${userName}: ${userData.percent}%\n`;
    });
    
    const total = users.reduce((sum, u) => sum + (u.percent || 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      preview += `\n⚠️ Total: ${total.toFixed(1)}% (should be 100%)`;
    }
    
    return preview;
  };

  const totalPercent = getTotalPercentage();
  const isTotalValid = Math.abs(totalPercent - 100) < 0.01;

  // Check if user has access to equity features
  // If plan is null/undefined, default to no access (FREE plan)
  const hasEquityAccess = plan && plan.workspaceFeatures?.equityFull === true;
  
  if (planLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Block access if plan is null (not loaded) or if equityFull is false
  if (!plan || !hasEquityAccess) {
    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Upgrade Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Full equity & roles management is available in Pro and Pro+ plans.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/pricing'}
            sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
          >
            View Pricing Plans
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <>
    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
      {/* Left Column: Equity Scenarios */}
      <Grid item xs={12} md={6}>
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
                <Tab label="Calculator" />
                <Tab label="Saved Scenarios" />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box 
              sx={{ 
                p: 3, 
                flex: 1, 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(14, 165, 233, 0.2)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(14, 165, 233, 0.4)',
                },
              }}
            >
              {activeTab === 0 && (
                <Box>
                  {/* Calculator Tab Content */}

            {/* Equity Sliders */}
            {participants?.map((participant) => {
              const value = equityPercentages[participant.user_id] || 0;
              return (
                <Box key={participant.user_id} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {participant.user?.name || 'Unknown'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={value.toFixed(1)}
                        onChange={(e) => handleEquityChange(participant.user_id, parseFloat(e.target.value) || 0)}
                        inputProps={{ min: 0, max: 100, step: 0.1 }}
                        sx={{ width: 80 }}
                      />
                      <Typography variant="body2" sx={{ color: '#64748b' }}>%</Typography>
                    </Box>
                  </Box>
                  <Slider
                    value={value}
                    onChange={(e, newValue) => handleEquityChange(participant.user_id, newValue)}
                    min={0}
                    max={100}
                    step={0.1}
                    sx={{
                      color: '#0ea5e9',
                      '& .MuiSlider-thumb': {
                        '&:hover': {
                          boxShadow: '0 0 0 8px rgba(14, 165, 233, 0.16)',
                        },
                      },
                    }}
                  />
                </Box>
              );
            })}

            {/* Total Percentage */}
            <Box sx={{ mb: 3, p: 2, bgcolor: isTotalValid ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: isTotalValid ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                Total: {totalPercent.toFixed(1)}% {isTotalValid ? '✓' : '(must equal 100%)'}
              </Typography>
            </Box>

            {/* Visual Bar */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', height: 32, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {participants?.map((participant, idx) => {
                  const percent = equityPercentages[participant.user_id] || 0;
                  const colors = ['#0ea5e9', '#14b8a6', '#f59e0b', '#8b5cf6'];
                  return (
                    <Box
                      key={participant.user_id}
                      sx={{
                        width: `${percent}%`,
                        bgcolor: colors[idx % colors.length],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {percent > 5 && (
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                          {percent.toFixed(0)}%
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Vesting Preset */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Vesting Schedule</InputLabel>
              <Select
                value={vestingPreset}
                onChange={(e) => setVestingPreset(e.target.value)}
                label="Vesting Schedule"
              >
                {VESTING_PRESETS.map((preset) => (
                  <MenuItem key={preset.label} value={preset.label}>
                    {preset.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {vestingPreset === 'Custom' && (
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                  label="Years"
                  type="number"
                  size="small"
                  value={customVesting.years}
                  onChange={(e) => setCustomVesting({ ...customVesting, years: parseInt(e.target.value) || 4 })}
                />
                <TextField
                  label="Cliff (months)"
                  type="number"
                  size="small"
                  value={customVesting.cliffMonths}
                  onChange={(e) => setCustomVesting({ ...customVesting, cliffMonths: parseInt(e.target.value) || 12 })}
                />
              </Box>
            )}

            {/* Summary */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: '8px' }}>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                Vesting Summary:
              </Typography>
              {participants?.map((participant) => {
                const percent = equityPercentages[participant.user_id] || 0;
                const vesting = vestingPreset === 'Custom' ? customVesting : VESTING_PRESETS.find(p => p.label === vestingPreset);
                return (
                  <Typography key={participant.user_id} variant="body2" sx={{ color: '#0f172a', mb: 0.5 }}>
                    {participant.user?.name}: {percent.toFixed(1)}% vesting over {vesting.years} years
                    {vesting.cliffMonths > 0 && ` (${vesting.cliffMonths / 12}-year cliff)`}
                  </Typography>
                );
              })}
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 2 }}>
                Note: This page helps you prepare your founders' agreement. It does not create a binding legal contract.
              </Typography>
            </Box>

            {/* Save Scenario */}
            <TextField
              fullWidth
              size="small"
              placeholder="Scenario label (e.g., 'Initial split', 'Revised after funding')"
              value={scenarioLabel}
              onChange={(e) => setScenarioLabel(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSaveScenario}
              disabled={!isTotalValid || !scenarioLabel.trim() || submitting}
              sx={{
                bgcolor: '#0ea5e9',
                '&:hover': { bgcolor: '#0284c7' },
              }}
            >
              {submitting ? <CircularProgress size={20} /> : 'Save Scenario'}
            </Button>
                </Box>
              )}

              {activeTab === 1 && (
                <>
                  {/* Saved Scenarios Tab Content */}
                  {equity?.scenarios && equity.scenarios.length > 0 ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 1,
                      }}
                    >
                  {[...(equity.scenarios || [])]
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((scenario, index) => {
                      const isLatestScenario = index === 0;
                      const isEditable = isLatestScenario && !scenario.is_current && scenario.status !== 'canceled';
                      const scenarioPreview = formatScenarioPreview(scenario);
                      return (
                    <Tooltip
                      key={scenario.id}
                      title={
                        <Box sx={{ p: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'white' }}>
                            {scenario.label}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            component="pre"
                            sx={{ 
                              color: 'white', 
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.75rem',
                              lineHeight: 1.6,
                            }}
                          >
                            {scenarioPreview || 'No equity data available'}
                          </Typography>
                        </Box>
                      }
                      arrow
                      placement="right"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            bgcolor: 'rgba(15, 23, 42, 0.95)',
                            maxWidth: 350,
                            fontSize: '0.875rem',
                            p: 2,
                          },
                        },
                        arrow: {
                          sx: {
                            color: 'rgba(15, 23, 42, 0.95)',
                          },
                        },
                      }}
                    >
                    <Card
                      sx={{
                        border: scenario.is_current ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          borderColor: scenario.is_current ? '#0ea5e9' : '#cbd5e1',
                        },
                      }}
                    >
                      <Box>
                        {/* Top row: Scenario info on left, approval buttons on right */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                              {scenario.label}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            {scenario.is_current && (
                              <Chip
                                label="Current"
                                size="small"
                                icon={<CheckCircle />}
                                sx={{
                                  bgcolor: '#0ea5e9',
                                  color: 'white',
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                              {scenario.approval_status === 'PENDING' && (
                                <Chip
                                  label="Pending Approval"
                                  size="small"
                                  icon={<HourglassEmpty />}
                                  color="warning"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                  }}
                                />
                              )}
                              {scenario.approval_status === 'REJECTED' && (
                                <Chip
                                  label="Rejected"
                                  size="small"
                                  icon={<Cancel />}
                                  color="error"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                  }}
                                />
                              )}
                              {scenario.status === 'canceled' && (
                                <Chip
                                  label="Canceled"
                                  size="small"
                                  icon={<Cancel />}
                                  color="default"
                                  sx={{
                                    fontSize: '0.7rem',
                                    height: 20,
                                    opacity: 0.6,
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                              {new Date(scenario.created_at).toLocaleDateString()}
                            </Typography>
                            
                            {/* Show who needs to approve */}
                            {pendingApprovals[scenario.id] && (
                              <Typography variant="caption" sx={{ color: '#f59e0b', display: 'block', mt: 0.5, fontWeight: 500 }}>
                                👤 Proposed by {pendingApprovals[scenario.id].proposer?.name || 'partner'} - awaiting your approval
                              </Typography>
                            )}
                            {scenario.approval_status === 'PENDING' && !pendingApprovals[scenario.id] && (
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                                ⏳ Waiting for partner's approval
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                            {/* Show approval buttons if user is approver */}
                            {pendingApprovals[scenario.id] && (
                              <>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={() => handleApproval(pendingApprovals[scenario.id].id, 'approve')}
                                  disabled={processingApproval === pendingApprovals[scenario.id].id}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Close />}
                                  onClick={() => handleApproval(pendingApprovals[scenario.id].id, 'reject')}
                                  disabled={processingApproval === pendingApprovals[scenario.id].id}
                                  sx={{ fontSize: '0.75rem' }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {processingApproval === pendingApprovals[scenario.id]?.id && (
                              <CircularProgress size={20} />
                            )}
                          </Box>
                        </Box>

                        {/* Set as Current button - full width, above note field */}
                        {!scenario.is_current && 
                         !pendingApprovals[scenario.id] && 
                         scenario.approval_status === 'APPROVED' && 
                         scenario.status !== 'canceled' && (
                          <Box sx={{ mb: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              fullWidth
                              onClick={() => handleSetCurrent(scenario.id)}
                              sx={{
                                borderColor: '#0ea5e9',
                                color: '#0ea5e9',
                                textTransform: 'none',
                                '&:hover': { 
                                  borderColor: '#0284c7', 
                                  bgcolor: 'rgba(14, 165, 233, 0.05)' 
                                },
                              }}
                            >
                              Set as Current
                            </Button>
                          </Box>
                        )}
                        
                        {/* Scenario Note - full width */}
                        <Box sx={{ mt: 1 }}>
                          <TextField
                            size="small"
                            placeholder={
                              !isEditable
                                ? scenario.is_current 
                                  ? "Note (locked - scenario is current)"
                                  : scenario.status === 'canceled'
                                  ? "Note (locked - scenario is canceled)"
                                  : "Note (locked - previous scenario)"
                                : "Add a note (e.g., 'Post-seed revision')"
                            }
                            value={scenarioNotes[scenario.id] ?? scenario.note ?? ''}
                            onChange={(e) => setScenarioNotes(prev => ({ ...prev, [scenario.id]: e.target.value }))}
                            onBlur={() => {
                              if (!isEditable) return;
                              const note = scenarioNotes[scenario.id] ?? scenario.note ?? '';
                              if (note !== scenario.note) {
                                handleUpdateScenarioNote(scenario.id, note);
                              }
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && isEditable) {
                                e.target.blur();
                              }
                            }}
                            disabled={!isEditable}
                            fullWidth
                            inputProps={{ maxLength: 255, style: { fontSize: '0.875rem' } }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': { 
                                bgcolor: !isEditable ? '#f1f5f9' : '#f8fafc',
                                '& fieldset': { borderColor: '#e2e8f0' },
                                '&.Mui-disabled': {
                                  bgcolor: '#f1f5f9',
                                  opacity: 0.7,
                                },
                              },
                            }}
                          />
                          {savingNote[scenario.id] === 'saved' && (
                            <Typography variant="caption" sx={{ color: '#10b981', display: 'block', mt: 0.5 }}>
                              ✓ Saved
                            </Typography>
                          )}
                          {scenario.note && !scenarioNotes[scenario.id] && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                              {scenario.note}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Card>
                    </Tooltip>
                    );
                  })}
                </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No scenarios saved yet. Create one in the Calculator tab.
                      </Typography>
              </Box>
            )}
                </>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Right Column: Roles & Responsibilities */}
      <Grid item xs={12} md={6}>
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Roles & Responsibilities
            </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
              Capture who owns what. This feeds your agreement doc.
            </Typography>
            </Box>

            {/* Tabs - One for each founder */}
            {participants && participants.length > 0 ? (
              <>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                  <Tabs 
                    value={activeRoleTab >= 0 ? activeRoleTab : 0} 
                    onChange={(e, newValue) => setActiveRoleTab(newValue)}
                    variant={participants.length > 2 ? "scrollable" : "standard"}
                    scrollButtons="auto"
                  >
                    {participants.map((participant, index) => (
                      <Tab 
                        key={participant.user_id} 
                        label={participant.user?.name || `Founder ${index + 1}`}
                      />
                    ))}
                  </Tabs>
                </Box>

                {/* Tab Content */}
                <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
                  {participants.map((participant, tabIndex) => {
                    if (tabIndex !== activeRoleTab) return null;
                    
              const existingRole = getParticipantRole(participant.user_id);
              const editing = editingRoles[participant.user_id];
              const roleData = editing || existingRole || { role_title: '', responsibilities: '' };

              return (
                      <Box key={participant.user_id}>
                <Card
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                            p: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    label="Role Title"
                    placeholder="e.g., CEO, CTO, CMO"
                    value={roleData.role_title || ''}
                    onChange={(e) => handleRoleChange(participant.user_id, 'role_title', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    multiline
                            rows={6}
                    label="Responsibilities"
                    placeholder="• Lead product development&#10;• Manage engineering team&#10;• Handle investor relations"
                    value={roleData.responsibilities || ''}
                    onChange={(e) => handleRoleChange(participant.user_id, 'responsibilities', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  
                  <Button
                            fullWidth
                    variant="contained"
                    onClick={() => handleSaveRole(participant.user_id)}
                    disabled={!roleData.role_title?.trim()}
                    sx={{
                      bgcolor: '#0ea5e9',
                      '&:hover': { bgcolor: '#0284c7' },
                    }}
                  >
                    {existingRole ? 'Update Role' : 'Save Role'}
                  </Button>
                </Card>
                      </Box>
              );
            })}
                </Box>
              </>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No participants found in this workspace.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Generate Agreement Draft */}
      <Grid item xs={12}>
        <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', bgcolor: '#f8fafc' }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 1, letterSpacing: '-0.01em' }}>
                  Founders' Agreement Draft
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  This is not a legal contract. It summarizes your current equity and roles for your lawyer.
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Description />}
                onClick={handleGenerateDraft}
                disabled={loadingDraft || !equity?.current}
                sx={{
                  bgcolor: '#0ea5e9',
                  '&:hover': { bgcolor: '#0284c7' },
                  textTransform: 'none',
                }}
              >
                {loadingDraft ? <CircularProgress size={20} /> : 'Generate Draft'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Agreement Draft Modal */}
    <Dialog open={draftDialogOpen} onClose={() => setDraftDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Founders' Agreement Draft
          </Typography>
          <IconButton onClick={copyDraftToClipboard}>
            <ContentCopy />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {draftData && (
          <Box>
            {/* Disclaimer */}
            <Alert severity="info" sx={{ mb: 3 }}>
              {draftData.disclaimer}
            </Alert>

            {/* Workspace Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {draftData.workspaceName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Generated: {new Date(draftData.generatedAt).toLocaleString()}
              </Typography>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Equity Distribution */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Equity Split
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Founder</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Equity %</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Vesting Period</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Cliff Period</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draftData.equity.owners.map((owner) => (
                      <TableRow key={owner.userId} hover>
                        <TableCell>{owner.name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          {owner.percent}%
                        </TableCell>
                        <TableCell align="right">
                          {draftData.equity.vestingYears} years
                        </TableCell>
                        <TableCell align="right">
                          {draftData.equity.cliffMonths} months
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: '#f8fafc', '& .MuiTableCell-root': { fontWeight: 600 } }}>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">
                        {draftData.equity.owners.reduce((sum, owner) => sum + owner.percent, 0).toFixed(1)}%
                      </TableCell>
                      <TableCell align="right" colSpan={2}>
                        -
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Roles & Responsibilities */}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Roles & Responsibilities
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Founder</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Responsibilities</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {draftData.roles.map((role) => (
                      <TableRow key={role.userId}>
                        <TableCell>{role.name}</TableCell>
                        <TableCell>{role.title || '-'}</TableCell>
                        <TableCell>{role.responsibilities || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDraftDialogOpen(false)}>Close</Button>
        <Button variant="contained" onClick={copyDraftToClipboard} startIcon={<ContentCopy />}>
          Copy to Clipboard
        </Button>
      </DialogActions>
    </Dialog>

    {/* Success Dialog */}
    <Dialog 
      open={successDialogOpen} 
      onClose={() => setSuccessDialogOpen(false)} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            background: successMessage.includes('Failed') 
              ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {successMessage.includes('Failed') ? (
              <Close sx={{ color: 'white', fontSize: 24 }} />
            ) : (
              <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
            )}
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {successMessage.includes('Failed') ? 'Error' : 'Success'}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ color: 'text.primary' }}>
          {successMessage}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, pt: 1 }}>
        <Button 
          onClick={() => setSuccessDialogOpen(false)}
          variant="contained"
          sx={{
            bgcolor: successMessage.includes('Failed') ? '#ef4444' : '#10b981',
            '&:hover': {
              bgcolor: successMessage.includes('Failed') ? '#dc2626' : '#059669',
            },
            textTransform: 'none',
            px: 3,
          }}
        >
          OK
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default WorkspaceEquityRoles;


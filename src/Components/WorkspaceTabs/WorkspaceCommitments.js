import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
} from '@mui/material';
import { Add, Edit, CheckCircle, TrendingUp, EventNote, Assignment } from '@mui/icons-material';
import { useWorkspaceKPIs, useWorkspaceCheckins, useWorkspaceParticipants } from '../../hooks/useWorkspace';
import AddTaskDialog from '../AddTaskDialog';

import { API_BASE } from '../../config/api';

const WorkspaceCommitments = ({ workspaceId }) => {
  const { user } = useUser();
  const { participants, updateParticipant } = useWorkspaceParticipants(workspaceId);
  const { kpis, createKPI, updateKPI } = useWorkspaceKPIs(workspaceId);
  const { checkins, createCheckin } = useWorkspaceCheckins(workspaceId);
  const [checkinPartnerReviews, setCheckinPartnerReviews] = useState({}); // { checkinId: [reviews] }
  const [expandedComments, setExpandedComments] = useState({}); // { reviewId: true/false }
  
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [participantChanges, setParticipantChanges] = useState({});
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [selectedKPIForTask, setSelectedKPIForTask] = useState(null);
  const [completedTasksForWeek, setCompletedTasksForWeek] = useState([]);
  const [newKPI, setNewKPI] = useState({
    label: '',
    target_value: '',
    target_date: '',
    owner_user_id: '',
    status: 'not_started',
  });
  const [newCheckin, setNewCheckin] = useState({
    week_start: '',
    summary: '',
    status: 'on_track',
    progress_percent: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleCreateKPI = async () => {
    if (!newKPI.label.trim()) {
      alert('KPI label is required');
      return;
    }

    setSubmitting(true);
    try {
      await createKPI(newKPI);
      setNewKPI({
        label: '',
        target_value: '',
        target_date: '',
        owner_user_id: '',
        status: 'not_started',
      });
      setShowKPIForm(false);
    } catch (err) {
      alert('Failed to create KPI');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateKPI = async (kpiId, updates) => {
    try {
      await updateKPI(kpiId, updates);
      setEditingKPI(null);
    } catch (err) {
      // Error updating KPI
    }
  };

  const handleSaveParticipant = async (participantId) => {
    if (!participantChanges[participantId]) return;
    
    try {
      await updateParticipant(participantId, participantChanges[participantId]);
      setEditingParticipant(null);
      setParticipantChanges(prev => {
        const updated = { ...prev };
        delete updated[participantId];
        return updated;
      });
    } catch (err) {
      // Error updating participant
    }
  };

  const handleParticipantChange = (participantId, field, value) => {
    setParticipantChanges(prev => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        [field]: value
      }
    }));
  };

  const fetchCompletedTasksForWeek = async (weekStart) => {
    if (!weekStart || !user?.id) return;
    
    try {
      // Calculate week end (7 days after week start)
      const startDate = new Date(weekStart);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/tasks/completed-for-week?week_start=${weekStart}&week_end=${endDate.toISOString()}`,
        {
          headers: { 'X-Clerk-User-Id': user.id },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCompletedTasksForWeek(data || []);
      }
    } catch (err) {
      // Error fetching completed tasks
    }
  };

  useEffect(() => {
    if (showCheckinForm && newCheckin.week_start) {
      fetchCompletedTasksForWeek(newCheckin.week_start);
    }
  }, [showCheckinForm, newCheckin.week_start]);

  // Fetch partner reviews for check-ins
  useEffect(() => {
    if (checkins && checkins.length > 0 && user?.id) {
      const fetchReviews = async () => {
        const reviewsMap = {};
        for (const checkin of checkins) {
          try {
            const response = await fetch(
              `${API_BASE}/workspaces/${workspaceId}/checkins/${checkin.id}/partner-reviews`,
              {
                headers: {
                  'X-Clerk-User-Id': user.id,
                },
              }
            );
            if (response.ok) {
              const reviews = await response.json();
              if (reviews && reviews.length > 0) {
                reviewsMap[checkin.id] = reviews;
              }
            }
          } catch (e) {
            // Error fetching partner reviews
          }
        }
        setCheckinPartnerReviews(reviewsMap);
      };
      fetchReviews();
    }
  }, [checkins, workspaceId, user?.id]);

  const handleCopyTaskTitles = () => {
    const titles = completedTasksForWeek.map(task => `- ${task.title}`).join('\n');
    navigator.clipboard.writeText(titles);
  };

  const handleCreateCheckin = async () => {
    if (!newCheckin.week_start || !newCheckin.summary.trim() || !newCheckin.status) {
      alert('Week start date, status, and summary are required');
      return;
    }

    // Validate progress_percent if provided
    if (newCheckin.progress_percent && (newCheckin.progress_percent < 0 || newCheckin.progress_percent > 100)) {
      alert('Progress percentage must be between 0 and 100');
      return;
    }

    setSubmitting(true);
    try {
      const checkinData = {
        week_start: newCheckin.week_start,
        summary: newCheckin.summary,
        status: newCheckin.status,
        progress_percent: newCheckin.progress_percent ? parseFloat(newCheckin.progress_percent) : null,
      };
      await createCheckin(checkinData);
      setNewCheckin({ week_start: '', summary: '', status: 'on_track', progress_percent: '' });
      setCompletedTasksForWeek([]);
      setShowCheckinForm(false);
    } catch (err) {
      alert('Failed to create checkin');
    } finally {
      setSubmitting(false);
    }
  };

  const getCheckinStatusLabel = (status) => {
    const labels = {
      on_track: 'On track',
      slightly_behind: 'Slightly behind',
      off_track: 'Off track',
    };
    return labels[status] || status;
  };

  const formatCommitmentSummary = (participant) => {
    const hours = participant.weekly_commitment_hours;
    const timezone = participant.timezone;
    if (!hours && !timezone) return null;
    
    const parts = [];
    if (hours) parts.push(`${hours} hrs/week`);
    if (timezone) parts.push(timezone);
    return parts.join(' · ');
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: '#64748b',
      in_progress: '#0ea5e9',
      done: '#10b981',
    };
    return colors[status] || '#64748b';
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      done: 'Done',
    };
    return labels[status] || status;
  };

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
        {/* Commitments Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1, flexShrink: 0 }}>
                Set realistic hours and availability. This feeds your weekly check‑ins.
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#0f172a', letterSpacing: '-0.01em', flexShrink: 0 }}>
                Commitments
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>

              {participants?.map((participant) => {
                const isEditing = editingParticipant === participant.user_id;
                const changes = participantChanges[participant.user_id] || {};
                const hasChanges = Object.keys(changes).length > 0;
                
                return (
                <Card
                  key={participant.user_id}
                  sx={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    mb: 2,
                    p: 2,
                  }}
                >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    {participant.user?.name || 'Unknown'}
                  </Typography>
                      {!isEditing ? (
                        <Button
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => setEditingParticipant(participant.user_id)}
                          sx={{ textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingParticipant(null);
                              setParticipantChanges(prev => {
                                const updated = { ...prev };
                                delete updated[participant.user_id];
                                return updated;
                              });
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!hasChanges}
                            onClick={() => handleSaveParticipant(participant.user_id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Save
                          </Button>
                        </Box>
                      )}
                    </Box>
                  
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Hours per week"
                      value={isEditing ? (changes.weekly_commitment_hours ?? participant.weekly_commitment_hours ?? '') : (participant.weekly_commitment_hours || '')}
                      onChange={isEditing ? (e) => handleParticipantChange(participant.user_id, 'weekly_commitment_hours', parseInt(e.target.value) || null) : undefined}
                      disabled={!isEditing}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    size="small"
                    label="Availability"
                    placeholder="e.g., Evenings & weekends, IST"
                      value={isEditing ? (changes.timezone ?? participant.timezone ?? '') : (participant.timezone || '')}
                      onChange={isEditing ? (e) => handleParticipantChange(participant.user_id, 'timezone', e.target.value) : undefined}
                      disabled={!isEditing}
                    sx={{ mb: 1 }}
                  />
                  
                  {/* Summary line */}
                  {!isEditing && formatCommitmentSummary(participant) && (
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 1 }}>
                      {formatCommitmentSummary(participant)}
                    </Typography>
                  )}
                </Card>
                );
              })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPIs Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  KPIs
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setNewKPI({
                      ...newKPI,
                      owner_user_id: participants?.[0]?.user_id || '',
                    });
                    setShowKPIForm(true);
                  }}
                  sx={{
                    bgcolor: '#0ea5e9',
                    '&:hover': { bgcolor: '#0284c7' },
                  }}
                >
                  Add KPI
                </Button>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 3, flexShrink: 0 }}>
                Focus on 3–5 KPIs for the next 90 days. These power your Overview progress and Upcoming KPIs.
              </Typography>

              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {kpis?.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    opacity: 0.6
                  }}>
                    <TrendingUp sx={{ fontSize: 48, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      No KPIs yet. Add one to track progress.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer sx={{ maxHeight: '100%', overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Metric</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Target</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Owner</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kpis?.map((kpi) => (
                          <TableRow key={kpi.id}>
                            <TableCell>{kpi.label}</TableCell>
                            <TableCell>
                              {kpi.target_value && <Typography variant="body2">{kpi.target_value}</Typography>}
                              {kpi.target_date && (
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                  by {new Date(kpi.target_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{kpi.owner?.name || 'Unknown'}</TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(kpi.status)}
                                size="small"
                                sx={{
                                  bgcolor: getStatusColor(kpi.status),
                                  color: 'white',
                                  fontWeight: 600,
                                  fontSize: '0.7rem',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                              {editingKPI === kpi.id ? (
                                  <>
                                  <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <Select
                                      value={kpi.status}
                                      onChange={(e) => handleUpdateKPI(kpi.id, { status: e.target.value })}
                                    >
                                      <MenuItem value="not_started">Not Started</MenuItem>
                                      <MenuItem value="in_progress">In Progress</MenuItem>
                                      <MenuItem value="done">Done</MenuItem>
                                    </Select>
                                  </FormControl>
                                  <IconButton size="small" onClick={() => setEditingKPI(null)}>
                                    <CheckCircle />
                                  </IconButton>
                                  </>
                              ) : (
                                  <>
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingKPI(kpi.id)}
                                  sx={{ color: '#64748b' }}
                                      title="Edit KPI"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedKPIForTask(kpi.id);
                                        setAddTaskDialogOpen(true);
                                      }}
                                      sx={{ color: '#0ea5e9' }}
                                      title="Add Task"
                                    >
                                      <Assignment fontSize="small" />
                                    </IconButton>
                                  </>
                              )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Check-ins */}
        <Grid item xs={12}>
          <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '600px', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
                  Recent Check-ins
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => {
                    // Set default to current week
                    const today = new Date();
                    const monday = new Date(today);
                    monday.setDate(today.getDate() - today.getDay() + 1);
                    setNewCheckin({
                      week_start: monday.toISOString().split('T')[0],
                      summary: '',
                      status: 'on_track',
                      progress_percent: '',
                    });
                    setShowCheckinForm(true);
                  }}
                  sx={{
                    borderColor: '#0ea5e9',
                    color: '#0ea5e9',
                    '&:hover': {
                      borderColor: '#0284c7',
                      bgcolor: 'rgba(14, 165, 233, 0.05)',
                    },
                  }}
                >
                  Add Weekly Check-in
                </Button>
              </Box>

              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
              {checkins?.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  opacity: 0.6
                }}>
                  <EventNote sx={{ fontSize: 48, color: '#94a3b8' }} />
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    No check-ins yet. Start tracking weekly progress.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {checkins?.map((checkin) => {
                    const statusLabel = getCheckinStatusLabel(checkin.status || 'on_track');
                    const weekDate = new Date(checkin.week_start);
                    const formattedDate = weekDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                    const progressText = checkin.progress_percent ? ` · ${checkin.progress_percent}% progress` : '';
                    const partnerReviews = checkinPartnerReviews[checkin.id] || [];
                    
                    return (
                      <Box
                        key={checkin.id}
                        sx={{
                          p: 2,
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          bgcolor: '#f8fafc',
                        }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: '#0f172a' }}>
                          Week of {formattedDate} – {statusLabel}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'pre-wrap', mb: 1 }}>
                          {checkin.summary}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: partnerReviews.length > 0 ? 2 : 0 }}>
                          {statusLabel}{progressText} · by {checkin.creator?.name || 'Unknown'} · {new Date(checkin.created_at).toLocaleDateString()}
                        </Typography>
                        
                        {/* Partner Reviews Section */}
                        {(() => {
                          const hasAdvisor = participants?.some(p => p.role === 'ADVISOR');
                          if (!hasAdvisor) return null;
                          
                          if (partnerReviews.length > 0) {
                            return (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e2e8f0' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', mb: 1, display: 'block' }}>
                                  Partner Review
                                </Typography>
                                {partnerReviews.map((review, idx) => {
                                  const verdictColors = {
                                    'ON_TRACK': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
                                    'AT_RISK': { bg: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' },
                                    'OFF_TRACK': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
                                  };
                                  const colors = verdictColors[review.verdict] || verdictColors['ON_TRACK'];
                                  const verdictLabels = {
                                    'ON_TRACK': 'On track',
                                    'AT_RISK': 'At risk',
                                    'OFF_TRACK': 'Off track',
                                  };
                                  const comment = review.comment || '';
                                  const isLongComment = comment.length > 200;
                                  const showFullComment = expandedComments[review.id] || !isLongComment;
                                  
                                  return (
                                    <Box key={review.id || idx} sx={{ mb: idx < partnerReviews.length - 1 ? 2 : 0 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: comment ? 1 : 0 }}>
                                        <Chip
                                          label={verdictLabels[review.verdict] || review.verdict}
                                          size="small"
                                          sx={{
                                            bgcolor: colors.bg,
                                            color: colors.color,
                                            border: `1px solid ${colors.border}`,
                                            fontWeight: 600,
                                          }}
                                        />
                                        {review.partner && (
                                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                                            by {review.partner.name || 'Partner'}
                                          </Typography>
                                        )}
                                      </Box>
                                      {comment && (
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: '#475569', 
                                            whiteSpace: 'pre-wrap',
                                            fontSize: '0.875rem',
                                          }}
                                        >
                                          {showFullComment ? comment : `${comment.substring(0, 200)}...`}
                                          {isLongComment && (
                                            <Button
                                              size="small"
                                              onClick={() => setExpandedComments(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                                              sx={{ 
                                                ml: 1, 
                                                minWidth: 'auto', 
                                                p: 0, 
                                                textTransform: 'none',
                                                color: '#0ea5e9',
                                                fontSize: '0.875rem',
                                              }}
                                            >
                                              {showFullComment ? 'See less' : 'See more'}
                                            </Button>
                                          )}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            );
                          } else {
                            return (
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic', display: 'block', mt: 2 }}>
                                Waiting for partner review
                              </Typography>
                            );
                          }
                        })()}
                      </Box>
                    );
                  })}
                </Box>
              )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Add KPI Dialog */}
      <Dialog open={showKPIForm} onClose={() => setShowKPIForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add KPI</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Metric Name"
            placeholder="e.g., Customer interviews"
            value={newKPI.label}
            onChange={(e) => setNewKPI({ ...newKPI, label: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="Target Value"
            placeholder="e.g., 10, 50%, $1000"
            value={newKPI.target_value}
            onChange={(e) => setNewKPI({ ...newKPI, target_value: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="date"
            label="Target Date"
            value={newKPI.target_date}
            onChange={(e) => setNewKPI({ ...newKPI, target_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Owner</InputLabel>
            <Select
              value={newKPI.owner_user_id}
              onChange={(e) => setNewKPI({ ...newKPI, owner_user_id: e.target.value })}
              label="Owner"
            >
              {participants?.map((p) => (
                <MenuItem key={p.user_id} value={p.user_id}>
                  {p.user?.name || 'Unknown'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newKPI.status}
              onChange={(e) => setNewKPI({ ...newKPI, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKPIForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateKPI}
            disabled={!newKPI.label.trim() || submitting}
            sx={{
              bgcolor: '#0ea5e9',
              '&:hover': { bgcolor: '#0284c7' },
            }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Add KPI'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Check-in Dialog */}
      <Dialog open={showCheckinForm} onClose={() => setShowCheckinForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Weekly Check-in</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="Week Start Date"
            value={newCheckin.week_start}
            onChange={(e) => setNewCheckin({ ...newCheckin, week_start: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 3, mt: 1 }}
            required
          />
          
          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend" sx={{ mb: 1, color: '#0f172a', fontWeight: 500 }}>
              How did this week go?
            </FormLabel>
            <RadioGroup
              value={newCheckin.status}
              onChange={(e) => setNewCheckin({ ...newCheckin, status: e.target.value })}
            >
              <FormControlLabel
                value="on_track"
                control={<Radio />}
                label="👍 On track"
                sx={{
                  mb: 1,
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                }}
              />
              <FormControlLabel
                value="slightly_behind"
                control={<Radio />}
                label="⚠ Slightly behind"
                sx={{
                  mb: 1,
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                }}
              />
              <FormControlLabel
                value="off_track"
                control={<Radio />}
                label="❌ Off track"
                sx={{
                  '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
                }}
              />
            </RadioGroup>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Progress vs goals (%) – optional"
            placeholder="0-100"
            value={newCheckin.progress_percent}
            onChange={(e) => {
              const value = e.target.value === '' ? '' : Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
              setNewCheckin({ ...newCheckin, progress_percent: value });
            }}
            inputProps={{ min: 0, max: 100, step: 1 }}
            sx={{ mb: 3 }}
            helperText="Optional: Enter a percentage (0-100)"
          />

          {/* Completed Tasks for Week */}
          {completedTasksForWeek.length > 0 && (
            <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                  Completed tasks this week ({completedTasksForWeek.length})
                </Typography>
                <Button
                  size="small"
                  onClick={handleCopyTaskTitles}
                  sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                >
                  Copy titles
                </Button>
              </Box>
              <Box component="ul" sx={{ m: 0, pl: 2, color: '#64748b', fontSize: '0.875rem' }}>
                {completedTasksForWeek.map((task) => (
                  <li key={task.id}>
                    <Typography variant="body2" component="span">
                      {task.title}
                      {task.owner && (
                        <Typography component="span" variant="caption" sx={{ ml: 1, color: '#94a3b8' }}>
                          ({task.owner.name})
                        </Typography>
                      )}
                    </Typography>
                  </li>
                ))}
              </Box>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="What happened this week?"
            placeholder="What did you accomplish this week? What are you working on next?"
            value={newCheckin.summary}
            onChange={(e) => setNewCheckin({ ...newCheckin, summary: e.target.value })}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCheckinForm(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateCheckin}
            disabled={!newCheckin.week_start || !newCheckin.summary.trim() || !newCheckin.status || submitting}
            sx={{
              bgcolor: '#0ea5e9',
              '&:hover': { bgcolor: '#0284c7' },
            }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Add Check-in'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddTaskDialog
        open={addTaskDialogOpen}
        onClose={() => {
          setAddTaskDialogOpen(false);
          setSelectedKPIForTask(null);
        }}
        workspaceId={workspaceId}
        kpiId={selectedKPIForTask}
      />
    </Box>
  );
};

export default WorkspaceCommitments;


import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Add,
  Close,
  Person,
  CalendarToday,
  TrendingUp,
  CheckCircleOutline,
} from '@mui/icons-material';
import { format, isPast, parseISO } from 'date-fns';

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

const STATUSES = {
  TODO: { label: 'To-do', color: SLATE_400 },
  IN_PROGRESS: { label: 'In Progress', color: SKY },
  DONE: { label: 'Done', color: TEAL },
};

const WorkspaceTasks = ({ workspaceId }) => {
  const { user } = useUser();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [founderId, setFounderId] = useState(null);
  const [founders, setFounders] = useState([]);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogStatus, setAddDialogStatus] = useState('TODO');
  const [newTask, setNewTask] = useState({
    title: '',
    owner_id: '',
    due_date: '',
    kpi_id: null,
    decision_id: null,
  });
  const [linkType, setLinkType] = useState('');
  const [draggedTask, setDraggedTask] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [decisions, setDecisions] = useState([]);

  useEffect(() => {
    if (user?.id && workspaceId) {
      fetchWorkspaceFeatureAccess();
    }
  }, [user?.id, workspaceId]);

  const fetchWorkspaceFeatureAccess = async () => {
    if (!user?.id || !workspaceId) return;
    setPlanLoading(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/check-feature?feature=workspaceFeatures.tasksBoard`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlan({ 
          id: data.workspace_plan || 'FREE', 
          workspaceFeatures: { tasksBoard: data.has_access } 
        });
      } else {
        setPlan({ id: 'FREE', workspaceFeatures: { tasksBoard: false } });
      }
    } catch (err) {
      setPlan({ id: 'FREE', workspaceFeatures: { tasksBoard: false } });
    } finally {
      setPlanLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchFounderId();
      fetchFounders();
      fetchKpis();
      fetchDecisions();
    }
  }, [user, workspaceId]);

  useEffect(() => {
    if (founderId) {
      fetchTasks();
    }
  }, [workspaceId, founderId, ownerFilter, linkFilter]);

  const fetchFounderId = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/check`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.has_profile && data.profile) {
          setFounderId(data.profile.id);
          setNewTask(prev => ({ ...prev, owner_id: data.profile.id }));
        }
      }
    } catch (err) {
      // Error fetching founder ID
    }
  };

  const fetchFounders = async () => {
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/participants`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setFounders(data || []);
      }
    } catch (err) {
      // Error fetching founders
    }
  };

  const fetchKpis = async () => {
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/kpis`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setKpis(data || []);
      }
    } catch (err) {
      // Error fetching KPIs
    }
  };

  const fetchDecisions = async () => {
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/decisions`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setDecisions(data || []);
      }
    } catch (err) {
      // Error fetching decisions
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ownerFilter !== 'all') params.append('owner', ownerFilter);
      if (linkFilter !== 'all') params.append('link', linkFilter);

      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/tasks?${params.toString()}`,
        {
          headers: { 'X-Clerk-User-Id': user.id },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTasks(data || []);
      } else {
        setError('Failed to fetch tasks');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || (!newTask.kpi_id && !newTask.decision_id)) {
      return;
    }

    try {
      const taskData = {
        title: newTask.title,
        owner_id: newTask.owner_id,
        status: addDialogStatus,
        due_date: newTask.due_date || null,
        kpi_id: newTask.kpi_id || null,
        decision_id: newTask.decision_id || null,
      };

      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/tasks`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (response.ok) {
        setAddDialogOpen(false);
        setLinkType('');
        setNewTask({
          title: '',
          owner_id: founderId,
          due_date: '',
          kpi_id: null,
          decision_id: null,
        });
        setAddDialogStatus('TODO');
        fetchTasks();
      }
    } catch (err) {
      // Error creating task
    }
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTask) return;

    if (draggedTask.status === targetStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/tasks/${draggedTask.id}`,
        {
          method: 'PATCH',
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: targetStatus }),
        }
      );

      if (response.ok) {
        fetchTasks();
      }
    } catch (err) {
      // Error updating task
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const hasTasksAccess = plan && plan.workspaceFeatures?.tasksBoard === true;
  
  if (planLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }
  
  if (!plan || !hasTasksAccess) {
    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 4 }}>
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            bgcolor: alpha(SKY, 0.1),
            border: '1px solid',
            borderColor: alpha(SKY, 0.3),
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
            Upgrade Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: SLATE_500 }}>
            Tasks board is available in Pro and Pro+ plans.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/pricing'}
            sx={{ 
              bgcolor: TEAL, 
              '&:hover': { bgcolor: TEAL_LIGHT },
              textTransform: 'none',
            }}
          >
            View Pricing Plans
          </Button>
        </Alert>
      </Box>
    );
  }

  const openAddDialog = (status, kpiId = null, decisionId = null) => {
    setAddDialogStatus(status);
    setLinkType(kpiId ? 'kpi' : decisionId ? 'decision' : '');
    setNewTask({
      title: '',
      owner_id: founderId,
      due_date: '',
      kpi_id: kpiId,
      decision_id: decisionId,
    });
    setAddDialogOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3, borderRadius: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Owner</InputLabel>
          <Select
            value={ownerFilter}
            label="Owner"
            onChange={(e) => setOwnerFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="me">Me</MenuItem>
            <MenuItem value="other">Other Founder</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Link</InputLabel>
          <Select
            value={linkFilter}
            label="Link"
            onChange={(e) => setLinkFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="kpi">KPIs</MenuItem>
            <MenuItem value="decision">Decisions</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Kanban Board */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
        {Object.entries(STATUSES).map(([status, config]) => (
          <Box
            key={status}
            sx={{
              bgcolor: '#fff',
              borderRadius: 2,
              border: '1px solid',
              borderColor: SLATE_200,
              height: 600,
              display: 'flex',
              flexDirection: 'column',
            }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <Box
              sx={{
                p: 2,
                borderBottom: '1px solid',
                borderColor: SLATE_200,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, color: config.color }}>
                {config.label}
              </Typography>
              <Chip
                label={getTasksByStatus(status).length}
                size="small"
                sx={{ 
                  bgcolor: alpha(config.color, 0.1),
                  color: config.color,
                  border: `1px solid ${alpha(config.color, 0.3)}`,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>

            {/* Tasks - Scrollable Area */}
            <Box 
              sx={{ 
                flex: 1, 
                p: 1.5, 
                overflowY: 'auto', 
                minHeight: 0,
                bgcolor: BG,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: SLATE_200,
                  borderRadius: '3px',
                  '&:hover': {
                    background: SLATE_400,
                  },
                },
              }}
            >
              {getTasksByStatus(status).length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  opacity: 0.5,
                }}>
                  <Typography variant="caption" sx={{ color: SLATE_400 }}>
                    No tasks
                  </Typography>
                </Box>
              ) : (
                getTasksByStatus(status).map((task) => {
                  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE';
                  
                  return (
                    <Box
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      sx={{
                        mb: 1.5,
                        p: 2,
                        bgcolor: '#fff',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isOverdue ? '#ef4444' : SLATE_200,
                        cursor: 'move',
                        opacity: draggedTask?.id === task.id ? 0.5 : 1,
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: `0 2px 8px ${alpha(SLATE_900, 0.1)}`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
                        {task.title}
                      </Typography>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {task.owner && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 20,
                                height: 20,
                                bgcolor: alpha(SKY, 0.1),
                                color: SKY,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                              }}
                            >
                              {task.owner.name?.split(' ').map(n => n[0]).join('') || '?'}
                            </Avatar>
                            <Typography variant="caption" sx={{ color: SLATE_500 }}>
                              {task.owner.name}
                            </Typography>
                          </Box>
                        )}

                        {task.due_date && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: 14, color: isOverdue ? '#ef4444' : SLATE_400 }} />
                            <Typography
                              variant="caption"
                              sx={{ color: isOverdue ? '#ef4444' : SLATE_500 }}
                            >
                              {format(parseISO(task.due_date), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                        )}

                        {task.kpi && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp sx={{ fontSize: 14, color: SKY }} />
                            <Typography variant="caption" sx={{ color: SKY }}>
                              KPI: {task.kpi.label}
                            </Typography>
                          </Box>
                        )}

                        {task.decision && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleOutline sx={{ fontSize: 14, color: TEAL }} />
                            <Typography variant="caption" sx={{ color: TEAL }}>
                              Decision
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>

            {/* Add Task Button */}
            <Box
              sx={{
                p: 1.5,
                borderTop: '1px solid',
                borderColor: SLATE_200,
                flexShrink: 0,
              }}
            >
              <Button
                startIcon={<Add sx={{ fontSize: 18 }} />}
                onClick={() => openAddDialog(status)}
                sx={{
                  width: '100%',
                  textTransform: 'none',
                  color: SLATE_500,
                  border: '1px dashed',
                  borderColor: SLATE_200,
                  borderRadius: 2,
                  py: 1,
                  '&:hover': {
                    borderColor: TEAL,
                    bgcolor: alpha(TEAL, 0.05),
                    color: TEAL,
                  },
                }}
              >
                Add Task
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Add Task Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: SLATE_900, fontWeight: 600, borderBottom: '1px solid', borderColor: SLATE_200 }}>
          Add Task
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2 }}
            required
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Owner</InputLabel>
            <Select
              value={newTask.owner_id}
              label="Owner"
              onChange={(e) => setNewTask({ ...newTask, owner_id: e.target.value })}
              required
            >
              {founders.map((founder) => (
                <MenuItem key={founder.user_id} value={founder.user_id}>
                  {founder.user?.name || 'Unknown'}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Link Type</InputLabel>
            <Select
              value={linkType}
              label="Link Type"
              onChange={(e) => {
                setLinkType(e.target.value);
                if (e.target.value === 'kpi') {
                  setNewTask({ ...newTask, kpi_id: null, decision_id: null });
                } else if (e.target.value === 'decision') {
                  setNewTask({ ...newTask, kpi_id: null, decision_id: null });
                } else {
                  setNewTask({ ...newTask, kpi_id: null, decision_id: null });
                }
              }}
              required
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="kpi">KPI</MenuItem>
              <MenuItem value="decision">Decision</MenuItem>
            </Select>
          </FormControl>

          {linkType === 'kpi' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select KPI</InputLabel>
              <Select
                value={newTask.kpi_id || ''}
                label="Select KPI"
                onChange={(e) => setNewTask({ ...newTask, kpi_id: e.target.value, decision_id: null })}
                required
              >
                {kpis.map((kpi) => (
                  <MenuItem key={kpi.id} value={kpi.id}>
                    {kpi.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {linkType === 'decision' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Decision</InputLabel>
              <Select
                value={newTask.decision_id || ''}
                label="Select Decision"
                onChange={(e) => setNewTask({ ...newTask, decision_id: e.target.value, kpi_id: null })}
                required
              >
                {decisions.map((decision) => (
                  <MenuItem key={decision.id} value={decision.id}>
                    {decision.content.substring(0, 50)}...
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <TextField
            fullWidth
            type="date"
            label="Due Date (Optional)"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button onClick={() => setAddDialogOpen(false)} sx={{ color: SLATE_500 }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.title.trim() || (!newTask.kpi_id && !newTask.decision_id)}
            sx={{
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
            }}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceTasks;

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
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

const STATUSES = {
  TODO: { label: 'To-do', color: '#64748b' },
  IN_PROGRESS: { label: 'In Progress', color: '#0ea5e9' },
  DONE: { label: 'Done', color: '#10b981' },
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
  const [linkType, setLinkType] = useState(''); // 'kpi', 'decision', or ''
  const [draggedTask, setDraggedTask] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [decisions, setDecisions] = useState([]);

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
        setPlan({ id: 'FREE', workspaceFeatures: { tasksBoard: false } });
      }
    } catch (err) {
      // Default to FREE on error
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

  // Check if user has access to tasks board
  // If plan is null/undefined, default to no access (FREE plan)
  const hasTasksAccess = plan && plan.workspaceFeatures?.tasksBoard === true;
  
  if (planLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Block access if plan is null (not loaded) or if tasksBoard is false
  if (!plan || !hasTasksAccess) {
    return (
      <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Upgrade Required
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Tasks board is available in Pro and Pro+ plans.
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
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
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
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {Object.entries(STATUSES).map(([status, config]) => (
          <Box
            key={status}
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              height: '600px',
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
                borderColor: 'divider',
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
                sx={{ bgcolor: config.color, color: 'white' }}
              />
            </Box>

            {/* Tasks - Scrollable Area */}
            <Box 
              sx={{ 
                flex: 1, 
                p: 1, 
                overflowY: 'auto', 
                minHeight: 0,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f5f9',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#cbd5e1',
                  borderRadius: '4px',
                  '&:hover': {
                    background: '#94a3b8',
                  },
                },
              }}
            >
              {getTasksByStatus(status).map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  sx={{
                    mb: 1,
                    cursor: 'move',
                    opacity: draggedTask?.id === task.id ? 0.5 : 1,
                    border: task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE' ? '2px solid #ef4444' : '1px solid',
                    borderColor: task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE' ? '#ef4444' : 'divider',
                  }}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {task.title}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {task.owner && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {task.owner.name}
                          </Typography>
                        </Box>
                      )}

                      {task.due_date && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography
                            variant="caption"
                            color={task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE' ? 'error' : 'text.secondary'}
                          >
                            {format(parseISO(task.due_date), 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                      )}

                      {task.kpi && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TrendingUp sx={{ fontSize: 14, color: 'primary.main' }} />
                          <Typography variant="caption" color="primary.main">
                            KPI: {task.kpi.label}
                          </Typography>
                        </Box>
                      )}

                      {task.decision && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CheckCircleOutline sx={{ fontSize: 14, color: 'secondary.main' }} />
                          <Typography variant="caption" color="secondary.main">
                            Decision
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Add Task Button - Fixed at Bottom */}
            <Box
              sx={{
                p: 1,
                borderTop: '1px solid',
                borderColor: 'divider',
                flexShrink: 0,
              }}
            >
              <Button
                startIcon={<Add />}
                onClick={() => openAddDialog(status)}
                sx={{
                  width: '100%',
                  textTransform: 'none',
                  color: 'text.secondary',
                  border: '1px dashed',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'rgba(14, 165, 233, 0.05)',
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
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
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
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.title.trim() || (!newTask.kpi_id && !newTask.decision_id)}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceTasks;


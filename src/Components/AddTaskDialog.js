import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../config/api';

const AddTaskDialog = ({ open, onClose, workspaceId, kpiId = null, decisionId = null }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [founderId, setFounderId] = useState(null);
  const [founders, setFounders] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    owner_id: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (open && user?.id) {
      fetchFounderId();
      fetchFounders();
    }
  }, [open, user]);

  useEffect(() => {
    if (founderId) {
      setNewTask(prev => ({ ...prev, owner_id: founderId }));
    }
  }, [founderId]);

  const fetchFounderId = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/check`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.has_profile && data.profile) {
          setFounderId(data.profile.id);
        }
      }
    } catch (err) {
      console.error('Error fetching founder ID:', err);
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
      console.error('Error fetching founders:', err);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      const taskData = {
        title: newTask.title,
        owner_id: newTask.owner_id,
        status: 'TODO',
        due_date: newTask.due_date || null,
        kpi_id: kpiId,
        decision_id: decisionId,
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
        setShowToast(true);
        setNewTask({
          title: '',
          owner_id: founderId,
          due_date: '',
        });
        setTimeout(() => {
          onClose();
          setShowToast(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewBoard = () => {
    navigate(`/workspaces/${workspaceId}/tasks`);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {kpiId ? 'Add Task for KPI' : 'Add Follow-up Task'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Task Title"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
            required
            placeholder="e.g., Set up analytics dashboard"
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

          <TextField
            fullWidth
            type="date"
            label="Due Date (Optional)"
            value={newTask.due_date}
            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            disabled={!newTask.title.trim() || !newTask.owner_id || submitting}
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showToast}
        autoHideDuration={4000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowToast(false)}
          severity="success"
          action={
            <Button color="inherit" size="small" onClick={handleViewBoard}>
              View on Board
            </Button>
          }
        >
          Task created successfully!
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddTaskDialog;


import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { Add, Assignment } from '@mui/icons-material';
import { useWorkspaceDecisions } from '../../hooks/useWorkspace';
import AddTaskDialog from '../AddTaskDialog';

const DECISION_TAGS = [
  { value: 'equity', label: 'Equity', color: '#0ea5e9' },
  { value: 'roles', label: 'Roles', color: '#14b8a6' },
  { value: 'scope', label: 'Scope', color: '#f59e0b' },
  { value: 'timeline', label: 'Timeline', color: '#8b5cf6' },
  { value: 'money', label: 'Money', color: '#10b981' },
  { value: 'other', label: 'Other', color: '#64748b' },
];

const WorkspaceDecisions = ({ workspaceId }) => {
  const [selectedTag, setSelectedTag] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDecision, setNewDecision] = useState({ content: '', tag: 'other' });
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [selectedDecisionForTask, setSelectedDecisionForTask] = useState(null);
  
  const { decisions, loading, error, createDecision, refetch } = useWorkspaceDecisions(workspaceId, selectedTag);

  // Filter decisions by tag and date range
  const filteredDecisions = useMemo(() => {
    let filtered = decisions;
    
    // Filter by tag
    if (selectedTag) {
      filtered = filtered.filter(d => d.tag === selectedTag);
    }
    
    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(d => {
        const decisionDate = new Date(d.created_at);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
          // Set time to start/end of day for proper comparison
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          return decisionDate >= startDate && decisionDate <= endDate;
        } else if (startDate) {
          startDate.setHours(0, 0, 0, 0);
          return decisionDate >= startDate;
        } else if (endDate) {
          endDate.setHours(23, 59, 59, 999);
          return decisionDate <= endDate;
        }
        return true;
      });
    }
    
    return filtered;
  }, [decisions, selectedTag, dateRange]);

  const handleAddDecision = async () => {
    if (!newDecision.content.trim()) return;
    
    setSubmitting(true);
    try {
      await createDecision(newDecision);
      setNewDecision({ content: '', tag: 'other' });
      setDialogOpen(false);
    } catch (err) {
      // Error creating decision
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setNewDecision({ content: '', tag: 'other' });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTagConfig = (tag) => {
    return DECISION_TAGS.find(t => t.value === tag) || DECISION_TAGS[DECISION_TAGS.length - 1];
  };

  return (
    <Box sx={{ maxWidth: '1100px', mx: 'auto' }}>
      {/* Decisions Container with Fixed Box */}
      <Card sx={{ border: '1px solid #e2e8f0', borderRadius: '16px', height: '700px', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Decisions
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {filteredDecisions.length} {filteredDecisions.length === 1 ? 'decision' : 'decisions'}
            </Typography>
              <IconButton
                onClick={() => setDialogOpen(true)}
                sx={{
                  bgcolor: '#0ea5e9',
                  color: 'white',
                  width: 32,
                  height: 32,
                  '&:hover': {
                    bgcolor: '#0284c7',
                  },
                }}
                size="small"
              >
                <Add sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Filters Row - Tags and Date Range */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            {/* Tag Filters */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: 1 }}>
              <Chip
                label="All"
                onClick={() => setSelectedTag(null)}
                size="small"
                sx={{
                  bgcolor: selectedTag === null ? '#0ea5e9' : 'transparent',
                  color: selectedTag === null ? 'white' : '#64748b',
                  border: `1px solid ${selectedTag === null ? '#0ea5e9' : '#e2e8f0'}`,
                  fontWeight: selectedTag === null ? 600 : 400,
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: selectedTag === null ? '#0ea5e9' : 'rgba(14, 165, 233, 0.05)',
                  },
                }}
              />
              {DECISION_TAGS.map((tag) => (
                <Chip
                  key={tag.value}
                  label={tag.label}
                  onClick={() => setSelectedTag(tag.value)}
                  size="small"
                  sx={{
                    bgcolor: selectedTag === tag.value ? tag.color : 'transparent',
                    color: selectedTag === tag.value ? 'white' : '#64748b',
                    border: `1px solid ${selectedTag === tag.value ? tag.color : '#e2e8f0'}`,
                    fontWeight: selectedTag === tag.value ? 600 : 400,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: selectedTag === tag.value ? tag.color : 'rgba(14, 165, 233, 0.05)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Date Range Filters */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TextField
                type="date"
                size="small"
                placeholder="Start"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                InputLabelProps={{ shrink: false }}
                inputProps={{ 
                  style: { 
                    fontSize: '0.75rem', 
                    padding: '6px 10px',
                    height: '28px'
                  } 
                }}
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.75rem',
                    height: '32px',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0ea5e9',
                    },
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', px: 0.5, fontSize: '0.75rem' }}>
                to
              </Typography>
              <TextField
                type="date"
                size="small"
                placeholder="End"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                InputLabelProps={{ shrink: false }}
                inputProps={{ 
                  style: { 
                    fontSize: '0.75rem', 
                    padding: '6px 10px',
                    height: '28px'
                  } 
                }}
                sx={{
                  width: '120px',
                  '& .MuiOutlinedInput-root': {
                    fontSize: '0.75rem',
                    height: '32px',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#0ea5e9',
                    },
                  },
                }}
              />
              {(dateRange.start || dateRange.end) && (
                <Button
                  size="small"
                  onClick={() => setDateRange({ start: '', end: '' })}
                  sx={{
                    color: '#64748b',
                    textTransform: 'none',
                    minWidth: 'auto',
                    px: 1,
                    py: 0.5,
                    fontSize: '0.75rem',
                    height: '32px',
                    '&:hover': {
                      bgcolor: 'rgba(100, 116, 139, 0.08)',
                    },
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Scrollable Decisions List */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '8px',
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
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : filteredDecisions.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                  No decisions found
                </Typography>
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  {selectedTag || dateRange.start || dateRange.end
                    ? 'Try adjusting your filters.'
                    : 'Start documenting your partnership decisions.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredDecisions.map((decision) => {
                  const tagConfig = getTagConfig(decision.tag);
                  return (
                    <Card 
                      key={decision.id} 
                      sx={{ 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        opacity: decision.is_active ? 1 : 0.6,
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Chip
                            label={tagConfig.label}
                            size="small"
                            sx={{
                              bgcolor: tagConfig.color,
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                          {!decision.is_active && (
                            <Chip
                              label="Superseded"
                              size="small"
                              sx={{
                                bgcolor: '#94a3b8',
                                color: 'white',
                                fontWeight: 500,
                              }}
                            />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ color: '#0f172a', mb: 2, whiteSpace: 'pre-wrap' }}>
                          {decision.content}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                          <Button
                            size="small"
                            startIcon={<Assignment />}
                            onClick={() => {
                              setSelectedDecisionForTask(decision.id);
                              setAddTaskDialogOpen(true);
                            }}
                            sx={{ textTransform: 'none' }}
                          >
                            Add Follow-up Task
                          </Button>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 24,
                              height: 24,
                              bgcolor: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                              fontSize: '0.75rem',
                            }}
                          >
                            {decision.creator?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </Avatar>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            Added by {decision.creator?.name || 'Unknown'} · {formatRelativeTime(decision.created_at)}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: '#94a3b8', ml: 1 }}
                            title={formatDate(decision.created_at)}
                          >
                            ({formatDate(decision.created_at)})
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Add Decision Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
          New Decision
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What did you decide? (e.g., 'We'll split equity 50/50 with 4-year vesting and 1-year cliff')"
            value={newDecision.content}
            onChange={(e) => setNewDecision({ ...newDecision, content: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DECISION_TAGS.map((tag) => (
                <Chip
                  key={tag.value}
                  label={tag.label}
                  onClick={() => setNewDecision({ ...newDecision, tag: tag.value })}
                  sx={{
                    bgcolor: newDecision.tag === tag.value ? tag.color : 'transparent',
                    color: newDecision.tag === tag.value ? 'white' : '#64748b',
                    border: `1px solid ${newDecision.tag === tag.value ? tag.color : '#e2e8f0'}`,
                    fontWeight: newDecision.tag === tag.value ? 600 : 400,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: newDecision.tag === tag.value ? tag.color : 'rgba(14, 165, 233, 0.05)',
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
            Decisions are shared with your partner and time-stamped.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddDecision}
            disabled={!newDecision.content.trim() || submitting}
            sx={{
              bgcolor: '#0ea5e9',
              '&:hover': { bgcolor: '#0284c7' },
            }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Save Decision'}
          </Button>
        </DialogActions>
      </Dialog>

      <AddTaskDialog
        open={addTaskDialogOpen}
        onClose={() => {
          setAddTaskDialogOpen(false);
          setSelectedDecisionForTask(null);
        }}
        workspaceId={workspaceId}
        decisionId={selectedDecisionForTask}
      />
    </Box>
  );
};

export default WorkspaceDecisions;


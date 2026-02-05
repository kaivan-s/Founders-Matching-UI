import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
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
  Paper,
  alpha,
} from '@mui/material';
import { Add, Assignment, Close, FilterList } from '@mui/icons-material';
import { useWorkspaceDecisions } from '../../hooks/useWorkspace';
import AddTaskDialog from '../AddTaskDialog';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const DECISION_TAGS = [
  { value: 'equity', label: 'Equity', color: SKY },
  { value: 'roles', label: 'Roles', color: TEAL },
  { value: 'scope', label: 'Scope', color: '#f59e0b' },
  { value: 'timeline', label: 'Timeline', color: '#8b5cf6' },
  { value: 'money', label: 'Money', color: '#10b981' },
  { value: 'other', label: 'Other', color: SLATE_500 },
];

const WorkspaceDecisions = ({ workspaceId }) => {
  const [selectedTag, setSelectedTag] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDecision, setNewDecision] = useState({ content: '', tag: 'other' });
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [selectedDecisionForTask, setSelectedDecisionForTask] = useState(null);
  
  const { decisions, loading, error, createDecision } = useWorkspaceDecisions(workspaceId, selectedTag);

  const filteredDecisions = useMemo(() => {
    let filtered = decisions;
    
    if (selectedTag) {
      filtered = filtered.filter(d => d.tag === selectedTag);
    }
    
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(d => {
        const decisionDate = new Date(d.created_at);
        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;
        
        if (startDate && endDate) {
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

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTagConfig = (tag) => {
    return DECISION_TAGS.find(t => t.value === tag) || DECISION_TAGS[DECISION_TAGS.length - 1];
  };

  const hasActiveFilters = selectedTag || dateRange.start || dateRange.end;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5, letterSpacing: '-0.01em' }}>
            Decisions
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400, fontSize: '0.875rem' }}>
            {filteredDecisions.length} {filteredDecisions.length === 1 ? 'decision' : 'decisions'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: TEAL,
            '&:hover': { bgcolor: TEAL_LIGHT },
          }}
        >
          New Decision
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: SLATE_200,
          borderRadius: 2,
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ fontSize: 18, color: SLATE_400 }} />
          <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.8rem' }}>
            Filters
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label="All"
            onClick={() => setSelectedTag(null)}
            size="small"
            sx={{
              bgcolor: selectedTag === null ? alpha(SKY, 0.1) : 'transparent',
              color: selectedTag === null ? SKY : SLATE_500,
              border: '1px solid',
              borderColor: selectedTag === null ? SKY : SLATE_200,
              fontWeight: selectedTag === null ? 600 : 400,
              fontSize: '0.75rem',
              height: 28,
              '&:hover': {
                bgcolor: selectedTag === null ? alpha(SKY, 0.15) : alpha(SKY, 0.05),
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
                bgcolor: selectedTag === tag.value ? alpha(tag.color, 0.1) : 'transparent',
                color: selectedTag === tag.value ? tag.color : SLATE_500,
                border: '1px solid',
                borderColor: selectedTag === tag.value ? tag.color : SLATE_200,
                fontWeight: selectedTag === tag.value ? 600 : 400,
                fontSize: '0.75rem',
                height: 28,
                '&:hover': {
                  bgcolor: selectedTag === tag.value ? alpha(tag.color, 0.15) : alpha(tag.color, 0.05),
                },
              }}
            />
          ))}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 0, sm: 'auto' } }}>
            <TextField
              type="date"
              size="small"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
              label="From"
              sx={{
                width: { xs: 120, sm: 140 },
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: SLATE_200 },
                  '&:hover fieldset': { borderColor: alpha(SKY, 0.5) },
                  '&.Mui-focused fieldset': { borderColor: SKY },
                },
              }}
            />
            <TextField
              type="date"
              size="small"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
              label="To"
              sx={{
                width: { xs: 120, sm: 140 },
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem',
                  '& fieldset': { borderColor: SLATE_200 },
                  '&:hover fieldset': { borderColor: alpha(SKY, 0.5) },
                  '&.Mui-focused fieldset': { borderColor: SKY },
                },
              }}
            />
          </Box>
          {hasActiveFilters && (
            <Button
              size="small"
              onClick={() => {
                setSelectedTag(null);
                setDateRange({ start: '', end: '' });
              }}
              sx={{
                textTransform: 'none',
                color: SLATE_400,
                fontSize: '0.8rem',
                '&:hover': { color: TEAL, bgcolor: 'transparent' },
              }}
            >
              Clear all
            </Button>
          )}
        </Box>
      </Paper>

      {/* Decisions List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TEAL }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : filteredDecisions.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: '1px dashed',
            borderColor: SLATE_200,
            borderRadius: 2,
            bgcolor: BG,
          }}
        >
          <Assignment sx={{ fontSize: 48, color: SLATE_400, mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" sx={{ color: SLATE_500, mb: 1, fontWeight: 600 }}>
            No decisions found
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400, mb: 3 }}>
            {hasActiveFilters
              ? 'Try adjusting your filters or create a new decision.'
              : 'Start documenting your partnership decisions to keep track of important agreements.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
            }}
          >
            Create First Decision
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredDecisions.map((decision) => {
            const tagConfig = getTagConfig(decision.tag);
            return (
              <Paper
                key={decision.id}
                elevation={0}
                sx={{
                  p: 3,
                  border: '1px solid',
                  borderColor: SLATE_200,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  transition: 'all 0.2s ease',
                  opacity: decision.is_active ? 1 : 0.7,
                  '&:hover': {
                    borderColor: alpha(tagConfig.color, 0.4),
                    boxShadow: `0 4px 12px ${alpha(tagConfig.color, 0.08)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={tagConfig.label}
                      size="small"
                      sx={{
                        bgcolor: alpha(tagConfig.color, 0.1),
                        color: tagConfig.color,
                        border: '1px solid',
                        borderColor: alpha(tagConfig.color, 0.3),
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                    {!decision.is_active && (
                      <Chip
                        label="Superseded"
                        size="small"
                        sx={{
                          bgcolor: alpha(SLATE_400, 0.1),
                          color: SLATE_400,
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.75rem' }}>
                    {formatDate(decision.created_at)}
                  </Typography>
                </Box>

                <Typography
                  variant="body1"
                  sx={{
                    color: SLATE_900,
                    mb: 2.5,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    fontSize: '0.95rem',
                  }}
                >
                  {decision.content}
                </Typography>

                <Divider sx={{ mb: 2, borderColor: SLATE_200 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: alpha(TEAL, 0.1),
                        color: TEAL,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {decision.creator?.name?.split(' ').map(n => n[0]).join('') || '?'}
                    </Avatar>
                    <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.8rem' }}>
                      {decision.creator?.name || 'Unknown'} · {formatRelativeTime(decision.created_at)}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    startIcon={<Assignment sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setSelectedDecisionForTask(decision.id);
                      setAddTaskDialogOpen(true);
                    }}
                    sx={{
                      textTransform: 'none',
                      color: SLATE_500,
                      fontSize: '0.8rem',
                      '&:hover': {
                        color: TEAL,
                        bgcolor: alpha(TEAL, 0.05),
                      },
                    }}
                  >
                    Add Task
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Add Decision Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setNewDecision({ content: '', tag: 'other' });
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: SLATE_200,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900, letterSpacing: '-0.01em' }}>
              New Decision
            </Typography>
            <IconButton
              size="small"
              onClick={() => {
                setDialogOpen(false);
                setNewDecision({ content: '', tag: 'other' });
              }}
              sx={{ color: SLATE_400 }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What did you decide? (e.g., 'We'll split equity 50/50 with 4-year vesting and 1-year cliff')"
            value={newDecision.content}
            onChange={(e) => setNewDecision({ ...newDecision, content: e.target.value })}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.95rem',
                '& fieldset': { borderColor: SLATE_200 },
                '&:hover fieldset': { borderColor: alpha(SKY, 0.5) },
                '&.Mui-focused fieldset': { borderColor: SKY },
              },
            }}
          />
          <Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 1.5, fontWeight: 500, fontSize: '0.875rem' }}>
              Category
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {DECISION_TAGS.map((tag) => (
                <Chip
                  key={tag.value}
                  label={tag.label}
                  onClick={() => setNewDecision({ ...newDecision, tag: tag.value })}
                  size="small"
                  sx={{
                    bgcolor: newDecision.tag === tag.value ? alpha(tag.color, 0.1) : 'transparent',
                    color: newDecision.tag === tag.value ? tag.color : SLATE_500,
                    border: '1px solid',
                    borderColor: newDecision.tag === tag.value ? tag.color : SLATE_200,
                    fontWeight: newDecision.tag === tag.value ? 600 : 400,
                    fontSize: '0.75rem',
                    height: 28,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: newDecision.tag === tag.value ? alpha(tag.color, 0.15) : alpha(tag.color, 0.05),
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
          <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 2, fontSize: '0.75rem' }}>
            Decisions are shared with your partner and automatically time-stamped.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button
            onClick={() => {
              setDialogOpen(false);
              setNewDecision({ content: '', tag: 'other' });
            }}
            sx={{ color: SLATE_500, textTransform: 'none', fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddDecision}
            disabled={!newDecision.content.trim() || submitting}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
              '&:disabled': { bgcolor: SLATE_200 },
            }}
          >
            {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Decision'}
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

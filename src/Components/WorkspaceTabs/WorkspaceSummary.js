import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  Grid,
  LinearProgress,
  Alert,
  Button,
  IconButton,
  alpha,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Block,
  Assignment,
  Lightbulb,
  EventNote,
  OpenInNew,
  Refresh,
  TrendingUp,
  Warning,
  ArrowForward,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';

const TEAL = '#0d9488';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const AMBER_500 = '#f59e0b';
const RED_500 = '#ef4444';
const GREEN_500 = '#22c55e';
const BLUE_500 = '#3b82f6';
const PURPLE_500 = '#8b5cf6';

const NotionIcon = ({ color = '#000', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466l1.823 1.447zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.354c0-.606-.233-.933-.746-.886l-15.177.887c-.56.046-.747.326-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.886.747-.933l3.222-.186zM2.168 1.108L16.06.054c1.682-.14 2.102.093 2.802.606l3.876 2.754c.56.42.747.793.747 1.353v15.778c0 .98-.373 1.587-1.68 1.68l-15.458.933c-.98.047-1.448-.093-1.962-.7l-3.083-4.012c-.56-.746-.793-1.306-.793-1.959V2.948c0-.793.373-1.493 1.168-1.587l.49-.253z" fill={color}/>
  </svg>
);

const StatusChip = ({ status, small = false }) => {
  const configs = {
    'To Do': { color: SLATE_500, bg: alpha(SLATE_500, 0.1), icon: RadioButtonUnchecked },
    'In Progress': { color: BLUE_500, bg: alpha(BLUE_500, 0.1), icon: Schedule },
    'Done': { color: GREEN_500, bg: alpha(GREEN_500, 0.1), icon: CheckCircle },
    'Blocked': { color: RED_500, bg: alpha(RED_500, 0.1), icon: Block },
    'Approved': { color: GREEN_500, bg: alpha(GREEN_500, 0.1), icon: CheckCircle },
    'Proposed': { color: AMBER_500, bg: alpha(AMBER_500, 0.1), icon: Lightbulb },
    'Deferred': { color: SLATE_500, bg: alpha(SLATE_500, 0.1), icon: Schedule },
  };
  const config = configs[status] || { color: SLATE_500, bg: alpha(SLATE_500, 0.1) };
  const Icon = config.icon;
  
  return (
    <Chip
      icon={Icon ? <Icon sx={{ fontSize: small ? 12 : 14 }} /> : undefined}
      label={status}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: small ? '0.65rem' : '0.7rem',
        height: small ? 20 : 24,
        '& .MuiChip-icon': { color: config.color },
      }}
    />
  );
};

const PriorityChip = ({ priority, small = false }) => {
  const configs = {
    'High': { color: RED_500, bg: alpha(RED_500, 0.1) },
    'Medium': { color: AMBER_500, bg: alpha(AMBER_500, 0.1) },
    'Low': { color: SLATE_500, bg: alpha(SLATE_500, 0.1) },
  };
  const config = configs[priority] || { color: SLATE_500, bg: alpha(SLATE_500, 0.1) };
  
  return (
    <Chip
      label={priority}
      size="small"
      sx={{
        bgcolor: config.bg,
        color: config.color,
        fontWeight: 600,
        fontSize: small ? '0.65rem' : '0.7rem',
        height: small ? 20 : 24,
      }}
    />
  );
};

const StatCard = ({ icon, label, value, color, subtext }) => (
  <Box sx={{
    p: 2,
    borderRadius: 2,
    bgcolor: alpha(color, 0.05),
    border: `1px solid ${alpha(color, 0.15)}`,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
  }}>
    <Box sx={{
      width: 40,
      height: 40,
      borderRadius: 1.5,
      bgcolor: alpha(color, 0.1),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: color,
    }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500 }}>
        {label}
      </Typography>
      {subtext && (
        <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', fontSize: '0.65rem' }}>
          {subtext}
        </Typography>
      )}
    </Box>
  </Box>
);

const SectionCard = ({ title, icon, children, headerAction, emptyMessage }) => (
  <Card
    elevation={0}
    sx={{
      borderRadius: 3,
      border: `1px solid ${SLATE_200}`,
      bgcolor: '#fff',
      height: '100%',
    }}
  >
    <CardContent sx={{ p: 0 }}>
      <Box sx={{
        p: 2,
        borderBottom: `1px solid ${SLATE_200}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: alpha(TEAL, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: TEAL,
          }}>
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
        {headerAction}
      </Box>
      <Box sx={{ p: 2 }}>
        {React.Children.count(children) === 0 && emptyMessage ? (
          <Typography variant="body2" sx={{ color: SLATE_500, textAlign: 'center', py: 3 }}>
            {emptyMessage}
          </Typography>
        ) : (
          children
        )}
      </Box>
    </CardContent>
  </Card>
);

const TaskItem = ({ task }) => (
  <Box
    component="a"
    href={task.url}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
      p: 1.5,
      borderRadius: 2,
      bgcolor: SLATE_100,
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: alpha(TEAL, 0.05),
        transform: 'translateX(4px)',
      },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mb: 0.5,
        }}
      >
        {task.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {task.status && <StatusChip status={task.status} small />}
        {task.priority && <PriorityChip priority={task.priority} small />}
        {task.due_date && (
          <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    </Box>
    <OpenInNew sx={{ fontSize: 14, color: SLATE_500, flexShrink: 0, mt: 0.5 }} />
  </Box>
);

const DecisionItem = ({ decision }) => (
  <Box
    component="a"
    href={decision.url}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 1.5,
      p: 1.5,
      borderRadius: 2,
      bgcolor: SLATE_100,
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: alpha(PURPLE_500, 0.05),
        transform: 'translateX(4px)',
      },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          mb: 0.5,
        }}
      >
        {decision.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
        {decision.status && <StatusChip status={decision.status} small />}
        {decision.impact && (
          <Chip
            label={`${decision.impact} Impact`}
            size="small"
            sx={{
              bgcolor: alpha(decision.impact === 'High' ? RED_500 : decision.impact === 'Medium' ? AMBER_500 : SLATE_500, 0.1),
              color: decision.impact === 'High' ? RED_500 : decision.impact === 'Medium' ? AMBER_500 : SLATE_500,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}
        {decision.date && (
          <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>
            {new Date(decision.date).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    </Box>
    <OpenInNew sx={{ fontSize: 14, color: SLATE_500, flexShrink: 0, mt: 0.5 }} />
  </Box>
);

const MeetingItem = ({ meeting }) => (
  <Box
    component="a"
    href={meeting.url}
    target="_blank"
    rel="noopener noreferrer"
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 1.5,
      borderRadius: 2,
      bgcolor: SLATE_100,
      textDecoration: 'none',
      color: 'inherit',
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: alpha(BLUE_500, 0.05),
        transform: 'translateX(4px)',
      },
    }}
  >
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 600,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {meeting.title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {meeting.type && (
          <Chip
            label={meeting.type}
            size="small"
            sx={{
              bgcolor: alpha(BLUE_500, 0.1),
              color: BLUE_500,
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        )}
        {meeting.date && (
          <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>
            {new Date(meeting.date).toLocaleDateString()}
          </Typography>
        )}
      </Box>
    </Box>
    <OpenInNew sx={{ fontSize: 14, color: SLATE_500, flexShrink: 0 }} />
  </Box>
);

const WorkspaceSummary = ({ workspaceId, onNavigateTab }) => {
  const { user } = useUser();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async () => {
    if (!user?.id || !workspaceId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/summary`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch summary');
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [user?.id, workspaceId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress size={40} sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ borderRadius: 2 }}>
        Failed to load summary. Please try again.
        <Button size="small" onClick={fetchSummary} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!summary?.connected) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${SLATE_200}`,
          bgcolor: '#fff',
          textAlign: 'center',
          py: 6,
          px: 4,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            bgcolor: alpha('#000', 0.05),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <NotionIcon size={40} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Connect Notion to See Summary
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, maxWidth: 400, mx: 'auto' }}>
          Connect your Notion workspace to view tasks, decisions, and meeting notes in one place.
        </Typography>
        <Button
          variant="contained"
          onClick={() => onNavigateTab?.(4)}
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: TEAL,
            '&:hover': { bgcolor: alpha(TEAL, 0.9) },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Go to Integrations
        </Button>
      </Card>
    );
  }

  if (!summary?.has_workspace) {
    return (
      <Card
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(AMBER_500, 0.3)}`,
          bgcolor: alpha(AMBER_500, 0.02),
          textAlign: 'center',
          py: 6,
          px: 4,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            bgcolor: alpha(AMBER_500, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Warning sx={{ fontSize: 40, color: AMBER_500 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Notion Workspace Not Set Up
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, maxWidth: 400, mx: 'auto' }}>
          Create your partnership workspace in Notion to start tracking tasks, decisions, and meetings.
        </Typography>
        <Button
          variant="contained"
          onClick={() => onNavigateTab?.(4)}
          endIcon={<ArrowForward />}
          sx={{
            bgcolor: AMBER_500,
            '&:hover': { bgcolor: alpha(AMBER_500, 0.9) },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 2,
          }}
        >
          Set Up in Integrations
        </Button>
      </Card>
    );
  }

  const { tasks, task_stats, decisions, decision_stats, meeting_notes, meeting_count } = summary;
  const taskCompletionPercent = task_stats.total > 0 
    ? Math.round((task_stats.done / task_stats.total) * 100) 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <NotionIcon color="#fff" size={28} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Partnership Summary
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              {summary.workspace_name ? `Connected to ${summary.workspace_name}` : 'Synced from Notion'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh data">
            <IconButton onClick={fetchSummary} sx={{ color: SLATE_500 }}>
              <Refresh />
            </IconButton>
          </Tooltip>
          {summary.partnership_page_url && (
            <Button
              variant="outlined"
              size="small"
              href={summary.partnership_page_url}
              target="_blank"
              endIcon={<OpenInNew sx={{ fontSize: 16 }} />}
              sx={{
                borderColor: SLATE_200,
                color: SLATE_500,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: TEAL,
                  color: TEAL,
                },
              }}
            >
              Open in Notion
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Assignment />}
            label="Total Tasks"
            value={task_stats.total}
            color={BLUE_500}
            subtext={`${task_stats.done} completed`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Schedule />}
            label="In Progress"
            value={task_stats.in_progress}
            color={TEAL}
            subtext={task_stats.blocked > 0 ? `${task_stats.blocked} blocked` : undefined}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<Lightbulb />}
            label="Decisions"
            value={decision_stats.total}
            color={PURPLE_500}
            subtext={`${decision_stats.approved} approved`}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<EventNote />}
            label="Meetings"
            value={meeting_count}
            color={AMBER_500}
          />
        </Grid>
      </Grid>

      {/* Task Progress */}
      {task_stats.total > 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${SLATE_200}`,
            bgcolor: '#fff',
            p: 2.5,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Task Progress
            </Typography>
            <Typography variant="body2" sx={{ color: TEAL, fontWeight: 700 }}>
              {taskCompletionPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={taskCompletionPercent}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(TEAL, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: TEAL,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                <Box component="span" sx={{ color: SLATE_500, fontWeight: 600 }}>{task_stats.todo}</Box> To Do
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                <Box component="span" sx={{ color: BLUE_500, fontWeight: 600 }}>{task_stats.in_progress}</Box> In Progress
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                <Box component="span" sx={{ color: GREEN_500, fontWeight: 600 }}>{task_stats.done}</Box> Done
              </Typography>
              {task_stats.blocked > 0 && (
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  <Box component="span" sx={{ color: RED_500, fontWeight: 600 }}>{task_stats.blocked}</Box> Blocked
                </Typography>
              )}
            </Box>
          </Box>
        </Card>
      )}

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Tasks */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Recent Tasks"
            icon={<Assignment sx={{ fontSize: 18 }} />}
            emptyMessage="No tasks yet. Add some in Notion!"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(tasks || []).slice(0, 5).map((task, index) => (
                <TaskItem key={task.id || index} task={task} />
              ))}
            </Box>
          </SectionCard>
        </Grid>

        {/* Decisions */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title="Recent Decisions"
            icon={<Lightbulb sx={{ fontSize: 18 }} />}
            emptyMessage="No decisions logged yet."
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(decisions || []).slice(0, 5).map((decision, index) => (
                <DecisionItem key={decision.id || index} decision={decision} />
              ))}
            </Box>
          </SectionCard>
        </Grid>

        {/* Meeting Notes */}
        <Grid item xs={12}>
          <SectionCard
            title="Recent Meeting Notes"
            icon={<EventNote sx={{ fontSize: 18 }} />}
            emptyMessage="No meeting notes yet."
          >
            <Grid container spacing={1}>
              {(meeting_notes || []).slice(0, 4).map((meeting, index) => (
                <Grid item xs={12} sm={6} md={3} key={meeting.id || index}>
                  <MeetingItem meeting={meeting} />
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WorkspaceSummary;

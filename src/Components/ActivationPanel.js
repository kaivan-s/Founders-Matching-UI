import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
  Visibility,
  VisibilityOff,
  ArrowForward,
  Close,
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.founder-match.in/api';

const ActivationPanel = ({ variant = 'full', onDismiss }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activation, setActivation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const fetchActivation = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/activation/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setActivation(data);
      }
    } catch (error) {
      console.error('Error fetching activation:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchActivation();
  }, [fetchActivation]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleCtaClick = () => {
    const hint = activation?.next_milestone_hint;
    if (!hint) return;

    const milestone = activation?.next_milestone;
    const routes = {
      PROFILE_STARTED: '/profile',
      PROFILE_COMPLETE: '/profile',
      LINKEDIN_VERIFIED: '/profile',
      FIRST_PROJECT_CREATED: '/projects',
      FIRST_SWIPE: '/discovery',
      FIRST_MATCH: '/interested',
      FIRST_CALL_SCHEDULED: '/interested',
    };

    const route = routes[milestone] || '/profile';
    navigate(route);
  };

  if (loading || !activation || dismissed) return null;

  const { profile_completeness, visible_in_discovery, next_milestone, next_milestone_hint } = activation;
  const score = profile_completeness?.score || 0;
  const threshold = activation.discovery_visibility_threshold || 60;
  const isComplete = score >= threshold;

  if (variant === 'compact') {
    if (isComplete && !next_milestone_hint) return null;

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1,
          bgcolor: alpha(isComplete ? '#10b981' : '#f59e0b', 0.15),
          borderRadius: 2,
          border: '1px solid',
          borderColor: alpha(isComplete ? '#10b981' : '#f59e0b', 0.3),
        }}
      >
        {!isComplete ? (
          <>
            <VisibilityOff sx={{ fontSize: 18, color: '#f59e0b' }} />
            <Typography variant="body2" sx={{ flex: 1, color: '#f59e0b' }}>
              Profile {score}% complete - reach {threshold}% to appear in discovery
            </Typography>
            <Button
              size="small"
              onClick={() => navigate('/profile')}
              sx={{ 
                textTransform: 'none', 
                color: '#f59e0b',
                fontSize: '0.75rem',
              }}
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            >
              Complete
            </Button>
          </>
        ) : next_milestone_hint ? (
          <>
            <TrendingUp sx={{ fontSize: 18, color: '#6366f1' }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {next_milestone_hint.title}
            </Typography>
            <Button
              size="small"
              onClick={handleCtaClick}
              sx={{ 
                textTransform: 'none', 
                color: '#6366f1',
                fontSize: '0.75rem',
              }}
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
            >
              {next_milestone_hint.cta}
            </Button>
          </>
        ) : null}
        <IconButton size="small" onClick={handleDismiss} sx={{ ml: -0.5 }}>
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: '#1a1a2e',
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha('#6366f1', 0.2),
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TrendingUp sx={{ color: '#6366f1' }} />
          <Typography variant="h6" fontWeight={600}>
            Your Progress
          </Typography>
          <Chip
            size="small"
            label={`${activation.milestones_count}/${activation.milestones_total} milestones`}
            sx={{ 
              bgcolor: alpha('#6366f1', 0.2),
              color: '#a5b4fc',
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <IconButton size="small" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Profile Completeness
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={600} color={isComplete ? '#10b981' : '#f59e0b'}>
              {score}%
            </Typography>
            <Tooltip title={visible_in_discovery ? 'Visible in discovery' : `Reach ${threshold}% to appear in discovery`}>
              {visible_in_discovery ? (
                <Visibility sx={{ fontSize: 18, color: '#10b981' }} />
              ) : (
                <VisibilityOff sx={{ fontSize: 18, color: '#f59e0b' }} />
              )}
            </Tooltip>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: alpha('#6366f1', 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: isComplete ? '#10b981' : '#f59e0b',
            },
          }}
        />
        {!isComplete && profile_completeness?.missing?.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Missing: {profile_completeness.missing.slice(0, 3).join(', ')}
            {profile_completeness.missing.length > 3 && ` +${profile_completeness.missing.length - 3} more`}
          </Typography>
        )}
      </Box>

      {next_milestone_hint && (
        <Box
          sx={{
            p: 2,
            bgcolor: alpha('#6366f1', 0.1),
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha('#6366f1', 0.2),
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Next Step: {next_milestone_hint.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {next_milestone_hint.reason}
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={handleCtaClick}
            sx={{
              textTransform: 'none',
              bgcolor: '#6366f1',
              '&:hover': { bgcolor: '#5558dd' },
            }}
          >
            {next_milestone_hint.cta}
          </Button>
        </Box>
      )}

      <Collapse in={expanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Milestones
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activation.milestones_reached?.map((m) => (
              <Box key={m.milestone} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                <Typography variant="body2">
                  {m.milestone.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              </Box>
            ))}
            {next_milestone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: 0.5 }}>
                <RadioButtonUnchecked sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  {next_milestone.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ActivationPanel;

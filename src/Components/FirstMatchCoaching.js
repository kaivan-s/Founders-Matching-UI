import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import {
  Close,
  Celebration,
  Lightbulb,
  ArrowForward,
  Chat,
  VideoCall,
  Timer,
} from '@mui/icons-material';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.founder-match.in/api';

// Teal accent color (used across app for CTAs)
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';

const FirstMatchCoaching = ({ matchId, open, onClose, onStartFounderDate, onOpenChat }) => {
  const { user } = useUser();
  const [coaching, setCoaching] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoaching = useCallback(async () => {
    if (!user?.id || !matchId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/activation/first-match-coaching/${matchId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setCoaching(data);
      }
    } catch (error) {
      console.error('Error fetching coaching:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, matchId]);

  useEffect(() => {
    if (open && matchId) {
      fetchCoaching();
    }
  }, [open, matchId, fetchCoaching]);

  const formatDeadline = (isoDate) => {
    if (!isoDate) return null;
    const date = new Date(isoDate);
    const now = new Date();
    const diff = date - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days <= 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days left`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 3, 
          overflow: 'visible',
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 60,
          height: 60,
          borderRadius: '50%',
          bgcolor: TEAL,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 20px ${alpha(TEAL, 0.4)}`,
        }}
      >
        <Celebration sx={{ fontSize: 28, color: 'white' }} />
      </Box>

      <DialogTitle sx={{ pt: 5, pb: 1, textAlign: 'center' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          You have a match!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Here's how to make it count
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        {coaching?.first_call_deadline && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 1.5,
              mb: 3,
              bgcolor: alpha(TEAL, 0.08),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(TEAL, 0.2),
            }}
          >
            <Timer sx={{ color: TEAL, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: TEAL }}>
              Schedule your first call: {formatDeadline(coaching.first_call_deadline)}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Chat sx={{ color: TEAL, fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Start the Conversation
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Try one of these openers:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {coaching?.first_message_questions?.map((q, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.5,
                  bgcolor: alpha(TEAL, 0.05),
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha(TEAL, 0.15),
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: alpha(TEAL, 0.1),
                    borderColor: alpha(TEAL, 0.3),
                    transform: 'translateX(4px)',
                  },
                }}
                onClick={() => {
                  navigator.clipboard?.writeText(q);
                }}
              >
                <Typography variant="body2" color="text.primary">"{q}"</Typography>
                <Typography variant="caption" color="text.secondary">
                  Click to copy
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {coaching?.founder_date_cta && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <VideoCall sx={{ color: TEAL, fontSize: 20 }} />
              <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                {coaching.founder_date_cta.label}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {coaching.founder_date_cta.description}
            </Typography>
            {onStartFounderDate && (
              <Button
                variant="outlined"
                size="small"
                onClick={onStartFounderDate}
                endIcon={<ArrowForward />}
                sx={{
                  borderColor: TEAL,
                  color: TEAL,
                  '&:hover': { borderColor: TEAL_LIGHT, bgcolor: alpha(TEAL, 0.05) },
                }}
              >
                Start Founder Date
              </Button>
            )}
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Lightbulb sx={{ color: TEAL, fontSize: 20 }} />
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Pro Tips
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {coaching?.tips?.map((tip, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Chip
                  size="small"
                  label={i + 1}
                  sx={{
                    minWidth: 24,
                    height: 24,
                    bgcolor: alpha(TEAL, 0.1),
                    color: TEAL,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {tip}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ color: 'text.secondary' }}
          >
            Got it
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={onOpenChat}
            endIcon={<Chat />}
            sx={{
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
            }}
          >
            Open Chat
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FirstMatchCoaching;

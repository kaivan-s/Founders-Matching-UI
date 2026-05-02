import React, { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Avatar,
  Paper,
  CircularProgress,
  IconButton,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Close,
  CalendarMonth,
  Schedule,
  AttachMoney,
  Info,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';

/**
 * BookingDialog
 *
 * Founder-side dialog for booking a pay-per-consultation call with an advisor.
 *
 * Props:
 *   - open       : boolean
 *   - advisor    : advisor profile object (must include user_id, user.name,
 *                  consultation_rate_30min_usd, consultation_rate_60min_usd)
 *   - onClose()  : closes the dialog
 *   - onSuccess(consultation) : called when booking is successfully created
 */
const BookingDialog = ({ open, advisor, onClose, onSuccess }) => {
  const { user } = useUser();
  const [duration, setDuration] = useState(30);
  const [proposedTime, setProposedTime] = useState('');
  const [topic, setTopic] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Compute a sensible "min" datetime-local value (now + 1 hour)
  const minDatetime = useMemo(() => {
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  // Reset state when dialog opens for a new advisor
  useEffect(() => {
    if (open) {
      setError(null);
      setSubmitting(false);
      setTopic('');
      setProposedTime('');
      // Default to whichever duration the advisor has a rate for
      const has30 = advisor?.consultation_rate_30min_usd != null && advisor?.consultation_rate_30min_usd !== '';
      const has60 = advisor?.consultation_rate_60min_usd != null && advisor?.consultation_rate_60min_usd !== '';
      setDuration(has30 ? 30 : has60 ? 60 : 30);
    }
  }, [open, advisor]);

  // Early return AFTER all hooks
  if (!advisor) return null;

  const advisorName = advisor.user?.name || 'Advisor';
  const rate30 = advisor.consultation_rate_30min_usd;
  const rate60 = advisor.consultation_rate_60min_usd;
  const has30 = rate30 != null && rate30 !== '';
  const has60 = rate60 != null && rate60 !== '';
  const selectedRate = duration === 30 ? rate30 : rate60;

  const handleSubmit = async () => {
    setError(null);

    if (!user?.id) {
      setError('You must be signed in to book a consultation.');
      return;
    }
    if (selectedRate == null || selectedRate === '') {
      setError(`This advisor doesn't offer ${duration}-minute consultations.`);
      return;
    }

    setSubmitting(true);
    try {
      const proposedTimeIso = proposedTime
        ? new Date(proposedTime).toISOString()
        : null;

      const response = await fetch(`${API_BASE}/advisors/${advisor.user_id}/consultations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          duration_min: duration,
          proposed_time_iso: proposedTimeIso,
          timezone: tz,
          topic: topic.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data?.upgrade_required) {
          setError('Booking advisors requires a Pro+ subscription. Upgrade in the Pricing page to continue.');
        } else {
          setError(data?.error || 'Failed to create booking');
        }
        setSubmitting(false);
        return;
      }

      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Book a consultation
          </Typography>
          <IconButton onClick={onClose} disabled={submitting} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {/* Advisor summary */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontWeight: 600 }}>
            {advisorName[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {advisorName}
            </Typography>
            {advisor.headline && (
              <Typography variant="body2" color="text.secondary" sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
              }}>
                {advisor.headline}
              </Typography>
            )}
          </Box>
        </Paper>

        {/* Duration selector */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Call length
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          value={duration}
          onChange={(_, val) => val && setDuration(val)}
          sx={{ mb: 3 }}
        >
          <ToggleButton value={30} disabled={!has30} sx={{ textTransform: 'none', flex: 1, py: 1.5 }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>30 minutes</Typography>
              <Typography variant="caption" color="text.secondary">
                {has30 ? `$${Number(rate30).toFixed(0)}` : 'Not offered'}
              </Typography>
            </Box>
          </ToggleButton>
          <ToggleButton value={60} disabled={!has60} sx={{ textTransform: 'none', flex: 1, py: 1.5 }}>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>60 minutes</Typography>
              <Typography variant="caption" color="text.secondary">
                {has60 ? `$${Number(rate60).toFixed(0)}` : 'Not offered'}
              </Typography>
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Proposed time */}
        <TextField
          fullWidth
          type="datetime-local"
          label="Proposed time (in your timezone)"
          InputLabelProps={{ shrink: true }}
          value={proposedTime}
          onChange={(e) => setProposedTime(e.target.value)}
          inputProps={{ min: minDatetime }}
          helperText={`Your timezone: ${tz}. The advisor will confirm or suggest a different time.`}
          sx={{ mb: 3 }}
        />

        {/* Topic */}
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          label="What do you want to discuss? (optional)"
          placeholder="e.g. Should I raise on a SAFE or priced round? My target is $500K to extend runway 18 months."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          inputProps={{ maxLength: 1000 }}
          helperText={`${topic.length}/1000 — helps the advisor prepare`}
          sx={{ mb: 3 }}
        />

        {/* Price summary */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachMoney fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                You'll pay the advisor
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              ${Number(selectedRate || 0).toFixed(0)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <Info sx={{ fontSize: 14, color: 'text.secondary', mt: 0.4 }} />
            <Typography variant="caption" color="text.secondary">
              Payment is sent <strong>directly to the advisor</strong> via UPI, PayPal, or Razorpay link
              after they accept your request. Guild Space does not process this payment.
            </Typography>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || (!has30 && !has60)}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CalendarMonth />}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
        >
          {submitting ? 'Sending request…' : 'Send booking request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;

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
  InfoOutlined,
  AccessTime,
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
 *   - advisor    : advisor profile object (must include user_id, name,
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
  const [calcomStatus, setCalcomStatus] = useState({ has_calcom: false, booking_url: null, preferred_payment: null });
  const [loadingCalcom, setLoadingCalcom] = useState(false);
  const [calBookingClicked, setCalBookingClicked] = useState(false);

  const tz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // Compute a sensible "min" datetime-local value (now + 1 hour)
  const minDatetime = useMemo(() => {
    const now = new Date(Date.now() + 60 * 60 * 1000);
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }, []);

  // Reset state and check cal.com when dialog opens
  useEffect(() => {
    if (open && advisor?.user_id) {
      setError(null);
      setSubmitting(false);
      setTopic('');
      setProposedTime('');
      setCalBookingClicked(false);
      // Default to whichever duration the advisor has a rate for
      const has30 = advisor?.consultation_rate_30min_usd != null && advisor?.consultation_rate_30min_usd !== '';
      const has60 = advisor?.consultation_rate_60min_usd != null && advisor?.consultation_rate_60min_usd !== '';
      setDuration(has30 ? 30 : has60 ? 60 : 30);
      
      // Check if advisor has cal.com connected and get payment info
      setLoadingCalcom(true);
      fetch(`${API_BASE}/advisors/${advisor.user_id}/booking-link`)
        .then(r => r.ok ? r.json() : { has_calcom: false, preferred_payment: null })
        .then(data => setCalcomStatus(data))
        .catch(() => setCalcomStatus({ has_calcom: false, preferred_payment: null }))
        .finally(() => setLoadingCalcom(false));
    }
  }, [open, advisor]);

  // Early return AFTER all hooks
  if (!advisor) return null;

  const advisorName = advisor.name || 'Advisor';
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
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          mx: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
          maxHeight: { xs: '90vh', sm: '85vh' },
        }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Book a consultation
          </Typography>
          <IconButton onClick={onClose} disabled={submitting} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
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

        {/* Cal.com booking option */}
        {loadingCalcom ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : calcomStatus.has_calcom && calcomStatus.booking_url ? (
          <Box>
            <Alert 
              severity="success" 
              sx={{ mb: 3, borderRadius: 2 }}
              icon={
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: 0.5, 
                  bgcolor: '#292929', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                }}>
                  cal
                </Box>
              }
            >
              <Typography variant="body2">
                <strong>Calendar connected!</strong> Book directly into {advisorName}'s calendar with automatic availability.
              </Typography>
            </Alert>

            {/* Pricing info */}
            <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Consultation rates</Typography>
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, mb: 2, flexWrap: 'wrap' }}>
                {has30 && (
                  <Chip 
                    icon={<Schedule sx={{ fontSize: 16 }} />}
                    label={`30 min · $${Number(rate30).toFixed(0)}`}
                    sx={{ fontWeight: 500 }}
                  />
                )}
                {has60 && (
                  <Chip 
                    icon={<Schedule sx={{ fontSize: 16 }} />}
                    label={`60 min · $${Number(rate60).toFixed(0)}`}
                    sx={{ fontWeight: 500 }}
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Pay the advisor directly{calcomStatus.preferred_payment ? ` via ${calcomStatus.preferred_payment}` : ''} after booking. No platform fees.
              </Typography>
            </Paper>

            {!calBookingClicked ? (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  href={calcomStatus.booking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setCalBookingClicked(true)}
                  startIcon={<CalendarMonth />}
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 600, 
                    borderRadius: 2,
                    py: 1.5,
                    bgcolor: '#292929',
                    '&:hover': { bgcolor: '#000' },
                  }}
                >
                  Book on cal.com
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
                  You'll be redirected to cal.com to select a time slot
                </Typography>
              </>
            ) : (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2.5, 
                  borderRadius: 2, 
                  bgcolor: 'rgba(16, 185, 129, 0.04)',
                  borderColor: 'success.main',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <InfoOutlined sx={{ color: 'success.main', fontSize: 20, mt: 0.25 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark', mb: 0.5 }}>
                      Did you complete the booking?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Once your booking is confirmed on cal.com, {advisorName} will reach out to coordinate payment and share the meeting link.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={onClose}
                        fullWidth={false}
                        sx={{ 
                          textTransform: 'none', 
                          fontWeight: 600,
                          bgcolor: 'success.main',
                          '&:hover': { bgcolor: 'success.dark' },
                          width: { xs: '100%', sm: 'auto' },
                        }}
                      >
                        Yes, I booked
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        href={calcomStatus.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', fontWeight: 500, width: { xs: '100%', sm: 'auto' } }}
                      >
                        Open cal.com again
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            )}
          </Box>
        ) : (
          <>
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
                    You'll pay the advisor directly
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ${Number(selectedRate || 0).toFixed(0)}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Payment is sent <strong>directly to the advisor</strong>
                {calcomStatus.preferred_payment ? ` via ${calcomStatus.preferred_payment}` : ' via UPI, PayPal, or their preferred method'} after they accept your request. No platform fees.
              </Typography>
            </Paper>

            {/* Expected response time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, px: 0.5 }}>
              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Advisors typically respond within 24-48 hours
              </Typography>
            </Box>
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        p: { xs: 1.5, sm: 2 },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        '& > button': { width: { xs: '100%', sm: 'auto' } }
      }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none', order: { xs: 2, sm: 1 } }}>
          Cancel
        </Button>
        {(!calcomStatus.has_calcom || !calcomStatus.booking_url) && !loadingCalcom && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || (!has30 && !has60)}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CalendarMonth />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, order: { xs: 1, sm: 2 } }}
          >
            {submitting ? 'Sending request…' : 'Send booking request'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;

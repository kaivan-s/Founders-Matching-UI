import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  MenuItem,
  Tooltip,
  Paper,
  Divider,
  alpha,
} from '@mui/material';
import {
  Schedule,
  CheckCircle,
  Cancel,
  Payment,
  HourglassEmpty,
  VideoCall,
  ContentCopy,
  Close,
  Refresh,
  Person,
  AttachMoney,
  CalendarMonth,
  ChatBubbleOutline,
  Star,
  StarBorder,
  StarOutline,
} from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';

// Status → display config (label, color, icon)
const STATUS_META = {
  pending_advisor_confirmation: { label: 'Awaiting advisor', color: 'warning', icon: HourglassEmpty },
  pending_payment: { label: 'Payment due', color: 'info', icon: Payment },
  pending_payment_confirmation: { label: 'Payment marked sent', color: 'info', icon: Payment },
  confirmed: { label: 'Confirmed', color: 'success', icon: CheckCircle },
  completed: { label: 'Completed', color: 'success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'default', icon: Cancel },
  declined: { label: 'Declined', color: 'error', icon: Cancel },
  no_show: { label: 'No show', color: 'error', icon: Cancel },
  refund_requested: { label: 'Refund requested', color: 'warning', icon: HourglassEmpty },
};

const formatDateTime = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const ConsultationsPage = () => {
  const { user } = useUser();
  const [tab, setTab] = useState(0); // 0=founder, 1=advisor
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [paymentModal, setPaymentModal] = useState(null);   // for founder marking payment sent
  const [reviewModal, setReviewModal] = useState(null);     // post-call review
  const [refundModal, setRefundModal] = useState(null);     // refund request

  const role = tab === 0 ? 'founder' : 'advisor';

  const fetchConsultations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/consultations?role=${role}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load consultations');
      }
      setConsultations(await res.json());
    } catch (err) {
      setError(err.message);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  // -------------------------------------------------------------------------
  // Action helpers — call API + refresh
  // -------------------------------------------------------------------------
  const callAction = async (consultationId, path, body = null, onErrorMsg) => {
    try {
      const res = await fetch(`${API_BASE}/consultations/${consultationId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Clerk-User-Id': user.id },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || onErrorMsg || 'Action failed');
      await fetchConsultations();
      return data;
    } catch (err) {
      alert(`Error: ${err.message}`);
      return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Consultations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your booked advisor calls and incoming requests
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} onClick={fetchConsultations} sx={{ textTransform: 'none' }}>
          Refresh
        </Button>
      </Box>

      <Paper variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="primary" textColor="primary">
          <Tab label="As Founder" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="As Advisor" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : consultations.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, borderRadius: 2, textAlign: 'center' }}>
          <CalendarMonth sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {role === 'founder'
              ? "You haven't booked any consultations yet."
              : "You haven't received any consultation requests yet."}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {role === 'founder'
              ? 'Browse advisors from any of your workspaces to book your first consultation.'
              : 'Once founders book consultations with you, they will appear here.'}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {consultations.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              role={role}
              onAccept={() => callAction(c.id, 'accept', {}, 'Failed to accept')}
              onDecline={() => {
                const reason = window.prompt('Reason (optional)') || undefined;
                callAction(c.id, 'decline', { reason });
              }}
              onCancel={() => {
                if (!window.confirm('Cancel this consultation?')) return;
                callAction(c.id, 'cancel', {});
              }}
              onPaymentSent={() => setPaymentModal(c)}
              onConfirmPayment={() => {
                if (!window.confirm('Confirm you have received the payment?')) return;
                callAction(c.id, 'payment-received', {});
              }}
              onComplete={() => {
                if (!window.confirm('Mark this consultation as completed?')) return;
                callAction(c.id, 'complete', {});
              }}
              onReview={() => setReviewModal(c)}
              onRefund={() => setRefundModal(c)}
            />
          ))}
        </Box>
      )}

      {/* Modals */}
      <PaymentSentModal
        consultation={paymentModal}
        onClose={() => setPaymentModal(null)}
        onSubmitted={async (paymentMethod, paymentReference) => {
          const result = await callAction(
            paymentModal.id,
            'payment-sent',
            { payment_method: paymentMethod, payment_reference: paymentReference || null },
          );
          if (result) setPaymentModal(null);
        }}
      />
      <RefundRequestModal
        consultation={refundModal}
        onClose={() => setRefundModal(null)}
        onSubmitted={async (reason) => {
          const result = await callAction(refundModal.id, 'refund-request', { reason });
          if (result) setRefundModal(null);
        }}
      />
      <ReviewModal
        consultation={reviewModal}
        role={role}
        userId={user?.id}
        onClose={() => setReviewModal(null)}
        onSubmitted={async () => {
          setReviewModal(null);
          await fetchConsultations();
        }}
      />
    </Container>
  );
};

// ---------------------------------------------------------------------------
// Consultation card
// ---------------------------------------------------------------------------

const ConsultationCard = ({
  consultation,
  role,
  onAccept,
  onDecline,
  onCancel,
  onPaymentSent,
  onConfirmPayment,
  onComplete,
  onReview,
  onRefund,
}) => {
  const meta = STATUS_META[consultation.status] || STATUS_META.cancelled;
  const Icon = meta.icon;

  const counterparty = role === 'founder' ? consultation.advisor : consultation.founder;
  const counterpartyName = counterparty?.name || (role === 'founder' ? 'Advisor' : 'Founder');

  // Action button matrix per (status, role)
  const renderActions = () => {
    const s = consultation.status;
    const isFounder = role === 'founder';
    const isAdvisor = role === 'advisor';

    if (s === 'pending_advisor_confirmation') {
      if (isAdvisor) {
        return (
          <>
            <Button variant="contained" size="small" onClick={onAccept} sx={{ textTransform: 'none' }}>
              Accept
            </Button>
            <Button variant="outlined" size="small" color="error" onClick={onDecline} sx={{ textTransform: 'none' }}>
              Decline
            </Button>
          </>
        );
      }
      return (
        <Button variant="outlined" size="small" color="error" onClick={onCancel} sx={{ textTransform: 'none' }}>
          Cancel request
        </Button>
      );
    }

    if (s === 'pending_payment') {
      if (isFounder) {
        return (
          <>
            <Button variant="contained" size="small" startIcon={<Payment />} onClick={onPaymentSent} sx={{ textTransform: 'none' }}>
              I've sent payment
            </Button>
            <Button variant="text" size="small" color="error" onClick={onCancel} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
          </>
        );
      }
      return (
        <Chip label="Awaiting founder payment" size="small" color="info" variant="outlined" />
      );
    }

    if (s === 'pending_payment_confirmation') {
      if (isAdvisor) {
        return (
          <>
            <Button variant="contained" size="small" color="success" startIcon={<CheckCircle />} onClick={onConfirmPayment} sx={{ textTransform: 'none' }}>
              Confirm receipt
            </Button>
            <Tooltip title="The founder claims they sent payment. Verify in your bank/UPI app, then confirm here.">
              <IconButton size="small"><Schedule fontSize="small" /></IconButton>
            </Tooltip>
          </>
        );
      }
      return <Chip label="Waiting for advisor to confirm" size="small" color="info" variant="outlined" />;
    }

    if (s === 'confirmed') {
      return (
        <>
          {consultation.video_room_url && (
            <Button
              variant="contained"
              size="small"
              color="success"
              startIcon={<VideoCall />}
              href={consultation.video_room_url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: 'none' }}
            >
              Join call
            </Button>
          )}
          <Button variant="outlined" size="small" onClick={onComplete} sx={{ textTransform: 'none' }}>
            Mark completed
          </Button>
        </>
      );
    }

    if (s === 'completed') {
      return (
        <>
          <Button variant="outlined" size="small" startIcon={<ChatBubbleOutline />} onClick={onReview} sx={{ textTransform: 'none' }}>
            Leave review
          </Button>
          {isFounder && (
            <Button variant="text" size="small" color="warning" onClick={onRefund} sx={{ textTransform: 'none' }}>
              Request refund
            </Button>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 600 }}>
            {counterpartyName[0]?.toUpperCase()}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {counterpartyName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {role === 'founder' ? 'Advisor' : 'Founder'}
                </Typography>
              </Box>
              <Chip
                icon={<Icon sx={{ fontSize: 14 }} />}
                label={meta.label}
                color={meta.color}
                size="small"
                sx={{ height: 24, fontWeight: 500 }}
              />
            </Box>

            {/* Details row */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Schedule sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {consultation.duration_min} min
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  ${Number(consultation.amount_usd).toFixed(0)}
                </Typography>
              </Box>
              {consultation.scheduled_at && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(consultation.scheduled_at)}
                  </Typography>
                </Box>
              )}
            </Box>

            {consultation.topic && (
              <Box sx={{ mb: 1.5, p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  TOPIC
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {consultation.topic}
                </Typography>
              </Box>
            )}

            {/* Payment audit info (visible once payment marked sent) */}
            {(consultation.payment_method || consultation.payment_reference) && (
              <Box sx={{ mb: 1.5, p: 1.25, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                  PAYMENT
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Method: <strong>{consultation.payment_method || '—'}</strong>
                  {consultation.payment_reference && (
                    <> · Ref: <strong>{consultation.payment_reference}</strong></>
                  )}
                </Typography>
              </Box>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {renderActions()}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'razorpay_link', label: 'Razorpay link' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
];

const PaymentSentModal = ({ consultation, onClose, onSubmitted }) => {
  const [method, setMethod] = useState('upi');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (consultation) {
      setMethod('upi');
      setReference('');
      setSubmitting(false);
    }
  }, [consultation]);

  if (!consultation) return null;

  // Show advisor payment methods (loaded with consultation if backend joined them)
  const advisorPayMethods = consultation.advisor?.payment_methods || {};

  const copy = (val) => {
    if (!val) return;
    try {
      navigator.clipboard.writeText(val);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!method) return;
    setSubmitting(true);
    await onSubmitted(method, reference);
    setSubmitting(false);
  };

  return (
    <Dialog open={!!consultation} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Send payment to {consultation.advisor?.name || 'advisor'}</Typography>
          <IconButton onClick={onClose} size="small" disabled={submitting}><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Send <strong>${Number(consultation.amount_usd).toFixed(0)}</strong> to the advisor using one of the methods below,
          then mark it as sent. The advisor will confirm receipt to lock in the call.
        </Alert>

        {/* Advisor payment options */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Advisor's payment methods</Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          {Object.entries({
            'UPI ID': advisorPayMethods.upi_id,
            'PayPal': advisorPayMethods.paypal_url,
            'Razorpay': advisorPayMethods.razorpay_link,
            'Bank': advisorPayMethods.bank_details,
          }).filter(([, v]) => !!v).map(([label, val]) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  {label}
                </Typography>
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {val}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => copy(val)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          ))}
          {Object.values(advisorPayMethods).filter(Boolean).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              The advisor hasn't added payment methods yet. Contact them to coordinate payment.
            </Typography>
          )}
        </Paper>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Confirm what you sent</Typography>
        <TextField
          select
          fullWidth
          label="Method used"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          sx={{ mb: 2 }}
        >
          {PAYMENT_METHODS.map(m => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </TextField>
        <TextField
          fullWidth
          label="Transaction reference (optional, helps with disputes)"
          placeholder="e.g. UPI ref 1234567890 or PayPal txn ID"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          inputProps={{ maxLength: 200 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Payment />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {submitting ? 'Marking…' : 'Mark as sent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RefundRequestModal = ({ consultation, onClose, onSubmitted }) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (consultation) { setReason(''); setSubmitting(false); }
  }, [consultation]);

  if (!consultation) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmitted(reason);
    setSubmitting(false);
  };

  return (
    <Dialog open={!!consultation} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Request a refund</Typography>
          <IconButton onClick={onClose} size="small" disabled={submitting}><Close /></IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          Payment was sent <strong>directly</strong> to the advisor — Guild Space cannot return it.
          Submitting this flags the consultation; please coordinate the refund with the advisor directly.
        </Alert>
        <TextField
          fullWidth
          multiline
          minRows={3}
          maxRows={6}
          label="Reason"
          placeholder="What happened?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: 1000 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={handleSubmit}
          disabled={submitting || !reason.trim()}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {submitting ? 'Submitting…' : 'Submit refund request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ReviewModal = ({ consultation, role, userId, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [canReview, setCanReview] = useState(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  useEffect(() => {
    if (consultation) {
      setRating(0);
      setReviewText('');
      setIsPublic(true);
      setSubmitting(false);
      setError(null);
      setCanReview(null);
      setCheckingEligibility(true);
      
      fetch(`${API_BASE}/consultations/${consultation.id}/can-review`, {
        headers: { 'X-Clerk-User-Id': userId },
      })
        .then(res => res.json())
        .then(data => {
          setCanReview(data);
          setCheckingEligibility(false);
        })
        .catch(() => {
          setCanReview({ can_review: false, reason: 'Could not check eligibility' });
          setCheckingEligibility(false);
        });
    }
  }, [consultation, userId]);

  if (!consultation) return null;

  const counterparty = role === 'founder' ? consultation.advisor : consultation.founder;
  const counterpartyName = counterparty?.name || (role === 'founder' ? 'Advisor' : 'Founder');

  const handleSubmit = async () => {
    if (rating < 1) {
      setError('Please select a rating');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/consultations/${consultation.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': userId,
        },
        body: JSON.stringify({
          rating,
          review_text: reviewText.trim() || null,
          is_public: isPublic,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to submit review');
      }
      await onSubmitted();
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const alreadyReviewed = canReview?.already_reviewed;

  return (
    <Dialog
      open={!!consultation}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {alreadyReviewed ? 'Already reviewed' : `Review ${counterpartyName}`}
          </Typography>
          <IconButton onClick={onClose} size="small" disabled={submitting}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {checkingEligibility ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : alreadyReviewed ? (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            You have already reviewed this consultation.
          </Alert>
        ) : !canReview?.can_review ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {canReview?.reason || 'You cannot review this consultation.'}
          </Alert>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Avatar
                  src={counterparty?.profile_picture_url}
                  sx={{ width: 48, height: 48 }}
                >
                  {counterpartyName?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {counterpartyName}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                How was your consultation?
              </Typography>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue || 0)}
                size="large"
                sx={{
                  '& .MuiRating-iconFilled': { color: '#FFD700' },
                  '& .MuiRating-iconEmpty': { color: 'grey.300' },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {rating === 0 && 'Select a rating'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={3}
              maxRows={6}
              label="Review (optional)"
              placeholder={
                role === 'founder'
                  ? 'Share your experience working with this advisor...'
                  : 'Share your experience working with this founder...'
              }
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              inputProps={{ maxLength: 2000 }}
              sx={{ mb: 2 }}
            />

            {role === 'founder' && (
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Show on advisor's public profile
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Public reviews help other founders choose advisors
                  </Typography>
                </Box>
                <Chip
                  label={isPublic ? 'Public' : 'Private'}
                  color={isPublic ? 'success' : 'default'}
                  size="small"
                  onClick={() => setIsPublic(!isPublic)}
                  sx={{ cursor: 'pointer', fontWeight: 500 }}
                />
              </Paper>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>
          {alreadyReviewed || !canReview?.can_review ? 'Close' : 'Cancel'}
        </Button>
        {canReview?.can_review && !alreadyReviewed && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Star />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ConsultationsPage;

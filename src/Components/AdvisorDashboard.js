import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  alpha,
  LinearProgress,
} from '@mui/material';
import { API_BASE } from '../config/api';
import {
  Business,
  People,
  CheckCircle,
  Schedule,
  TrendingUp,
  Message,
  Assignment,
  Visibility,
  Close,
  Notifications,
  CheckCircleOutline,
  Circle,
  Edit,
  Pending,
  Cancel,
  Link as LinkIcon,
  Payment,
  ArrowForward,
  WorkspacesOutlined,
  GroupsOutlined,
  TaskAlt,
  AccessTime,
  LinkedIn,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';

// Clean, minimal request details dialog
const RequestDetailsDialog = ({ open, onClose, request, onRespond }) => {
  const [tabValue, setTabValue] = useState(0);
  const workspace = request?.workspace || {};
  const details = request?.workspace_details || {};
  const kpis = details.kpis || {};
  const decisions = details.decisions || {};
  const participants = details.participants || {};
  const projects = details.projects || [];
  const advisorEquityPercent = details?.advisor_equity_percent;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              width: 48, 
              height: 48, 
              bgcolor: alpha('#0ea5e9', 0.1),
              color: '#0ea5e9',
              fontWeight: 600,
            }}>
              {workspace.title?.[0] || 'W'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a' }}>
                {workspace.title || 'Workspace Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Requested by {request?.founder?.name || 'Founder'}
              </Typography>
              {advisorEquityPercent !== undefined && advisorEquityPercent !== null && (
                <Chip
                  icon={<TrendingUp sx={{ fontSize: 16 }} />}
                  label={`${advisorEquityPercent}% equity offered`}
                  size="small"
                  sx={{
                    mt: 1,
                    alignSelf: 'flex-start',
                    bgcolor: alpha('#14b8a6', 0.12),
                    color: '#0d9488',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                  }}
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              minHeight: 48,
            },
          }}
        >
          <Tab label={`Projects (${projects.length || 0})`} />
          <Tab label={`KPIs (${kpis.total || 0})`} />
          <Tab label={`Decisions (${decisions.total || 0})`} />
          <Tab label={`Founders (${participants.total || 0})`} />
        </Tabs>
      </Box>

      <DialogContent sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {/* Projects Tab */}
        {tabValue === 0 && (
          <Box>
            {projects.length > 0 ? (
              projects.map((project, idx) => (
                <Paper key={idx} elevation={0} sx={{ 
                  p: 2.5, 
                  mb: 2, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 2,
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Business sx={{ color: '#0ea5e9', fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                      {project.title || 'Untitled Project'}
                    </Typography>
                    {project.stage && (
                      <Chip 
                        label={project.stage} 
                        size="small" 
                        sx={{ 
                          ml: 'auto',
                          bgcolor: alpha('#0ea5e9', 0.1),
                          color: '#0ea5e9',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {project.description || 'No description provided'}
                  </Typography>
                </Paper>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Business sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">No project information available</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* KPIs Tab */}
        {tabValue === 1 && (
          <Box>
            {kpis.total > 0 ? (
              <>
                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                  {kpis.done > 0 && (
                    <Chip 
                      label={`${kpis.done} Done`} 
                      size="small" 
                      sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', fontWeight: 500 }}
                    />
                  )}
                  {kpis.in_progress > 0 && (
                    <Chip 
                      label={`${kpis.in_progress} In Progress`} 
                      size="small"
                      sx={{ bgcolor: alpha('#0ea5e9', 0.1), color: '#0ea5e9', fontWeight: 500 }}
                    />
                  )}
                  {kpis.not_started > 0 && (
                    <Chip 
                      label={`${kpis.not_started} Not Started`} 
                      size="small"
                      sx={{ bgcolor: alpha('#64748b', 0.1), color: '#64748b', fontWeight: 500 }}
                    />
                  )}
                </Box>
                {kpis.all?.map((kpi, idx) => (
                  <Paper key={idx} elevation={0} sx={{ 
                    p: 2, 
                    mb: 1.5, 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>{kpi.label}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={kpi.status.replace('_', ' ')} 
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem',
                          bgcolor: kpi.status === 'done' ? alpha('#10b981', 0.1) : 
                                   kpi.status === 'in_progress' ? alpha('#0ea5e9', 0.1) : alpha('#64748b', 0.1),
                          color: kpi.status === 'done' ? '#10b981' : 
                                 kpi.status === 'in_progress' ? '#0ea5e9' : '#64748b',
                        }}
                      />
                      {kpi.target_date && (
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(kpi.target_date).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                ))}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <TrendingUp sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">No KPIs defined yet</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Decisions Tab */}
        {tabValue === 2 && (
          <Box>
            {decisions.total > 0 ? (
              decisions.all?.map((decision, idx) => (
                <Paper key={idx} elevation={0} sx={{ 
                  p: 2, 
                  mb: 1.5, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 2,
                }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>{decision.content}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {decision.tag && (
                      <Chip label={decision.tag} size="small" sx={{ fontSize: '0.7rem' }} />
                    )}
                    {decision.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(decision.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </Paper>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <Assignment sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">No decisions recorded yet</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Founders Tab */}
        {tabValue === 3 && (
          <Box>
            {participants.total > 0 ? (
              participants.founders?.map((founder, idx) => (
                <Paper key={idx} elevation={0} sx={{ 
                  p: 2, 
                  mb: 1.5, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}>
                  <Avatar sx={{ bgcolor: alpha('#14b8a6', 0.1), color: '#14b8a6' }}>
                    {founder.name?.[0] || 'F'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{founder.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Founder</Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                <People sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                <Typography variant="body2">No founders listed</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
          Close
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => { onRespond(request.id, 'decline'); onClose(); }}
          sx={{ borderRadius: 2 }}
        >
          Decline
        </Button>
        <Button
          variant="contained"
          onClick={() => { onRespond(request.id, 'accept'); onClose(); }}
          sx={{
            borderRadius: 2,
            bgcolor: '#14b8a6',
            '&:hover': { bgcolor: '#0d9488' },
          }}
        >
          Accept Request
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Minimal request card
const RequestCard = ({ request, onRespond }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const workspace = request.workspace || {};
  const details = request.workspace_details || {};

  return (
    <>
      <Paper 
        elevation={0}
        sx={{ 
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          mb: 2,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: '#0ea5e9',
            boxShadow: `0 4px 12px ${alpha('#0ea5e9', 0.1)}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ 
            width: 52, 
            height: 52, 
            bgcolor: alpha('#0ea5e9', 0.1),
            color: '#0ea5e9',
            fontWeight: 600,
          }}>
            {workspace.title?.[0] || 'W'}
          </Avatar>
          
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
              {workspace.title || 'Workspace'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              From {request.founder?.name || 'Founder'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {workspace.stage && (
                <Chip 
                  label={workspace.stage} 
                  size="small"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 24,
                    bgcolor: alpha('#64748b', 0.1),
                    color: '#64748b',
                  }}
                />
              )}
              {details.kpis?.total > 0 && (
                <Chip 
                  label={`${details.kpis.total} KPIs`}
                  size="small"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 24,
                    bgcolor: alpha('#0ea5e9', 0.1),
                    color: '#0ea5e9',
                  }}
                />
              )}
              {details.participants?.total > 0 && (
                <Chip 
                  label={`${details.participants.total} Founders`}
                  size="small"
                  sx={{ 
                    fontSize: '0.7rem',
                    height: 24,
                    bgcolor: alpha('#14b8a6', 0.1),
                    color: '#14b8a6',
                  }}
                />
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            <Button
              size="small"
              variant="text"
              onClick={() => setDialogOpen(true)}
              sx={{ color: 'text.secondary', minWidth: 'auto' }}
            >
              <Visibility sx={{ fontSize: 18 }} />
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => onRespond(request.id, 'decline')}
              sx={{ borderRadius: 1.5, textTransform: 'none', minWidth: 70 }}
            >
              Decline
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => onRespond(request.id, 'accept')}
              sx={{ 
                borderRadius: 1.5, 
                textTransform: 'none',
                bgcolor: '#14b8a6',
                '&:hover': { bgcolor: '#0d9488' },
                minWidth: 70,
              }}
            >
              Accept
            </Button>
          </Box>
        </Box>
      </Paper>

      <RequestDetailsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        request={request}
        onRespond={onRespond}
      />
    </>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, value, label, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ 
        p: 1.5, 
        borderRadius: 2, 
        bgcolor: alpha(color, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon sx={{ color, fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

// =============================================================================
// SubscriptionCard
// Renders the advisor's Pro Advisor billing state: free / trial / past_due /
// active / cancelled. Has CTAs for monthly + yearly subscription via Dodo.
// =============================================================================
const SubscriptionCard = ({ billingProfile, userId, onChange }) => {
  const [subscribing, setSubscribing] = useState(null); // 'monthly' | 'yearly' | null
  const [cancelling, setCancelling] = useState(false);

  if (!billingProfile) return null;

  const status = billingProfile.effective_status || billingProfile.subscription_status || 'free';
  const pricing = billingProfile.subscription_pricing || {};
  const trialEndsAt = billingProfile.trial_ends_at;
  const periodEnd = billingProfile.subscription_current_period_end;

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  };

  const daysUntil = (iso) => {
    if (!iso) return null;
    try {
      const ms = new Date(iso).getTime() - Date.now();
      return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    } catch { return null; }
  };

  const subscribe = async (cycle) => {
    setSubscribing(cycle);
    try {
      const res = await fetch(`${API_BASE}/billing/advisor/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Clerk-User-Id': userId },
        body: JSON.stringify({ billing_cycle: cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
      window.location.href = data.checkout_url;
    } catch (err) {
      alert(`Error: ${err.message}`);
      setSubscribing(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel your Pro Advisor subscription? You will keep access until the end of your current billing period, then lose the ability to accept new bookings until you resubscribe.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE}/billing/advisor/cancel-subscription`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': userId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to cancel');
      onChange?.();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const SubscribeButtons = () => (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
      <Button
        variant="contained"
        size="small"
        startIcon={subscribing === 'monthly' ? <CircularProgress size={14} color="inherit" /> : null}
        disabled={!!subscribing}
        onClick={() => subscribe('monthly')}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Subscribe — ${pricing.monthly_usd}/mo
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={subscribing === 'yearly' ? <CircularProgress size={14} color="inherit" /> : null}
        disabled={!!subscribing}
        onClick={() => subscribe('yearly')}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Yearly — ${pricing.yearly_usd}/yr (save ${(pricing.monthly_usd * 12) - pricing.yearly_usd})
      </Button>
    </Box>
  );

  // FREE: no first booking yet
  if (status === 'free') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#0d9488', 0.08), borderRadius: 1.5, color: '#0d9488' }}>
              <Payment fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Free until your first booking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can list, accept requests, and run consultations <strong>for free</strong>.
                Your {pricing.trial_days}-day Pro Advisor trial begins after your first confirmed booking.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // TRIAL: in active trial period
  if (status === 'trial') {
    const days = daysUntil(trialEndsAt);
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#0ea5e9', 0.3), bgcolor: alpha('#0ea5e9', 0.04) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#0ea5e9', 0.12), borderRadius: 1.5, color: '#0ea5e9' }}>
              <AccessTime fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor trial · {days != null ? `${days} day${days === 1 ? '' : 's'} left` : 'active'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trial ends {formatDate(trialEndsAt)}. Subscribe now to keep accepting new bookings after that.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // PAST_DUE: trial expired or active subscription lapsed
  if (status === 'past_due') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#f59e0b', 0.5), bgcolor: alpha('#f59e0b', 0.06) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#f59e0b', 0.15), borderRadius: 1.5, color: '#f59e0b' }}>
              <Cancel fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Subscription required to accept new bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {billingProfile.subscription_status === 'trial'
                  ? 'Your Pro Advisor trial has ended. Subscribe to keep accepting new bookings.'
                  : 'Your subscription is past due or has lapsed. Resubscribe to start accepting new bookings again.'}
                You remain listed in the marketplace, but new bookings are paused.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ACTIVE: subscribed
  if (status === 'active') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#10b981', 0.4), bgcolor: alpha('#10b981', 0.04) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#10b981', 0.15), borderRadius: 1.5, color: '#10b981' }}>
              <CheckCircle fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Active
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {periodEnd
                  ? `Your subscription renews on ${formatDate(periodEnd)}.`
                  : 'Your subscription is active.'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  disabled={cancelling}
                  onClick={cancel}
                  sx={{ textTransform: 'none' }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // CANCELLED: previously paid, now cancelled
  if (status === 'cancelled') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#64748b', 0.1), borderRadius: 1.5, color: '#64748b' }}>
              <Cancel fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Cancelled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You've cancelled your Pro Advisor subscription. New bookings are paused until you resubscribe.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return null;
};

const AdvisorDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceScorecards, setWorkspaceScorecards] = useState({});
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [founderId, setFounderId] = useState(null);
  const [workspaceNotificationsDialogOpen, setWorkspaceNotificationsDialogOpen] = useState(false);
  const [selectedWorkspaceForNotifications, setSelectedWorkspaceForNotifications] = useState(null);
  const [billingProfile, setBillingProfile] = useState(null);
  
  // LinkedIn verification
  const [linkedinStatus, setLinkedinStatus] = useState({
    linkedin_verified: false,
    linkedin_configured: false,
    linkedin_name: null,
  });
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const fetchLinkedinStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedinStatus(data);
      }
    } catch (err) {
      // Verification is optional
    }
  }, [user?.id]);

  const handleLinkedInConnect = async () => {
    if (!user?.id) return;
    setLinkedinLoading(true);
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      }
    } catch (err) {
      setError('Failed to connect to LinkedIn');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const fetchBillingProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/advisor/profile`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setBillingProfile(data);
      }
    } catch (err) {
      // Error fetching billing profile
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async (abortSignal = null) => {
    if (!user?.id) return;
    if (abortSignal?.aborted) return;
    
    setLoading(true);
    try {
      const profileResponse = await fetch(`${API_BASE}/advisors/profile`, {
        headers: { 'X-Clerk-User-Id': user.id },
        ...(abortSignal && { signal: abortSignal }),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        const isValidProfile = profileData !== null && 
                              profileData !== undefined && 
                              typeof profileData === 'object' && 
                              !Array.isArray(profileData) &&
                              Object.keys(profileData).length > 0;
        
        if (isValidProfile) {
          hasFetchedOnceRef.current = true;
          setProfile(profileData);
          setLoading(false);
          
          // Fetch additional data in background
          Promise.all([
            fetch(`${API_BASE}/advisors/requests`, {
              headers: { 'X-Clerk-User-Id': user.id },
            }).then(r => r.ok ? r.json() : []).then(setRequests).catch(() => {}),
            
            fetch(`${API_BASE}/advisors/workspaces`, {
              headers: { 'X-Clerk-User-Id': user.id },
            }).then(r => r.ok ? r.json() : []).then(async (workspacesData) => {
              setWorkspaces(workspacesData || []);
              const scorecardsMap = {};
              await Promise.allSettled((workspacesData || []).map(async (ws) => {
                try {
                  const r = await fetch(`${API_BASE}/workspaces/${ws.id}/partner-impact-scorecard`, {
                    headers: { 'X-Clerk-User-Id': user.id },
                  });
                  if (r.ok) {
                    const data = await r.json();
                    if (data.has_partner) scorecardsMap[ws.id] = data;
                  }
                } catch {}
              }));
              setWorkspaceScorecards(scorecardsMap);
            }).catch(() => {}),
            
            fetch(`${API_BASE}/advisors/notifications`, {
              headers: { 'X-Clerk-User-Id': user.id },
            }).then(r => r.ok ? r.json() : []).then(setNotifications).catch(() => {}),
          ]);
        } else {
          hasFetchedOnceRef.current = true;
          setProfile(null);
          setLoading(false);
        }
      } else if (profileResponse.status === 404) {
        hasFetchedOnceRef.current = true;
        setProfile(null);
        setLoading(false);
      } else {
        hasFetchedOnceRef.current = true;
        setError('Failed to load advisor profile');
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      hasFetchedOnceRef.current = true;
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [user?.id]);

  const hasFetchedRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      hasFetchedOnceRef.current = false;
      fetchDashboardData();
      fetchBillingProfile();
      fetchLinkedinStatus();
    } else if (!user?.id) {
      hasFetchedRef.current = false;
      hasFetchedOnceRef.current = false;
    }
  }, [user?.id, fetchDashboardData, fetchBillingProfile, fetchLinkedinStatus]);

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !user?.id) return;

    const completeCallback = async () => {
      setLinkedinLoading(true);
      try {
        const response = await fetch(`${API_BASE}/advisors/linkedin/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({ code, state }),
        });
        if (response.ok) {
          const data = await response.json();
          setLinkedinStatus({
            linkedin_verified: true,
            linkedin_configured: true,
            linkedin_name: data.linkedin_name,
          });
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        setError('Failed to complete LinkedIn verification');
      } finally {
        setLinkedinLoading(false);
      }
    };
    completeCallback();
  }, [searchParams, user?.id]);

  // Handle "?advisor_subscription=success" return from Dodo checkout
  useEffect(() => {
    const flag = searchParams.get('advisor_subscription');
    if (flag !== 'success' || !user?.id) return;
    // Webhook usually arrives within 1-3s; refetch a couple of times
    const refetchTimes = [500, 2500, 5000];
    const timers = refetchTimes.map((delay) =>
      setTimeout(() => fetchBillingProfile(), delay)
    );
    // Clear the URL params
    window.history.replaceState({}, '', window.location.pathname);
    return () => timers.forEach(clearTimeout);
  }, [searchParams, user?.id, fetchBillingProfile]);

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (hasFetchedOnceRef.current && !loading && !profile && !error && !hasRedirectedRef.current && location.pathname !== '/advisor/onboarding') {
      const timeout = setTimeout(() => {
        if (!profile && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/advisor/onboarding', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
    if (profile) hasRedirectedRef.current = false;
  }, [loading, profile, error, navigate, location.pathname]);

  // Fetch founder ID for realtime
  useEffect(() => {
    const fetchFounderId = async () => {
      if (!user?.id) return;
      try {
        const r = await fetch(`${API_BASE}/profile/check`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (r.ok) {
          const data = await r.json();
          if (data.has_profile && data.profile) setFounderId(data.profile.id);
        }
      } catch {}
    };
    fetchFounderId();
  }, [user?.id]);

  // Realtime notifications
  useEffect(() => {
    if (!founderId || !user?.id) return;

    const fetchNotifications = async () => {
      try {
        const r = await fetch(`${API_BASE}/advisors/notifications`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (r.ok) setNotifications(await r.json() || []);
      } catch {}
    };

    fetchNotifications();

    const channel = supabase
      .channel(`advisor_notifications_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${founderId}`,
      }, fetchNotifications)
      .subscribe();

    const handleVisibility = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [founderId, user?.id]);

  const handleRespondToRequest = async (requestId, response) => {
    // Acceptance is now free for advisors. Platform monetizes via subscription
    // after the advisor's first booking is completed.
    try {
      const r = await fetch(`${API_BASE}/advisors/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ response }),
      });
      if (r.ok) fetchDashboardData();
      else alert((await r.json()).error || 'Failed to respond');
    } catch {
      alert('Failed to respond to request');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const r = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (r.ok) setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch {}
  };

  // Loading state
  if (loading && !hasFetchedOnceRef.current) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0ea5e9' }} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ bgcolor: '#0ea5e9' }}>
          Retry
        </Button>
      </Box>
    );
  }

  // No profile - redirect will handle
  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0ea5e9' }} />
      </Box>
    );
  }

  const status = profile?.status || 'PENDING';

  // Theme constants (match app design)
  const NAVY = '#1e3a8a';
  const TEAL = '#0d9488';
  const TEAL_LIGHT = '#14b8a6';
  const SKY = '#0ea5e9';
  const SLATE_900 = '#0f172a';
  const SLATE_500 = '#64748b';
  const SLATE_400 = '#94a3b8';
  const SLATE_200 = '#e2e8f0';
  const BG = '#f8fafc';

  // Pending status
  if (status === 'PENDING') {
    return (
      <Box sx={{ minHeight: '100%', bgcolor: BG, py: 6, pb: 8 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Box
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid',
              borderColor: SLATE_200,
              bgcolor: '#fff',
              textAlign: 'center',
              mb: 3,
              transition: 'all 0.25s ease',
              '&:hover': { borderColor: alpha(TEAL, 0.3), boxShadow: `0 8px 24px ${alpha(TEAL, 0.06)}` },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 2,
                bgcolor: alpha(TEAL, 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Pending sx={{ fontSize: 32, color: TEAL }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1, fontSize: '1.35rem' }}>
              Application Under Review
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, lineHeight: 1.6 }}>
              We'll notify you via email once your advisor application is approved.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => navigate('/advisor/onboarding')}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: SLATE_200,
                color: SLATE_900,
                '&:hover': { borderColor: TEAL, color: TEAL, bgcolor: alpha(TEAL, 0.04) },
              }}
            >
              Edit Application
            </Button>
          </Box>

          <Box
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: SLATE_200,
              bgcolor: '#fff',
              transition: 'all 0.25s ease',
              '&:hover': { borderColor: alpha(SKY, 0.3), boxShadow: `0 8px 24px ${alpha(SKY, 0.06)}` },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 2.5, fontSize: '1rem' }}>
              Application Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Headline
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_900, lineHeight: 1.6 }}>
                  {profile?.headline || 'Not set'}
                </Typography>
              </Box>
              {profile?.bio && (
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, display: 'block', mb: 0.5 }}>
                    Bio
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_900, lineHeight: 1.6 }}>
                    {profile.bio}
                  </Typography>
                </Box>
              )}
              {(profile?.expertise_stages?.length > 0 || profile?.domains?.length > 0) && (
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, display: 'block', mb: 1 }}>
                    Expertise
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {profile?.expertise_stages?.map((s, i) => (
                      <Chip key={i} label={s} size="small" sx={{ fontSize: '0.75rem', fontWeight: 500, bgcolor: alpha(SKY, 0.1), color: SKY, border: 'none' }} />
                    ))}
                    {profile?.domains?.map((d, i) => (
                      <Chip key={i} label={d} size="small" sx={{ fontSize: '0.75rem', fontWeight: 500, bgcolor: alpha(TEAL, 0.1), color: TEAL, border: 'none' }} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  // Rejected status
  if (status === 'REJECTED') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 6 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: alpha('#ef4444', 0.1), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}>
              <Cancel sx={{ fontSize: 40, color: '#ef4444' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              Application Not Approved
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You can update your details and submit again for review.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate('/advisor/onboarding')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
            >
              Update & Resubmit
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  // Approved - Full Dashboard
  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const availableSlots = (profile?.max_active_workspaces || 0) - (profile?.current_active_workspaces || 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
        {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                  Welcome back, {profile?.user?.name?.split(' ')[0] || 'Advisor'}
                </Typography>
                {profile?.is_discoverable && (
                  <Chip 
                    label="Discoverable" 
                    size="small"
                    sx={{ 
                      bgcolor: alpha('#10b981', 0.1), 
                      color: '#10b981',
                      fontWeight: 500,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {profile?.headline || 'Advisor Dashboard'}
              </Typography>
            </Box>

            {/* LinkedIn Verification */}
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor: linkedinStatus.linkedin_verified ? 'success.main' : 'divider',
                bgcolor: linkedinStatus.linkedin_verified ? alpha('#10b981', 0.04) : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LinkedIn sx={{ color: '#0A66C2', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      LinkedIn Verification
                      {linkedinStatus.linkedin_verified && (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label="Verified"
                          size="small"
                          color="success"
                          sx={{ ml: 1, height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {linkedinStatus.linkedin_verified
                        ? `Verified as ${linkedinStatus.linkedin_name || 'LinkedIn User'}`
                        : 'Verify your identity with LinkedIn to build trust with founders'}
                    </Typography>
                  </Box>
                </Box>
                {!linkedinStatus.linkedin_verified && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLinkedInConnect}
                    disabled={linkedinLoading || !linkedinStatus.linkedin_configured}
                    startIcon={linkedinLoading ? <CircularProgress size={16} /> : <LinkedIn />}
                    sx={{
                      borderColor: '#0A66C2',
                      color: '#0A66C2',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': { borderColor: '#004182', bgcolor: alpha('#0A66C2', 0.04) },
                    }}
                  >
                    {linkedinLoading ? 'Connecting...' : 'Verify with LinkedIn'}
                  </Button>
                )}
              </Box>
              {!linkedinStatus.linkedin_configured && !linkedinStatus.linkedin_verified && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  LinkedIn verification coming soon
                </Typography>
              )}
            </Paper>

            {/* Pro Advisor subscription card */}
            <SubscriptionCard
              billingProfile={billingProfile}
              userId={user?.id}
              onChange={fetchBillingProfile}
            />

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} md={3}>
                <StatCard 
                  icon={WorkspacesOutlined}
                  value={profile?.current_active_workspaces || 0}
                  label="Active Workspaces"
                  color="#0ea5e9"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard 
                  icon={Message}
                  value={pendingRequests.length}
                  label="Pending Requests"
                  color="#8b5cf6"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard 
                  icon={TaskAlt}
                  value={requests.filter(r => r.status === 'ACCEPTED').length}
                  label="Accepted"
                  color="#10b981"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <StatCard 
                  icon={AccessTime}
                  value={availableSlots}
                  label="Available Slots"
                  color="#f59e0b"
                />
              </Grid>
            </Grid>

            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge badgeContent={pendingRequests.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#8b5cf6' } }}>
                    <Message sx={{ color: '#8b5cf6' }} />
                  </Badge>
                  <span style={{ marginLeft: 8 }}>Pending Requests</span>
                </Typography>
                {pendingRequests.map((request) => (
                  <RequestCard 
                    key={request.id} 
                    request={request} 
                    onRespond={handleRespondToRequest}
                  />
                ))}
              </Box>
            )}

            {/* Active Workspaces */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkspacesOutlined sx={{ color: '#0ea5e9' }} />
                Active Workspaces
              </Typography>
              
              {workspaces.length === 0 ? (
                <Paper elevation={0} sx={{ 
                  p: 5, 
                  border: '1px dashed', 
                  borderColor: 'divider',
                  borderRadius: 2,
                  textAlign: 'center',
                }}>
                  <WorkspacesOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    No active workspaces yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Founders can discover and request you from the marketplace
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {workspaces.map((workspace) => {
                    const wsNotifications = notifications.filter(n => 
                      (n.workspace_id === workspace.id || n.workspace?.id === workspace.id) && !n.read_at
                    );
                    const scorecard = workspaceScorecards[workspace.id];
                    
                    return (
                      <Grid item xs={12} md={6} key={workspace.id}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: '#0ea5e9',
                              boxShadow: `0 4px 12px ${alpha('#0ea5e9', 0.1)}`,
                            },
                          }}
                          onClick={() => navigate(`/advisor/workspaces/${workspace.id}`)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                            <Avatar sx={{ 
                              bgcolor: alpha('#0ea5e9', 0.1), 
                              color: '#0ea5e9',
                              fontWeight: 600,
                            }}>
                              {workspace.title?.[0] || 'W'}
                            </Avatar>
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a' }}>
                                  {workspace.title || 'Workspace'}
                                </Typography>
                                {wsNotifications.length > 0 && (
                                  <Badge 
                                    badgeContent={wsNotifications.length} 
                                    color="error"
                                    sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}
                                  >
                                    <Notifications sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  </Badge>
                                )}
                              </Box>
                              
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Stage: {workspace.stage || 'N/A'}
                              </Typography>
                              
                              {scorecard && (
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={`${scorecard.metrics.on_time_checkins.current_rate.toFixed(0)}% on-time`}
                                    size="small"
                                    sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}
                                  />
                                  <Chip
                                    label={`${scorecard.metrics.kpi_progress.average_progress_pct.toFixed(0)}% KPI progress`}
                                    size="small"
                                    sx={{ fontSize: '0.65rem', height: 20, bgcolor: alpha('#0ea5e9', 0.1), color: '#0ea5e9' }}
                                  />
                                </Box>
                              )}
                            </Box>
                            
                            <ArrowForward sx={{ color: 'text.disabled', fontSize: 18 }} />
                          </Box>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
      </Box>

      {/* Workspace Notifications Dialog */}
      <Dialog
        open={workspaceNotificationsDialogOpen}
        onClose={() => { setWorkspaceNotificationsDialogOpen(false); setSelectedWorkspaceForNotifications(null); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedWorkspaceForNotifications?.title || 'Workspace'} Updates
            </Typography>
            <IconButton size="small" onClick={() => { setWorkspaceNotificationsDialogOpen(false); setSelectedWorkspaceForNotifications(null); }}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {(() => {
            const wsNotifs = notifications.filter(n => 
              (n.workspace_id === selectedWorkspaceForNotifications?.id || n.workspace?.id === selectedWorkspaceForNotifications?.id) && !n.read_at
            );
            
            if (wsNotifs.length === 0) {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No unread notifications</Typography>
                </Box>
              );
            }

            return wsNotifs.map((n) => (
              <Paper key={n.id} elevation={0} sx={{ p: 2, mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Circle sx={{ fontSize: 8, color: '#0ea5e9', mt: 0.8 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{n.title}</Typography>
                    {n.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(n.created_at).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                  <IconButton size="small" onClick={() => handleMarkAsRead(n.id)}>
                    <CheckCircleOutline fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            ));
          })()}
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default AdvisorDashboard;

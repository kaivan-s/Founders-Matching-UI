import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Check,
  Close,
  Star,
  TrendingUp,
  Business,
  People,
  Analytics,
  Assignment,
  CheckCircle,
  Warning,
  CancelOutlined,
  Rocket,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

/** Fallback if /billing/plans omits advisor_pricing (keep in sync with plan_service.ADVISOR_PRICING). */
const DEFAULT_ADVISOR_PRICING = {
  subscriptionMonthlyUSD: 19,
  subscriptionYearlyUSD: 99,
  trialDaysAfterFirstBooking: 30,
  minConsultationRateUSD: 5,
  maxConsultationRateUSD: 1000,
};

const PricingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState(null);
  const [advisorPricing, setAdvisorPricing] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentPlanDetails, setCurrentPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(null);
  const [workspaceSelectionRequired, setWorkspaceSelectionRequired] = useState(false);
  const [userWorkspaces, setUserWorkspaces] = useState([]);

  // Check for subscription success on mount
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    const planFromUrl = searchParams.get('plan');
    
    if (subscriptionStatus === 'success' && planFromUrl) {
      setSubscriptionSuccess(true);
      setSuccessPlan(planFromUrl);
    }
  }, [searchParams]);

  // Countdown and redirect for success state
  useEffect(() => {
    if (subscriptionSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (subscriptionSuccess && countdown === 0) {
      navigate('/discover');
    }
  }, [subscriptionSuccess, countdown, navigate]);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE}/billing/plans`, {
        headers: {
          'X-Clerk-User-Id': user?.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(data.founder_plans);
        setAdvisorPricing(data.advisor_pricing || {});
      }

      // Fetch current plan with full details
      if (user?.id) {
        const planResponse = await fetch(`${API_BASE}/billing/my-plan`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        if (planResponse.ok) {
          const planData = await planResponse.json();
          setCurrentPlan(planData.id);
          setCurrentPlanDetails(planData);
        }
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (workspaceToKeep = null) => {
    setCancelling(true);
    setCancelError(null);

    try {
      const body = workspaceToKeep ? { workspace_to_keep: workspaceToKeep } : {};
      
      const response = await fetch(`${API_BASE}/billing/founder/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user?.id,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if workspace selection is required
        if (data.error === 'workspace_selection_required') {
          setWorkspaceSelectionRequired(true);
          setUserWorkspaces(data.workspaces || []);
          setCancelling(false);
          return;
        }
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Success - close dialog and show message
      setCancelDialogOpen(false);
      setWorkspaceSelectionRequired(false);
      setCancelSuccess(data.message || 'Subscription cancelled. You\'ll keep access until the end of your billing period.');
      await fetchPlans();
      
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (planId === 'FREE') {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/billing/founder/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user?.id,
        },
        body: JSON.stringify({ plan: planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const data = await response.json();
      // Redirect to Polar checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatPrice = (price) => {
    return `$${price}`;
  };

  // Show success screen if subscription was successful
  if (subscriptionSuccess) {
    const planDisplayName = successPlan === 'PRO' ? 'Pro' : successPlan === 'PRO_PLUS' ? 'Pro+' : successPlan;
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '80vh',
          bgcolor: '#f8fafc'
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 500, 
            mx: 2, 
            p: 4, 
            textAlign: 'center',
            borderRadius: 4,
            boxShadow: '0 12px 32px rgba(13, 148, 136, 0.15)',
          }}
        >
          <Box 
            sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: '#d1fae5', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <CheckCircle sx={{ fontSize: 48, color: '#10b981' }} />
          </Box>
          
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
            Payment Successful!
          </Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#0d9488' }}>
            Welcome to {planDisplayName}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Your payment was successful! Your {planDisplayName} subscription is being activated.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 3, color: '#64748b', bgcolor: '#f1f5f9', p: 2, borderRadius: 2 }}>
            Note: It may take 5-10 minutes for your Pro status to reflect in the app. 
            If you don't see the update, try refreshing the page.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
            <CircularProgress size={20} sx={{ color: '#0d9488' }} />
            <Typography variant="body2" color="text.secondary">
              Redirecting to dashboard in {countdown} seconds...
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/discover')}
            sx={{
              bgcolor: '#0d9488',
              color: 'white',
              px: 4,
              py: 1.5,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                bgcolor: '#14b8a6',
              },
            }}
          >
            Go to Dashboard Now
          </Button>
        </Card>
      </Box>
    );
  }

  if (loading || !plans) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography>Loading pricing...</Typography>
      </Box>
    );
  }

  const adv = { ...DEFAULT_ADVISOR_PRICING, ...(advisorPricing || {}) };
  const yearlySave =
    adv.subscriptionMonthlyUSD * 12 - adv.subscriptionYearlyUSD;

  const planFeatures = {
    FREE: [
      { icon: <TrendingUp />, text: '3 curated projects per day' },
      { icon: <People />, text: '1 application per day' },
      { icon: <Rocket />, text: '1 project' },
      { icon: <Business />, text: '1 workspace' },
      { icon: <Check />, text: 'Equity calculator' },
      { icon: <Check />, text: 'Slack & Notion integrations' },
      { icon: <Check />, text: 'Weekly check-ins' },
      { icon: <Close color="disabled" />, text: 'Can only see Free projects', muted: true },
    ],
    PRO: [
      { icon: <TrendingUp />, text: 'Unlimited applications' },
      { icon: <Rocket />, text: 'Up to 3 projects' },
      { icon: <Business />, text: 'Unlimited workspaces' },
      { icon: <Star />, text: 'See Free + Pro projects' },
      { icon: <Star />, text: 'Advisor marketplace access' },
      { icon: <Check />, text: 'Everything in Free' },
    ],
    PRO_PLUS: [
      { icon: <Star />, text: 'See all projects (Free, Pro, Pro+)' },
      { icon: <Star />, text: 'Post-match support (30 days)' },
      { icon: <Check />, text: 'Priority check-in support' },
      { icon: <Check />, text: 'Everything in Pro' },
    ],
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
          Pricing Plans
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Choose the plan that fits your startup journey
        </Typography>
      </Box>

      {/* Cancel Success Alert */}
      {cancelSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 4 }}
          onClose={() => setCancelSuccess(null)}
        >
          {cancelSuccess}
        </Alert>
      )}

      {/* Founder Plans */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {Object.values(plans).map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.id === 'PRO';
          
          return (
            <Grid item xs={12} md={4} key={plan.id} sx={{ display: 'flex' }}>
              <Card
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isPopular ? '2px solid #0d9488' : '1px solid #e2e8f0', // Teal border for popular
                  borderRadius: 4,
                  position: 'relative',
                  bgcolor: '#ffffff',
                  transition: 'all 0.3s ease',
                  ...(isPopular && {
                    boxShadow: '0 12px 32px rgba(13, 148, 136, 0.15)', // Teal shadow
                  }),
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: isPopular 
                      ? '0 16px 40px rgba(13, 148, 136, 0.2)'
                      : '0 8px 24px rgba(30, 58, 138, 0.08)', // Navy shadow for others
                  }
                }}
              >
                {isPopular && (
                  <Chip
                    label="Most Popular"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      bgcolor: '#0d9488', // Teal
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  />
                )}
                {isCurrent && (
                  <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Chip
                      label="Current Plan"
                      sx={{
                        bgcolor: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 600,
                        borderRadius: 2,
                      }}
                    />
                    {currentPlanDetails?.subscription_status === 'canceled' && currentPlanDetails?.subscription_current_period_end && (
                      <Chip
                        label={`Ends ${new Date(currentPlanDetails.subscription_current_period_end).toLocaleDateString()}`}
                        size="small"
                        sx={{
                          bgcolor: '#fef3c7',
                          color: '#92400e',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          borderRadius: 2,
                        }}
                      />
                    )}
                  </Box>
                )}
                
                <CardContent
                  sx={{
                    flex: 1,
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1e3a8a' }}> {/* Navy */}
                    {plan.id === 'FREE' ? 'Free' : plan.id === 'PRO' ? 'Pro' : 'Pro+'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e3a8a' }}> {/* Navy */}
                      {formatPrice(plan.monthlyPriceUSD)}
                    </Typography>
                    {plan.monthlyPriceUSD > 0 && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                        /month
                      </Typography>
                    )}
                  </Box>

                  <List sx={{ flex: 1, mb: 2, py: 0 }}>
                    {planFeatures[plan.id].map((feature, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {React.cloneElement(feature.icon, { 
                            sx: { 
                              color: feature.icon.type === Close ? '#94a3b8' : '#0d9488', // Teal icons
                              fontSize: 20 
                            } 
                          })}
                        </ListItemIcon>
                        <ListItemText
                          primary={feature.text}
                          primaryTypographyProps={{
                            variant: 'body2',
                            color: feature.icon.type === Close ? 'text.secondary' : 'text.primary',
                            fontWeight: 500,
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Button
                    fullWidth
                    variant={isPopular ? 'contained' : 'outlined'}
                    size="large"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent}
                    sx={{
                      mt: 'auto',
                      flexShrink: 0,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      ...(isPopular ? {
                        bgcolor: '#0d9488',
                        color: 'white',
                        '&:hover': {
                          bgcolor: '#14b8a6',
                        },
                      } : {
                        borderColor: '#e2e8f0',
                        color: '#1e3a8a',
                        '&:hover': {
                          borderColor: '#1e3a8a',
                          bgcolor: '#f8fafc',
                        },
                      }),
                    }}
                  >
                    {isCurrent ? 'Current Plan' : plan.id === 'FREE' ? 'Start Free' : `Upgrade to ${plan.id === 'PRO' ? 'Pro' : 'Pro+'}`}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Subscription Management Section - Only show for paid plans */}
      {currentPlan && currentPlan !== 'FREE' && (
        <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#fff8f8', border: '1px solid #fecaca', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e3a8a', mb: 0.5 }}>
                Manage Your Subscription
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're currently on the {currentPlan === 'PRO' ? 'Pro' : 'Pro+'} plan
                {currentPlanDetails?.subscription_current_period_end && (
                  <> • Renews on {new Date(currentPlanDetails.subscription_current_period_end).toLocaleDateString()}</>
                )}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelOutlined />}
              onClick={() => setCancelDialogOpen(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Cancel Subscription
            </Button>
          </Box>
        </Paper>
      )}

      {/* Cancel Subscription Dialog */}
      <Dialog 
        open={cancelDialogOpen} 
        onClose={() => {
          setCancelDialogOpen(false);
          setWorkspaceSelectionRequired(false);
          setCancelError(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning sx={{ color: '#f59e0b' }} />
          {workspaceSelectionRequired ? 'Select Workspace to Keep' : 'Cancel Subscription'}
        </DialogTitle>
        <DialogContent>
          {cancelError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {cancelError}
            </Alert>
          )}
          
          {workspaceSelectionRequired ? (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You have multiple workspaces. The Free plan only allows 1 workspace. 
                Please select which workspace you'd like to keep:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {userWorkspaces.map((workspace) => (
                  <Button
                    key={workspace.id}
                    variant="outlined"
                    onClick={() => handleCancelSubscription(workspace.id)}
                    disabled={cancelling}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      py: 1.5,
                    }}
                  >
                    {workspace.name || `Workspace ${workspace.id.slice(0, 8)}`}
                  </Button>
                ))}
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to cancel your subscription? After your current billing period ends, you'll lose access to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Close sx={{ color: '#ef4444' }} /></ListItemIcon>
                  <ListItemText primary="Unlimited discovery & matching" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Close sx={{ color: '#ef4444' }} /></ListItemIcon>
                  <ListItemText primary="Full workspace features" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Close sx={{ color: '#ef4444' }} /></ListItemIcon>
                  <ListItemText primary="Advisor marketplace access" />
                </ListItem>
                {currentPlan === 'PRO_PLUS' && (
                  <ListItem>
                    <ListItemIcon><Close sx={{ color: '#ef4444' }} /></ListItemIcon>
                    <ListItemText primary="Advanced analytics & investor features" />
                  </ListItem>
                )}
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Your subscription won't renew, but you'll keep full access to your current plan until the end of your billing period.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setCancelDialogOpen(false);
              setWorkspaceSelectionRequired(false);
              setCancelError(null);
            }}
            disabled={cancelling}
          >
            Keep My Plan
          </Button>
          {!workspaceSelectionRequired && (
            <Button
              variant="contained"
              color="error"
              onClick={() => handleCancelSubscription()}
              disabled={cancelling}
              startIcon={cancelling ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {cancelling ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Advisor Section */}
      <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#f8fafc' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          For Advisors
        </Typography>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Consultations
            </Typography>
            <Box
              component="ul"
              sx={{
                m: 0,
                pl: 2.25,
                listStyleType: 'disc',
                '& li': {
                  pl: 0.5,
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  '&:last-child': { mb: 0 },
                },
                '& li::marker': { color: '#0d9488' },
              }}
            >
              <li>30 and 60 minute sessions—you choose rates from ${adv.minConsultationRateUSD} to ${adv.maxConsultationRateUSD}</li>
              <li>Only founders on Pro or Pro+ can book through the marketplace</li>
              <li>They pay you directly; Guild Space doesn&apos;t process those payments</li>
              <li>Use your Cal.com link for scheduling after a booking is confirmed</li>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Pro Advisor
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#14b8a6', mb: 0.5 }}>
              ${adv.subscriptionMonthlyUSD}/mo · ${adv.subscriptionYearlyUSD}/yr
            </Typography>
            {yearlySave > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Yearly saves ${yearlySave} vs monthly
              </Typography>
            )}
            <Box
              component="ul"
              sx={{
                m: 0,
                mt: yearlySave > 0 ? 0 : 1,
                pl: 2.25,
                listStyleType: 'disc',
                '& li': {
                  pl: 0.5,
                  mb: 1,
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                  '&:last-child': { mb: 0 },
                },
                '& li::marker': { color: '#0d9488' },
              }}
            >
              <li>Listings and consultations are free until your first confirmed booking</li>
              <li>
                Then a {adv.trialDaysAfterFirstBooking}-day trial—after that, stay subscribed to accept new requests
              </li>
            </Box>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          fullWidth
          onClick={() => navigate('/advisor/onboarding')}
          sx={{
            bgcolor: '#14b8a6',
            maxWidth: 400,
            mx: 'auto',
            display: 'block',
            '&:hover': { bgcolor: '#0d9488' },
          }}
        >
          Apply as Advisor
        </Button>
      </Paper>
      </Container>
    </Box>
  );
};

export default PricingPage;


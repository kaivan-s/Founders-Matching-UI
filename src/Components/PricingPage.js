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
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const PricingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [currentPlanDetails, setCurrentPlanDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [successPlan, setSuccessPlan] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);
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

      // Success - close dialog and refresh plans
      setCancelDialogOpen(false);
      setWorkspaceSelectionRequired(false);
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
            Welcome to {planDisplayName}!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your subscription has been activated successfully. 
            You now have access to all {planDisplayName} features.
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

  const planFeatures = {
    FREE: [
      { icon: <Business />, text: '1 lite workspace' },
      { icon: <People />, text: '10 swipes/month' },
      { icon: <Check />, text: 'Basic compatibility score' },
      { icon: <Check />, text: 'Basic KPIs & decisions' },
      { icon: <Check />, text: 'Weekly check-ins' },
      { icon: <Close />, text: 'No marketplace partners' },
    ],
    PRO: [
      { icon: <Business />, text: 'Up to 2 full workspaces' },
      { icon: <TrendingUp />, text: 'Unlimited discovery & matching' },
      { icon: <Analytics />, text: 'Full compatibility report' },
      { icon: <Check />, text: 'Full workspace OS' },
      { icon: <Check />, text: 'Equity & roles' },
      { icon: <Check />, text: 'Tasks board' },
      { icon: <Check />, text: 'Advisor marketplace' },
    ],
    PRO_PLUS: [
      { icon: <Business />, text: 'Up to 5 workspaces' },
      { icon: <TrendingUp />, text: 'Everything in Pro' },
      { icon: <Analytics />, text: 'Advanced compatibility analytics' },
      { icon: <Star />, text: 'Investor-facing features' },
      { icon: <Star />, text: 'Priority partner access' },
      { icon: <Star />, text: 'Discounted partner rates' },
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

      {/* Founder Plans */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        {Object.values(plans).map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.id === 'PRO';
          
          return (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
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
                  <Chip
                    label="Current Plan"
                    sx={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                      fontWeight: 600,
                      borderRadius: 2,
                    }}
                  />
                )}
                
                <CardContent sx={{ flex: 1, p: 4 }}>
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

                  <List sx={{ mb: 3 }}>
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
                Are you sure you want to cancel your subscription? You'll lose access to:
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
              <Alert severity="warning" sx={{ mt: 2 }}>
                You'll be downgraded to the Free plan immediately. If you have more than 1 workspace, 
                you'll need to select which one to keep.
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
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                One-time Onboarding Fee
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#14b8a6', mb: 1 }}>
                $69
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pay once when you join the marketplace to get listed and access partner tools
              </Typography>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Annual Renewal
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#14b8a6', mb: 1 }}>
                $39/year
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Renew annually to stay listed and keep your dashboard active
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Compensation Model
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Advisors receive equity in the projects they handle, not monetary payment
              </Typography>
              
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>How it works:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • You'll receive equity in the project you're advising
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Equity terms are determined per project
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Details will be discussed when you accept an advisor request
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/advisor/onboarding')}
                sx={{
                  bgcolor: '#14b8a6',
                  '&:hover': { bgcolor: '#0d9488' },
                }}
              >
                Apply as Advisor
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      </Container>
    </Box>
  );
};

export default PricingPage;


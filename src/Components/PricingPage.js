import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const PricingPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

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

      // Fetch current plan
      if (user?.id) {
        const planResponse = await fetch(`${API_BASE}/billing/my-plan`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        if (planResponse.ok) {
          const planData = await planResponse.json();
          setCurrentPlan(planData.id);
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
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
      { icon: <Check />, text: 'Accountability partner marketplace' },
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

      {/* Accountability Partner Section */}
      <Paper sx={{ p: 4, borderRadius: 3, bgcolor: '#f8fafc' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          For Accountability Partners
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
                Per-Workspace Earnings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set your rate between $50–$150/month per workspace
              </Typography>
              
              <Box sx={{ bgcolor: 'white', p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Example:</strong> You set rate at $80/month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Founder pays: $100/month (includes 25% platform fee)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • You receive: $60/month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Platform fee: $20/month (25%)
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/partner/onboarding')}
                sx={{
                  bgcolor: '#14b8a6',
                  '&:hover': { bgcolor: '#0d9488' },
                }}
              >
                Apply as Accountability Partner
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


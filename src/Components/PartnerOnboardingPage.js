import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  ArrowForward,
  Payment,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import PartnerOnboardingWizard from './PartnerOnboardingWizard';

const PartnerOnboardingPage = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [billingProfile, setBillingProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      navigate('/');
      return;
    }
    checkPartnerStatus();
  }, [isSignedIn, user]);

  // Check if coming from successful payment
  useEffect(() => {
    if (searchParams.get('onboarding') === 'success') {
      // Refresh status after payment
      setTimeout(() => {
        checkPartnerStatus();
      }, 2000);
    }
  }, [searchParams]);

  const checkPartnerStatus = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Check billing profile (payment status)
      const billingResponse = await fetch(`${API_BASE}/billing/partner/profile`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (billingResponse.ok) {
        const billing = await billingResponse.json();
        setBillingProfile(billing);
      }

      // Check partner profile
      const profileResponse = await fetch(`${API_BASE}/accountability-partners/profile`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        if (profile && Object.keys(profile).length > 0) {
          setPartnerProfile(profile);
          // If profile exists and is approved, redirect to dashboard
          if (profile.status === 'APPROVED') {
            navigate('/partner/dashboard');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking partner status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayOnboarding = async () => {
    if (!user?.id) return;

    setPaymentLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/partner/onboarding`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const data = await response.json();
      // Redirect to Polar checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      alert(`Error: ${error.message}`);
      setPaymentLoading(false);
    }
  };

  const handleWizardComplete = () => {
    setWizardOpen(false);
    // Check status again - if approved, will redirect to dashboard
    checkPartnerStatus();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // If user has paid but no profile yet, show wizard
  if (billingProfile?.onboarding_paid && !partnerProfile) {
    return (
      <PartnerOnboardingWizard
        open={true}
        onComplete={handleWizardComplete}
        onClose={() => navigate('/')}
      />
    );
  }

  // If profile exists but pending approval
  if (partnerProfile && partnerProfile.status === 'PENDING') {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircle sx={{ fontSize: 64, color: '#0d9488', mb: 2 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              Application Submitted
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your accountability partner profile has been submitted and is pending approval.
              We'll notify you once your application has been reviewed.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // If profile is rejected
  if (partnerProfile && partnerProfile.status === 'REJECTED') {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
              Application Status
            </Typography>
            <Alert severity="warning" sx={{ mb: 4 }}>
              Your application was not approved at this time. Please contact support if you have questions.
            </Alert>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Show payment screen if not paid
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
          Become an Accountability Partner
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Help founders succeed while building your network
        </Typography>
      </Box>

      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  One-time Onboarding Fee
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#0d9488', mb: 1 }}>
                  $69
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Join the marketplace and get listed
                </Typography>
              </Box>

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Annual Renewal
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#0d9488', mb: 1 }}>
                  $39/year
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep your dashboard active
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
                
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, mb: 2 }}>
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
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Payment />}
              onClick={handlePayOnboarding}
              disabled={paymentLoading}
              sx={{
                px: 5,
                py: 1.5,
                height: '56px',
                borderRadius: '12px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                bgcolor: '#0d9488',
                color: 'white',
                '&:hover': {
                  bgcolor: '#14b8a6',
                },
              }}
            >
              {paymentLoading ? 'Processing...' : 'Pay $69 Onboarding Fee'}
            </Button>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
              After payment, you'll complete your partner profile
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {wizardOpen && (
        <PartnerOnboardingWizard
          open={wizardOpen}
          onComplete={handleWizardComplete}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </Container>
  );
};

export default PartnerOnboardingPage;


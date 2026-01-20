import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserButton, useUser } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  Business,
  Handshake,
  ArrowForward,
  Lock,
  LockOpen,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import OnboardingDialog from './OnboardingDialog';

const UserFlowSelector = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [partnerPaid, setPartnerPaid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    const checkPartnerBilling = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/billing/partner/profile`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });

        if (response.ok) {
          const billing = await response.json();
          setPartnerPaid(billing?.onboarding_paid || false);
        }
      } catch (error) {
        console.error('Error checking partner billing:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPartnerBilling();
  }, [user]);

  const handleSelectFounder = async () => {
    if (!user?.id) {
      return;
    }

    setCheckingOnboarding(true);
    try {
      // Check if user has completed onboarding
      const response = await fetch(`${API_BASE}/founders/onboarding-status`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // If user doesn't exist or hasn't completed onboarding, show dialog
        if (!data.exists || !data.onboarding_completed || !data.has_purpose || !data.has_skills) {
          setShowOnboarding(true);
          setCheckingOnboarding(false);
          return;
        }
      }
      
      // If onboarding is complete, navigate to discover
      navigate('/discover');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, show onboarding dialog to be safe
      setShowOnboarding(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleSelectAdvisor = () => {
    // Navigate to advisor onboarding
    navigate('/partner/onboarding');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Navigate to discover after onboarding is complete
    navigate('/discover');
  };

  const handleSelectPartner = () => {
    navigate('/partner/onboarding');
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      {/* UserButton in top right corner */}
      <Box sx={{ 
        position: 'absolute', 
        top: 16, 
        right: 16, 
        zIndex: 1000 
      }}>
        <UserButton />
      </Box>
      
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
            Welcome to GuildSpace
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Choose how you'd like to use the platform
          </Typography>
        </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid #e2e8f0',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                borderColor: '#0d9488',
              },
            }}
            onClick={handleSelectFounder}
          >
            <CardContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                <LockOpen sx={{ fontSize: 24, color: '#0d9488' }} />
              </Box>
              <Business 
                sx={{ 
                  fontSize: 64, 
                  color: '#0d9488',
                  mb: 3,
                }} 
              />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                I'm Looking for a Co-Founder
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Find your perfect co-founder match. Swipe through projects, get matched, and start building together.
              </Typography>
              <Button
                variant="contained"
                endIcon={checkingOnboarding ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
                onClick={handleSelectFounder}
                disabled={checkingOnboarding}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#0d9488',
                  '&:hover': {
                    bgcolor: '#14b8a6',
                  },
                }}
              >
                {checkingOnboarding ? 'Checking...' : 'Go to Discover'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: '2px solid #e2e8f0',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
                borderColor: '#0d9488',
              },
            }}
            onClick={handleSelectPartner}
          >
            <CardContent sx={{ p: 4, textAlign: 'center', position: 'relative' }}>
              <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                {loading ? (
                  <CircularProgress size={24} />
                ) : partnerPaid ? (
                  <LockOpen sx={{ fontSize: 24, color: '#0d9488' }} />
                ) : (
                  <Lock sx={{ fontSize: 24, color: '#64748b' }} />
                )}
              </Box>
              <Handshake 
                sx={{ 
                  fontSize: 64, 
                  color: partnerPaid ? '#0d9488' : '#64748b',
                  mb: 3,
                }} 
              />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                I'm an Accountability Partner/Advisor
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Help founders stay accountable and succeed. Join workspaces, provide guidance, and build your advisory network.
              </Typography>
              <Button
                variant="outlined"
                endIcon={<ArrowForward />}
                onClick={handleSelectPartner}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderColor: '#0d9488',
                  color: '#0d9488',
                  '&:hover': {
                    borderColor: '#14b8a6',
                    bgcolor: 'rgba(13, 148, 136, 0.04)',
                  },
                }}
              >
                Become a Partner
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Container>

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSelectPartnerFlow={() => {
          setShowOnboarding(false);
          handleSelectPartner();
        }}
      />
    </Box>
  );
};

export default UserFlowSelector;


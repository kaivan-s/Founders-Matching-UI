import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import {
  Handshake,
  TrendingUp,
  People,
  CheckCircle,
  ArrowForward,
  Business,
  Schedule,
  VerifiedUser,
} from '@mui/icons-material';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import PartnerOnboardingWizard from './PartnerOnboardingWizard';

const AccountabilityPartnerLanding = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  // Open wizard after sign-in if user was trying to apply
  useEffect(() => {
    if (isSignedIn && pendingOnboarding) {
      setWizardOpen(true);
      setPendingOnboarding(false);
    }
  }, [isSignedIn, pendingOnboarding]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      setWizardOpen(true);
    } else {
      setPendingOnboarding(true);
    }
  };

  const benefits = [
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: 'Help Founders Succeed',
      description: 'Guide early-stage founders through their journey and help them stay accountable to their goals.',
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: 'Build Your Network',
      description: 'Connect with ambitious founders and expand your network in the startup ecosystem.',
    },
    {
      icon: <Schedule sx={{ fontSize: 40 }} />,
      title: 'Flexible Commitment',
      description: 'Set your own capacity and preferred cadence. Work with founders on your schedule.',
    },
    {
      icon: <VerifiedUser sx={{ fontSize: 40 }} />,
      title: 'Vetted Platform',
      description: 'Join a curated community of experienced partners and founders.',
    },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      position: 'relative',
      width: '100%',
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: { xs: 2, sm: 4, md: 6 },
        py: 3,
        zIndex: 10,
        background: 'transparent',
      }}>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
        >
          Founder Match
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isSignedIn ? (
            <Button 
              variant="outlined" 
              onClick={() => setWizardOpen(true)}
              sx={{ 
                textTransform: 'none',
                borderRadius: '12px',
                px: 3,
                py: 1,
                borderColor: '#14b8a6',
                color: '#14b8a6',
                fontWeight: 600,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  borderColor: '#14b8a6',
                  bgcolor: '#14b8a6',
                  color: 'white',
                },
              }}
            >
              Apply Now
            </Button>
          ) : (
            <SignInButton mode="modal" afterSignInUrl="/accountable_partner" afterSignUpUrl="/accountable_partner">
              <Button 
                variant="outlined" 
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  borderColor: '#e2e8f0',
                  color: '#0f172a',
                  fontWeight: 600,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: '#0ea5e9',
                    bgcolor: '#0ea5e9',
                    color: 'white',
                  },
                }}
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </Box>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 16 }, pb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            label="Join Our Community"
            sx={{
              mb: 3,
              px: 2,
              py: 0.5,
              bgcolor: 'rgba(14, 165, 233, 0.1)',
              color: '#0ea5e9',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          />
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '4rem' },
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            Become an Accountability Partner
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
            }}
          >
            Help founders stay accountable, make better decisions, and achieve their goals. 
            Join a curated community of experienced partners supporting early-stage startups.
          </Typography>
          {isSignedIn ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Join as Accountability Partner
            </Button>
          ) : (
            <SignInButton mode="modal" afterSignInUrl="/accountable_partner" afterSignUpUrl="/accountable_partner">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setPendingOnboarding(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Join as Accountability Partner
              </Button>
            </SignInButton>
          )}
        </Box>

        {/* Benefits Grid */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '20px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    {benefit.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      color: 'text.primary',
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                    }}
                  >
                    {benefit.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* How It Works */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: 4,
              color: 'text.primary',
            }}
          >
            How It Works
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    1
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Apply
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill out your profile with your experience, expertise, and availability.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    2
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Get Approved
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our team reviews your application and approves qualified partners.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    3
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Start Partnering
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Founders discover you in the marketplace and request your partnership.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section */}
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)',
            border: '1px solid rgba(14, 165, 233, 0.2)',
            borderRadius: '24px',
            p: 4,
            textAlign: 'center',
          }}
        >
          <Handshake sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to Help Founders Succeed?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: '600px', mx: 'auto' }}>
            Join our community of accountability partners and make a real impact on early-stage startups.
          </Typography>
          {isSignedIn ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
                },
              }}
            >
              Get Started Now
            </Button>
          ) : (
            <SignInButton mode="modal" afterSignInUrl="/accountable_partner" afterSignUpUrl="/accountable_partner">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setPendingOnboarding(true)}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: '12px',
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 20px rgba(14, 165, 233, 0.3)',
                  },
                }}
              >
                Get Started Now
              </Button>
            </SignInButton>
          )}
        </Card>
      </Container>

      {/* Partner Onboarding Wizard */}
      {isSignedIn && (
        <PartnerOnboardingWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={(profile) => {
            setWizardOpen(false);
            // Show success message
            alert('Application submitted! We\'ll review it and get back to you soon.');
            // Optionally redirect to partner dashboard
            navigate('/partner/dashboard');
          }}
          useDirectSupabase={true}
        />
      )}
    </Box>
  );
};

export default AccountabilityPartnerLanding;


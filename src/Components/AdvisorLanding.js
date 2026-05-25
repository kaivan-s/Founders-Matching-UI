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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Pending,
} from '@mui/icons-material';
import { useUser, SignInButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const AdvisorLanding = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [pendingOnboarding, setPendingOnboarding] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Navigate to onboarding after sign-in if user was trying to apply
  useEffect(() => {
    if (isSignedIn && pendingOnboarding) {
      navigate('/advisor/onboarding');
      setPendingOnboarding(false);
    }
  }, [isSignedIn, pendingOnboarding, navigate]);

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/advisor/onboarding');
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
      title: 'Earn per session',
      description: 'Set your own consultation rates; founders on Pro+ pay you directly for booked time. Cal.com keeps scheduling simple.',
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
        py: { xs: 2, sm: 3 },
        zIndex: 10,
        background: 'transparent',
      }}>
          <Typography 
            variant="h5" 
            component="h1" 
            sx={{ 
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
            }}
          >
            Guild Space
          </Typography>
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          {isSignedIn ? (
            <Button 
              variant="outlined" 
              onClick={() => navigate('/advisor/onboarding')}
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
            <SignInButton mode="modal" afterSignInUrl="/advisor/landing" afterSignUpUrl="/advisor/landing">
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
      <Container maxWidth="lg" sx={{ pt: { xs: 10, sm: 12, md: 16 }, pb: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, sm: 8 } }}>
          <Chip
            label="Join Our Community"
            sx={{
              mb: { xs: 2, sm: 3 },
              px: { xs: 1.5, sm: 2 },
              py: 0.5,
              bgcolor: 'rgba(14, 165, 233, 0.1)',
              color: '#0ea5e9',
              fontWeight: 600,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          />
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '2.5rem', md: '4rem' },
                fontWeight: 800,
                mb: { xs: 2, sm: 3 },
                background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)', // Navy to Teal
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              Become an Advisor
            </Typography>
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              mb: { xs: 3, sm: 4 },
              maxWidth: '720px',
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              px: { xs: 1, sm: 0 },
            }}
          >
            Help founders with paid 30- and 60-minute consultations. They discover you in the marketplace,
            you confirm the booking, they pay you directly, and you meet using your Cal.com link.
          </Typography>
          {isSignedIn ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
                '&:hover': {
                  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(13, 148, 136, 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Join as Advisor
            </Button>
          ) : (
            <SignInButton mode="modal" afterSignInUrl="/advisor/landing" afterSignUpUrl="/advisor/landing">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setPendingOnboarding(true)}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '1rem', sm: '1.1rem' },
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
                Join as Advisor
              </Button>
            </SignInButton>
          )}
        </Box>

        {/* Benefits Grid */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: { xs: 5, sm: 8 } }}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: { xs: 2, sm: 3 },
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: { xs: '16px', sm: '20px' },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-8px)' },
                    boxShadow: { xs: 'none', sm: '0 12px 24px rgba(0, 0, 0, 0.1)' },
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
                  <Box
                    sx={{
                      color: 'primary.main',
                      mb: { xs: 1.5, sm: 2 },
                      display: 'flex',
                      justifyContent: 'center',
                      '& svg': { fontSize: { xs: 32, sm: 40 } },
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
                      fontSize: { xs: '1rem', sm: '1.125rem' },
                    }}
                  >
                    {benefit.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
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
        <Box sx={{ mb: { xs: 5, sm: 8 } }}>
          <Typography
            variant="h3"
            sx={{
              textAlign: 'center',
              fontWeight: 700,
              mb: { xs: 3, sm: 4 },
              color: 'text.primary',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            }}
          >
            How It Works
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            <Grid item xs={12} sm={4} md={4}>
              <Box sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    width: { xs: 48, sm: 60 },
                    height: { xs: 48, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    1
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Apply
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Share your experience and set your consultation rates. Add your Cal.com booking link when you&apos;re ready to take sessions.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <Box sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    width: { xs: 48, sm: 60 },
                    height: { xs: 48, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    2
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Get Approved
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Our team reviews your application and approves qualified partners.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={4}>
              <Box sx={{ textAlign: 'center', p: { xs: 2, sm: 3 } }}>
                <Box
                  sx={{
                    width: { xs: 48, sm: 60 },
                    height: { xs: 48, sm: 60 },
                    borderRadius: '50%',
                    bgcolor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                    3
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Get booked
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Pro+ founders request consultations. Accept or decline; after payment is confirmed, they schedule on your Cal.com page.
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
            borderRadius: { xs: '16px', sm: '24px' },
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
          }}
        >
          <Handshake sx={{ fontSize: { xs: 48, sm: 64 }, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' }, wordBreak: 'break-word' }}>
            Ready to Help Founders Succeed?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 3, sm: 4 }, maxWidth: '620px', mx: 'auto', fontSize: { xs: '0.875rem', sm: '1rem' }, px: { xs: 1, sm: 0 } }}>
            After your first confirmed consultation you get a <strong>30-day Pro Advisor trial</strong>, then <strong>$19/mo</strong> or <strong>$99/yr</strong> to stay bookable—listing your profile stays free.
          </Typography>
          {isSignedIn ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={handleGetStarted}
              sx={{
                px: { xs: 3, sm: 4 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
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
            <SignInButton mode="modal" afterSignInUrl="/advisor/landing" afterSignUpUrl="/advisor/landing">
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={() => setPendingOnboarding(true)}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '1rem', sm: '1.1rem' },
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


      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 2, sm: 3 },
            p: { xs: 1, sm: 2 },
            mx: { xs: 2, sm: 3 },
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              sx={{
                width: { xs: 64, sm: 80 },
                height: { xs: 64, sm: 80 },
                borderRadius: '50%',
                bgcolor: 'rgba(14, 165, 233, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pending sx={{ fontSize: { xs: 36, sm: 48 }, color: 'primary.main' }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Application Submitted!
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2, px: { xs: 2, sm: 3 } }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Thank you for your interest in becoming an Advisor.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Your application is now under review. We'll carefully evaluate your profile and get back to you via email once we've made a decision.
          </Typography>
          <Alert 
            severity="info" 
            icon={<CheckCircle />}
            sx={{ 
              textAlign: 'left',
              bgcolor: 'rgba(14, 165, 233, 0.05)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              What happens next?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
              • We'll review your LinkedIn/X profiles and experience<br/>
              • You'll receive an email notification when your status changes<br/>
              • Once approved, you'll appear in the marketplace for founders to discover
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setSuccessDialogOpen(false);
              navigate('/advisor/dashboard');
            }}
            sx={{
              px: { xs: 3, sm: 4 },
              py: { xs: 1.25, sm: 1.5 },
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              maxWidth: { xs: '100%', sm: 'auto' },
              background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
              },
            }}
          >
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvisorLanding;


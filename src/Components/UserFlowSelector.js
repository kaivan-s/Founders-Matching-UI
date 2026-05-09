import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Search,
  RocketLaunch,
  Handshake,
  ArrowForward,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import OnboardingDialog from './OnboardingDialog';
import FounderPlanNavTag from './FounderPlanNavTag';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';

const UserFlowSelector = ({ onFounderVerified }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null); // 'join' or 'create'

  const checkFounderOnboarding = async (flow) => {
    if (!user?.id) return;

    setCheckingOnboarding(true);
    setSelectedFlow(flow);
    
    try {
      const response = await fetch(`${API_BASE}/founders/onboarding-status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (!data.exists || !data.onboarding_completed || !data.has_purpose || !data.has_skills) {
          setShowOnboarding(true);
          setCheckingOnboarding(false);
          return;
        }
      }
      
      if (onFounderVerified) onFounderVerified();
      
      // Navigate based on selected flow
      if (flow === 'create') {
        navigate('/projects');
      } else {
        navigate('/discover');
      }
    } catch (error) {
      setShowOnboarding(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleJoinProject = () => checkFounderOnboarding('join');
  const handleCreateProject = () => checkFounderOnboarding('create');
  const handleAdvisor = () => navigate('/advisor/onboarding');

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (onFounderVerified) onFounderVerified();
    
    if (selectedFlow === 'create') {
      navigate('/projects');
    } else {
      navigate('/discover');
    }
  };

  const options = [
    {
      id: 'join',
      icon: <Search sx={{ fontSize: 48 }} />,
      title: 'Join a Project',
      description: 'Browse projects looking for co-founders. Apply with your skills and find the right fit.',
      action: handleJoinProject,
      color: TEAL,
    },
    {
      id: 'create',
      icon: <RocketLaunch sx={{ fontSize: 48 }} />,
      title: 'Create a Project',
      description: 'Have an idea? Post your project and find collaborators who believe in your vision.',
      action: handleCreateProject,
      color: NAVY,
    },
    {
      id: 'advisor',
      icon: <Handshake sx={{ fontSize: 48 }} />,
      title: 'Join as Advisor',
      description: 'Help founders succeed. Offer paid consultations and build your advisory network.',
      action: handleAdvisor,
      color: '#7c3aed', // Purple for advisor
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 4, md: 8 }, position: 'relative' }}>
      {/* Account menu (sign out lives here) — /home has no AppLayout, so we show Clerk’s user button explicitly */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 32 },
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <FounderPlanNavTag />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: { width: 36, height: 36 },
            },
          }}
        />
      </Box>

      <Container maxWidth="lg">
        {/* Page title block (not the global app bar — that only appears on sidebar routes) */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: SLATE_900,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
            }}
          >
            What brings you here today?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: SLATE_500,
              maxWidth: 480,
              mx: 'auto',
              fontSize: '1.05rem',
            }}
          >
            Choose your path. You can always explore other options later.
          </Typography>
        </Box>

        {/* Options Grid */}
        <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto' }}>
          {options.map((option) => (
            <Grid item xs={12} md={4} key={option.id}>
              <Card
                onClick={option.action}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: '2px solid',
                  borderColor: SLATE_200,
                  borderRadius: 3,
                  bgcolor: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: option.color,
                    boxShadow: `0 12px 24px ${alpha(option.color, 0.15)}`,
                    '& .option-icon': {
                      transform: 'scale(1.1)',
                      color: option.color,
                    },
                    '& .option-arrow': {
                      transform: 'translateX(4px)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  {/* Icon */}
                  <Box
                    className="option-icon"
                    sx={{
                      color: alpha(option.color, 0.7),
                      mb: 3,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {option.icon}
                  </Box>

                  {/* Title */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      color: SLATE_900,
                      fontSize: '1.25rem',
                    }}
                  >
                    {option.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: SLATE_500,
                      mb: 3,
                      lineHeight: 1.7,
                      minHeight: 60,
                    }}
                  >
                    {option.description}
                  </Typography>

                  {/* Action indicator */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: option.color,
                    }}
                  >
                    {checkingOnboarding && selectedFlow === option.id ? (
                      <CircularProgress size={24} sx={{ color: option.color }} />
                    ) : (
                      <>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          Get Started
                        </Typography>
                        <ArrowForward
                          className="option-arrow"
                          sx={{
                            fontSize: 18,
                            transition: 'all 0.25s ease',
                            opacity: 0.7,
                          }}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer note */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 5,
            color: SLATE_500,
            fontSize: '0.875rem',
          }}
        >
          Not sure yet? Start by browsing projects — you can create your own anytime.
        </Typography>
      </Container>

      {/* Onboarding Dialog */}
      <OnboardingDialog
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSelectAdvisorFlow={() => {
          setShowOnboarding(false);
          handleAdvisor();
        }}
      />
    </Box>
  );
};

export default UserFlowSelector;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignInButton, useUser } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Business,
  Handshake,
  ArrowForward,
} from '@mui/icons-material';

const SignInSelector = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const [selectedFlow, setSelectedFlow] = useState(null);

  // If already signed in, redirect based on selection
  React.useEffect(() => {
    if (isSignedIn && selectedFlow) {
      if (selectedFlow === 'founder') {
        navigate('/discover');
      } else if (selectedFlow === 'partner') {
        navigate('/partner/onboarding');
      }
    }
  }, [isSignedIn, selectedFlow, navigate]);

  const handleFounderClick = () => {
    setSelectedFlow('founder');
  };

  const handlePartnerClick = () => {
    setSelectedFlow('partner');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: '#1e3a8a' }}>
          Welcome to Co-Build
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Choose how you'd like to sign in
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <SignInButton mode="modal" afterSignInUrl={selectedFlow === 'founder' ? '/discover' : '/partner/onboarding'}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedFlow === 'founder' ? '2px solid #0d9488' : '1px solid #e2e8f0',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
                borderColor: '#0d9488',
              },
            }}
            onClick={handleFounderClick}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Business sx={{ fontSize: 40, color: '#0d9488' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Sign in as Founder
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find co-founders, create projects, and build partnerships
                  </Typography>
                </Box>
                <ArrowForward sx={{ color: '#0d9488' }} />
              </Box>
            </CardContent>
          </Card>
        </SignInButton>

        <SignInButton mode="modal" afterSignInUrl={selectedFlow === 'partner' ? '/partner/onboarding' : '/discover'}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: selectedFlow === 'partner' ? '2px solid #0d9488' : '1px solid #e2e8f0',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
                borderColor: '#0d9488',
              },
            }}
            onClick={handlePartnerClick}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Handshake sx={{ fontSize: 40, color: '#0d9488' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                    Sign in as Accountability Partner
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Help founders succeed and build your network
                  </Typography>
                </Box>
                <ArrowForward sx={{ color: '#0d9488' }} />
              </Box>
            </CardContent>
          </Card>
        </SignInButton>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          You can sign in with Google or email
        </Typography>
      </Box>
    </Container>
  );
};

export default SignInSelector;


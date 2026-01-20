import React from 'react';
import { Container, Box, Typography } from '@mui/material';

const PartnerOnboardingPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Partner Onboarding
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Partner onboarding page - coming soon
        </Typography>
      </Box>
    </Container>
  );
};

export default PartnerOnboardingPage;

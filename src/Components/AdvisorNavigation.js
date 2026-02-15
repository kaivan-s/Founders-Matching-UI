import React from 'react';
import { Box, Typography } from '@mui/material';
import { useUser, UserButton } from '@clerk/clerk-react';

const AdvisorNavigation = () => {
  const { user } = useUser();

  return (
    <Box sx={{ 
      flexShrink: 0,
      borderBottom: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      px: { xs: 2, sm: 4 },
      py: 1.5,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Guild Space
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Advisor Dashboard
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <UserButton />
      </Box>
    </Box>
  );
};

export default AdvisorNavigation;

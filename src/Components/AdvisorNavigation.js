import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';

const AdvisorNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  
  // Map routes to tab indices
  const getTabValue = () => {
    if (location.pathname.includes('/marketplace')) return 1;
    return 0; // Dashboard
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      navigate('/advisor/dashboard');
    } else if (newValue === 1) {
      navigate('/advisor/marketplace');
    }
  };

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
            mr: 2,
          }}
        >
          Guild Space
        </Typography>
        <Tabs 
          value={getTabValue()} 
          onChange={handleTabChange} 
          aria-label="advisor navigation tabs"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.9375rem',
              fontWeight: 500,
              minHeight: 56,
              px: 3,
              color: 'text.secondary',
              '&:hover': {
                color: 'text.primary',
              },
            },
            '& .Mui-selected': {
              color: '#14b8a6',
              fontWeight: 600,
            },
            '& .MuiTabs-indicator': {
              height: 2,
              backgroundColor: '#14b8a6',
              bottom: 0,
            },
          }}
        >
          <Tab label="Dashboard" />
          <Tab label="Marketplace" />
        </Tabs>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <UserButton />
      </Box>
    </Box>
  );
};

export default AdvisorNavigation;

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import AccountabilityPartnerLanding from './Components/AccountabilityPartnerLanding';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0ea5e9', // Trust Blue - Sky blue
      light: '#38bdf8',
      dark: '#0284c7',
    },
    secondary: {
      main: '#14b8a6', // Warm Teal
      light: '#2dd4bf',
      dark: '#0d9488',
    },
    success: {
      main: '#10b981', // Emerald
      light: '#34d399',
    },
    error: {
      main: '#ef4444', // Modern Red
      light: '#f87171',
    },
    warning: {
      main: '#f59e0b', // Amber
      light: '#fbbf24',
    },
    background: {
      default: '#f8fafc', // Cooler gray
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 12,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0284c7 0%, #0d9488 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
  },
});

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Routes>
            <Route path="*" element={
              <Box sx={{ 
                minHeight: '100vh',
                bgcolor: '#f8fafc',
                width: '100%',
                position: 'relative',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                <AccountabilityPartnerLanding />
              </Box>
            } />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}

export default App;

/* 
===========================================
TEMPORARY MINIMAL VERSION - FOR TESTING ACCOUNTABLE PARTNER ONBOARDING
===========================================

All other routes and components have been commented out.
This version only shows the AccountabilityPartnerLanding component.

To restore full functionality, uncomment the code below:

// import { useState, useEffect, useCallback } from 'react';
// import { SignedIn, SignedOut, SignIn, UserButton, useNavigate, useLocation, Navigate } from 'react-router-dom';
// import { Typography, CircularProgress, Tabs, Tab, Button, Chip, Badge } from '@mui/material';
// import { AccountBalanceWallet, AddCircleOutline } from '@mui/icons-material';
// import SwipeInterface from './Components/SwipeInterface';
// import InterestedPage from './Components/InterestedPage';
// import LandingPage from './Components/LandingPage';
// import PaymentHistory from './Components/PaymentHistory';
// import PurchaseSuccess from './Components/PurchaseSuccess';
// import WorkspacePage from './Components/WorkspacePage';
// import WorkspacesList from './Components/WorkspacesList';
// import MyProjects from './Components/MyProjects';
// import OnboardingDialog from './Components/OnboardingDialog';
// import PartnerOnboardingWizard from './Components/PartnerOnboardingWizard';
// import PartnerDashboard from './Components/PartnerDashboard';
// import PartnerWorkspaceView from './Components/PartnerWorkspaceView';
// import NewProjectDialog from './Components/NewProjectDialog';
// import PricingPage from './Components/PricingPage';

// ... rest of the original App.js code ...
*/

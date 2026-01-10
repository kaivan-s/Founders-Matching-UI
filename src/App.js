import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { SignedIn, SignedOut, SignIn, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { Typography, CircularProgress, Tabs, Tab, Button, Chip, Badge } from '@mui/material';
import { AccountBalanceWallet, AddCircleOutline, Feedback } from '@mui/icons-material';
import SwipeInterface from './Components/SwipeInterface';
import InterestedPage from './Components/InterestedPage';
import LandingPage from './Components/LandingPage';
import PaymentHistory from './Components/PaymentHistory';
import PurchaseSuccess from './Components/PurchaseSuccess';
import WorkspacePage from './Components/WorkspacePage';
import WorkspacesList from './Components/WorkspacesList';
import MyProjects from './Components/MyProjects';
import OnboardingDialog from './Components/OnboardingDialog';
import PartnerOnboardingWizard from './Components/PartnerOnboardingWizard';
import PartnerOnboardingPage from './Components/PartnerOnboardingPage';
import PartnerDashboard from './Components/PartnerDashboard';
import PartnerWorkspaceView from './Components/PartnerWorkspaceView';
import UserFlowSelector from './Components/UserFlowSelector';
import NewProjectDialog from './Components/NewProjectDialog';
import PricingPage from './Components/PricingPage';
import AccountabilityPartnerLanding from './Components/AccountabilityPartnerLanding';
import FeedbackHistory from './Components/FeedbackHistory';
import FeedbackDialog from './Components/FeedbackDialog';
import { API_BASE } from './config/api';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a', // Deep Royal Blue
      light: '#3b82f6',
      dark: '#172554',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c3aed', // Rich Violet
      light: '#8b5cf6',
      dark: '#5b21b6',
    },
    success: {
      main: '#059669', // Emerald
      light: '#10b981',
    },
    background: {
      default: '#f8fafc', // Slate 50
      paper: '#ffffff',
    },
    text: {
      primary: '#0f172a', // Slate 900
      secondary: '#64748b', // Slate 500
    },
    divider: '#e2e8f0',
  },
  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          border: '1px solid #f1f5f9',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.95rem',
          minHeight: 48,
        },
      },
    },
  },
});

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;
const clerkDomain = process.env.REACT_APP_CLERK_DOMAIN; // Optional: for custom domains

if (!clerkPubKey) {
  throw new Error(
    "Missing REACT_APP_CLERK_PUBLISHABLE_KEY environment variable. " +
    "Please set it in your .env file or environment configuration."
  );
}

function Header() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const fetchPlan = useCallback(async () => {
    if (!user || !user.id) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/billing/my-plan`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setPlanLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlan();
    }
  }, [user, fetchPlan]);

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      px: { xs: 3, sm: 4, md: 5 },
      py: 2.5,
      borderBottom: '1px solid',
      borderColor: 'divider',
      flexShrink: 0,
      bgcolor: 'background.paper',
    }}>
      <Typography 
        variant="h5" 
        component="h1" 
        onClick={() => navigate('/discover')}
        sx={{ 
          color: '#1e3a8a',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          cursor: 'pointer',
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          '&:hover': {
            color: '#2563eb',
          },
        }}
      >
        CoreTeam
      </Typography>
      <SignedIn>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            icon={<AccountBalanceWallet />}
            label={planLoading ? 'Loading...' : plan?.id === 'FREE' ? 'Free Plan' : plan?.id === 'PRO' ? 'Pro' : 'Pro+'}
            onClick={() => navigate('/pricing')}
            sx={{
              bgcolor: plan?.id === 'FREE' ? '#f1f5f9' : '#1e3a8a',
              color: plan?.id === 'FREE' ? '#475569' : '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              height: 40,
              borderRadius: '12px', // Consistent 12px radius
              px: 1,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: plan?.id === 'FREE' ? '#e2e8f0' : 'transparent',
              '& .MuiChip-icon': {
                color: plan?.id === 'FREE' ? '#64748b' : 'inherit',
              },
              '&:hover': {
                bgcolor: plan?.id === 'FREE' ? '#e2e8f0' : '#1e40af',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              },
              transition: 'all 0.2s ease',
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddCircleOutline />}
            onClick={() => setNewProjectDialogOpen(true)}
            sx={{
              bgcolor: '#0d9488',
              px: 3,
              py: 1,
              height: 40,
              fontSize: '0.875rem',
              borderRadius: '12px', // Consistent 12px radius
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#14b8a6',
                boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            New Project
          </Button>
          <Button
            variant="outlined"
            startIcon={<Feedback />}
            onClick={() => setFeedbackDialogOpen(true)}
            sx={{
              borderColor: '#e2e8f0',
              color: '#1e3a8a',
              px: 2,
              py: 0.75,
              height: 36,
              fontSize: '0.8125rem',
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                borderColor: '#0d9488',
                bgcolor: 'rgba(13, 148, 136, 0.04)',
              },
            }}
          >
            Feedback
          </Button>
          <UserButton />
        </Box>
        <NewProjectDialog
          open={newProjectDialogOpen}
          onClose={() => setNewProjectDialogOpen(false)}
          onProjectCreated={(project) => {
            setNewProjectDialogOpen(false);
            // Could also trigger a refresh of the discovery feed if needed
            window.dispatchEvent(new Event('projectCreated'));
          }}
        />
        <FeedbackDialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button 
            variant="contained"
            sx={{ 
              bgcolor: '#0d9488',
              px: 3,
              py: 1,
              height: 40,
              fontSize: '0.875rem',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              color: 'white',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: '#14b8a6',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
              },
            }}
          >
            Sign In
          </Button>
        </SignInButton>
      </SignedOut>
    </Box>
  );
}

function NavigationTabs() {
  const location = useLocation();
  const { user } = useUser();
  const [notificationCounts, setNotificationCounts] = useState({
    interests: 0,
    workspaces: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch notification counts
  const fetchNotificationCounts = useCallback(async () => {
    if (!user || !user.id) {
      setLoadingCounts(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/notifications/counts`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationCounts({
          interests: data.interests || 0,
          workspaces: data.workspaces || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching notification counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  }, [user]);

  // Fetch counts on mount and when user changes
  useEffect(() => {
    fetchNotificationCounts();
  }, [fetchNotificationCounts]);

  // Refresh counts when navigating to interested or workspaces tabs (mark as viewed)
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/interested') || path.startsWith('/workspaces')) {
      // Refresh counts after a short delay to allow page to load
      const timer = setTimeout(() => {
        fetchNotificationCounts();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, fetchNotificationCounts]);

  // Listen for events that might change notification counts
  useEffect(() => {
    const handleInterestAccepted = () => {
      setTimeout(() => fetchNotificationCounts(), 500);
    };
    const handleProjectCreated = () => {
      setTimeout(() => fetchNotificationCounts(), 500);
    };
    const handleInterestsViewed = () => {
      setTimeout(() => fetchNotificationCounts(), 500);
    };

    window.addEventListener('interestAccepted', handleInterestAccepted);
    window.addEventListener('projectCreated', handleProjectCreated);
    window.addEventListener('interestsViewed', handleInterestsViewed);

    return () => {
      window.removeEventListener('interestAccepted', handleInterestAccepted);
      window.removeEventListener('projectCreated', handleProjectCreated);
      window.removeEventListener('interestsViewed', handleInterestsViewed);
    };
  }, [fetchNotificationCounts]);

  // Map routes to tab indices
  const getTabValue = () => {
    const path = location.pathname;
    if (path.startsWith('/discover')) return 0;
    if (path.startsWith('/interested')) return 1;
    if (path.startsWith('/projects')) return 2;
    if (path.startsWith('/workspaces')) return 3;
    if (path.startsWith('/payments')) return 4;
    if (path.startsWith('/feedback') || path.startsWith('/my-feedback')) return 5;
    return 0;
  };

  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    const routes = ['/discover', '/interested', '/projects', '/workspaces', '/payments', '/my-feedback'];
    navigate(routes[newValue]);
  };

  return (
    <Box sx={{ 
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}>
      <Tabs 
        value={getTabValue()} 
        onChange={handleTabChange} 
        aria-label="navigation tabs"
        sx={{
          px: { xs: 2, sm: 4 },
          minHeight: 56,
          '& .MuiTab-root': {
            minHeight: 56,
            px: 3,
          },
          '& .MuiTabs-indicator': {
            height: 3,
            backgroundColor: '#0d9488',
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab label="Discover" />
        <Tab 
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75,
              whiteSpace: 'nowrap',
            }}>
              <span>Interested</span>
              {notificationCounts.interests > 0 && (
                <Box
                  sx={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: '20px',
                    height: '20px',
                    lineHeight: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {notificationCounts.interests}
                </Box>
              )}
            </Box>
          }
        />
        <Tab label="My Projects" />
        <Tab 
          label={
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.75,
              whiteSpace: 'nowrap',
            }}>
              <span>Workspaces</span>
              {notificationCounts.workspaces > 0 && (
                <Box
                  sx={{
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: '20px',
                    height: '20px',
                    lineHeight: '20px',
                    padding: '0 6px',
                    borderRadius: '10px',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {notificationCounts.workspaces}
                </Box>
              )}
            </Box>
          }
        />
        <Tab label="Payments" />
        <Tab label="Feedback" />
      </Tabs>
    </Box>
  );
}

// Wrapper component to handle loading/onboarding states
function RouteWrapper({ children, loading, partnerChecked, showPartnerOnboarding, showOnboarding, onboardingChecked, isPartner, isFounder, onPartnerOnboardingComplete, onOnboardingComplete, onSelectPartnerFlow }) {
  if (loading || !partnerChecked) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (showPartnerOnboarding) {
    return (
      <PartnerOnboardingWizard
        open={showPartnerOnboarding}
        onComplete={onPartnerOnboardingComplete}
        onClose={onPartnerOnboardingComplete}
      />
    );
  }

  if (onboardingChecked && showOnboarding && !isPartner && !isFounder) {
    return (
      <OnboardingDialog 
        open={showOnboarding} 
        onComplete={onOnboardingComplete}
        onSelectPartnerFlow={onSelectPartnerFlow}
      />
    );
  }

  // Always allow access to flow selector page
  const currentPath = window.location.pathname;
  if (currentPath === '/select-flow') {
    return children;
  }

  if (isPartner) {
    // Don't redirect if already on partner routes
    if (currentPath.startsWith('/partner/')) {
      return children;
    }
    return <Navigate to="/partner/dashboard" replace />;
  }

  // If user is not a founder and not on onboarding, redirect to flow selector
  if (!isFounder && !showOnboarding && !currentPath.startsWith('/partner/')) {
    return <Navigate to="/select-flow" replace />;
  }

  return children;
}

function AppContent() {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPartnerOnboarding, setShowPartnerOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isPartner, setIsPartner] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [partnerChecked, setPartnerChecked] = useState(false);
  const [showFlowSelector, setShowFlowSelector] = useState(false);

  const checkUserType = useCallback(async () => {
    try {
      // First check if user is an accountability partner
      const partnerResponse = await fetch(`${API_BASE}/accountability-partners/profile`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (partnerResponse.ok) {
        const partnerData = await partnerResponse.json();
        // Check if we got actual profile data (not null or empty)
        if (partnerData && partnerData !== null && Object.keys(partnerData).length > 0) {
          // User is a partner - show partner dashboard
          setIsPartner(true);
          setPartnerChecked(true);
          setLoading(false);
          return;
        }
      }

      // Not a partner (or profile doesn't exist yet), check founder status
      setIsPartner(false);
      const onboardingResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      const onboardingData = await onboardingResponse.json();
      
      // Check if user exists as founder
      if (onboardingData.exists) {
        setIsFounder(true);
        // Check if onboarding is needed
        if (!onboardingData.onboarding_completed || 
            !onboardingData.has_purpose || !onboardingData.has_skills) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        // User doesn't exist as founder
        setIsFounder(false);
        setShowOnboarding(false);
        
        // If user is not a partner either, show flow selector
        // (This will be handled by checking if they're on /select-flow route)
      }
      setOnboardingChecked(true);
      setPartnerChecked(true);
    } catch (error) {
      console.error('Error checking user type:', error);
      // If error, check founder onboarding to be safe
      try {
        const onboardingResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        const onboardingData = await onboardingResponse.json();
        if (!onboardingData.exists || !onboardingData.onboarding_completed || 
            !onboardingData.has_purpose || !onboardingData.has_skills) {
          setShowOnboarding(true);
        }
      } catch (e) {
        setShowOnboarding(true);
      }
      setOnboardingChecked(true);
      setPartnerChecked(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // If user is on flow selector page, show it without checking user type
      // This allows users to select their flow regardless of their current status
      if (location.pathname === '/select-flow') {
        setShowFlowSelector(true);
        setLoading(false);
        setPartnerChecked(true);
        setOnboardingChecked(true);
        return;
      }
      
      // If user is on partner onboarding page, allow them to stay there
      if (location.pathname === '/partner/onboarding') {
        checkUserType();
        return;
      }
      
      // For all other routes, check user type normally
      checkUserType();
    }
  }, [user, checkUserType, location.pathname]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // User can now access the main app
  };

  const handlePartnerOnboardingComplete = async () => {
    setShowPartnerOnboarding(false);
    setShowOnboarding(false);
    
    // Refresh user type to ensure profile was created
    await checkUserType();
  };

  const handleSelectPartnerFlow = () => {
    setShowOnboarding(false);
    setShowPartnerOnboarding(true);
  };

  return (
    <>
      {/* Always render Routes - don't conditionally render them */}
      <Routes>
        {/* Flow selector route - shown when user is neither founder nor partner */}
        <Route path="/select-flow" element={
          loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
              <CircularProgress />
            </Box>
          ) : (
            <UserFlowSelector />
          )
        } />
        
        {/* Partner routes */}
        <Route path="/partner/dashboard" element={
          loading || !partnerChecked ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : isPartner ? (
            <PartnerDashboard />
          ) : (
            <Navigate to="/discover" replace />
          )
        } />
        <Route path="/partner/workspaces/:workspaceId" element={
          loading || !partnerChecked ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : isPartner ? (
            <PartnerWorkspaceView />
          ) : (
            <Navigate to="/discover" replace />
          )
        } />
        <Route path="/partner/onboarding" element={
          <PartnerOnboardingPage />
        } />
        <Route path="/partner/*" element={<Navigate to="/partner/dashboard" replace />} />
        
        {/* Main app routes */}
        <Route path="/discover" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <SwipeInterface />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/interested" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <InterestedPage />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/projects" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <MyProjects />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/workspaces" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <WorkspacesList />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/workspaces/:workspaceId/*" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <WorkspacePage />
          </RouteWrapper>
        } />
        <Route path="/payments" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <PaymentHistory />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/pricing" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <PricingPage />
            </Box>
          </RouteWrapper>
        } />
        <Route path="/feedback" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <FeedbackHistory />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/my-feedback" element={
          <RouteWrapper
            loading={loading}
            partnerChecked={partnerChecked}
            showPartnerOnboarding={showPartnerOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isPartner={isPartner}
            isFounder={isFounder}
            onPartnerOnboardingComplete={handlePartnerOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectPartnerFlow={handleSelectPartnerFlow}
          >
            <Box sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <NavigationTabs />
              <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <FeedbackHistory />
              </Box>
            </Box>
          </RouteWrapper>
        } />
        <Route path="/accountable_partner" element={
          <Box sx={{ 
            minHeight: '100vh',
            bgcolor: '#f8fafc',
            width: '100%',
            position: 'relative'
          }}>
            <AccountabilityPartnerLanding />
          </Box>
        } />
        <Route path="/" element={<Navigate to="/select-flow" replace />} />
      </Routes>
      
      {showPurchaseSuccess && (
        <PurchaseSuccess onContinue={() => setShowPurchaseSuccess(false)} />
      )}
    </>
  );
}

function App() {
  // Configure ClerkProvider with custom domain for production
  // When using a custom Clerk domain, you must specify it here
  const clerkConfig = {
    publishableKey: clerkPubKey,
    domain: clerkDomain || 'clerk.founder-match.in', // Use custom domain if provided, otherwise default
    signInUrl: '/',
    signUpUrl: '/',
    afterSignInUrl: '/select-flow',
    afterSignUpUrl: '/select-flow'
  };

  return (
    <ClerkProvider {...clerkConfig}>
      <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SignedIn>
          <AppWithHeader />
        </SignedIn>
        
        <SignedOut>
          <Routes>
            {/* Accountability Partner Landing Page */}
            <Route path="/accountable_partner" element={
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
            {/* Normal Landing Page - catch-all for signed-out users */}
            <Route path="*" element={
              <Box sx={{ 
                minHeight: '100vh',
                bgcolor: '#f8fafc',
                width: '100%',
                position: 'relative'
              }}>
                <LandingPage />
              </Box>
            } />
          </Routes>
        </SignedOut>
      </ThemeProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}

function AppWithHeader() {
  const location = useLocation();
  
  // Hide global header for partner routes (partner has its own navigation)
  // Also hide for accountable_partner route (public landing page)
  // Hide for select-flow page (both flows have their own headers)
  const isPartnerRoute = location.pathname.startsWith('/partner');
  const isAccountablePartnerRoute = location.pathname === '/accountable_partner';
  const isSelectFlowRoute = location.pathname === '/select-flow';
  const showHeader = !isPartnerRoute && !isAccountablePartnerRoute && !isSelectFlowRoute;

  return (
    <Box sx={{ 
      height: '100vh', 
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header - only show for non-partner routes */}
      {showHeader && <Header />}
      
      <Box sx={{ 
        flex: 1, 
        overflow: (isAccountablePartnerRoute || isSelectFlowRoute) ? 'auto' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {isAccountablePartnerRoute ? (
          <AccountabilityPartnerLanding />
        ) : (
          <AppContent />
        )}
      </Box>
    </Box>
  );
}

export default App;

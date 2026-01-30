import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { SignedIn, SignedOut, SignIn, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { Typography, CircularProgress, Tabs, Tab, Button, Chip, Badge, Box as MuiBox } from '@mui/material';
import { AccountBalanceWallet, AddCircleOutline, Feedback, Business, Handshake, SwapHoriz } from '@mui/icons-material';
import SwipeInterface from './Components/SwipeInterface';
import InterestedPage from './Components/InterestedPage';
import LandingPage from './Components/LandingPage';
import PaymentHistory from './Components/PaymentHistory';
import PurchaseSuccess from './Components/PurchaseSuccess';
import WorkspacePage from './Components/WorkspacePage';
import WorkspacesList from './Components/WorkspacesList';
import MyProjects from './Components/MyProjects';
import OnboardingDialog from './Components/OnboardingDialog';
import AdvisorOnboarding from './Components/AdvisorOnboarding';
import AdvisorDashboard from './Components/AdvisorDashboard';
import AdvisorWorkspaceView from './Components/AdvisorWorkspaceView';
import UserFlowSelector from './Components/UserFlowSelector';
import NewProjectDialog from './Components/NewProjectDialog';
import PricingPage from './Components/PricingPage';
import AdvisorLanding from './Components/AdvisorLanding';
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
  const location = useLocation();
  const [plan, setPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [isAdvisorMode, setIsAdvisorMode] = useState(false);
  
  // Detect if we're in advisor mode based on route
  useEffect(() => {
    setIsAdvisorMode(location.pathname.startsWith('/advisor/'));
  }, [location.pathname]);

  const isHomePage = location.pathname === '/home';

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
    <>
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
          onClick={() => navigate('/home')}
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
          Guild Space
        </Typography>
        <SignedIn>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Simplified header for home page - only show profile icon */}
            {isHomePage ? (
              <UserButton />
            ) : (
              <>
                {/* Mode Switcher */}
                <Button
                  variant="outlined"
                  startIcon={isAdvisorMode ? <Business /> : <Handshake />}
                  endIcon={<SwapHoriz />}
                  onClick={() => {
                    if (isAdvisorMode) {
                      // Switch to founder mode - go to discover
                      navigate('/discover');
                    } else {
                      // Switch to advisor mode - go to advisor dashboard
                      navigate('/advisor/dashboard');
                    }
                  }}
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
                  {isAdvisorMode ? 'Founder Mode' : 'Advisor Mode'}
                </Button>

                {/* Founder Mode Buttons */}
                {!isAdvisorMode && (
                  <>
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
                        borderRadius: '12px',
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
                        borderRadius: '12px',
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
                  </>
                )}

                <UserButton />
              </>
            )}
          </Box>
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
      {/* Advisor Navigation Tabs - show below header when in advisor mode */}
      {isAdvisorMode && (
        <Box sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          px: { xs: 2, sm: 4 },
          flexShrink: 0,
        }}>
          <Tabs 
            value={location.pathname.includes('/marketplace') ? 1 : 0}
            onChange={(e, newValue) => {
              if (newValue === 0) {
                navigate('/advisor/dashboard');
              } else if (newValue === 1) {
                navigate('/advisor/marketplace');
              }
            }}
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
      )}
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
    </>
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
function RouteWrapper({ children, loading, advisorChecked, showAdvisorOnboarding, showOnboarding, onboardingChecked, isAdvisor, isFounder, onAdvisorOnboardingComplete, onOnboardingComplete, onSelectAdvisorFlow }) {
  if (loading || !advisorChecked) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (showAdvisorOnboarding) {
    return (
      <Navigate to="/advisor/onboarding" replace />
    );
  }

  // Always allow access to home page
  const currentPath = window.location.pathname;
  if (currentPath === '/home') {
    return children;
  }

  // IMPORTANT: Don't show founder onboarding if user is on advisor routes
  // This prevents advisors from seeing founder onboarding questionnaire
  const isOnAdvisorRoute = currentPath.startsWith('/advisor/');
  if (onboardingChecked && showOnboarding && !isAdvisor && !isFounder && !isOnAdvisorRoute) {
    return (
      <OnboardingDialog 
        open={showOnboarding} 
        onComplete={onOnboardingComplete}
        onSelectAdvisorFlow={onSelectAdvisorFlow}
      />
    );
  }

  if (isAdvisor) {
    // Don't redirect if already on advisor routes
    if (currentPath.startsWith('/advisor/')) {
      return children;
    }
    // Allow access to founder routes even if user is an advisor (mode switching)
    // Founder routes: /discover, /projects, /workspaces, /interested, /pricing, /my-feedback
    const founderRoutes = ['/discover', '/projects', '/workspaces', '/interested', '/pricing', '/my-feedback'];
    if (founderRoutes.some(route => currentPath.startsWith(route))) {
      return children;
    }
    // Otherwise redirect to advisor dashboard
    return <Navigate to="/advisor/dashboard" replace />;
  }

  // If user is not a founder and not on onboarding, redirect to home
  if (!isFounder && !showOnboarding && !currentPath.startsWith('/advisor/')) {
    return <Navigate to="/home" replace />;
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
  const [showAdvisorOnboarding, setShowAdvisorOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [advisorChecked, setAdvisorChecked] = useState(false);
  const [showFlowSelector, setShowFlowSelector] = useState(false);

  const checkUserType = useCallback(async () => {
    try {
      // IMPORTANT: Only check for advisor if user is on advisor routes
      // This prevents founders from being incorrectly identified as advisors
      const isOnAdvisorRoute = location.pathname.startsWith('/advisor/');
      
      // Only check advisor profile if on advisor routes
      if (isOnAdvisorRoute) {
        const advisorResponse = await fetch(`${API_BASE}/advisors/profile`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });

        if (advisorResponse.ok) {
          const advisorData = await advisorResponse.json();
          console.log('Advisor profile response:', advisorData);
          // Check if we got actual profile data (not null or empty)
          // Handle both null and empty object cases
          if (advisorData !== null && advisorData !== undefined && typeof advisorData === 'object' && Object.keys(advisorData).length > 0) {
            console.log('Advisor profile found, setting isAdvisor to true');
            // User is an advisor - show advisor dashboard
            setIsAdvisor(true);
            setIsFounder(false); // Don't check founder status if they're an advisor
            setShowOnboarding(false); // Don't show founder onboarding for advisors
            setShowAdvisorOnboarding(false); // Don't show advisor onboarding if profile exists
            setAdvisorChecked(true);
            setOnboardingChecked(true);
            setLoading(false);
            
            // If user is on onboarding page but profile exists, redirect to dashboard
            if (location.pathname === '/advisor/onboarding') {
              navigate('/advisor/dashboard', { replace: true });
            }
            return;
          } else {
            console.log('Advisor profile check: profile is null/empty, advisorData:', advisorData);
          }
        } else {
          console.log('Advisor profile check: response not ok, status:', advisorResponse.status);
        }
      } else {
        // Not on advisor route - skip advisor check
        setIsAdvisor(false);
      }

      // Skip advisor retry check if not on advisor routes
      if (isOnAdvisorRoute) {
        // Check if advisor profile might exist but query failed - verify by checking advisor_profiles table directly
        // This handles edge cases where the API might return null even though a profile exists
        let hasAdvisorProfile = false;
        try {
          // Try to check if there's an advisor profile by checking the founder profile first
          // If founder exists with onboarding_completed=false and has advisor-like data, they might be an advisor
          const founderCheckResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
            headers: {
              'X-Clerk-User-Id': user.id,
            },
          });
          if (founderCheckResponse.ok) {
            const founderData = await founderCheckResponse.json();
            // If founder exists but onboarding is incomplete, and they're trying to access advisor routes,
            // they might be an advisor whose profile check failed
            if (founderData.exists && !founderData.onboarding_completed && location.pathname.startsWith('/advisor/')) {
              // Re-check advisor profile - might be a timing issue
              const retryAdvisorResponse = await fetch(`${API_BASE}/advisors/profile`, {
                headers: {
                  'X-Clerk-User-Id': user.id,
                },
              });
              if (retryAdvisorResponse.ok) {
                const retryAdvisorData = await retryAdvisorResponse.json();
                if (retryAdvisorData !== null && retryAdvisorData !== undefined && typeof retryAdvisorData === 'object' && Object.keys(retryAdvisorData).length > 0) {
                  hasAdvisorProfile = true;
                  setIsAdvisor(true);
                  setIsFounder(false);
                  setShowOnboarding(false);
                  setAdvisorChecked(true);
                  setOnboardingChecked(true);
                  setLoading(false);
                  return;
                }
              }
            }
          }
        } catch (e) {
          // Ignore errors in this check
          console.log('Error in advisor profile retry check:', e);
        }
      }

      // Not an advisor (or profile doesn't exist yet), check founder status
      // BUT: Don't show founder onboarding if user is on advisor routes (they're likely an advisor)
      if (!isOnAdvisorRoute) {
        setIsAdvisor(false);
        
        const onboardingResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        const onboardingData = await onboardingResponse.json();
        
        // Check if user exists as founder
        if (onboardingData.exists) {
          setIsFounder(true);
          // IMPORTANT: Don't show founder onboarding if user is on advisor routes
          // This prevents advisors from seeing founder onboarding questionnaire
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
          
          // If user is not an advisor either, show flow selector
          // (This will be handled by checking if they're on /home route)
        }
      } else {
        // On advisor route but no advisor profile found - don't check founder status
        setIsFounder(false);
        setShowOnboarding(false);
      }
      setOnboardingChecked(true);
      setAdvisorChecked(true);
    } catch (error) {
      console.error('Error checking user type:', error);
      // If error, check founder onboarding to be safe
      // BUT: Don't show onboarding if user is on advisor routes
      const isOnAdvisorRoute = location.pathname.startsWith('/advisor/');
      if (!isOnAdvisorRoute) {
        setIsAdvisor(false);
        try {
          const onboardingResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
            headers: {
              'X-Clerk-User-Id': user.id,
            },
          });
          const onboardingData = await onboardingResponse.json();
          if (onboardingData.exists) {
            setIsFounder(true);
            if (!onboardingData.onboarding_completed || 
                !onboardingData.has_purpose || !onboardingData.has_skills) {
              setShowOnboarding(true);
            }
          } else {
            setIsFounder(false);
          }
        } catch (e) {
          setIsFounder(false);
          setShowOnboarding(true);
        }
      } else {
        setIsAdvisor(false);
        setIsFounder(false);
      }
      setOnboardingChecked(true);
      setAdvisorChecked(true);
    } finally {
      setLoading(false);
    }
  }, [user, location.pathname, navigate]);

  useEffect(() => {
    if (user) {
      // If user is on flow selector page, show it without checking user type
      // This allows users to select their flow regardless of their current status
      if (location.pathname === '/home') {
        setShowFlowSelector(true);
        setLoading(false);
        setAdvisorChecked(true);
        setOnboardingChecked(true);
        setIsFounder(false); // Reset founder status on flow selector
        return;
      }
      
      // If user is on advisor onboarding page, skip user type check
      // AdvisorOnboarding will handle its own logic
      if (location.pathname === '/advisor/onboarding') {
        setLoading(false);
        setAdvisorChecked(true);
        setOnboardingChecked(true);
        return;
      }
      
      // If user is on advisor dashboard/marketplace routes, prioritize advisor check
      // and don't show founder onboarding even if founder profile is incomplete
      if (location.pathname.startsWith('/advisor/')) {
        checkUserType();
        return;
      }
      
      // For founder routes (like /discover), check founder status first, not partner
      // This prevents founders from being incorrectly identified as partners
      if (location.pathname === '/discover' || location.pathname.startsWith('/workspace') || location.pathname.startsWith('/projects')) {
        // Check founder status first for founder routes
        checkFounderStatus();
        return;
      }
      
      // For all other routes, check user type normally
      checkUserType();
    }
  }, [user, checkUserType, location.pathname]);

  const checkFounderStatus = useCallback(async () => {
    try {
      const onboardingResponse = await fetch(`${API_BASE}/founders/onboarding-status`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      const onboardingData = await onboardingResponse.json();
      
      if (onboardingData.exists) {
        setIsFounder(true);
        if (!onboardingData.onboarding_completed || 
            !onboardingData.has_purpose || !onboardingData.has_skills) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        setIsFounder(false);
        setShowOnboarding(false);
      }
      setOnboardingChecked(true);
      setAdvisorChecked(true);
    } catch (error) {
      console.error('Error checking founder status:', error);
      setOnboardingChecked(true);
      setAdvisorChecked(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // User can now access the main app
  };

  const handleAdvisorOnboardingComplete = async () => {
    setShowAdvisorOnboarding(false);
    setShowOnboarding(false);
    
    // Refresh user type to ensure profile was created
    await checkUserType();
  };

  const handleSelectAdvisorFlow = () => {
    setShowOnboarding(false);
    navigate('/advisor/onboarding');
  };

  return (
    <>
      {/* Always render Routes - don't conditionally render them */}
      <Routes>
        {/* Home route - shown when user is neither founder nor advisor */}
        <Route path="/home" element={
          loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
              <CircularProgress />
            </Box>
          ) : (
            <UserFlowSelector />
          )
        } />
        
        {/* Advisor routes */}
        <Route path="/advisor/marketplace" element={
          loading || !advisorChecked ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            // Always render AdvisorDashboard - it will handle checking for profile and redirecting if needed
            <AdvisorDashboard />
          )
        } />
        <Route path="/advisor/dashboard" element={
          loading || !advisorChecked ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            // Always render AdvisorDashboard - it will handle checking for profile and redirecting if needed
            <AdvisorDashboard />
          )
        } />
        <Route path="/advisor/workspaces/:workspaceId" element={
          loading || !advisorChecked ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : isAdvisor ? (
            <AdvisorWorkspaceView />
          ) : (
            <Navigate to="/discover" replace />
          )
        } />
        <Route path="/advisor/onboarding" element={
          <AdvisorOnboarding onComplete={handleAdvisorOnboardingComplete} />
        } />
        <Route path="/advisor/*" element={<Navigate to="/advisor/dashboard" replace />} />
        
        {/* Main app routes */}
        <Route path="/discover" element={
          <RouteWrapper
            loading={loading}
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
          >
            <WorkspacePage />
          </RouteWrapper>
        } />
        <Route path="/payments" element={
          <RouteWrapper
            loading={loading}
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
            advisorChecked={advisorChecked}
            showAdvisorOnboarding={showAdvisorOnboarding}
            showOnboarding={showOnboarding}
            onboardingChecked={onboardingChecked}
            isAdvisor={isAdvisor}
            isFounder={isFounder}
            onAdvisorOnboardingComplete={handleAdvisorOnboardingComplete}
            onOnboardingComplete={handleOnboardingComplete}
            onSelectAdvisorFlow={handleSelectAdvisorFlow}
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
        <Route path="/advisor/landing" element={
          <Box sx={{ 
            minHeight: '100vh',
            bgcolor: '#f8fafc',
            width: '100%',
            position: 'relative'
          }}>
            <AdvisorLanding />
          </Box>
        } />
        <Route path="/" element={<Navigate to="/home" replace />} />
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
    domain: clerkDomain || 'clerk.guild-space.co', // Use custom domain if provided, otherwise default
    signInUrl: '/',
    signUpUrl: '/',
    afterSignInUrl: '/home',
    afterSignUpUrl: '/home'
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
            {/* Advisor Landing Page */}
            <Route path="/advisor/landing" element={
              <Box sx={{ 
                minHeight: '100vh',
                bgcolor: '#f8fafc',
                width: '100%',
                position: 'relative',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}>
                <AdvisorLanding />
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
  
  // Hide header only for public landing pages
  const isAdvisorLandingRoute = location.pathname === '/advisor/landing';
  const isHomeRoute = location.pathname === '/home';
  const showHeader = !isAdvisorLandingRoute; // Show header on all pages except public landing

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
        overflow: (isAdvisorLandingRoute || isHomeRoute) ? 'auto' : 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {isAdvisorLandingRoute ? (
          <AdvisorLanding />
        ) : (
          <AppContent />
        )}
      </Box>
    </Box>
  );
}

export default App;

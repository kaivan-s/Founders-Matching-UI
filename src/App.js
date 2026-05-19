import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { CircularProgress } from '@mui/material';
import SeekerDiscovery from './Components/SeekerDiscovery';
import OwnerApplications from './Components/OwnerApplications';
import MyApplications from './Components/MyApplications';
import LandingPage from './Components/LandingPage';
import PaymentHistory from './Components/PaymentHistory';
import WorkspacePage from './Components/WorkspacePage';
import WorkspacesList from './Components/WorkspacesList';
import MyProjects from './Components/MyProjects';
import OnboardingDialog from './Components/OnboardingDialog';
import AdvisorOnboarding from './Components/AdvisorOnboardingQuick';
import AdvisorDashboard from './Components/AdvisorDashboard';
// AdvisorWorkspaceView removed - advisors no longer join workspaces
import UserFlowSelector from './Components/UserFlowSelector';
import PricingPage from './Components/PricingPage';
import AdvisorLanding from './Components/AdvisorLanding';
import FeedbackHistory from './Components/FeedbackHistory';
import PrivacyPolicy from './Components/PrivacyPolicy';
import TermsAndConditions from './Components/TermsAndConditions';
import FAQ from './Components/FAQ';
import AdminAdvisors from './Components/AdminAdvisors';
import ProfilePage from './Components/ProfilePage';
import FounderDatePage from './Components/FounderDatePage';
import ConsultationsPage from './Components/ConsultationsPage';
import CreditsPage from './Components/CreditsPage';
import AppLayout from './Components/AppLayout';
import { API_BASE } from './config/api';
import { identifyUser, resetUser } from './config/posthog';
import './App.css';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

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
    // Founder routes: /discover, /projects, /workspaces, /applications, /pricing, /my-feedback
    const founderRoutes = ['/discover', '/find-project', '/applications', '/my-applications', '/projects', '/workspaces', '/pricing', '/my-feedback'];
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAdvisorOnboarding, setShowAdvisorOnboarding] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [isAdvisor, setIsAdvisor] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [advisorChecked, setAdvisorChecked] = useState(false);
  const [showFlowSelector, setShowFlowSelector] = useState(false);

  // Check for stored redirect URL after sign-in and navigate there
  useEffect(() => {
    if (user && location.pathname === '/home') {
      const redirectUrl = localStorage.getItem('redirectAfterSignIn');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterSignIn');
        navigate(redirectUrl, { replace: true });
      }
    }
  }, [user, location.pathname, navigate]);

  // Identify user with PostHog when logged in
  useEffect(() => {
    if (user) {
      identifyUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        created_at: user.createdAt,
      });
    } else {
      resetUser();
    }
  }, [user]);

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
          // Check if we got actual profile data (not null or empty)
          // Handle both null and empty object cases
          if (advisorData !== null && advisorData !== undefined && typeof advisorData === 'object' && Object.keys(advisorData).length > 0) {
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
          }
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
          // Error in advisor profile retry check
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
      // Error checking user type
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
        // Don't reset isFounder here - it causes a race condition when navigating to /discover
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
        setLoading(true);
        checkUserType();
        return;
      }
      
      // For founder routes, check founder status first, not partner
      // This prevents founders from being incorrectly identified as partners
      const founderRoutePrefixes = ['/discover', '/find-project', '/applications', '/my-applications', '/workspace', '/projects', '/consultations', '/payments', '/pricing', '/my-feedback', '/feedback'];
      if (founderRoutePrefixes.some(prefix => location.pathname.startsWith(prefix))) {
        // Set loading to true to prevent RouteWrapper from redirecting before check completes
        setLoading(true);
        // Check founder status first for founder routes
        checkFounderStatus();
        return;
      }
      
      // For all other routes, check user type normally
      setLoading(true);
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
      // Error checking founder status
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
            <UserFlowSelector onFounderVerified={() => {
              setIsFounder(true);
              setOnboardingChecked(true);
              setAdvisorChecked(true);
              setLoading(false);
            }} />
          )
        } />
        
        {/* Advisor routes */}
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
        {/* AdvisorWorkspaceView route removed - advisors no longer join workspaces */}
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <SeekerDiscovery />
            </Box>
          </RouteWrapper>
        } />
        {/* Legacy route redirect */}
        <Route path="/find-project" element={<Navigate to="/discover" replace />} />
        <Route path="/applications" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <OwnerApplications />
            </Box>
          </RouteWrapper>
        } />
        <Route path="/my-applications" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <MyApplications />
            </Box>
          </RouteWrapper>
        } />
        {/* Legacy route redirect */}
        <Route path="/interested" element={<Navigate to="/applications" replace />} />
        <Route path="/access-requests" element={<Navigate to="/applications" replace />} />
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <MyProjects />
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <WorkspacesList />
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
        <Route path="/consultations" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <ConsultationsPage />
            </Box>
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <PaymentHistory />
            </Box>
          </RouteWrapper>
        } />
        <Route path="/credits" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <CreditsPage />
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <FeedbackHistory />
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <FeedbackHistory />
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
        <Route path="/profile" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <ProfilePage />
            </Box>
          </RouteWrapper>
        } />
        <Route path="/founder-dates/:founderDateId" element={
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
            <Box sx={{ height: '100%', overflow: 'auto' }}>
              <FounderDatePage />
            </Box>
          </RouteWrapper>
        } />
        <Route path="/admin" element={<AdminAdvisors />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
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
      <ScrollToTop />
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
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/faq" element={<FAQ />} />
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

  // Full-width pages only: home chooser, advisor marketing, legal. In-app pages (including advisor onboarding) use sidebar.
  const noLayoutRoutes = ['/home', '/advisor/landing', '/privacy-policy', '/terms-and-conditions', '/faq'];
  const isNoLayoutRoute = noLayoutRoutes.includes(location.pathname);

  // For routes without sidebar layout
  if (isNoLayoutRoute) {
    return (
      <Box sx={{ 
        height: '100vh', 
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto'
      }}>
        <AppContent />
      </Box>
    );
  }

  // For main app routes with sidebar layout
  return (
    <AppLayout>
      <AppContent />
    </AppLayout>
  );
}

export default App;

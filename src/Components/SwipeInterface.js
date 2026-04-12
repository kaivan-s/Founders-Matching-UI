import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useTheme, useMediaQuery, alpha } from '@mui/material';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tabs,
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import { 
  Handshake, 
  Close, 
  LocationOn, 
  Language, 
  LinkedIn,
  Business,
  Clear,
  Psychology,
  ArrowBack,
  ArrowForward,
  Search,
  Tune,
  Lock,
  LockOpen,
  HourglassEmpty,
  Send,
  Rocket,
  Add,
  CheckCircle
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import FilterBar from '../Components/FilterBar';
import { PROJECT_COMPATIBILITY_QUESTIONS } from './ProjectCompatibilityQuiz';
import AdvancedSearch from './AdvancedSearch';
import DiscoveryPreferencesDialog from './DiscoveryPreferencesDialog';
import NewProjectDialog from './NewProjectDialog';
import { API_BASE } from '../config/api';

const SwipeInterface = () => {
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false); // Subtle loading for filters
  const [error, setError] = useState(null);
  const [swiping, setSwiping] = useState(null);
  const [selectedFounder, setSelectedFounder] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [compatibilityTab, setCompatibilityTab] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0); // Track current card index
  const [swipeDirection, setSwipeDirection] = useState(null); // Track swipe animation direction
  const [offset, setOffset] = useState(0); // Track pagination offset
  const [hasMore, setHasMore] = useState(true); // Track if more projects are available
  const [loadingMore, setLoadingMore] = useState(false); // Track if loading more projects
  const [filters, setFilters] = useState({
    search: '',
    skills: [],
    location: '',
    project_stage: '',
    looking_for: ''
  });
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('discoveryPreferences');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [compatibilityPromptOpen, setCompatibilityPromptOpen] = useState(false); // Prompt for paid users without preferences
  const [hasCompatibilityPrefs, setHasCompatibilityPrefs] = useState(null); // null = loading, true/false
  const [plan, setPlan] = useState(null);
  const [swipeLimit, setSwipeLimit] = useState(null); // {can_swipe, current_count, max_allowed, remaining}
  
  // Request Access state
  const [requestAccessDialogOpen, setRequestAccessDialogOpen] = useState(false);
  const [requestAccessProject, setRequestAccessProject] = useState(null);
  const [requestAccessMessage, setRequestAccessMessage] = useState('');
  const [requestAccessLoading, setRequestAccessLoading] = useState(false);
  const [accessRequestLimit, setAccessRequestLimit] = useState(null); // {can_request, current_count, max_allowed, remaining}
  
  // First-time user project creation prompt
  const [userProjects, setUserProjects] = useState(null); // null = loading, [] = no projects
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [skippedProjectPrompt, setSkippedProjectPrompt] = useState(() => {
    try {
      return localStorage.getItem('skippedProjectPrompt') === 'true';
    } catch {
      return false;
    }
  });

  const fetchUserProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setUserProjects(data || []);
      } else {
        setUserProjects([]);
      }
    } catch (err) {
      setUserProjects([]);
    }
  }, [user]);

  const fetchSwipeLimit = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/founders/swipe-limit`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSwipeLimit(data);
      }
    } catch (err) {
    }
  }, [user]);

  const fetchAccessRequestLimit = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/access-request-limit`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAccessRequestLimit(data);
      }
    } catch (err) {
    }
  }, [user]);

  const fetchFounders = useCallback(async (currentFilters, currentPreferences, currentOffset = 0, append = false) => {
    if (!user || !user.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (currentFilters?.search) params.append('search', currentFilters.search);
      if (currentFilters?.location) params.append('location', currentFilters.location);
      if (currentFilters?.project_stage) params.append('project_stage', currentFilters.project_stage);
      if (currentFilters?.looking_for) params.append('looking_for', currentFilters.looking_for);
      if (currentFilters?.skills) {
        currentFilters.skills.forEach(skill => params.append('skills', skill));
      }
      
      // Add preferences to the request
      if (currentPreferences && Object.keys(currentPreferences).length > 0) {
        params.append('preferences', JSON.stringify(currentPreferences));
      }
      
      // Add pagination parameters
      params.append('offset', currentOffset.toString());
      params.append('limit', '20'); // Fetch 20 at a time
      
      // Add discover parameter to get discoverable projects (not user's own)
      params.append('discover', 'true');
      
      const queryString = params.toString();
      const url = `${API_BASE}/projects${queryString ? '?' + queryString : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch founders');
      }
      const data = await response.json();
      
      // Debug: Log preferences and scores
      if (currentPreferences && Object.keys(currentPreferences).length > 0) {
        // Projects received with scores
      }
      
      if (append) {
        // Append new projects to existing list
        setFounders(prev => [...prev, ...data]);
        // Check if we got fewer than requested (means no more available)
        if (data.length < 20) {
          setHasMore(false);
        }
      } else {
        // Replace existing list (initial load or filter change)
        setFounders(data);
        setOffset(data.length);
        setHasMore(data.length >= 20); // If we got 20, there might be more
      }
      
      setLoading(false);
      return data; // Return for promise chaining
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err; // Re-throw for promise chaining
    }
  }, [user]);

  const fetchMoreFounders = useCallback(async () => {
    if (!user || !user.id || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      // Use current offset to fetch next batch
      const newData = await fetchFounders(filters, preferences, offset, true);
      if (newData && newData.length > 0) {
        setOffset(prev => prev + newData.length);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false); // Stop trying if there's an error
      // Don't show error to user for background loading
    } finally {
      setLoadingMore(false);
    }
  }, [user, filters, preferences, offset, hasMore, loadingMore, fetchFounders]);

  const fetchPlan = useCallback(async () => {
    if (!user || !user.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/my-plan`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
        return data;
      }
    } catch (err) {
    }
    return null;
  }, [user]);

  const checkCompatibilityPreferences = useCallback(async (userPlan) => {
    if (!user?.id) return;
    
    // Only check for paid users
    const isPaid = userPlan?.id === 'PRO' || userPlan?.id === 'PRO_PLUS';
    if (!isPaid) {
      setHasCompatibilityPrefs(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/founders/discovery-preferences`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (response.ok) {
        const data = await response.json();
        const hasPrefs = data.has_preferences || false;
        setHasCompatibilityPrefs(hasPrefs);
        
        // Show prompt if paid user doesn't have preferences and hasn't dismissed it
        if (!hasPrefs) {
          const dismissed = localStorage.getItem('compatibilityPromptDismissed');
          if (!dismissed) {
            setCompatibilityPromptOpen(true);
          }
        }
      }
    } catch (err) {
      setHasCompatibilityPrefs(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Reset pagination on initial load
      setOffset(0);
      setHasMore(true);
      // Fetch with initial preferences if they exist
      try {
        const savedPrefs = localStorage.getItem('discoveryPreferences');
        const initialPrefs = savedPrefs ? JSON.parse(savedPrefs) : {};
        fetchFounders(filters, initialPrefs, 0, false);
      } catch (e) {
        fetchFounders(filters, {}, 0, false);
      }
      // Fetch plan and then check compatibility preferences
      fetchPlan().then((userPlan) => {
        if (userPlan) {
          checkCompatibilityPreferences(userPlan);
        }
      });
      fetchSwipeLimit();
      fetchAccessRequestLimit();
      fetchUserProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Navigate to previous card (circular)
  const handlePrevious = () => {
    if (founders.length === 0) return;
    const newIndex = currentIndex === 0 ? founders.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  // Navigate to next card (circular)
  const handleNext = () => {
    if (founders.length === 0) return;
    const newIndex = currentIndex === founders.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  // Keyboard navigation - Arrow keys to move carousel (circular)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (dialogOpen || !founders.length || swiping) return;
      
      if (e.key === 'ArrowLeft') {
        // Move to previous card (circular)
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        // Move to next card (circular)
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [founders, currentIndex, dialogOpen, swiping]);


  // Debounce for text inputs (search, location, looking_for)
  useEffect(() => {
    if (!loading && user) { // Don't debounce on initial load
      const debounceTimer = setTimeout(() => {
        setFiltering(true);
        setOffset(0);
        setHasMore(true);
        fetchFounders(filters, preferences, 0, false).finally(() => setFiltering(false));
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(debounceTimer);
    }
  }, [filters.search, filters.location, filters.looking_for, fetchFounders, loading, user, filters, preferences]);

  // Instant fetch for dropdowns (skills, project_stage)
  useEffect(() => {
    if (!loading && user) { // Don't trigger on initial load
      setFiltering(true);
      setOffset(0);
      setHasMore(true);
      fetchFounders(filters, preferences, 0, false).finally(() => setFiltering(false));
    }
  }, [filters.skills, filters.project_stage, fetchFounders, loading, user, filters, preferences]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Don't call fetchFounders here - useEffect will handle it
  };

  const handlePreferencesChange = (newPreferences) => {
    setPreferences(newPreferences);
    // Save preferences to localStorage
    try {
      localStorage.setItem('discoveryPreferences', JSON.stringify(newPreferences));
    } catch (e) {
    }
    // Reset pagination when preferences change
    setOffset(0);
    setHasMore(true);
    // Fetch with new preferences - but only if they actually exist
    // Empty object means user cleared preferences
    setLoading(true);
    fetchFounders(filters, newPreferences, 0, false).finally(() => setLoading(false));
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.skills.length > 0 || 
           filters.location || 
           filters.project_stage || 
           filters.looking_for;
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      search: '',
      skills: [],
      location: '',
      project_stage: '',
      looking_for: ''
    };
    setFilters(emptyFilters);
    setOffset(0);
    setHasMore(true);
    // useEffect will handle fetching
  };

  // Request Access handlers
  const handleOpenRequestAccess = (project, founder) => {
    setRequestAccessProject({ ...project, founderName: founder?.name });
    setRequestAccessMessage('');
    setRequestAccessDialogOpen(true);
  };

  const handleSubmitAccessRequest = async () => {
    if (!requestAccessProject || !user?.id) return;
    
    setRequestAccessLoading(true);
    try {
      const response = await fetch(`${API_BASE}/projects/${requestAccessProject.id}/access/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ message: requestAccessMessage }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request');
      }
      
      // Update the local state to show pending status
      setFounders(prev => prev.map(f => {
        if (f.projects?.[0]?.id === requestAccessProject.id) {
          return {
            ...f,
            projects: [{
              ...f.projects[0],
              access_status: data.status === 'approved' ? 'granted' : 'pending',
              has_access: data.status === 'approved'
            }]
          };
        }
        return f;
      }));
      
      setRequestAccessDialogOpen(false);
      setRequestAccessMessage('');
      fetchAccessRequestLimit(); // Refresh limit after successful request
      setError(data.status === 'approved' 
        ? '🎉 Access granted! You can now view the full project details.'
        : '📩 Access request sent! The founder will review your request.');
      setTimeout(() => setError(null), 4000);
      
    } catch (err) {
      const errorMsg = err.message || 'Failed to send access request';
      // Check if this is a limit reached error
      if (errorMsg.includes('limit reached')) {
        setError('⚡ ' + errorMsg);
      } else {
        setError(errorMsg);
      }
      setTimeout(() => setError(null), 5000);
    } finally {
      setRequestAccessLoading(false);
    }
  };

  const handleSwipe = async (founderId, direction, projectId = null) => {
    // Check swipe limit for right swipes
    if (direction === 'right' && swipeLimit && swipeLimit.max_allowed !== -1) {
      if (!swipeLimit.can_swipe) {
        setError(`Swipe limit reached! You've used ${swipeLimit.current_count} of ${swipeLimit.max_allowed} swipes. Upgrade to Pro for unlimited discovery.`);
        setTimeout(() => setError(null), 5000);
        return;
      }
    }
    
    setSwiping(founderId);
    setSwipeDirection(direction); // Set animation direction
    
    // Find the founder/project being swiped on
    const founder = founders.find(f => f.id === founderId);
    // In project mode, use founder_id for the swipe, but project_id for the project
    const actualFounderId = founder?.founder_id || founderId;
    const primaryProjectId = founder?.primary_project_id || projectId || (founder?.projects?.[0]?.id);
    
    try {
      const swipeData = {
        swiped_id: actualFounderId,  // Use actual founder ID for the swipe
        swipe_type: direction
      };
      
      // Add project information (project_id is required - all swipes must be project-based)
      if (primaryProjectId) {
        swipeData.project_id = primaryProjectId;
      }
      
      const response = await fetch(`${API_BASE}/swipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(swipeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record swipe');
      }

      const swipeResult = await response.json();
      
      // Refresh swipe limit after successful right swipe
      if (direction === 'right') {
        fetchSwipeLimit();
      }

      // Note: Credits system replaced with plan-based limits
      
      // Show match notification if match was created
      if (swipeResult.match_created) {
        setError('🎉 It\'s a match! Check your Connections tab.');
        setTimeout(() => setError(null), 5000);
      }

      // Animate card out then remove from list
      setTimeout(() => {
        setFounders(prev => {
          const newFounders = prev.filter(founder => founder.id !== founderId);
          // Reset currentIndex if it's out of bounds
          if (currentIndex >= newFounders.length && newFounders.length > 0) {
            setCurrentIndex(newFounders.length - 1);
          }
          
          // Auto-fetch more projects when running low (3-5 projects left)
          if (newFounders.length <= 5 && hasMore && !loadingMore) {
            // Use setTimeout to avoid state update conflicts
            setTimeout(() => fetchMoreFounders(), 100);
          }
          
          return newFounders;
        });
        setSwipeDirection(null);
      }, 300); // Wait for animation to complete
      
      // Close dialog if it was open for this founder
      if (selectedFounder && selectedFounder.id === founderId) {
        setDialogOpen(false);
        setSelectedFounder(null);
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to record swipe. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSwiping(null);
    }
  };

  const handleCardClick = (founder) => {
    setSelectedFounder(founder);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFounder(null);
    setCompatibilityTab(0);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        px={2}
      >
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: '500px' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // First-time user prompt - show when user has no projects
  const renderFirstTimeUserPrompt = () => (
    <Box 
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 4,
        minHeight: '70vh',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Paper
          elevation={0}
          sx={{
            textAlign: 'center',
            borderRadius: '24px',
            p: { xs: 4, sm: 6 },
            maxWidth: '520px',
            border: '1px solid',
            borderColor: '#e2e8f0',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          }}
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '20px',
            bgcolor: alpha('#0d9488', 0.1),
            mb: 3,
          }}>
            <Rocket sx={{ fontSize: 40, color: '#0d9488' }} />
          </Box>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 700, 
              color: '#0f172a',
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              mb: 2,
            }}
          >
            Welcome to Guild Space!
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#64748b', 
              mb: 4,
              fontSize: '1rem',
              lineHeight: 1.7,
              maxWidth: '400px',
              mx: 'auto',
            }}
          >
            Create your first project to start discovering co-founders who match your vision and work style.
          </Typography>

          <Box sx={{ 
            bgcolor: alpha('#0d9488', 0.05), 
            borderRadius: '16px', 
            p: 3, 
            mb: 4,
            textAlign: 'left',
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 2 }}>
              What happens next?
            </Typography>
            {[
              { icon: <Add sx={{ fontSize: 18 }} />, text: 'Describe your project idea (takes ~2 min)' },
              { icon: <Psychology sx={{ fontSize: 18 }} />, text: 'Answer compatibility questions' },
              { icon: <Handshake sx={{ fontSize: 18 }} />, text: 'Get matched with aligned co-founders' },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: i < 2 ? 1.5 : 0 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  bgcolor: '#0d9488',
                  color: 'white',
                }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<Rocket />}
            onClick={() => setShowNewProjectDialog(true)}
            sx={{
              bgcolor: '#0d9488',
              color: 'white',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              px: 5,
              py: 1.5,
              borderRadius: '14px',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
              '&:hover': {
                bgcolor: '#14b8a6',
                boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
              },
            }}
          >
            Create Your First Project
          </Button>

          <Box sx={{ width: '100%', mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Free to create • No credit card required
            </Typography>
            <Typography
              component="button"
              variant="caption"
              onClick={() => {
                setSkippedProjectPrompt(true);
                try {
                  localStorage.setItem('skippedProjectPrompt', 'true');
                } catch {}
              }}
              sx={{
                mt: 1,
                color: '#94a3b8',
                bgcolor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                '&:hover': { color: '#0d9488', textDecoration: 'underline' },
              }}
            >
              Skip for now
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      <NewProjectDialog
        open={showNewProjectDialog}
        onClose={() => setShowNewProjectDialog(false)}
        onProjectCreated={() => {
          setShowNewProjectDialog(false);
          fetchUserProjects();
        }}
      />
    </Box>
  );

  // Show first-time user prompt if user has no projects and hasn't skipped
  if (userProjects !== null && userProjects.length === 0 && !skippedProjectPrompt) {
    return renderFirstTimeUserPrompt();
  }

  const renderEmptyState = () => (
    <Box 
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 3,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box
          sx={{
            textAlign: 'center',
            bgcolor: '#ffffff',
            borderRadius: '16px',
            p: 5,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid',
            borderColor: '#e2e8f0',
            maxWidth: '450px',
          }}
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 88,
            height: 88,
            borderRadius: '50%',
            bgcolor: '#1e3a8a',
            mb: 3,
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
          }}>
            <Business sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h4" gutterBottom sx={{ mb: 1.5, fontWeight: 600, fontSize: '1.5rem', color: '#0f172a' }}>
            {hasActiveFilters() ? 'No matches found' : 'All caught up!'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: hasActiveFilters() ? 3 : 0, lineHeight: 1.7, fontSize: '0.9375rem', fontWeight: 400 }}>
            {hasActiveFilters() 
              ? 'Try adjusting your filters to see more founders.' 
              : 'Check back later for new founders to connect with.'}
          </Typography>
          {hasActiveFilters() && (
            <Button
              variant="contained"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{ 
                textTransform: 'none',
                px: 3.5,
                py: 1.25,
                bgcolor: '#1e3a8a',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.9375rem',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
                '&:hover': {
                  bgcolor: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                },
              }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
      </motion.div>
    </Box>
  );

  return (
    <Box sx={{ 
      height: '100vh',
      maxHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      bgcolor: 'background.default',
    }}>
      {/* Subtle Background Gradient */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 0%, rgba(30, 58, 138, 0.03) 0%, transparent 70%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
      {/* Error/Info Alert */}
      {error && (
        <Alert 
          severity={error.includes('🎉') ? 'success' : 'error'}
          sx={{ 
            mx: { xs: 1.5, sm: 2, md: 3, lg: 4 },
            mt: { xs: 1.5, sm: 2 },
            borderRadius: 2,
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {founders.length === 0 ? (
        renderEmptyState()
      ) : (
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 1, sm: 2 },
          pt: { xs: 2, sm: 2.5 },
          pb: 0,
          minHeight: 0,
        }}>
          {/* Filters and Preferences */}
                {swipeLimit && swipeLimit.max_allowed !== -1 && (
                  <Chip
                    label={`${swipeLimit.remaining} swipes remaining`}
                    size="small"
                    color={swipeLimit.remaining <= 2 ? 'error' : swipeLimit.remaining <= 5 ? 'warning' : 'default'}
                    sx={{ 
                      fontSize: '0.7rem',
                      height: '20px',
                      fontWeight: swipeLimit.remaining <= 2 ? 600 : 400
                    }}
                  />
                )}
          <Box sx={{ 
            mb: 0.5, 
            px: { xs: 1, sm: 2 },
            width: '100%',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {filtering && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      Filtering...
                    </Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }}>
                  {founders.length} {founders.length === 1 ? 'project' : 'projects'} available
                </Typography>
                {preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }}>
                    • Sorted by match score
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Box data-tutorial-id="filter-bar">
                  <FilterBar 
                    onFilterChange={handleFilterChange} 
                    activeFilters={filters} 
                    onPreferencesChange={handlePreferencesChange}
                    preferences={preferences}
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Tune />}
                  onClick={() => setPreferencesDialogOpen(true)}
                  size="small"
                  sx={{
                    borderColor: preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0 
                      ? '#1e3a8a' 
                      : '#e2e8f0',
                    color: preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0 
                      ? '#1e3a8a' 
                      : '#64748b',
                    bgcolor: preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0 
                      ? 'rgba(30, 58, 138, 0.08)' 
                      : 'transparent',
                    fontWeight: preferences && Object.keys(preferences).filter(k => preferences[k]).length > 0 
                      ? 600 
                      : 400,
                    '&:hover': {
                      borderColor: '#1e3a8a',
                      bgcolor: 'rgba(30, 58, 138, 0.08)',
                    },
                  }}
                >
                  Preferences
                </Button>
                <Button
                  data-tutorial-id="advanced-search-btn"
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={() => setAdvancedSearchOpen(true)}
                  size="small"
                  sx={{
                    borderColor: plan?.id === 'PRO_PLUS' ? '#7c3aed' : '#e2e8f0',
                    color: plan?.id === 'PRO_PLUS' ? '#7c3aed' : '#64748b',
                    '&:hover': {
                      borderColor: plan?.id === 'PRO_PLUS' ? '#6d28d9' : '#cbd5e1',
                      bgcolor: plan?.id === 'PRO_PLUS' ? 'rgba(124, 58, 237, 0.04)' : 'rgba(100, 116, 139, 0.04)',
                    },
                  }}
                >
                  Advanced Search {plan?.id === 'PRO_PLUS' ? '' : '(Pro+)'}
                </Button>
              </Box>
            </Box>
          </Box>
          {/* Card Carousel Container - Full Width Horizontal Layout */}
          <Box 
            data-tutorial-id="project-cards"
            sx={{ 
            position: 'relative',
            width: '100%',
            flex: '1 1 auto',
            minHeight: 0,
            maxHeight: { xs: 'calc(100vh - 320px)', sm: 'calc(100vh - 280px)', md: 'calc(100vh - 240px)' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1000px',
            overflow: 'hidden',
            px: { xs: 1, sm: 2, md: 4, lg: 6 },
            mt: -3,
          }}>
            <AnimatePresence initial={false}>
              {/* Show all available projects - up to 15 cards in linear scroll */}
              {(() => {
                if (founders.length === 0) return null;
                
                const cardsToShow = [];
                const maxVisibleCards = 21; // Increased for better full-width utilization
                const totalFounders = founders.length;
                
                // Calculate how many cards to show on each side of center
                let leftCards, rightCards;
                
                if (totalFounders <= maxVisibleCards) {
                  // Show all projects when we have maxVisibleCards or fewer
                  // Calculate positions relative to current index
                  for (let i = 0; i < totalFounders; i++) {
                    let visualOffset = i - currentIndex;
                    // Wrap visual offset for circular display
                    if (visualOffset > Math.floor(totalFounders / 2)) {
                      visualOffset = visualOffset - totalFounders;
                    } else if (visualOffset < -Math.floor(totalFounders / 2)) {
                      visualOffset = visualOffset + totalFounders;
                    }
                    
                    cardsToShow.push({
                      index: i,
                      visualOffset: visualOffset,
                      founder: founders[i]
                    });
                  }
                } else {
                  // If more than maxVisibleCards projects, show maxVisibleCards centered around current
                  leftCards = Math.floor(maxVisibleCards / 2);
                  rightCards = Math.floor(maxVisibleCards / 2);
                  
                  for (let offset = -leftCards; offset <= rightCards; offset++) {
                    let cardIndex = currentIndex + offset;
                    
                    // Wrap around for infinite scroll
                    cardIndex = ((cardIndex % totalFounders) + totalFounders) % totalFounders;
                    
                    const founder = founders[cardIndex];
                    if (founder) {
                      cardsToShow.push({
                        index: cardIndex,
                        visualOffset: offset,
                        founder: founder
                      });
                    }
                  }
                }
                
                // Sort by visualOffset to maintain proper order
                cardsToShow.sort((a, b) => a.visualOffset - b.visualOffset);
                
                return cardsToShow.map(({ index, visualOffset, founder }) => {
                  // Safety check: skip if founder is undefined
                  if (!founder) return null;
                  
                  // Calculate distance from current card (for visual positioning)
                  const distanceFromCurrent = visualOffset;
                
                  const firstProject = founder?.projects && founder.projects.length > 0 
                    ? founder.projects[0] 
                    : null;
                  
                  // Only the card at visualOffset 0 is the current card (center position)
                  const isCurrentCard = visualOffset === 0;
                  const isBeingSwiped = swiping === founder?.id && isCurrentCard;
                
                  // Linear horizontal carousel - optimized for full-width website layout
                  // Cards arranged in a horizontal line
                  
                  // Calculate horizontal position with responsive spacing
                  // Smaller cards on mobile to ensure counter is visible
                  const cardWidth = isMobile ? 260 : isTablet ? 290 : 320;
                  const cardGap = isMobile ? 16 : isTablet ? 20 : 32;
                  const horizontalOffset = distanceFromCurrent * (cardWidth + cardGap);
                  
                  // Scale based on distance from center - more gradual scaling
                  const absDistance = Math.abs(distanceFromCurrent);
                  const scale = isCurrentCard ? 1.05 : // Center card slightly larger
                              Math.max(0.75, 1 - (absDistance * 0.08)); // Gradual scale down
                  
                  // Opacity fade for distance - more gradual
                  const opacity = isCurrentCard ? 1 :
                                Math.max(0.5, 1 - (absDistance * 0.12));
                  
                  // Z-index for layering (center card on top)
                  const zIndex = isCurrentCard ? 20 : Math.max(1, 15 - absDistance);
                  
                  // Slight rotation for depth perception
                  const rotateY = isCurrentCard ? 0 : 
                                distanceFromCurrent > 0 ? -4 : 4; // Subtle angle for side cards

                  return (
                    <motion.div
                      key={`card-${founder?.id || index}`}
                    initial={false}
                    animate={{ 
                      x: isBeingSwiped && swipeDirection === 'left' 
                        ? horizontalOffset - 1000
                        : isBeingSwiped && swipeDirection === 'right'
                        ? horizontalOffset + 1000
                        : horizontalOffset,
                      scale: isBeingSwiped ? scale * 0.9 : scale,
                      opacity: isBeingSwiped ? 0 : opacity,
                      rotateY: rotateY,
                    }}
                    exit={{ 
                      x: swipeDirection === 'left' ? -1000 : 1000,
                      opacity: 0,
                      scale: 0.7
                    }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 40,
                      mass: 0.5,
                    }}
                    drag={isCurrentCard ? 'x' : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                    onDragEnd={(event, info) => {
                      if (Math.abs(info.offset.x) > 100 && founder?.id) {
                        if (info.offset.x > 0) {
                          handleSwipe(founder.id, 'right');
                        } else {
                          handleSwipe(founder.id, 'left');
                        }
                      }
                    }}
                    whileDrag={isCurrentCard ? { scale: 0.95 } : {}}
                    style={{ 
                      position: 'absolute',
                      width: isMobile ? '260px' : isTablet ? '290px' : '320px',
                      height: isMobile ? '380px' : isTablet ? '420px' : '480px',
                      zIndex: zIndex,
                      pointerEvents: isCurrentCard ? 'auto' : 'none',
                      cursor: isCurrentCard ? 'grab' : 'default',
                      transformOrigin: 'center center',
                      ...(isCurrentCard ? {
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                      } : {}),
                    }}
                    whileHover={isCurrentCard ? { 
                      scale: 1.03,
                      transition: { duration: 0.2, ease: 'easeOut' }
                    } : {}}
                  >
                    <Card 
                      onClick={() => isCurrentCard && founder && handleCardClick(founder)}
                      elevation={0}
                      sx={{ 
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '16px',
                        border: isCurrentCard ? '1.5px solid' : '1px solid',
                        borderColor: isCurrentCard ? 'rgba(30, 58, 138, 0.2)' : 'rgba(226, 232, 240, 0.6)',
                        cursor: isCurrentCard ? 'pointer' : 'default',
                        overflow: 'hidden',
                        position: 'relative',
                        background: isCurrentCard ? 'white' : 'rgba(255, 255, 255, 0.95)',
                        boxShadow: isCurrentCard 
                          ? '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)' 
                          : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        opacity: isCurrentCard ? 1 : 0.85,
                        WebkitFontSmoothing: 'antialiased',
                        MozOsxFontSmoothing: 'grayscale',
                        textRendering: 'optimizeLegibility',
                        '& *': {
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                        },
                        '&:hover': isCurrentCard ? {
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
                          borderColor: 'rgba(30, 58, 138, 0.3)',
                          transform: 'translateY(-1px)',
                        } : {},
                      }}
                    >
                    {/* Compatibility Score Badge for Paid Users */}
                    {founder?.compatibility_score !== undefined && founder?.compatibility_score !== null ? (
                      <Box sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 10,
                      }}>
                        <Chip
                          icon={<Psychology sx={{ fontSize: 14, color: 'white' }} />}
                          label={`${founder.compatibility_score}%`}
                          size="small"
                          sx={{
                            background: founder.compatibility_score >= 80 ? 
                              '#0d9488' :
                              founder.compatibility_score >= 60 ?
                              '#0d9488' :
                              founder.compatibility_score >= 40 ?
                              '#f59e0b' :
                              '#64748b',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: isCurrentCard ? '0.6875rem' : '0.625rem',
                            px: 1,
                            py: 0.25,
                            height: 26,
                            boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
                            opacity: isCurrentCard ? 1 : 0.9,
                            '& .MuiChip-icon': {
                              marginLeft: '4px',
                              marginRight: '-2px',
                            },
                            '& .MuiChip-label': {
                              px: 0.5,
                              letterSpacing: '0.01em',
                            }
                          }}
                        />
                      </Box>
                    ) : plan?.id === 'FREE' && isCurrentCard ? (
                      /* Hint for Free users to upgrade for compatibility scores */
                      <Tooltip title="Upgrade to Pro to see compatibility scores" arrow placement="left">
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 10,
                          cursor: 'pointer',
                        }}>
                          <Chip
                            icon={<Lock sx={{ fontSize: 12, color: 'white' }} />}
                            label="Pro"
                            size="small"
                            sx={{
                              background: 'rgba(100, 116, 139, 0.7)',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.625rem',
                              px: 0.5,
                              height: 22,
                              opacity: 0.8,
                              '& .MuiChip-icon': {
                                marginLeft: '4px',
                                marginRight: '-4px',
                              },
                            }}
                          />
                        </Box>
                      </Tooltip>
                    ) : (
                      /* Preference Match Score Badge (when no compatibility score and not free) */
                      founder?.preference_score !== undefined && founder?.preference_score !== null && (
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 10,
                        }}>
                          <Chip
                            label={`${founder.preference_score}% Match`}
                            size="small"
                            sx={{
                              background: founder.preference_score >= 80 ? 
                                '#1e3a8a' :
                                founder.preference_score >= 60 ?
                                '#1e3a8a' :
                                '#64748b',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: isCurrentCard ? '0.6875rem' : '0.625rem',
                              px: 1.25,
                              py: 0.25,
                              height: 24,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                              opacity: isCurrentCard ? 1 : 0.9,
                              '& .MuiChip-label': {
                                px: 0.5,
                                letterSpacing: '0.01em',
                              }
                            }}
                          />
                        </Box>
                      )
                    )}
                    
                    <CardContent sx={{ 
                      p: { xs: 2.5, sm: 3 }, 
                      pt: { xs: 2.5, sm: 3 },
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column',
                      minHeight: 0,
                      overflow: 'hidden',
                      pb: 0,
                      WebkitFontSmoothing: 'antialiased',
                      MozOsxFontSmoothing: 'grayscale',
                      textRendering: 'optimizeLegibility',
                      ...(isCurrentCard ? {
                        transform: 'translateZ(0)',
                        willChange: 'auto',
                      } : {}),
                    }}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 1.5, mb: 1.5, flexShrink: 0 }}>
                        <Avatar
                          src={founder?.profile_picture_url}
                          alt={founder?.name || 'Founder'}
                          sx={{ 
                            width: { xs: 40, sm: 44 },
                            height: { xs: 40, sm: 44 },
                            bgcolor: '#1e3a8a',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 600,
                            boxShadow: isCurrentCard ? '0 2px 8px rgba(30, 58, 138, 0.15)' : '0 1px 4px rgba(0, 0, 0, 0.08)',
                            border: '1.5px solid white',
                            transition: 'all 0.25s ease',
                            flexShrink: 0,
                          }}
                        >
                          {founder?.name ? founder.name.split(' ').map(n => n[0]).join('') : '?'}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 600, 
                            mb: 0.25, 
                            fontSize: { xs: '0.875rem', sm: '0.9375rem' }, 
                            color: '#111827', 
                            letterSpacing: '-0.01em',
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            textRendering: 'optimizeLegibility',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {founder?.name || 'Unknown'}
                          </Typography>
                          {founder?.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 12, color: '#64748b', flexShrink: 0 }} />
                              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {founder.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                        {/* Looking For / Project */}
                        {firstProject ? (
                          <Box sx={{ mb: 2, flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                            {/* Project Title - Always visible */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'left', fontSize: { xs: '0.9375rem', sm: '1rem' }, color: '#0f172a', lineHeight: 1.4, flex: 1 }}>
                                {firstProject.title}
                              </Typography>
                              {/* Visibility indicator */}
                              {firstProject.visibility && firstProject.visibility !== 'open' && (
                                <Chip
                                  icon={<Lock sx={{ fontSize: 12 }} />}
                                  label={firstProject.access_status === 'pending' ? 'Pending' : 'Private'}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: '0.6rem',
                                    bgcolor: firstProject.access_status === 'pending' ? '#fef3c7' : firstProject.has_access ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: firstProject.access_status === 'pending' ? '#d97706' : firstProject.has_access ? '#16a34a' : '#d97706',
                                    border: '1px solid',
                                    borderColor: firstProject.access_status === 'pending' ? '#fcd34d' : firstProject.has_access ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    '& .MuiChip-icon': { color: 'inherit', fontSize: 12 }
                                  }}
                                />
                              )}
                            </Box>
                            
                            {/* Content - Conditional based on access */}
                            {firstProject.has_access !== false ? (
                              <>
                                {/* Full project details */}
                                <Box
                                  sx={{
                                    mb: 1.25,
                                    flex: '1 1 auto',
                                    minHeight: 0,
                                    maxHeight: { xs: '120px', sm: '140px' },
                                    overflowY: 'auto',
                                    overflowX: 'hidden',
                                    textAlign: 'left',
                                    '&::-webkit-scrollbar': { width: '6px' },
                                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                                    '&::-webkit-scrollbar-thumb': {
                                      background: 'rgba(148, 163, 184, 0.4)',
                                      borderRadius: '3px',
                                      '&:hover': { background: 'rgba(148, 163, 184, 0.6)' },
                                    },
                                  }}
                                >
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      lineHeight: 1.6,
                                      textAlign: 'left',
                                      fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                      color: '#374151',
                                      fontWeight: 400,
                                    }}
                                  >
                                    {firstProject.description}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
                                  {firstProject.stage && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.6875rem', letterSpacing: '0.01em' }}>
                                        Stage:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        <Chip 
                                          label={firstProject.stage} 
                                          size="small"
                                          sx={{ 
                                            textTransform: 'capitalize',
                                            fontSize: '0.625rem',
                                            height: 20,
                                            bgcolor: 'rgba(30, 58, 138, 0.1)',
                                            color: '#1e3a8a',
                                            fontWeight: 500,
                                            border: '1px solid rgba(30, 58, 138, 0.2)',
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  )}
                                  {firstProject.needed_skills && firstProject.needed_skills.length > 0 && (
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500, fontSize: '0.6875rem', letterSpacing: '0.01em' }}>
                                        Skills Needed:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {firstProject.needed_skills.slice(0, 3).map((skill, idx) => (
                                          <Chip 
                                            key={idx}
                                            label={skill} 
                                            size="small"
                                            sx={{
                                              fontSize: '0.625rem',
                                              height: 20,
                                              bgcolor: 'rgba(30, 58, 138, 0.1)',
                                              color: '#1e3a8a',
                                              fontWeight: 500,
                                              border: '1px solid rgba(30, 58, 138, 0.2)',
                                            }}
                                          />
                                        ))}
                                        {firstProject.needed_skills.length > 3 && (
                                          <Chip 
                                            label={`+${firstProject.needed_skills.length - 3}`}
                                            size="small"
                                            sx={{
                                              fontSize: '0.625rem',
                                              height: 20,
                                              bgcolor: 'rgba(30, 58, 138, 0.08)',
                                              color: '#1e3a8a',
                                              fontWeight: 500,
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </>
                            ) : (
                              /* Locked project - Request Access UI */
                              <Box sx={{ 
                                flex: '1 1 auto', 
                                display: 'flex', 
                                flexDirection: 'column', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                p: 2,
                                bgcolor: 'rgba(245, 158, 11, 0.05)',
                                borderRadius: '12px',
                                border: '1px dashed rgba(245, 158, 11, 0.3)',
                              }}>
                                <Lock sx={{ fontSize: 32, color: '#d97706', mb: 1 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e', mb: 0.5, textAlign: 'center' }}>
                                  {firstProject.access_status === 'pending' ? 'Access Request Pending' : 'Project Details Locked'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#a16207', mb: 1.5, textAlign: 'center', lineHeight: 1.4 }}>
                                  {firstProject.access_status === 'pending' ? 'Waiting for the founder to approve your request' : 'Request access to view the full project details'}
                                </Typography>
                                {firstProject.access_status === 'pending' ? (
                                  <Chip
                                    icon={<HourglassEmpty sx={{ fontSize: 14 }} />}
                                    label="Request Sent"
                                    size="small"
                                    sx={{
                                      bgcolor: '#fef3c7',
                                      color: '#92400e',
                                      fontWeight: 600,
                                      '& .MuiChip-icon': { color: '#d97706' }
                                    }}
                                  />
                                ) : firstProject.access_status === 'no_access' ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<Send sx={{ fontSize: 14 }} />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRequestAccess(firstProject, founder);
                                    }}
                                    sx={{
                                      bgcolor: '#f59e0b',
                                      color: 'white',
                                      textTransform: 'none',
                                      fontWeight: 600,
                                      fontSize: '0.75rem',
                                      px: 2,
                                      py: 0.75,
                                      borderRadius: '8px',
                                      '&:hover': { bgcolor: '#d97706' },
                                    }}
                                  >
                                    Request Access
                                  </Button>
                                ) : null}
                              </Box>
                            )}
                          </Box>
                        ) : founder?.looking_for ? (
                          <Box sx={{ mb: 2, flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                lineHeight: 1.6,
                                textAlign: 'center',
                                fontStyle: 'italic',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                                color: '#6b7280',
                                fontWeight: 400,
                              }}
                            >
                              "{founder.looking_for}"
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ mb: 2, flex: '1 1 auto', minHeight: 0 }} />
                        )}

                        {/* Skills */}
                        {founder?.skills && founder.skills.length > 0 && (
                          <Box sx={{ mb: 1.5, flexShrink: 0 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.625, justifyContent: 'center' }}>
                              {founder.skills.slice(0, 3).map((skill, idx) => (
                                <Chip 
                                  key={idx}
                                  label={skill} 
                                  size="small"
                                  sx={{
                                    fontSize: '0.6875rem',
                                    height: 24,
                                    bgcolor: '#f9fafb',
                                    color: '#374151',
                                    fontWeight: 500,
                                    border: '1px solid #e5e7eb',
                                  }}
                                />
                              ))}
                              {founder.skills.length > 3 && (
                                <Chip 
                                  label={`+${founder.skills.length - 3}`}
                                  size="small"
                                  sx={{
                                    fontSize: '0.6875rem',
                                    height: 24,
                                    bgcolor: '#f1f5f9',
                                    color: '#6b7280',
                                    fontWeight: 500,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}
                      </CardContent>
                      
                      {/* Action Buttons - Only show on current card */}
                      {isCurrentCard && (
                        <Box sx={{ 
                          p: { xs: 2, sm: 2.5 },
                          pt: { xs: 1.75, sm: 2 },
                          display: 'flex', 
                          gap: 1.25,
                          borderTop: '1px solid',
                          borderColor: 'rgba(229, 231, 235, 0.8)',
                          flexShrink: 0,
                          bgcolor: '#fafbfc',
                        }}>
                          <Button
                            variant="outlined"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              if (founder?.id) handleSwipe(founder.id, 'left');
                            }}
                            disabled={swiping === founder?.id}
                            startIcon={<Close sx={{ fontSize: 16 }} />}
                            sx={{ 
                              py: 1.125,
                              borderRadius: '12px',
                              borderWidth: 1.5,
                              borderColor: '#e2e8f0',
                              color: '#64748b',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              textTransform: 'none',
                              transition: 'all 0.2s ease',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                              textRendering: 'optimizeLegibility',
                              '& .MuiButton-label': {
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                              },
                              '&:hover': {
                                borderColor: '#ef4444',
                                color: '#ef4444',
                                bgcolor: '#fef2f2',
                                borderWidth: 1.5,
                                transform: 'translateY(-0.5px)',
                              },
                            }}
                          >
                            Skip
                          </Button>
                          <Button
                            data-tutorial-id="connect-btn"
                            variant="contained"
                            fullWidth
                            onClick={(e) => {
                              e.stopPropagation();
                              if (founder?.id) handleSwipe(founder.id, 'right');
                            }}
                            disabled={swiping === founder?.id}
                            startIcon={swiping === founder?.id ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Handshake sx={{ fontSize: 16 }} />}
                            sx={{ 
                              py: 1.125,
                              borderRadius: '12px',
                              bgcolor: '#1e3a8a',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.8125rem',
                              textTransform: 'none',
                              boxShadow: '0 2px 8px rgba(30, 58, 138, 0.25)',
                              transition: 'all 0.2s ease',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                              textRendering: 'optimizeLegibility',
                              '& .MuiButton-label': {
                                WebkitFontSmoothing: 'antialiased',
                                MozOsxFontSmoothing: 'grayscale',
                              },
                              '&:hover': {
                                bgcolor: '#3b82f6',
                                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
                                transform: 'translateY(-0.5px)',
                              },
                              '&:disabled': {
                                bgcolor: '#cbd5e1',
                                color: '#94a3b8',
                                opacity: 0.6,
                              },
                            }}
                          >
                            {swiping === founder?.id ? 'Connecting...' : 'Connect'}
                          </Button>
                        </Box>
                      )}

                  </Card>
                    </motion.div>
                  );
                });
              })()}
            </AnimatePresence>
          </Box>

          {/* Navigation and Progress Indicators - Fixed at bottom */}
          <Box 
            data-tutorial-id="navigation-controls"
            sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75 },
            pt: { xs: 0.25, sm: 0.5 },
            pb: { xs: 1, sm: 1.5 },
            width: '100%',
            px: { xs: 1, sm: 2 },
            flexShrink: 0,
            bgcolor: 'transparent',
            zIndex: 10,
          }}>
            {/* Card Counter */}
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 400, 
                fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                textAlign: 'center',
                whiteSpace: 'nowrap',
                letterSpacing: '0.01em',
              }}
            >
              {Math.min(currentIndex + 1, founders.length)} of {founders.length} {founders.length === 1 ? 'project' : 'projects'}
            </Typography>

            {/* Progress Dots */}
            <Box sx={{ 
              display: 'flex', 
              gap: { xs: 0.4, sm: 0.5 }, 
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              maxWidth: '100%',
            }}>
              {founders.slice(0, Math.min(founders.length, isMobile ? 5 : 7)).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: idx === currentIndex ? { xs: 16, sm: 18 } : { xs: 5, sm: 6 },
                    height: { xs: 5, sm: 6 },
                    borderRadius: 3,
                    bgcolor: idx === currentIndex ? 'primary.main' : idx < currentIndex ? 'primary.light' : 'grey.300',
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                  }}
                />
              ))}
              {founders.length > (isMobile ? 5 : 7) && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ 
                    ml: { xs: 0.3, sm: 0.5 }, 
                    fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    flexShrink: 0,
                  }}
                >
                  +{founders.length - (isMobile ? 5 : 7)}
                </Typography>
              )}
            </Box>

            {/* Loading More Indicator */}
            {loadingMore && (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mt: 0.5,
                opacity: 0.8,
              }}>
                <CircularProgress 
                  size={14} 
                  sx={{ 
                    color: '#1e3a8a',
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    color: '#1e3a8a',
                    fontWeight: 400,
                  }}
                >
                  Loading more projects...
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            height: '90vh',
            maxHeight: '800px',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {selectedFounder && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              pb: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedFounder.profile_picture_url}
                  alt={selectedFounder.name}
                  sx={{ 
                    width: 64,
                    height: 64,
                    bgcolor: '#1e3a8a',
                    fontSize: '1.5rem',
                    fontWeight: 600,
                  }}
                >
                  {selectedFounder.name ? selectedFounder.name.split(' ').map(n => n[0]).join('') : '?'}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {selectedFounder.name}
                  </Typography>
                  {selectedFounder.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedFounder.location}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent 
              dividers
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Projects */}
                {selectedFounder.projects && selectedFounder.projects.length > 0 ? (
                  selectedFounder.projects.map((project, projIndex) => (
                    <Box key={project.id || projIndex}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {project.title}
                        </Typography>
                        {project.stage && (
                          <Chip 
                            label={project.stage} 
                            size="small"
                            sx={{ 
                              textTransform: 'capitalize',
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: 'rgba(30, 58, 138, 0.1)',
                              color: '#1e3a8a',
                              fontWeight: 500,
                              border: '1px solid rgba(30, 58, 138, 0.2)',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1.5 }}>
                        {project.description}
                      </Typography>
                      {project.needed_skills && project.needed_skills.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                            Skills Needed:
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {project.needed_skills.map((skill, skillIdx) => (
                              <Chip 
                                key={skillIdx}
                                label={skill} 
                                size="small"
                                sx={{
                                  fontSize: '0.7rem',
                                  height: 24,
                                  bgcolor: 'rgba(30, 58, 138, 0.1)',
                                  color: '#1e3a8a',
                                  fontWeight: 600,
                                  border: '1px solid rgba(30, 58, 138, 0.3)',
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {projIndex < selectedFounder.projects.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))
                ) : (
                  selectedFounder.project_title && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {selectedFounder.project_title}
                        </Typography>
                        {selectedFounder.project_stage && (
                          <Chip 
                            label={selectedFounder.project_stage} 
                            size="small"
                            sx={{ 
                              textTransform: 'capitalize',
                              fontSize: '0.7rem',
                              height: 20,
                              bgcolor: 'rgba(30, 58, 138, 0.1)',
                              color: '#1e3a8a',
                              fontWeight: 500,
                              border: '1px solid rgba(30, 58, 138, 0.2)',
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        {selectedFounder.project_description}
                      </Typography>
                    </Box>
                  )
                )}

                {/* Looking for */}
                {selectedFounder.looking_for && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                      LOOKING FOR
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {selectedFounder.looking_for}
                    </Typography>
                  </Box>
                )}

                {/* Skills */}
                {selectedFounder.skills && selectedFounder.skills.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                      SKILLS
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {selectedFounder.skills.map((skill, skillIndex) => (
                        <Chip 
                          key={skillIndex} 
                          label={skill} 
                          size="small" 
                          variant="outlined"
                          sx={{
                            fontSize: '0.75rem',
                            height: 28,
                            borderColor: 'divider',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Compatibility Answers - Show for the primary project */}
                {selectedFounder.projects && selectedFounder.projects.length > 0 && 
                 selectedFounder.projects[0].compatibility_answers && 
                 Object.keys(selectedFounder.projects[0].compatibility_answers).length > 0 && (() => {
                  // Group questions by category
                  const categories = [
                    'Work style',
                    'Vision & funding',
                    'Roles & equity',
                    'Culture & team setup',
                    'Conflict & communication under stress'
                  ];
                  
                  const getQuestionsByCategory = (category) => {
                    return PROJECT_COMPATIBILITY_QUESTIONS.filter(q => q.category === category);
                  };
                  
                  const activeCategory = categories[compatibilityTab];
                  const questionsInCategory = getQuestionsByCategory(activeCategory);
                  
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Psychology sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          About the Founder
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: 'rgba(37, 99, 235, 0.05)', 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '300px',
                        maxHeight: '400px',
                      }}>
                        <Tabs
                          value={compatibilityTab}
                          onChange={(e, newValue) => setCompatibilityTab(newValue)}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: '#e2e8f0',
                            bgcolor: '#ffffff',
                            flexShrink: 0,
                            minHeight: 44,
                            '& .MuiTab-root': {
                              minHeight: 44,
                              fontSize: '0.75rem',
                              px: 2,
                              color: '#64748b',
                              fontWeight: 500,
                              textTransform: 'none',
                              '&.Mui-selected': {
                                color: '#1e3a8a',
                                fontWeight: 600,
                              },
                            },
                            '& .MuiTabs-indicator': {
                              height: 3,
                              backgroundColor: '#1e3a8a',
                              borderRadius: '3px 3px 0 0',
                            },
                          }}
                        >
                          {categories.map((category, index) => {
                            const questionCount = getQuestionsByCategory(category).filter(q => 
                              selectedFounder.projects[0].compatibility_answers[q.id]
                            ).length;
                            return (
                              <Tab 
                                key={category} 
                                label={`${category} (${questionCount})`}
                              />
                            );
                          })}
                        </Tabs>
                        
                        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="tbody">
                              {questionsInCategory.map((question) => {
                                const answerValue = selectedFounder.projects[0].compatibility_answers[question.id];
                                if (!answerValue) return null;
                                
                                const selectedOption = question.options.find(opt => opt.value === answerValue);
                                if (!selectedOption) return null;
                                
                                // Get short answer text (remove A/B/C prefix and keep it concise)
                                const shortAnswer = selectedOption.label.replace(/^[A-D]\.\s*/, '').split('–')[0].trim();
                                
                                return (
                                  <Box 
                                    component="tr" 
                                    key={question.id}
                                    sx={{ 
                                      borderBottom: '1px solid',
                                      borderColor: 'divider',
                                      '&:last-child': { borderBottom: 'none' },
                                    }}
                                  >
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1,
                                        pr: 2,
                                        width: '45%',
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        {question.question.replace(/\?$/, '')}
                                      </Typography>
                                    </Box>
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1,
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                        {shortAnswer}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
                {selectedFounder.website_url && (
                  <IconButton 
                    href={selectedFounder.website_url} 
                    target="_blank"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                      },
                    }}
                  >
                    <Language />
                  </IconButton>
                )}
                {selectedFounder.linkedin_url && (
                  <IconButton 
                    href={selectedFounder.linkedin_url} 
                    target="_blank"
                    sx={{ 
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'primary.main',
                      },
                    }}
                  >
                    <LinkedIn />
                  </IconButton>
                )}
              </Box>
              <Button 
                onClick={() => handleSwipe(selectedFounder.id, 'left')}
                disabled={swiping === selectedFounder.id}
                variant="outlined"
                startIcon={<Close />}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '12px',
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    bgcolor: '#fef2f2',
                  },
                }}
              >
                Skip
              </Button>
              <Button 
                onClick={() => {
                  handleSwipe(selectedFounder.id, 'right');
                }}
                disabled={swiping === selectedFounder.id}
                variant="contained"
                startIcon={<Handshake />}
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '12px',
                  bgcolor: '#1e3a8a',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#3b82f6',
                  },
                  '&:disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8',
                  },
                }}
              >
                Connect
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Advanced Search Dialog */}
      <AdvancedSearch
        open={advancedSearchOpen}
        onClose={() => setAdvancedSearchOpen(false)}
        plan={plan}
      />

      {/* Discovery Preferences Dialog */}
      <DiscoveryPreferencesDialog
        open={preferencesDialogOpen}
        onClose={() => setPreferencesDialogOpen(false)}
        onSave={(prefs) => {
          handlePreferencesChange(prefs);
          setHasCompatibilityPrefs(Object.keys(prefs).length > 0);
        }}
        initialPreferences={preferences}
        isPaidUser={plan?.id === 'PRO' || plan?.id === 'PRO_PLUS'}
      />

      {/* Compatibility Preferences Prompt (for paid users without preferences) */}
      <DiscoveryPreferencesDialog
        open={compatibilityPromptOpen}
        onClose={() => {
          setCompatibilityPromptOpen(false);
          localStorage.setItem('compatibilityPromptDismissed', 'true');
        }}
        onSave={(prefs) => {
          handlePreferencesChange(prefs);
          setHasCompatibilityPrefs(Object.keys(prefs).length > 0);
          setCompatibilityPromptOpen(false);
          // Refresh founders to get compatibility scores
          fetchFounders(filters, prefs, 0, false);
        }}
        initialPreferences={{}}
        isPaidUser={true}
        showCompatibilityPrompt={true}
      />

      {/* Request Access Dialog */}
      <Dialog
        open={requestAccessDialogOpen}
        onClose={() => !requestAccessLoading && setRequestAccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              p: 1.25,
              borderRadius: '12px',
              bgcolor: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Lock sx={{ color: '#d97706', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                Request Access
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                to view "{requestAccessProject?.title}"
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2, lineHeight: 1.6 }}>
            The founder has set this project as private. Send a request explaining your interest,
            and they'll review your profile to decide if they want to share the details with you.
          </Typography>
          
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 0.5, display: 'block' }}>
              Requesting access from
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>
              {requestAccessProject?.founderName || 'The founder'}
            </Typography>
          </Box>

          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
            Your message (optional)
          </Typography>
          <textarea
            value={requestAccessMessage}
            onChange={(e) => setRequestAccessMessage(e.target.value)}
            placeholder="Tell them why you're interested in this project and what you can bring to the table..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              resize: 'vertical',
              outline: 'none',
            }}
            disabled={requestAccessLoading}
          />
          <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
            A good intro increases your chances of approval
          </Typography>
          
          {/* Show remaining requests for free users */}
          {accessRequestLimit && accessRequestLimit.max_allowed !== -1 && (
            <Box sx={{ 
              mt: 2, 
              p: 1.5, 
              borderRadius: '8px', 
              bgcolor: accessRequestLimit.can_request ? '#fef3c7' : '#fee2e2',
              border: `1px solid ${accessRequestLimit.can_request ? '#fcd34d' : '#fecaca'}`,
            }}>
              <Typography variant="caption" sx={{ 
                color: accessRequestLimit.can_request ? '#92400e' : '#dc2626', 
                fontWeight: 600 
              }}>
                {accessRequestLimit.can_request 
                  ? `${accessRequestLimit.remaining} request${accessRequestLimit.remaining !== 1 ? 's' : ''} remaining this month`
                  : 'Request limit reached. Upgrade to Pro for unlimited requests.'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1.5, gap: 1 }}>
          <Button
            onClick={() => setRequestAccessDialogOpen(false)}
            disabled={requestAccessLoading}
            sx={{ 
              textTransform: 'none', 
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAccessRequest}
            variant="contained"
            disabled={requestAccessLoading || (accessRequestLimit && !accessRequestLimit.can_request)}
            startIcon={requestAccessLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{
              bgcolor: accessRequestLimit && !accessRequestLimit.can_request ? '#9ca3af' : '#f59e0b',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderRadius: '10px',
              '&:hover': { bgcolor: accessRequestLimit && !accessRequestLimit.can_request ? '#9ca3af' : '#d97706' },
            }}
          >
            {requestAccessLoading ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default SwipeInterface;

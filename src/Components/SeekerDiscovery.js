import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  alpha,
  LinearProgress,
  Collapse,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Code,
  BusinessCenter,
  DesignServices,
  PersonSearch,
  Lightbulb,
  RocketLaunch,
  TrendingUp,
  CheckCircle,
  Close,
  ArrowForward,
  ArrowBack,
  Verified,
  Send,
  Refresh,
  ExpandMore,
  ExpandLess,
  Edit,
  AllInclusive,
  Lock,
  InfoOutlined,
  AutoAwesome,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';
import ProjectCompatibilityAnswersTabs, {
  COMPATIBILITY_CATEGORY_ORDER,
} from './ProjectCompatibilityAnswersTabs';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const NAVY = '#1e3a8a';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

const ROLE_OPTIONS = [
  { value: 'any', label: 'Open to Any', description: 'Show me everything', icon: <AllInclusive /> },
  { value: 'technical', label: 'Technical', description: 'Build the product', icon: <Code /> },
  { value: 'business', label: 'Business', description: 'Sales, ops, growth', icon: <BusinessCenter /> },
  { value: 'product', label: 'Product', description: 'Strategy, design, PM', icon: <DesignServices /> },
  { value: 'generalist', label: 'Generalist', description: 'Multiple things', icon: <PersonSearch /> },
];

const STAGE_OPTIONS = [
  { value: 'any', label: 'Any Stage', description: 'Open to all', icon: <AllInclusive /> },
  { value: 'idea', label: 'Idea Stage', description: 'Build from zero', icon: <Lightbulb /> },
  { value: 'mvp', label: 'MVP', description: 'Help ship v1', icon: <RocketLaunch /> },
  { value: 'early_revenue', label: 'Early Revenue', description: 'Scale what works', icon: <TrendingUp /> },
];

const INDUSTRY_OPTIONS = [
  'fintech', 'healthcare', 'ai_ml', 'b2b_saas', 'consumer',
  'climate', 'education', 'ecommerce', 'gaming', 'other'
];

const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time', description: 'Ready to commit' },
  { value: 'part_time_to_full', label: 'Part-time → Full', description: 'Testing first' },
  { value: 'part_time_only', label: 'Part-time only', description: 'Limited hours' },
  { value: 'exploring', label: 'Just exploring', description: 'Browsing options' },
];

const PRIORITY_OPTIONS = [
  { value: 'equity_upside', label: 'Equity Upside' },
  { value: 'learning', label: 'Learning Opportunity' },
  { value: 'strong_technical', label: 'Strong Technical Co-founder' },
  { value: 'revenue_traction', label: 'Revenue/Traction' },
  { value: 'mission_impact', label: 'Mission/Impact' },
];

const PRO_UPGRADE_BENEFITS = [
  'Unlimited applications',
  '5× more personalized opportunities',
  'AI competitor & SWOT analysis for projects',
  'Revisit passed opportunities',
  'Up to 3 projects & unlimited workspaces',
  'Pro badge on your profile',
];

const DEALBREAKER_OPTIONS = [
  { value: 'remote_friendly', label: 'Must be remote-friendly' },
  { value: 'has_funding', label: 'Must have funding/revenue' },
  { value: 'founder_verified', label: 'Founder must be verified' },
];

const SeekerDiscovery = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // View states: 'loading' | 'questionnaire' | 'results'
  const [view, setView] = useState('loading');
  const [questionnaireScreen, setQuestionnaireScreen] = useState(0); // 0 or 1
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [answers, setAnswers] = useState({
    role: '',
    stage: '',
    industries: [],
    availability: '',
    priorities: [],
    dealbreakers: [],
  });
  
  const [matches, setMatches] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Application dialog
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [upgradeLimitDialogOpen, setUpgradeLimitDialogOpen] = useState(false);
  const [upgradeLimitType, setUpgradeLimitType] = useState('application'); // 'application' or 'filters'
  const [applicationData, setApplicationData] = useState({
    interest_reason: '',
    value_proposition: '',
    question_answers: {},
  });
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [applying, setApplying] = useState(false);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [discoveryMeta, setDiscoveryMeta] = useState(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [detailProject, setDetailProject] = useState(null);
  const [detailTab, setDetailTab] = useState(0);
  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const [profileBannerDismissed, setProfileBannerDismissed] = useState(false);
  
  // Skipped projects view (Pro/Pro+ only)
  const [viewingSkipped, setViewingSkipped] = useState(false);
  const [skippedProjects, setSkippedProjects] = useState([]);
  const [canViewSkipped, setCanViewSkipped] = useState(false);
  const [loadingSkipped, setLoadingSkipped] = useState(false);
  
  // Info dialog for preference updates
  const [prefsInfoDialogOpen, setPrefsInfoDialogOpen] = useState(false);
  const [normalMatches, setNormalMatches] = useState([]); // Store normal matches when viewing skipped
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Mobile detection for responsive carousel
  const [isMobileView, setIsMobileView] = useState(typeof window !== 'undefined' && window.innerWidth < 600);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Direct checkout to Pro
  const handleDirectCheckout = async () => {
    if (!user?.id) return;
    
    setCheckoutLoading(true);
    try {
      const response = await fetch(`${API_BASE}/billing/founder/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ plan: 'PRO' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout');
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
      setCheckoutLoading(false);
    }
  };

  // Check profile completeness
  useEffect(() => {
    const checkProfileCompleteness = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_BASE}/profile`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        
        if (response.ok) {
          const profile = await response.json();
          // Check if profile is incomplete (not verified on either platform)
          const isIncomplete = !profile.linkedin_verified && !profile.github_verified;
          setProfileIncomplete(isIncomplete);
        }
      } catch {
        // Silent fail
      }
    };
    
    checkProfileCompleteness();
  }, [user?.id]);

  // Keyboard navigation for carousel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (view !== 'results' || matches.length === 0) return;
      if (applyDialogOpen || projectDetailOpen) return;
      
      // Account for upgrade card at the end
      const hasUpgradeCard = discoveryMeta?.has_more;
      const totalCards = matches.length + (hasUpgradeCard ? 1 : 0);
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentCardIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentCardIndex(prev => Math.min(totalCards - 1, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, matches.length, applyDialogOpen, projectDetailOpen, discoveryMeta?.has_more]);

  // Load saved preferences from backend on mount
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) {
        setView('questionnaire');
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE}/founders/discovery-preferences`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.has_preferences && data.preferences) {
            const prefs = data.preferences;
            setAnswers({
              role: prefs.role || '',
              stage: prefs.stage || '',
              industries: prefs.industries || [],
              availability: prefs.availability || '',
              priorities: prefs.priorities || [],
              dealbreakers: prefs.dealbreakers || [],
            });
            // Go straight to search with saved preferences
            searchWithPrefs(prefs);
            return;
          }
        }
        setView('questionnaire');
      } catch {
        setView('questionnaire');
      }
    };
    
    loadPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const savePreferences = async (prefs) => {
    if (!user?.id) return;
    
    try {
      await fetch(`${API_BASE}/founders/discovery-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ preferences: prefs }),
      });
    } catch {
      // Silent fail - search will still work
    }
  };

  const searchWithPrefs = useCallback(async (prefs) => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = {
        ...prefs,
        // Convert 'any' to empty for backend
        role: prefs.role === 'any' ? '' : prefs.role,
        stage: prefs.stage === 'any' ? '' : prefs.stage,
      };
      
      const response = await fetch(`${API_BASE}/seeker/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search');
      }
      
      const data = await response.json();
      setMatches(data.matches || []);
      setDiscoveryMeta(data.discovery || null);
      setCurrentCardIndex(0);
      setView('results');
    } catch (err) {
      setError(err.message);
      setView('questionnaire');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSearch = async () => {
    // Save to backend (fire and forget - don't block search)
    savePreferences(answers);
    await searchWithPrefs(answers);
  };

  const handleUpdatePreferences = () => {
    // FREE users with cached results: show info dialog before allowing edit
    if (discoveryMeta?.user_plan === 'FREE' && discoveryMeta?.results_cached) {
      setPrefsInfoDialogOpen(true);
      return;
    }
    
    proceedToEditPreferences();
  };
  
  const proceedToEditPreferences = () => {
    setPrefsInfoDialogOpen(false);
    setView('questionnaire');
    setQuestionnaireScreen(0);
    // Reset skipped view
    if (viewingSkipped) {
      setViewingSkipped(false);
      setMatches(normalMatches);
    }
  };

  // Fetch skipped projects for Pro/Pro+ users
  const fetchSkippedProjects = async () => {
    if (!user?.id) return;
    
    setLoadingSkipped(true);
    try {
      const searchParams = {
        ...answers,
        role: answers.role === 'any' ? '' : answers.role,
        stage: answers.stage === 'any' ? '' : answers.stage,
      };
      
      const response = await fetch(`${API_BASE}/seeker/skipped-projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(searchParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch skipped projects');
      }
      
      const data = await response.json();
      setCanViewSkipped(data.can_view_skipped);
      setSkippedProjects(data.matches || []);
      return data;
    } catch (err) {
      console.error('Error fetching skipped projects:', err);
      return null;
    } finally {
      setLoadingSkipped(false);
    }
  };

  const handleToggleSkipped = async () => {
    if (viewingSkipped) {
      // Switch back to normal view
      setViewingSkipped(false);
      setMatches(normalMatches);
      setCurrentCardIndex(0);
    } else {
      // Fetch and show skipped
      const data = await fetchSkippedProjects();
      if (data && data.can_view_skipped && data.matches?.length > 0) {
        setNormalMatches(matches);
        setMatches(data.matches);
        setViewingSkipped(true);
        setCurrentCardIndex(0);
      } else if (data && !data.can_view_skipped) {
        setUpgradeLimitType('skipped');
        setUpgradeLimitDialogOpen(true);
      } else if (data && data.matches?.length === 0) {
        setSuccess('No skipped projects to show');
      }
    }
  };

  const handleApply = async () => {
    if (!selectedProject) return;
    
    setApplying(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/seeker/apply/${selectedProject.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(applicationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Failed to apply';
        
        if (errorMsg.includes('1 application per day') || errorMsg.includes('Daily application limit')) {
          setApplyDialogOpen(false);
          setError('Daily application limit reached. Upgrade to Pro for unlimited applications.');
          return;
        }
        
        throw new Error(errorMsg);
      }
      
      setSuccess(`Application submitted to ${selectedProject.title}!`);
      setApplyDialogOpen(false);
      setSelectedProject(null);
      setApplicationData({ interest_reason: '', value_proposition: '', question_answers: {} });
      setMatches(prev => prev.filter(m => m.id !== selectedProject.id));
      setProjectDetailOpen(false);
      setDetailProject(null);
      
      // Update remaining applications count
      const hadDailyLimit = discoveryMeta?.user_plan === 'FREE'
        && discoveryMeta?.applications_remaining !== undefined
        && discoveryMeta?.applications_remaining !== -1;

      setDiscoveryMeta(prev => prev ? {
        ...prev,
        applications_remaining: prev.applications_remaining !== -1 ? Math.max(0, prev.applications_remaining - 1) : -1,
        applications_sent_today: (prev.applications_sent_today || 0) + 1,
      } : prev);

      // Show upgrade dialog after a short pause so it doesn't feel abrupt
      if (hadDailyLimit) {
        setUpgradeLimitType('application');
        setTimeout(() => {
          setUpgradeLimitDialogOpen(true);
        }, 1500);
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const canProceedScreen1 = answers.role && answers.stage;

  // Compact selection button component
  const SelectionButton = ({ selected, onClick, icon, label, description, color = TEAL }) => (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        p: 1.5,
        borderRadius: 2,
        border: '2px solid',
        borderColor: selected ? color : SLATE_200,
        bgcolor: selected ? alpha(color, 0.08) : '#fff',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        '&:hover': { borderColor: color, bgcolor: alpha(color, 0.04) },
      }}
    >
      <Box sx={{ 
        p: 0.75, 
        borderRadius: 1.5, 
        bgcolor: selected ? color : alpha(SLATE_400, 0.1),
        color: selected ? '#fff' : SLATE_500,
        display: 'flex',
        '& svg': { fontSize: 20 },
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
          {label}
        </Typography>
        {description && (
          <Typography variant="caption" sx={{ color: SLATE_500, display: { xs: 'none', sm: 'block' } }}>
            {description}
          </Typography>
        )}
      </Box>
      {selected && <CheckCircle sx={{ color: color, fontSize: 18 }} />}
    </Box>
  );

  // Screen 1: Role + Stage (compact layout)
  const renderScreen1 = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
        What are you looking for?
      </Typography>
      <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
        Help us find the best matches for you
      </Typography>

      {/* Role Selection */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
        What role do you want to play?
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 1, mb: 3 }}>
        {ROLE_OPTIONS.map((option) => (
          <SelectionButton
            key={option.value}
            selected={answers.role === option.value}
            onClick={() => setAnswers({ ...answers, role: option.value })}
            icon={option.icon}
            label={option.label}
            description={option.description}
          />
        ))}
      </Box>

      {/* Stage Selection */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
        What stage projects excite you?
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1 }}>
        {STAGE_OPTIONS.map((option) => (
          <SelectionButton
            key={option.value}
            selected={answers.stage === option.value}
            onClick={() => setAnswers({ ...answers, stage: option.value })}
            icon={option.icon}
            label={option.label}
            description={option.description}
          />
        ))}
      </Box>
    </Box>
  );

  // Compact chip component for selections
  const SelectionChip = ({ selected, onClick, label, color = TEAL, disabled = false }) => (
    <Box
      onClick={disabled && !selected ? undefined : onClick}
      sx={{
        cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        px: 2,
        py: 1,
        borderRadius: 2,
        border: '2px solid',
        borderColor: selected ? color : SLATE_200,
        bgcolor: selected ? alpha(color, 0.1) : '#fff',
        opacity: disabled && !selected ? 0.5 : 1,
        transition: 'all 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        '&:hover': disabled && !selected ? {} : { borderColor: color, bgcolor: alpha(color, 0.05) },
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 600, color: selected ? color : SLATE_500 }}>
        {label}
      </Typography>
      {selected && <CheckCircle sx={{ color: color, fontSize: 16 }} />}
    </Box>
  );

  // Screen 2: Optional refinements (consistent styling)
  const renderScreen2 = () => (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
        Refine your search
      </Typography>
      <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
        Optional — skip this to see all matches
      </Typography>

      {/* Availability */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
        Your availability
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {AVAILABILITY_OPTIONS.map((option) => (
          <SelectionChip
            key={option.value}
            selected={answers.availability === option.value}
            onClick={() => setAnswers({ 
              ...answers, 
              availability: answers.availability === option.value ? '' : option.value 
            })}
            label={option.label}
          />
        ))}
      </Box>

      {/* Industries */}
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
        Industries you're interested in
        <Typography component="span" variant="caption" sx={{ color: SLATE_400, ml: 1 }}>
          (max 3)
        </Typography>
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {INDUSTRY_OPTIONS.map((industry) => {
          const isSelected = answers.industries.includes(industry);
          const atMax = answers.industries.length >= 3;
          return (
            <SelectionChip
              key={industry}
              selected={isSelected}
              disabled={atMax}
              onClick={() => {
                if (isSelected) {
                  setAnswers({ ...answers, industries: answers.industries.filter(i => i !== industry) });
                } else if (!atMax) {
                  setAnswers({ ...answers, industries: [...answers.industries, industry] });
                }
              }}
              label={industry.replace('_', '/').toUpperCase()}
              color={SKY}
            />
          );
        })}
      </Box>

      {/* Advanced Options (collapsible) */}
      <Button
        onClick={() => setShowAdvanced(!showAdvanced)}
        endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
        sx={{ color: SLATE_500, textTransform: 'none', mb: 2 }}
      >
        {showAdvanced ? 'Hide' : 'Show'} advanced filters
      </Button>
      
      <Collapse in={showAdvanced}>
        <Box sx={{ p: 2, bgcolor: alpha(SLATE_200, 0.3), borderRadius: 2 }}>
          {/* Priorities */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
            What matters most? (pick up to 2)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
            {PRIORITY_OPTIONS.map((option) => {
              const isSelected = answers.priorities.includes(option.value);
              const atMax = answers.priorities.length >= 2;
              return (
                <SelectionChip
                  key={option.value}
                  selected={isSelected}
                  disabled={atMax}
                  onClick={() => {
                    if (isSelected) {
                      setAnswers({ ...answers, priorities: answers.priorities.filter(p => p !== option.value) });
                    } else if (!atMax) {
                      setAnswers({ ...answers, priorities: [...answers.priorities, option.value] });
                    }
                  }}
                  label={option.label}
                  color={NAVY}
                />
              );
            })}
          </Box>

          {/* Dealbreakers */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: SLATE_900 }}>
            Dealbreakers
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {DEALBREAKER_OPTIONS.map((option) => {
              const isSelected = answers.dealbreakers.includes(option.value);
              return (
                <SelectionChip
                  key={option.value}
                  selected={isSelected}
                  onClick={() => {
                    if (isSelected) {
                      setAnswers({ ...answers, dealbreakers: answers.dealbreakers.filter(d => d !== option.value) });
                    } else {
                      setAnswers({ ...answers, dealbreakers: [...answers.dealbreakers, option.value] });
                    }
                  }}
                  label={option.label}
                  color="#ef4444"
                />
              );
            })}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );

  // Results view - Single card carousel
  const renderResults = () => {
    if (matches.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: SLATE_900 }}>
            No matches found
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500, mb: 4 }}>
            Try broadening your preferences
          </Typography>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleUpdatePreferences}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Update Preferences
          </Button>
        </Box>
      );
    }

    // Ensure currentCardIndex is valid (account for upgrade card if present)
    const hasUpgradeCard = discoveryMeta?.has_more;
    const totalCards = matches.length + (hasUpgradeCard ? 1 : 0);
    const safeIndex = Math.min(currentCardIndex, totalCards - 1);
    const isOnUpgradeCard = hasUpgradeCard && safeIndex === matches.length;
    const project = isOnUpgradeCard ? null : matches[safeIndex];
    const isFirst = safeIndex === 0;
    const isLast = safeIndex === totalCards - 1;

    const handleNext = () => {
      if (!isLast) setCurrentCardIndex(safeIndex + 1);
    };

    const handlePrev = () => {
      if (!isFirst) setCurrentCardIndex(safeIndex - 1);
    };

    const handleSkip = async () => {
      if (!project?.id) return;
      
      try {
        const response = await fetch(`${API_BASE}/seeker/skip/${project.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          // Check if it's a swipe/browse limit error
          if (errorData.error?.toLowerCase().includes('browse limit') || 
              errorData.error?.toLowerCase().includes('swipe limit')) {
            setUpgradeLimitType('swipe');
            setUpgradeLimitDialogOpen(true);
            return;
          }
          console.error('Failed to skip project:', errorData.error);
        }
      } catch (err) {
        console.error('Error skipping project:', err);
      }
      
      // Remove from local list and navigate
      setMatches(prev => {
        const newMatches = prev.filter(m => m.id !== project.id);
        // Adjust index if needed
        if (safeIndex >= newMatches.length && newMatches.length > 0) {
          setCurrentCardIndex(newMatches.length - 1);
        }
        return newMatches;
      });
    };

    const nextBatchLabel = discoveryMeta?.next_batch_at_utc
      ? new Date(discoveryMeta.next_batch_at_utc).toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short',
        })
      : null;

    return (
      <Box>
        {/* Only show warning notes, not the curated projects info */}
        {discoveryMeta?.note && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {discoveryMeta.note}
          </Alert>
        )}
        
        {/* Viewing Skipped Projects Banner */}
        {viewingSkipped && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleToggleSkipped}
              >
                Back to Feed
              </Button>
            }
          >
            Viewing skipped projects — You previously passed on these. Changed your mind?
          </Alert>
        )}

        {/* Carousel of project cards - Full width */}
        <Box sx={{ 
          position: 'relative', 
          height: { xs: 'auto', sm: 540, md: 580 },
          minHeight: { xs: 520, sm: 540, md: 580 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: { xs: 'visible', sm: 'hidden' },
          perspective: '1500px',
          mx: { xs: 0, sm: -3, md: -4 },
        }}>
          {/* Navigation Arrows - positioned at bottom on mobile, center on desktop */}
          {totalCards > 1 && (
            <Box sx={{
              display: 'flex',
              gap: 2,
              position: { xs: 'absolute', sm: 'absolute' },
              bottom: { xs: -50, sm: 'auto' },
              top: { xs: 'auto', sm: '50%' },
              left: { xs: '50%', sm: 16 },
              transform: { xs: 'translateX(-50%)', sm: 'translateY(-50%)' },
              zIndex: 25,
            }}>
              <IconButton
                onClick={handlePrev}
                disabled={isFirst}
                sx={{
                  bgcolor: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid',
                  borderColor: SLATE_200,
                  width: { xs: 40, sm: 44 },
                  height: { xs: 40, sm: 44 },
                  opacity: isFirst ? 0.5 : 1,
                  '&:hover': {
                    bgcolor: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                  '&:disabled': {
                    bgcolor: 'white',
                  },
                }}
              >
                <ArrowBack sx={{ color: NAVY }} />
              </IconButton>
              {/* Show right arrow inline on mobile */}
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <IconButton
                  onClick={handleNext}
                  disabled={isLast}
                  sx={{
                    bgcolor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid',
                    borderColor: SLATE_200,
                    width: 40,
                    height: 40,
                    opacity: isLast ? 0.5 : 1,
                    '&:hover': {
                      bgcolor: 'white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    },
                    '&:disabled': {
                      bgcolor: 'white',
                    },
                  }}
                >
                  <ArrowForward sx={{ color: NAVY }} />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Right Navigation Arrow - only on desktop */}
          {totalCards > 1 && (
            <IconButton
              onClick={handleNext}
              disabled={isLast}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 25,
                bgcolor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid',
                borderColor: SLATE_200,
                width: 44,
                height: 44,
                opacity: isLast ? 0.5 : 1,
                '&:hover': {
                  bgcolor: 'white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                },
                '&:disabled': {
                  bgcolor: 'white',
                },
              }}
            >
              <ArrowForward sx={{ color: NAVY }} />
            </IconButton>
          )}

          <AnimatePresence initial={false}>
            {(() => {
              // Add upgrade card as last item if there are more projects available
              const hasUpgradeCard = discoveryMeta?.has_more;
              const totalCards = matches.length + (hasUpgradeCard ? 1 : 0);
              
              const cardsToShow = [];
              // On mobile, only show center card; on desktop show 3
              const maxVisible = isMobileView ? 1 : 3;
              const sideCards = Math.floor(maxVisible / 2);
              
              for (let offset = -sideCards; offset <= sideCards; offset++) {
                const idx = safeIndex + offset;
                if (idx >= 0 && idx < totalCards) {
                  const isUpgradeCard = idx === matches.length;
                  cardsToShow.push({ 
                    index: idx, 
                    offset, 
                    project: isUpgradeCard ? null : matches[idx],
                    isUpgradeCard,
                  });
                }
              }
              
              return cardsToShow.map(({ index: cardIdx, offset, project: cardProject, isUpgradeCard }) => {
                const isCenter = offset === 0;
                const absOffset = Math.abs(offset);
                
                // Card positioning - use percentage-based positioning for desktop carousel
                const horizontalPos = isMobileView ? 0 : offset * 380; // Fixed offset for side cards
                const scale = isCenter ? 1.0 : Math.max(0.6, 0.75 - (absOffset * 0.08));
                const cardOpacity = isCenter ? 1 : Math.max(0.4, 0.65 - (absOffset * 0.12));
                const zIdx = isCenter ? 20 : 10 - absOffset;
                
                // Render upgrade card
                if (isUpgradeCard) {
                  const moreCount = discoveryMeta?.total_available - matches.length;
                  return (
                    <motion.div
                      key="upgrade-card"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        x: horizontalPos,
                        scale: scale,
                        opacity: cardOpacity,
                        rotateY: isCenter ? 0 : offset > 0 ? -5 : 5,
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={() => {
                        if (!isCenter) {
                          setCurrentCardIndex(cardIdx);
                        }
                      }}
                    style={{
                      position: isMobileView ? 'relative' : 'absolute',
                      width: isMobileView ? '100%' : 650,
                      maxWidth: isMobileView ? '100%' : 650,
                      zIndex: zIdx,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                    whileHover={!isCenter ? { scale: scale * 1.05, opacity: 1 } : {}}
                  >
                    <Card
                      sx={{
                        border: '2px dashed',
                        borderColor: TEAL,
                        boxShadow: isCenter 
                          ? `0 8px 24px ${alpha(TEAL, 0.2)}` 
                          : `0 4px 12px ${alpha(SLATE_900, 0.06)}`,
                        bgcolor: alpha(TEAL, 0.02),
                        height: '100%',
                        minHeight: { xs: 380, sm: 420 },
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                        <CardContent sx={{ p: { xs: 2.5, sm: 4 }, textAlign: 'center' }}>
                          <Box
                            sx={{
                              width: { xs: 56, sm: 72 },
                              height: { xs: 56, sm: 72 },
                              borderRadius: '50%',
                              bgcolor: alpha(TEAL, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mx: 'auto',
                              mb: 2,
                            }}
                          >
                            <RocketLaunch sx={{ fontSize: { xs: 28, sm: 36 }, color: TEAL }} />
                          </Box>
                          <Typography sx={{ fontWeight: 700, color: SLATE_900, mb: 1, fontSize: { xs: '1.25rem', sm: '2rem' } }}>
                            {discoveryMeta?.results_cached 
                              ? "Someone's building your idea" 
                              : `${moreCount}+ founders waiting`
                            }
                          </Typography>
                          <Typography variant="body1" sx={{ color: SLATE_500, mb: 3, maxWidth: 340, mx: 'auto', fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                            {discoveryMeta?.results_cached 
                              ? <>Explore <Box component="span" sx={{ color: TEAL, fontWeight: 700 }}>25+ opportunities</Box> with <Box component="span" sx={{ color: TEAL, fontWeight: 700 }}>unlimited</Box> applications</> 
                              : <>Explore <Box component="span" sx={{ color: TEAL, fontWeight: 700 }}>25+ matches</Box> & apply to <Box component="span" sx={{ color: TEAL, fontWeight: 700 }}>as many as you want</Box></>
                            }
                          </Typography>
                          {isCenter && (
                            <Button
                              variant="contained"
                              size="large"
                              disabled={checkoutLoading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectCheckout();
                              }}
                              sx={{
                                bgcolor: TEAL,
                                color: '#fff',
                                fontWeight: 600,
                                px: { xs: 3, sm: 4 },
                                py: { xs: 1, sm: 1.5 },
                                fontSize: { xs: '0.85rem', sm: '1rem' },
                                '&:hover': { bgcolor: TEAL_LIGHT },
                              }}
                            >
                              {checkoutLoading ? 'Redirecting...' : 'Unlock Pro → $15/mo'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }
                
                const founderPlan = cardProject.founder?.plan || 'FREE';
                
                return (
                  <motion.div
                    key={cardProject.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      x: horizontalPos,
                      scale: scale,
                      opacity: cardOpacity,
                      rotateY: isCenter ? 0 : offset > 0 ? -5 : 5,
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={() => {
                      if (!isCenter) {
                        setCurrentCardIndex(cardIdx);
                      }
                    }}
                    style={{
                      position: isMobileView ? 'relative' : 'absolute',
                      width: isMobileView ? '100%' : 650,
                      maxWidth: isMobileView ? '100%' : 650,
                      zIndex: zIdx,
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                    }}
                    whileHover={!isCenter ? { scale: scale * 1.05, opacity: 1 } : {}}
                  >
                    <Card
                      onClick={(e) => {
                        if (isCenter) {
                          setDetailProject(cardProject);
                          setDetailTab(0);
                          setProjectDetailOpen(true);
                        } else {
                          e.stopPropagation();
                          setCurrentCardIndex(cardIdx);
                        }
                      }}
                      sx={{
                        border: '1px solid',
                        borderColor: isCenter ? TEAL : SLATE_200,
                        boxShadow: isCenter 
                          ? `0 8px 24px ${alpha(SLATE_900, 0.12)}` 
                          : `0 4px 12px ${alpha(SLATE_900, 0.06)}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': isCenter ? {
                          borderColor: TEAL,
                          boxShadow: `0 12px 32px ${alpha(SLATE_900, 0.15)}`,
                        } : {
                          borderColor: alpha(TEAL, 0.3),
                        },
                      }}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        {/* Header with match score */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="h5" 
                              sx={{ 
                                fontWeight: 700, 
                                color: SLATE_900, 
                                mb: 1,
                                fontSize: { xs: '1.1rem', sm: '1.5rem' },
                                lineHeight: 1.3,
                                wordBreak: 'break-word',
                              }}
                            >
                              {cardProject.title}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                              <Chip 
                                label={cardProject.stage?.replace('_', ' ')} 
                                size="small" 
                                sx={{ 
                                  bgcolor: alpha(SKY, 0.1), 
                                  color: SKY, 
                                  fontWeight: 600, 
                                  textTransform: 'capitalize',
                                  height: { xs: 22, sm: 24 },
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                }} 
                              />
                              {cardProject.genre && (
                                <Chip 
                                  label={cardProject.genre} 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: alpha(SLATE_400, 0.1), 
                                    color: SLATE_500,
                                    height: { xs: 22, sm: 24 },
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  }} 
                                />
                              )}
                              {cardProject.has_insights && (
                                <Chip 
                                  icon={<AutoAwesome sx={{ fontSize: { xs: 12, sm: 14 } }} />}
                                  label="AI Insights" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: alpha(TEAL, 0.1), 
                                    color: TEAL, 
                                    fontWeight: 600,
                                    height: { xs: 22, sm: 24 },
                                    fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                    '& .MuiChip-icon': { color: TEAL },
                                  }} 
                                />
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            bgcolor: cardProject.match_score >= 80 ? alpha(TEAL, 0.1) : cardProject.match_score >= 60 ? alpha(SKY, 0.1) : alpha(SLATE_400, 0.1),
                            borderRadius: 2,
                            p: { xs: 1, sm: 1.5 },
                            minWidth: { xs: 50, sm: 64 },
                            flexShrink: 0,
                          }}>
                            <Typography sx={{ 
                              fontWeight: 700, 
                              color: cardProject.match_score >= 80 ? TEAL : cardProject.match_score >= 60 ? SKY : SLATE_500,
                              lineHeight: 1,
                              fontSize: { xs: '1rem', sm: '1.5rem' },
                            }}>
                              {cardProject.match_score}%
                            </Typography>
                            <Typography variant="caption" sx={{ color: SLATE_500, fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                              match
                            </Typography>
                          </Box>
                        </Box>

                        {/* Description */}
                        <Box sx={{ mb: { xs: 2, sm: 2.5 }, minHeight: { xs: 56, sm: 72 } }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              color: SLATE_500, 
                              lineHeight: 1.6,
                              fontSize: { xs: '0.85rem', sm: '1rem' },
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {cardProject.description}
                          </Typography>
                        </Box>

                        {/* Match reasons */}
                        <Box sx={{ bgcolor: alpha(TEAL, 0.05), borderRadius: 2, p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 2.5 }, minHeight: { xs: 56, sm: 64 } }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                            Why this matches
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 }, mt: 1 }}>
                            {(cardProject.match_reasons?.length > 0 ? cardProject.match_reasons : ['Good fit based on your preferences']).slice(0, 3).map((reason, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: { xs: 12, sm: 14 }, color: TEAL }} />
                                <Typography variant="caption" sx={{ color: SLATE_900, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{reason}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        {/* Founder info */}
                        {cardProject.founder && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: { xs: 1, sm: 1.5 }, 
                            p: { xs: 1, sm: 1.5 }, 
                            bgcolor: alpha(SLATE_200, 0.3), 
                            borderRadius: 2,
                            mb: { xs: 2, sm: 2.5 },
                          }}>
                            <Avatar
                              src={cardProject.founder.profile_picture_url}
                              sx={{ 
                                width: { xs: 32, sm: 40 }, 
                                height: { xs: 32, sm: 40 }, 
                                bgcolor: alpha(SKY, 0.15), 
                                color: SKY, 
                                fontWeight: 600, 
                                fontSize: { xs: 12, sm: 14 } 
                              }}
                            >
                              {cardProject.founder.name?.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                  {cardProject.founder.name}
                                </Typography>
                                {cardProject.founder.verification?.tier !== 'UNVERIFIED' && (
                                  <Verified sx={{ fontSize: { xs: 12, sm: 14 }, color: TEAL }} />
                                )}
                                {['PRO', 'PRO_PLUS'].includes(founderPlan) && (
                                  <Chip 
                                    label={founderPlan === 'PRO_PLUS' ? 'Pro+' : 'Pro'} 
                                    size="small" 
                                    sx={{ 
                                      height: { xs: 16, sm: 18 }, 
                                      fontSize: { xs: '0.6rem', sm: '0.65rem' }, 
                                      fontWeight: 700,
                                      bgcolor: alpha(NAVY, 0.1), 
                                      color: NAVY,
                                    }} 
                                  />
                                )}
                              </Box>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: SLATE_500, 
                                  display: 'block',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {cardProject.founder.headline || cardProject.founder.location || 'Founder'}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Action buttons - only on center card */}
                        {isCenter && (
                          <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 } }}>
                            <Button
                              variant="outlined"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSkip();
                              }}
                              sx={{ 
                                flex: 1,
                                py: { xs: 1, sm: 1.5 }, 
                                borderColor: SLATE_200, 
                                color: SLATE_500,
                                fontWeight: 600,
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                '&:hover': { borderColor: SLATE_400 },
                              }}
                            >
                              Skip
                            </Button>
                            <Button
                              variant="contained"
                              endIcon={<Send sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProject(cardProject);
                                setApplyDialogOpen(true);
                              }}
                              sx={{ 
                                flex: 2,
                                py: { xs: 1, sm: 1.5 }, 
                                bgcolor: TEAL, 
                                fontWeight: 600, 
                                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                '&:hover': { bgcolor: TEAL_LIGHT } 
                              }}
                            >
                              Apply to Join
                            </Button>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              });
            })()}
          </AnimatePresence>
        </Box>

        {/* Footer with project counter */}
        <Box sx={{ mt: { xs: 8, sm: 0 }, textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 600 }}>
            {isOnUpgradeCard 
              ? `${matches.length} of ${matches.length} projects`
              : `${safeIndex + 1} of ${matches.length} projects`
            }
          </Typography>
          <Typography variant="caption" sx={{ display: { xs: 'none', sm: 'block' }, color: SLATE_400, mt: 0.5 }}>
            Use arrow keys or click side cards to navigate
          </Typography>
        </Box>
      </Box>
    );
  };

  // Loading state
  if (view === 'loading' && loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%" gap={2}>
        <CircularProgress sx={{ color: TEAL }} />
        <Typography variant="body2" sx={{ color: SLATE_500 }}>Finding projects for you...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <Box sx={{ 
        maxWidth: view === 'results' ? 1400 : 700, 
        mx: 'auto', 
        width: '100%', 
        p: { xs: 2, sm: 3, md: 4 },
        transition: 'max-width 0.3s ease',
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>
        )}
        
        {/* Profile Completion Banner + Edit Filters Row */}
        {view === 'results' && (
          <Box sx={{ 
            mb: 2,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: { xs: 1.5, sm: 2 },
          }}>
            {/* Profile Banner */}
            {profileIncomplete && !profileBannerDismissed && (
              <Button
                variant="contained"
                size="small"
                startIcon={<ArrowForward />}
                onClick={() => navigate('/profile?tab=verification')}
                sx={{ 
                  bgcolor: TEAL,
                  color: '#fff',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: { xs: 'normal', sm: 'nowrap' },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  py: { xs: 1, sm: 0.5 },
                  '&:hover': {
                    bgcolor: TEAL_LIGHT,
                  },
                }}
              >
                Verify your profile to get featured more
              </Button>
            )}
            
            {/* Spacer to push buttons to the right - only on desktop */}
            <Box sx={{ flex: 1, display: { xs: 'none', sm: 'block' } }} />
            
            {/* Button group for filters */}
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'space-between', sm: 'flex-end' },
            }}>
              {/* Edit Filters Button */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Edit />}
                onClick={handleUpdatePreferences}
                sx={{ 
                  borderColor: TEAL,
                  color: TEAL,
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flex: { xs: 1, sm: 'none' },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  '&:hover': {
                    borderColor: TEAL_LIGHT,
                    bgcolor: alpha(TEAL, 0.05),
                  },
                }}
              >
                Edit filters
              </Button>
              
              {/* View Skipped Projects Button (Pro/Pro+ only) */}
              <Button
                variant={viewingSkipped ? "contained" : "outlined"}
                size="small"
                startIcon={loadingSkipped ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
                onClick={handleToggleSkipped}
                disabled={loadingSkipped}
                sx={{ 
                  borderColor: viewingSkipped ? TEAL : SLATE_400,
                  color: viewingSkipped ? '#fff' : SLATE_500,
                  bgcolor: viewingSkipped ? TEAL : 'transparent',
                  fontWeight: 600,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flex: { xs: 1, sm: 'none' },
                  fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  '&:hover': {
                    borderColor: TEAL,
                    bgcolor: viewingSkipped ? TEAL_LIGHT : alpha(TEAL, 0.05),
                    color: viewingSkipped ? '#fff' : TEAL,
                  },
                }}
              >
                {viewingSkipped ? 'Back to Feed' : 'See Skipped'}
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Profile Banner for questionnaire view */}
        {view === 'questionnaire' && profileIncomplete && !profileBannerDismissed && (
          <Box sx={{ 
            mb: 3,
            p: 2,
            bgcolor: alpha(TEAL, 0.08),
            border: `1px solid ${alpha(TEAL, 0.3)}`,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}>
            <InfoOutlined sx={{ color: TEAL, fontSize: 22 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Complete your profile to stand out
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Verified profiles get 3x more responses from founders
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              onClick={() => navigate('/profile?tab=verification')}
              sx={{
                bgcolor: TEAL,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: TEAL_LIGHT },
              }}
            >
              Verify Profile
            </Button>
            <IconButton 
              size="small" 
              onClick={() => setProfileBannerDismissed(true)}
              sx={{ color: SLATE_400 }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        )}

        {view === 'questionnaire' && (
          <Box>
            {/* Progress */}
            <Box sx={{ mb: 4 }}>
              <LinearProgress 
                variant="determinate" 
                value={((questionnaireScreen + 1) / 2) * 100}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: alpha(TEAL, 0.1),
                  '& .MuiLinearProgress-bar': { bgcolor: TEAL, borderRadius: 3 },
                }}
              />
              <Typography variant="caption" sx={{ color: SLATE_500, mt: 1, display: 'block' }}>
                Step {questionnaireScreen + 1} of 2
              </Typography>
            </Box>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={questionnaireScreen}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
              >
                {questionnaireScreen === 0 ? renderScreen1() : renderScreen2()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              {questionnaireScreen === 0 ? (
                <Box />
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => setQuestionnaireScreen(0)}
                  sx={{ borderColor: SLATE_200, color: SLATE_500 }}
                >
                  Back
                </Button>
              )}
              
              {questionnaireScreen === 0 ? (
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={() => setQuestionnaireScreen(1)}
                  disabled={!canProceedScreen1}
                  sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
                >
                  Continue
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{ borderColor: SLATE_200, color: SLATE_500 }}
                  >
                    Skip & Search
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                    onClick={handleSearch}
                    disabled={loading}
                    sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
                  >
                    Find Projects
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {view === 'results' && renderResults()}
      </Box>

      {/* Project detail — overview + questionnaire by category (fixed size; content scrolls) */}
      <Dialog
        open={projectDetailOpen}
        onClose={() => setProjectDetailOpen(false)}
        fullWidth={false}
        maxWidth={false}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: { xs: 'calc(100vw - 24px)', sm: 680 },
            height: { xs: 'min(90vh, 620px)', sm: 600 },
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: '1px solid',
            borderColor: SLATE_200,
            pb: 1.5,
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {detailProject?.title}
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Overview and founder answers from project setup (compatibility questionnaire)
              </Typography>
            </Box>
            <IconButton onClick={() => setProjectDetailOpen(false)} size="small" aria-label="Close">
              <Close />
            </IconButton>
          </Box>
          <Tabs
            value={detailTab}
            onChange={(e, v) => setDetailTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mt: 2,
              minHeight: 40,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.78rem', minHeight: 40 },
              '& .MuiTabs-indicator': { bgcolor: TEAL },
              '& .Mui-selected': { color: TEAL },
            }}
          >
            <Tab label="Overview" />
            {COMPATIBILITY_CATEGORY_ORDER.map((c) => (
              <Tab key={c} label={c} />
            ))}
          </Tabs>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            pt: 2,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {detailProject && detailTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                <Chip
                  label={`${detailProject.match_score}% match`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor:
                      detailProject.match_score >= 80
                        ? alpha(TEAL, 0.15)
                        : detailProject.match_score >= 60
                          ? alpha(SKY, 0.15)
                          : alpha(SLATE_400, 0.12),
                  }}
                />
                {detailProject.stage && (
                  <Chip label={detailProject.stage.replace('_', ' ')} size="small" sx={{ textTransform: 'capitalize' }} />
                )}
                {detailProject.genre && <Chip label={detailProject.genre} size="small" />}
              </Box>
              <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {detailProject.description || 'No description provided.'}
              </Typography>
              {detailProject.needed_skills?.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500, display: 'block', mb: 1 }}>
                    Skills they&apos;re looking for
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {detailProject.needed_skills.map((s) => (
                      <Chip key={s} label={typeof s === 'string' ? s : s?.skill || s} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
          {detailProject && detailTab > 0 && (
            <ProjectCompatibilityAnswersTabs
              compatibilityAnswers={detailProject.compatibility_answers || {}}
              focusCategory={COMPATIBILITY_CATEGORY_ORDER[detailTab - 1]}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button onClick={() => setProjectDetailOpen(false)} sx={{ color: SLATE_500 }}>
            Close
          </Button>
          <Button
            variant="contained"
            endIcon={<Send />}
            onClick={() => {
              setProjectDetailOpen(false);
              setSelectedProject(detailProject);
              setApplyDialogOpen(true);
            }}
            disabled={!detailProject}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Apply to join
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Dialog - Simplified for open projects */}
      <Dialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            mx: { xs: 2, sm: 3 },
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
          } 
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Apply to {selectedProject?.title}
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Connect with the founder
              </Typography>
            </Box>
            <IconButton onClick={() => setApplyDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {/* Show remaining applications warning for FREE users */}
          {discoveryMeta?.user_plan === 'FREE' && discoveryMeta?.applications_remaining !== undefined && discoveryMeta?.applications_remaining !== -1 && (
            <Alert 
              severity={discoveryMeta.applications_remaining <= 1 ? "warning" : "info"}
              sx={{ mt: 1, mb: 3, borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
              icon={<Send sx={{ fontSize: 20 }} />}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {discoveryMeta.applications_remaining === 0 
                      ? "You've used your daily application"
                      : `${discoveryMeta.applications_remaining} application remaining today`
                    }
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {discoveryMeta.applications_remaining === 0 
                      ? "Upgrade to Pro for unlimited applications"
                      : "Free plan includes 1 application per day"
                    }
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="contained"
                  disabled={checkoutLoading}
                  onClick={() => {
                    setApplyDialogOpen(false);
                    handleDirectCheckout();
                  }}
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 600,
                    bgcolor: TEAL,
                    '&:hover': { bgcolor: TEAL_LIGHT },
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {checkoutLoading ? 'Redirecting...' : 'Upgrade'}
                </Button>
              </Box>
            </Alert>
          )}
          
          {/* If project has custom questions, show only those */}
          {selectedProject?.application_questions?.length > 0 ? (
            <Box>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
                Answer the founder's questions to apply
              </Typography>
              {selectedProject.application_questions.map((question, idx) => (
                <TextField
                  key={idx}
                  label={question}
                  multiline
                  rows={2}
                  fullWidth
                  value={applicationData.question_answers[question] || ''}
                  onChange={(e) => setApplicationData({
                    ...applicationData,
                    question_answers: { ...applicationData.question_answers, [question]: e.target.value },
                  })}
                  sx={{ mb: 2 }}
                />
              ))}
            </Box>
          ) : (
            /* Quick apply for open projects - just optional intro */
            <Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                p: 2, 
                bgcolor: alpha(TEAL, 0.05), 
                borderRadius: 2, 
                mb: 3 
              }}>
                <CheckCircle sx={{ color: TEAL }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                    Quick apply
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500 }}>
                    This project is open — your profile will be shared with the founder
                  </Typography>
                </Box>
              </Box>
              <TextField
                label="Add a brief intro (optional)"
                multiline
                rows={2}
                fullWidth
                value={applicationData.interest_reason}
                onChange={(e) => setApplicationData({ ...applicationData, interest_reason: e.target.value })}
                placeholder="Say hi or mention why you're interested..."
                helperText="Your skills and experience from your profile will be included"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button onClick={() => setApplyDialogOpen(false)} sx={{ color: SLATE_500 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleApply}
            disabled={
              applying || 
              (discoveryMeta?.applications_remaining === 0) ||
              (selectedProject?.application_questions?.length > 0 && 
                !selectedProject.application_questions.every(q => applicationData.question_answers[q]?.trim()))
            }
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            {applying ? 'Submitting...' : discoveryMeta?.applications_remaining === 0 ? 'Limit reached' : 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Description Dialog */}
      <Dialog
        open={descriptionDialogOpen}
        onClose={() => setDescriptionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {matches[currentCardIndex]?.title}
            </Typography>
            <IconButton onClick={() => setDescriptionDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ color: SLATE_500, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {matches[currentCardIndex]?.description}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDescriptionDialogOpen(false)} 
            sx={{ color: SLATE_500 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            endIcon={<Send />}
            onClick={() => { 
              setDescriptionDialogOpen(false);
              setSelectedProject(matches[currentCardIndex]); 
              setApplyDialogOpen(true); 
            }}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Apply to Join
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade Limit Dialog - Premium Design */}
      <Dialog
        open={upgradeLimitDialogOpen}
        onClose={() => setUpgradeLimitDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: `0 20px 40px ${alpha(TEAL, 0.15)}`,
            mx: { xs: 2, sm: 3 },
            width: { xs: 'calc(100% - 32px)', sm: '100%' },
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3, px: 3 }}>
          {/* Icon with glow effect */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(TEAL, 0.15)} 0%, ${alpha(TEAL, 0.05)} 100%)`,
              border: `2px solid ${alpha(TEAL, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2.5,
              position: 'relative',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${alpha(TEAL, 0.1)} 0%, transparent 70%)`,
              }}
            />
            <AutoAwesome sx={{ fontSize: 36, color: TEAL }} />
          </Box>

          {/* Pro badge */}
          <Chip 
            label="PRO" 
            size="small" 
            sx={{ 
              mb: 2,
              bgcolor: alpha(TEAL, 0.1), 
              color: TEAL, 
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
            }} 
          />
          
          <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1, lineHeight: 1.3 }}>
            {upgradeLimitType === 'filters' 
              ? "Preferences locked for today" 
              : upgradeLimitType === 'skipped'
              ? "Revisit skipped opportunities"
              : upgradeLimitType === 'swipe'
              ? "Daily browse limit reached"
              : "You've used today's application"
            }
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
            {upgradeLimitType === 'filters'
              ? "Upgrade to Pro to change preferences anytime"
              : upgradeLimitType === 'skipped'
              ? "Upgrade to Pro to view projects you passed on"
              : upgradeLimitType === 'swipe'
              ? "Upgrade to Pro for unlimited browsing"
              : "Upgrade to Pro for unlimited applications"
            }
          </Typography>

          {/* Price section */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 3,
              py: 2,
              px: 2,
              bgcolor: alpha(TEAL, 0.04),
              borderRadius: 2,
              border: `1px solid ${alpha(TEAL, 0.1)}`,
            }}
          >
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: TEAL }}>
              $15
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: SLATE_500 }}>
              /mo
            </Typography>
            <Chip 
              label="BEST VALUE" 
              size="small" 
              sx={{ 
                ml: 1,
                height: 24,
                bgcolor: '#ecfdf5', 
                color: '#059669', 
                fontWeight: 700,
                fontSize: '0.7rem',
              }} 
            />
          </Box>

          {/* Benefits list */}
          {upgradeLimitType === 'application' && (
            <Box sx={{ textAlign: 'left', mb: 3 }}>
              {PRO_UPGRADE_BENEFITS.map((benefit) => (
                <Box 
                  key={benefit} 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    py: 0.75,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 18, color: TEAL, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: SLATE_900 }}>
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleDirectCheckout}
            disabled={checkoutLoading}
            startIcon={checkoutLoading ? <CircularProgress size={18} color="inherit" /> : null}
            sx={{
              bgcolor: TEAL,
              color: '#fff',
              fontWeight: 600,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              boxShadow: `0 4px 12px ${alpha(TEAL, 0.3)}`,
              '&:hover': { 
                bgcolor: TEAL_LIGHT,
                boxShadow: `0 6px 16px ${alpha(TEAL, 0.4)}`,
              },
              '&.Mui-disabled': {
                bgcolor: alpha(TEAL, 0.6),
                color: '#fff',
              },
            }}
          >
            {checkoutLoading ? 'Redirecting...' : 'Upgrade to Pro'}
          </Button>
          
          <Button
            fullWidth
            onClick={() => setUpgradeLimitDialogOpen(false)}
            sx={{ 
              mt: 1.5,
              color: SLATE_400,
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': { bgcolor: 'transparent', color: SLATE_500 },
            }}
          >
            Maybe later
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Preferences Info Dialog */}
      <Dialog
        open={prefsInfoDialogOpen}
        onClose={() => setPrefsInfoDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3, maxWidth: 400, mx: 2 }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3, px: 4 }}>
          <Box sx={{ 
            width: 56, height: 56, borderRadius: '50%', 
            bgcolor: alpha(TEAL, 0.1), display: 'flex', 
            alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 
          }}>
            <InfoOutlined sx={{ fontSize: 28, color: TEAL }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900, mb: 1 }}>
            Today's matches are set
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
            Your new preferences will take effect tomorrow with fresh opportunities. Want to continue editing?
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={proceedToEditPreferences}
            sx={{ 
              bgcolor: TEAL, 
              fontWeight: 600,
              py: 1.25,
              mb: 1.5,
              '&:hover': { bgcolor: TEAL_LIGHT } 
            }}
          >
            Continue to Edit
          </Button>
          <Button
            fullWidth
            onClick={() => setPrefsInfoDialogOpen(false)}
            sx={{ color: SLATE_500 }}
          >
            Stay on current matches
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SeekerDiscovery;

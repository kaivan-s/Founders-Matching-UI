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
} from '@mui/icons-material';
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

const DEALBREAKER_OPTIONS = [
  { value: 'remote_friendly', label: 'Must be remote-friendly' },
  { value: 'has_funding', label: 'Must have funding/revenue' },
  { value: 'founder_verified', label: 'Founder must be verified' },
];

const SeekerDiscovery = () => {
  const { user } = useUser();
  
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
    setView('questionnaire');
    setQuestionnaireScreen(0);
    setDiscoveryMeta(null);
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
        throw new Error(errorData.error || 'Failed to apply');
      }
      
      setSuccess(`Application submitted to ${selectedProject.title}!`);
      setApplyDialogOpen(false);
      setSelectedProject(null);
      setApplicationData({ interest_reason: '', value_proposition: '', question_answers: {} });
      setMatches(prev => prev.filter(m => m.id !== selectedProject.id));
      setProjectDetailOpen(false);
      setDetailProject(null);
      
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

    // Ensure currentCardIndex is valid
    const safeIndex = Math.min(currentCardIndex, matches.length - 1);
    const project = matches[safeIndex];
    const isFirst = safeIndex === 0;
    const isLast = safeIndex === matches.length - 1;

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
        {discoveryMeta?.note && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {discoveryMeta.note}
          </Alert>
        )}
        {discoveryMeta?.persistent_feed && !discoveryMeta.note && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You&apos;ll see up to {discoveryMeta.effective_limit ?? discoveryMeta.daily_limit} curated projects today.
            {' '}
            {nextBatchLabel && (
              <>The next batch unlocks {nextBatchLabel}. If you&apos;ve saved discovery preferences and email is enabled, we&apos;ll also nudge you once that batch is ready.</>
            )}
          </Alert>
        )}

        {/* Header with progress and edit */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 600 }}>
              {safeIndex + 1} of {matches.length} projects
            </Typography>
          </Box>
          <Button
            variant="text"
            size="small"
            startIcon={<Edit />}
            onClick={handleUpdatePreferences}
            sx={{ color: SLATE_500 }}
          >
            Edit filters
          </Button>
        </Box>

        {/* Progress dots */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 3 }}>
          {matches.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => setCurrentCardIndex(idx)}
              sx={{
                width: idx === safeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: idx === safeIndex ? TEAL : alpha(SLATE_400, 0.3),
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: idx === safeIndex ? TEAL : alpha(SLATE_400, 0.5) },
              }}
            />
          ))}
        </Box>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: SLATE_400, mb: 1 }}>
          Click the card to see the full pitch, skills they need, and the founder&apos;s questionnaire answers.
        </Typography>

        {/* Single project card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              onClick={() => {
                setDetailProject(project);
                setDetailTab(0);
                setProjectDetailOpen(true);
              }}
              sx={{
              border: '1px solid',
              borderColor: SLATE_200,
              boxShadow: `0 4px 16px ${alpha(SLATE_900, 0.08)}`,
              cursor: 'pointer',
            }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header with match score */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1 }}>
                      {project.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip 
                        label={project.stage?.replace('_', ' ')} 
                        size="small" 
                        sx={{ bgcolor: alpha(SKY, 0.1), color: SKY, fontWeight: 600, textTransform: 'capitalize' }} 
                      />
                      {project.genre && (
                        <Chip label={project.genre} size="small" sx={{ bgcolor: alpha(SLATE_400, 0.1), color: SLATE_500 }} />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    bgcolor: project.match_score >= 80 ? alpha(TEAL, 0.1) : project.match_score >= 60 ? alpha(SKY, 0.1) : alpha(SLATE_400, 0.1),
                    borderRadius: 2,
                    p: 1.5,
                    minWidth: 64,
                  }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      color: project.match_score >= 80 ? TEAL : project.match_score >= 60 ? SKY : SLATE_500,
                      lineHeight: 1,
                    }}>
                      {project.match_score}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>
                      match
                    </Typography>
                  </Box>
                </Box>

                {/* Description - Fixed height with show more */}
                <Box sx={{ mb: 2.5, minHeight: 72 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: SLATE_500, 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {project.description}
                  </Typography>
                  {project.description?.length > 150 && (
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDescriptionDialogOpen(true);
                      }}
                      sx={{ 
                        color: TEAL, 
                        textTransform: 'none', 
                        p: 0, 
                        mt: 0.5,
                        minWidth: 'auto',
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      Show more
                    </Button>
                  )}
                </Box>

                {/* Match reasons - Fixed height */}
                <Box sx={{ bgcolor: alpha(TEAL, 0.05), borderRadius: 2, p: 2, mb: 2.5, minHeight: 64 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Why this matches
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {(project.match_reasons?.length > 0 ? project.match_reasons : ['Good fit based on your preferences']).slice(0, 3).map((reason, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CheckCircle sx={{ fontSize: 14, color: TEAL }} />
                        <Typography variant="caption" sx={{ color: SLATE_900 }}>{reason}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Founder info - Compact */}
                {project.founder && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5, 
                    p: 1.5, 
                    bgcolor: alpha(SLATE_200, 0.3), 
                    borderRadius: 2,
                    mb: 2.5,
                  }}>
                    <Avatar
                      src={project.founder.profile_picture_url}
                      sx={{ width: 40, height: 40, bgcolor: alpha(SKY, 0.15), color: SKY, fontWeight: 600, fontSize: 14 }}
                    >
                      {project.founder.name?.split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                          {project.founder.name}
                        </Typography>
                        {project.founder.verification?.tier !== 'UNVERIFIED' && (
                          <Verified sx={{ fontSize: 14, color: TEAL }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: SLATE_500, display: 'block' }}>
                        {project.founder.headline || project.founder.location || 'Founder'}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSkip();
                    }}
                    sx={{ 
                      flex: 1,
                      py: 1.5, 
                      borderColor: SLATE_200, 
                      color: SLATE_500,
                      fontWeight: 600,
                      '&:hover': { borderColor: SLATE_400 },
                    }}
                  >
                    Skip
                  </Button>
                  <Button
                    variant="contained"
                    endIcon={<Send />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProject(project);
                      setApplyDialogOpen(true);
                    }}
                    sx={{ 
                      flex: 2,
                      py: 1.5, 
                      bgcolor: TEAL, 
                      fontWeight: 600, 
                      '&:hover': { bgcolor: TEAL_LIGHT } 
                    }}
                  >
                    Apply to Join
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows for desktop */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handlePrev}
            disabled={isFirst}
            sx={{ borderColor: SLATE_200, color: SLATE_500 }}
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={handleNext}
            disabled={isLast}
            sx={{ borderColor: SLATE_200, color: SLATE_500 }}
          >
            Next
          </Button>
        </Box>

        {/* End of results message */}
        {isLast && (
          <Box sx={{ textAlign: 'center', mt: 4, p: 3, bgcolor: alpha(SLATE_200, 0.3), borderRadius: 2 }}>
            <Typography variant="body1" sx={{ color: SLATE_500, mb: 2 }}>
              That's all for now! Want to see more?
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => { setCurrentCardIndex(0); searchWithPrefs(answers); }}
                disabled={loading}
                sx={{ borderColor: SLATE_200, color: SLATE_500 }}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={handleUpdatePreferences}
                sx={{ borderColor: TEAL, color: TEAL }}
              >
                Broaden filters
              </Button>
            </Box>
          </Box>
        )}
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
      <Box sx={{ maxWidth: 700, mx: 'auto', width: '100%', p: { xs: 2, sm: 4 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>
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
        PaperProps={{ sx: { borderRadius: 2 } }}
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
              (selectedProject?.application_questions?.length > 0 && 
                !selectedProject.application_questions.every(q => applicationData.question_answers[q]?.trim()))
            }
            startIcon={applying ? <CircularProgress size={16} color="inherit" /> : <Send />}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            {applying ? 'Submitting...' : 'Apply'}
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
    </Box>
  );
};

export default SeekerDiscovery;

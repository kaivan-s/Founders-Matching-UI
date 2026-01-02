import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Button,
  IconButton,
  Popover,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  LinearProgress,
} from '@mui/material';
import { 
  FilterList, 
  Clear, 
  Search, 
  Tune,
  BusinessCenter,
  TrendingUp,
  Schedule,
  Laptop
} from '@mui/icons-material';
import LocationAutocomplete from './LocationAutocomplete';
import CircularProgress from '@mui/material/CircularProgress';

const COMMON_SKILLS = [
  'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'AWS', 'Docker',
  'Machine Learning', 'AI', 'Blockchain', 'Mobile Development', 'Web Design',
  'Marketing', 'Sales', 'Finance', 'Operations', 'Product Management'
];

const PROJECT_STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'idea', label: 'Just an Idea' },
  { value: 'mvp', label: 'MVP Development' },
  { value: 'early-stage', label: 'Early Stage' },
  { value: 'growth', label: 'Growth Stage' }
];

// Discovery preference questions - most important for matching
const DISCOVERY_PREFERENCES = [
  {
    id: 'primary_role',
    category: 'Role',
    question: 'What role are you looking to fill?',
    icon: <BusinessCenter />,
    weight: 30,
    options: [
      { value: 'technical', label: 'Technical Co-founder' },
      { value: 'business', label: 'Business Co-founder' },
      { value: 'product', label: 'Product Co-founder' }
    ]
  },
  {
    id: 'ideal_outcome',
    category: 'Vision',
    question: 'What\'s your ideal exit strategy?',
    icon: <TrendingUp />,
    weight: 25,
    options: [
      { value: 'acquisition', label: 'Quick acquisition (3-5 years)' },
      { value: 'ipo', label: 'Build a unicorn (7-10+ years)' },
      { value: 'lifestyle', label: 'Profitable lifestyle business' }
    ]
  },
  {
    id: 'work_hours',
    category: 'Commitment',
    question: 'What\'s your commitment level?',
    icon: <Schedule />,
    weight: 25,
    options: [
      { value: 'intense', label: 'Full-time, nights & weekends' },
      { value: 'flexible', label: 'Flexible schedule' },
      { value: 'regular', label: 'Regular 9-5 schedule' }
    ]
  },
  {
    id: 'work_model',
    category: 'Work Style',
    question: 'How do you prefer to work?',
    icon: <Laptop />,
    weight: 20,
    options: [
      { value: 'remote_first', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'in_person', label: 'In-person' }
    ]
  }
];

const FilterBar = ({ onFilterChange, activeFilters, onPreferencesChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferences, setPreferences] = useState(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('discoveryPreferences');
    return saved ? JSON.parse(saved) : {
      primary_role: '',
      ideal_outcome: '',
      work_hours: '',
      work_model: ''
    };
  });
  const [filters, setFilters] = useState({
    search: activeFilters?.search || '',
    skills: activeFilters?.skills || [],
    location: activeFilters?.location || '',
    project_stage: activeFilters?.project_stage || '',
    looking_for: activeFilters?.looking_for || ''
  });

  const open = Boolean(anchorEl);

  // Save preferences to localStorage when they change (but don't trigger fetch)
  useEffect(() => {
    if (Object.values(preferences).some(v => v)) {
      localStorage.setItem('discoveryPreferences', JSON.stringify(preferences));
    }
  }, [preferences]);

  const handleOpenFilters = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilters = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
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
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.skills.length > 0 || 
           filters.location || 
           filters.project_stage || 
           filters.looking_for;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.skills.length > 0) count++;
    if (filters.location) count++;
    if (filters.project_stage) count++;
    if (filters.looking_for) count++;
    return count;
  };

  const hasPreferences = () => {
    return Object.values(preferences).some(v => v);
  };

  const getPreferenceCompletion = () => {
    const filled = Object.values(preferences).filter(v => v).length;
    return (filled / 4) * 100;
  };

  const handlePreferenceChange = (id, value) => {
    setPreferences(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSavePreferences = () => {
    // Only trigger fetch when user explicitly saves preferences
    if (Object.values(preferences).some(v => v)) {
      onPreferencesChange?.(preferences);
    }
    setPreferencesOpen(false);
  };

  const handleClearPreferences = () => {
    const emptyPrefs = {
      primary_role: '',
      ideal_outcome: '',
      work_hours: '',
      work_model: ''
    };
    setPreferences(emptyPrefs);
    localStorage.removeItem('discoveryPreferences');
    // Only call onPreferencesChange if dialog is open (user is actively clearing)
    if (preferencesOpen) {
      onPreferencesChange?.(emptyPrefs);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {/* Preferences Button */}
        <Button
          variant={hasPreferences() ? 'contained' : 'outlined'}
          startIcon={<Tune />}
          onClick={() => setPreferencesOpen(true)}
          size="small"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            ...(hasPreferences() && {
              background: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
            })
          }}
        >
          {hasPreferences() ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress
                variant="determinate"
                value={getPreferenceCompletion()}
                size={16}
                thickness={6}
                sx={{ 
                  color: 'white',
                  '& .MuiCircularProgress-circle': {
                    strokeLinecap: 'round',
                  }
                }}
              />
              <span>Preferences</span>
            </Box>
          ) : (
            'Set Preferences'
          )}
        </Button>

        {/* Filters Button */}
      <Button
        variant={hasActiveFilters() ? 'contained' : 'outlined'}
        startIcon={<FilterList />}
        onClick={handleOpenFilters}
        size="small"
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 600,
          ...(hasActiveFilters() && {
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
          })
        }}
      >
        {getActiveFilterCount() > 0 && (
          <Chip
            label={getActiveFilterCount()}
            size="small"
            sx={{
              height: 18,
              mr: 0.5,
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.7rem',
              minWidth: 18,
              '& .MuiChip-label': {
                px: 0.5,
              }
            }}
          />
        )}
        Filters
      </Button>
      </Box>

      {/* Filter Popover */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 3,
            borderRadius: 3,
            minWidth: 340,
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Filter Founders
          </Typography>
          {hasActiveFilters() && (
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={() => {
                handleClearFilters();
                handleCloseFilters();
              }}
              sx={{ textTransform: 'none', fontSize: '0.875rem' }}
            >
              Clear All
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Skills */}
          <FormControl fullWidth size="small">
            <InputLabel>Skills</InputLabel>
            <Select
              multiple
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
              input={<OutlinedInput label="Skills" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {COMMON_SKILLS.map((skill) => (
                <MenuItem key={skill} value={skill}>
                  {skill}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Location */}
          <Box sx={{ width: '100%' }}>
            <LocationAutocomplete
              value={filters.location}
              onChange={(location) => handleFilterChange('location', location)}
              label="Location"
              placeholder="Start typing a city, state, or country..."
              helperText="Type to search for a location or enter 'Remote'"
              size="small"
            />
          </Box>

          {/* Project Stage */}
          <FormControl fullWidth size="small">
            <InputLabel>Project Stage</InputLabel>
            <Select
              value={filters.project_stage}
              onChange={(e) => handleFilterChange('project_stage', e.target.value)}
              label="Project Stage"
            >
              {PROJECT_STAGES.map((stage) => (
                <MenuItem key={stage.value} value={stage.value}>
                  {stage.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Looking For */}
          <TextField
            fullWidth
            size="small"
            label="Looking For"
            value={filters.looking_for}
            onChange={(e) => handleFilterChange('looking_for', e.target.value)}
            placeholder="e.g. Technical Co-founder"
          />

          {/* Search */}
          <Divider sx={{ my: 0.5 }} />
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by name or keywords..."
            InputProps={{
              startAdornment: <Search sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />,
            }}
          />
        </Box>
      </Popover>

      {/* Preferences Dialog */}
      <Dialog 
        open={preferencesOpen} 
        onClose={() => setPreferencesOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            Set Your Discovery Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Answer 4 quick questions to see the most relevant projects for you
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={getPreferenceCompletion()} 
            sx={{ 
              mt: 2, 
              height: 6,
              borderRadius: 3,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
              }
            }}
          />
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          {DISCOVERY_PREFERENCES.map((pref, index) => (
            <Box key={pref.id} sx={{ mb: 3.5 }}>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  mb: 1.5,
                  fontWeight: 600,
                  color: 'text.primary'
                }}>
                  {pref.icon}
                  <span>{index + 1}. {pref.question}</span>
                </FormLabel>
                <RadioGroup
                  value={preferences[pref.id] || ''}
                  onChange={(e) => handlePreferenceChange(pref.id, e.target.value)}
                >
                  {pref.options.map(option => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {option.label}
                          </Typography>
                        </Box>
                      }
                      sx={{
                        mb: 1,
                        mx: 0,
                        '&:hover': {
                          bgcolor: 'grey.50',
                          borderRadius: 2
                        },
                        ...(preferences[pref.id] === option.value && {
                          bgcolor: 'primary.50',
                          borderRadius: 2,
                        })
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </DialogContent>
        
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          {hasPreferences() && (
            <Button 
              onClick={handleClearPreferences}
              sx={{ mr: 'auto', textTransform: 'none' }}
            >
              Clear All
            </Button>
          )}
          <Button 
            onClick={() => setPreferencesOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleSavePreferences}
            disabled={!hasPreferences()}
            sx={{
              textTransform: 'none',
              background: hasPreferences() ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : undefined,
              px: 3
            }}
          >
            Apply Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FilterBar;


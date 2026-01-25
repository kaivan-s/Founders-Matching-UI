import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { Close, Psychology, TrendingUp, BusinessCenter, Schedule } from '@mui/icons-material';

// Only the 4 main questions used for scoring (from backend PREFERENCE_WEIGHTS)
const PREFERENCE_QUESTIONS = [
  {
    id: 'primary_role',
    category: 'Roles & Equity',
    question: 'What role do you primarily see yourself in?',
    icon: <BusinessCenter />,
    weight: '30%',
    options: [
      { value: 'technical', label: 'A. Technical – Building and scaling the product' },
      { value: 'business', label: 'B. Business – Sales, growth, operations, hiring' },
      { value: 'product', label: 'C. Product – Vision, UX, roadmap, user research' },
    ]
  },
  {
    id: 'ideal_outcome',
    category: 'Vision & Funding',
    question: 'What\'s your ideal outcome for this startup?',
    icon: <TrendingUp />,
    weight: '25%',
    options: [
      { value: 'acquisition', label: 'A. Acquisition in 3–5 years' },
      { value: 'ipo', label: 'B. IPO / very large company over 7–10+ years' },
      { value: 'lifestyle', label: 'C. Profitable lifestyle business that supports a good living' },
    ]
  },
  {
    id: 'work_hours',
    category: 'Work Style',
    question: 'What are your preferred working hours / intensity?',
    icon: <Schedule />,
    weight: '25%',
    options: [
      { value: 'regular', label: 'A. Regular schedule – Mostly 9–5, predictable' },
      { value: 'flexible', label: 'B. Flexible – Work when it fits, as long as outcomes are met' },
      { value: 'intense', label: 'C. Intense – Nights and weekends are fine while we\'re early' },
    ]
  },
  {
    id: 'work_model',
    category: 'Culture & Team',
    question: 'What\'s your preferred work model?',
    icon: <BusinessCenter />,
    weight: '20%',
    options: [
      { value: 'remote_first', label: 'A. Remote‑first – Work from anywhere' },
      { value: 'hybrid', label: 'B. Hybrid – Mix of remote and in‑person' },
      { value: 'in_person', label: 'C. In‑person – Mostly office/co‑located' },
    ]
  },
];

const DiscoveryPreferencesDialog = ({ open, onClose, onSave, initialPreferences = {} }) => {
  const [preferences, setPreferences] = useState(initialPreferences);

  // Initialize preferences from localStorage or initialPreferences
  useEffect(() => {
    if (open) {
      try {
        const saved = localStorage.getItem('discoveryPreferences');
        const savedPrefs = saved ? JSON.parse(saved) : {};
        setPreferences(savedPrefs);
      } catch (e) {
        console.error('Error loading preferences:', e);
        setPreferences(initialPreferences);
      }
    }
  }, [open, initialPreferences]);

  const handleAnswerChange = (questionId, value) => {
    setPreferences(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSave = () => {
    // Save preferences
    if (onSave) {
      onSave(preferences);
    }
    onClose();
  };

  const handleClear = () => {
    setPreferences({});
    if (onSave) {
      onSave({});
    }
    onClose();
  };

  const answeredCount = PREFERENCE_QUESTIONS.filter(q => preferences[q.id]).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology sx={{ color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Discovery Preferences
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Set your preferences to see compatibility scores on projects. Projects matching your preferences will appear first.
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: '70vh', overflow: 'auto' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Answer these 4 key questions to see compatibility scores. Projects matching your preferences will appear first.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Progress: {answeredCount} of {PREFERENCE_QUESTIONS.length} answered
            </Typography>
            <Box sx={{ flex: 1, height: 4, bgcolor: 'grey.200', borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  bgcolor: 'primary.main',
                  width: `${(answeredCount / PREFERENCE_QUESTIONS.length) * 100}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {PREFERENCE_QUESTIONS.map((q, index) => (
            <Paper
              key={q.id}
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid',
                borderColor: preferences[q.id] ? 'primary.main' : 'divider',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                background: preferences[q.id] 
                  ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.03) 0%, rgba(20, 184, 166, 0.03) 100%)'
                  : 'white',
              }}
            >
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ color: 'primary.main' }}>{q.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {index + 1}. {q.question}
                      </Typography>
                    </Box>
                    <Chip
                      label={`${q.weight} weight`}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(30, 58, 138, 0.1)',
                        color: '#1e3a8a',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  </Box>
                </FormLabel>
                <RadioGroup
                  value={preferences[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                >
                  {q.options.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {option.label}
                        </Typography>
                      }
                      sx={{
                        ml: 0,
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: preferences[q.id] === option.value ? 'primary.main' : 'transparent',
                        bgcolor: preferences[q.id] === option.value ? 'rgba(14, 165, 233, 0.05)' : 'transparent',
                        mb: 1,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        '&:hover': {
                          borderColor: 'primary.light',
                          bgcolor: 'rgba(14, 165, 233, 0.03)',
                        },
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Paper>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClear} sx={{ color: '#64748b' }}>
          Clear All
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ color: '#64748b' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={answeredCount === 0}
          sx={{
            bgcolor: '#1e3a8a',
            '&:hover': {
              bgcolor: '#3b82f6',
            },
            '&:disabled': {
              bgcolor: '#cbd5e1',
              color: '#94a3b8',
            },
          }}
        >
          Save Preferences
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscoveryPreferencesDialog;

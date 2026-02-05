import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  LinearProgress,
  Fade,
  alpha,
} from '@mui/material';
import LocationAutocomplete from './LocationAutocomplete';
import { API_BASE } from '../config/api';
import {
  ArrowForward,
  ArrowBack,
  Lightbulb,
  Code,
  Groups,
  CheckCircle,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const OnboardingDialog = ({ open, onComplete, onSelectAdvisorFlow }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState('founder');
  
  const [formData, setFormData] = useState({
    purpose: '',
    skills: [],
    projects: [],
    location: '',
    name: '',
    email: '',
  });
  
  const [skillInput, setSkillInput] = useState('');

  const totalSteps = 2;
  const progress = userType ? ((currentStep + 1) / totalSteps) * 100 : 0;

  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setUserType('founder');
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: prev.name || user.fullName || user.firstName || '',
          email: prev.email || user.primaryEmailAddress?.emailAddress || '',
        }));
      }
    }
  }, [open, user]);

  const purposes = [
    {
      value: 'idea_needs_cofounder',
      label: 'I have an idea and need a co-founder',
      icon: <Lightbulb />,
      description: 'You have a vision and looking for someone to build it with',
    },
    {
      value: 'skills_want_project',
      label: 'I have skills and want to join a project',
      icon: <Code />,
      description: 'You want to apply your expertise to an exciting venture',
    },
    {
      value: 'both',
      label: 'Both',
      icon: <Groups />,
      description: 'Open to starting something new or joining an existing project',
    },
  ];

  const commonSkills = [
    'Product Management',
    'Software Development',
    'UI/UX Design',
    'Marketing',
    'Sales',
    'Data Science',
    'Mobile Development',
    'Backend Development',
    'Frontend Development',
    'DevOps',
    'Business Development',
    'Finance',
    'Legal',
    'Operations',
    'Growth Hacking',
  ];

  const handlePurposeSelect = (value) => {
    setFormData({ ...formData, purpose: value });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove),
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.name || !formData.name.trim()) {
      alert('Please enter your full name');
      return;
    }
    
    if (!formData.email || !formData.email.trim() || !formData.email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/founders/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          purpose: formData.purpose,
          location: formData.location,
          skills: formData.skills,
          projects: formData.projects,
          onboarding_completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }

      if (onComplete) {
        onComplete(formData);
      }
    } catch (error) {
      alert('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.purpose !== '';
      case 1:
        return formData.location.trim() !== '' && formData.skills.length > 0;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1 }}>
                  Welcome to Guild Space! 👋
                </Typography>
                <Typography variant="body1" sx={{ color: SLATE_500 }}>
                  Let's get to know you better to find your perfect co-founder
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900, mb: 3 }}>
                Why are you here?
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {purposes.map((purpose) => (
                  <Box
                    key={purpose.value}
                    onClick={() => handlePurposeSelect(purpose.value)}
                    sx={{
                      p: 2.5,
                      bgcolor: formData.purpose === purpose.value ? alpha(TEAL, 0.05) : '#fff',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: formData.purpose === purpose.value ? TEAL : SLATE_200,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      '&:hover': {
                        borderColor: TEAL,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: formData.purpose === purpose.value 
                          ? alpha(TEAL, 0.1) 
                          : alpha(SLATE_400, 0.1),
                        color: formData.purpose === purpose.value ? TEAL : SLATE_400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {purpose.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
                          {purpose.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          {purpose.description}
                        </Typography>
                      </Box>
                      {formData.purpose === purpose.value && (
                        <CheckCircle sx={{ color: TEAL, flexShrink: 0 }} />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                Tell us about yourself
              </Typography>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
                We need some basic information to get started
              </Typography>
              
              <TextField
                fullWidth
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                error={formData.email && !formData.email.includes('@')}
                helperText={formData.email && !formData.email.includes('@') ? 'Please enter a valid email address' : ''}
                sx={{ mb: 4 }}
              />
              
              <Typography variant="h5" sx={{ fontWeight: 600, color: SLATE_900, mb: 1, mt: 2 }}>
                Where are you located?
              </Typography>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
                This helps us show you relevant projects and co-founders in your area
              </Typography>
              
              <LocationAutocomplete
                value={formData.location}
                onChange={(location) => setFormData({ ...formData, location })}
                label="Location"
                placeholder="Start typing a city, state, or country..."
                helperText="Type to search for a location or enter 'Remote'"
                sx={{ mb: 4 }}
              />
              
              <Typography variant="h5" sx={{ fontWeight: 600, color: SLATE_900, mb: 1, mt: 4 }}>
                What are your skills and expertise?
              </Typography>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
                Add the skills that best describe what you bring to a founding team
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="Type a skill and press Enter or click Add"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddSkill();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddSkill}
                    sx={{
                      bgcolor: TEAL,
                      '&:hover': { bgcolor: TEAL_LIGHT },
                      textTransform: 'none',
                      px: 3,
                    }}
                  >
                    Add
                  </Button>
                </Box>
                
                <Typography variant="caption" sx={{ color: SLATE_500, mb: 1, display: 'block' }}>
                  Quick add:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {commonSkills.filter(skill => !formData.skills.includes(skill)).slice(0, 8).map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onClick={() => setFormData({ ...formData, skills: [...formData.skills, skill] })}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: alpha(SLATE_400, 0.1),
                        color: SLATE_500,
                        border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: alpha(TEAL, 0.1),
                          color: TEAL,
                          borderColor: alpha(TEAL, 0.3),
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              {formData.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: SLATE_500, mb: 2, fontWeight: 600 }}>
                    Your skills ({formData.skills.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={() => handleRemoveSkill(skill)}
                        sx={{
                          bgcolor: alpha(TEAL, 0.1),
                          color: TEAL,
                          border: `1px solid ${alpha(TEAL, 0.3)}`,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          '& .MuiChip-deleteIcon': {
                            color: TEAL,
                            '&:hover': {
                              color: TEAL_LIGHT,
                            }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </Fade>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={(event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {userType === 'founder' && (
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{
              height: 4,
              borderRadius: '2px 2px 0 0',
              bgcolor: alpha(TEAL, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: TEAL,
                borderRadius: 1,
              }
            }}
          />
        )}
        
        <DialogContent sx={{ p: 4 }}>
          {userType === 'founder' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500 }}>
                Step {currentStep + 1} of {totalSteps}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ minHeight: 400 }}>
            {renderStepContent()}
          </Box>
          
          {userType === 'founder' && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 4, 
              pt: 3, 
              borderTop: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={handleBack}
                disabled={currentStep === 0}
                sx={{ 
                  textTransform: 'none',
                  color: currentStep === 0 ? SLATE_400 : SLATE_500,
                  '&:hover': {
                    bgcolor: alpha(SLATE_200, 0.5),
                  },
                }}
              >
                Back
              </Button>
              
              {currentStep === totalSteps - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleComplete}
                  disabled={loading}
                  sx={{
                    bgcolor: TEAL,
                    '&:hover': { bgcolor: TEAL_LIGHT },
                    textTransform: 'none',
                    px: 4,
                  }}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  onClick={handleNext}
                  disabled={!canProceed()}
                  sx={{
                    bgcolor: TEAL,
                    '&:hover': { bgcolor: TEAL_LIGHT },
                    '&:disabled': {
                      bgcolor: alpha(SLATE_400, 0.2),
                      color: SLATE_400,
                    },
                    textTransform: 'none',
                    px: 4,
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Box>
    </Dialog>
  );
};

export default OnboardingDialog;

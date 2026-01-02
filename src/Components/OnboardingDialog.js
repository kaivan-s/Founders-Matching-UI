import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Fade,
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
  Add,
  Business,
  Delete,
  Person,
  Handshake,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';

const OnboardingDialog = ({ open, onComplete, onSelectPartnerFlow }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState(null); // 'founder' or 'partner'
  
  // Form data
  const [formData, setFormData] = useState({
    purpose: '',
    skills: [],
    projects: [],
    location: '',
  });
  
  // Temporary states for input
  const [skillInput, setSkillInput] = useState('');
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    stage: 'idea',
  });

  const totalSteps = 3;
  const progress = userType ? ((currentStep + 1) / totalSteps) * 100 : 0;

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

  const handleAddProject = () => {
    if (projectForm.title.trim() && projectForm.description.trim()) {
      setFormData({
        ...formData,
        projects: [...formData.projects, { ...projectForm }],
      });
      setProjectForm({
        title: '',
        description: '',
        stage: 'idea',
      });
    }
  };

  const handleRemoveProject = (index) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((_, i) => i !== index),
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
    setLoading(true);
    try {
      // Save onboarding data to backend
      const response = await fetch(`${API_BASE}/founders/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          name: user.fullName || user.firstName || '',
          email: user.primaryEmailAddress?.emailAddress || '',
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

      // Call the onComplete callback
      if (onComplete) {
        onComplete(formData);
      }
    } catch (error) {
      console.error('Error saving onboarding data:', error);
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
      case 2:
        return true; // Projects are optional
      default:
        return false;
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    if (type === 'partner') {
      // Switch to partner onboarding flow
      onSelectPartnerFlow?.();
    } else {
      // Continue with founder onboarding
      setCurrentStep(0);
    }
  };

  const renderStepContent = () => {
    // Step -1: Choose user type (Founder or Partner)
    if (userType === null) {
      return (
        <Fade in timeout={300}>
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                Welcome to Co-Build! 👋
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Choose how you'd like to get started
              </Typography>
            </Box>
            
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 3, textAlign: 'center' }}>
              What would you like to do?
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Paper
                onClick={() => handleUserTypeSelect('founder')}
                sx={{
                  p: 4,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: userType === 'founder' ? '#0ea5e9' : 'rgba(226, 232, 240, 0.8)',
                  background: userType === 'founder' 
                    ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.02) 100%)'
                    : '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#0ea5e9',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    color: '#0ea5e9',
                  }}>
                    <Person sx={{ fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                      Become a Founder
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      Find co-founders, build projects, and discover opportunities. Perfect if you're looking to start or join a startup.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Find Co-founders" size="small" />
                      <Chip label="Build Projects" size="small" />
                      <Chip label="Discover Opportunities" size="small" />
                    </Box>
                  </Box>
                  {userType === 'founder' && (
                    <CheckCircle sx={{ color: '#0ea5e9', fontSize: 28 }} />
                  )}
                </Box>
              </Paper>

              <Paper
                onClick={() => handleUserTypeSelect('partner')}
                sx={{
                  p: 4,
                  cursor: 'pointer',
                  border: '2px solid',
                  borderColor: userType === 'partner' ? '#14b8a6' : 'rgba(226, 232, 240, 0.8)',
                  background: userType === 'partner' 
                    ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(20, 184, 166, 0.02) 100%)'
                    : '#ffffff',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#14b8a6',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(20, 184, 166, 0.1)',
                    color: '#14b8a6',
                  }}>
                    <Handshake sx={{ fontSize: 32 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                      Become an Accountability Partner
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                      Help founders stay accountable and provide valuable feedback. Set your capacity and get matched with startups that need your guidance.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Help Founders" size="small" />
                      <Chip label="Provide Feedback" size="small" />
                      <Chip label="Set Your Capacity" size="small" />
                    </Box>
                  </Box>
                  {userType === 'partner' && (
                    <CheckCircle sx={{ color: '#14b8a6', fontSize: 28 }} />
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
        </Fade>
      );
    }

    // Founder onboarding steps (original steps)
    switch (currentStep) {
      case 0:
        return (
          <Fade in timeout={300}>
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                  Welcome to Co-Build! 👋
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                  Let's get to know you better to find your perfect co-founder
                </Typography>
              </Box>
              
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', mb: 3 }}>
                Why are you here?
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {purposes.map((purpose) => (
                  <Paper
                    key={purpose.value}
                    onClick={() => handlePurposeSelect(purpose.value)}
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: formData.purpose === purpose.value ? '#0ea5e9' : 'rgba(226, 232, 240, 0.8)',
                      background: formData.purpose === purpose.value 
                        ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(14, 165, 233, 0.02) 100%)'
                        : '#ffffff',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#0ea5e9',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: formData.purpose === purpose.value 
                          ? 'rgba(14, 165, 233, 0.1)' 
                          : 'rgba(100, 116, 139, 0.1)',
                        color: formData.purpose === purpose.value ? '#0ea5e9' : '#64748b',
                      }}>
                        {purpose.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
                          {purpose.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          {purpose.description}
                        </Typography>
                      </Box>
                      {formData.purpose === purpose.value && (
                        <CheckCircle sx={{ color: '#0ea5e9' }} />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          </Fade>
        );

      case 1:
        return (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                Where are you located?
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
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
              
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1, mt: 4 }}>
                What are your skills and expertise?
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
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
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddSkill}
                    sx={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      textTransform: 'none',
                      px: 3,
                    }}
                  >
                    Add
                  </Button>
                </Box>
                
                {/* Quick add common skills */}
                <Typography variant="caption" sx={{ color: '#64748b', mb: 1, display: 'block' }}>
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
                        bgcolor: 'rgba(100, 116, 139, 0.08)',
                        '&:hover': {
                          bgcolor: 'rgba(14, 165, 233, 0.1)',
                          color: '#0ea5e9',
                        }
                      }}
                    />
                  ))}
                </Box>
              </Box>
              
              {/* Selected skills */}
              {formData.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2 }}>
                    Your skills ({formData.skills.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        onDelete={() => handleRemoveSkill(skill)}
                        sx={{
                          bgcolor: 'rgba(14, 165, 233, 0.08)',
                          color: '#0ea5e9',
                          border: '1px solid rgba(14, 165, 233, 0.15)',
                          fontWeight: 500,
                          '& .MuiChip-deleteIcon': {
                            color: '#0ea5e9',
                            '&:hover': {
                              color: '#0284c7',
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

      case 2:
        return (
          <Fade in timeout={300}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#0f172a', mb: 1 }}>
                Do you have a project in mind?
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                Share your project idea or skip this step for now
              </Typography>
              
              {/* Add project form */}
              <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(248, 250, 252, 0.5)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Business sx={{ color: '#0ea5e9' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                    Add a Project
                  </Typography>
                </Box>
                
                <TextField
                  fullWidth
                  label="Project Title"
                  placeholder="e.g., AI-powered Learning Platform"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  sx={{ mb: 2 }}
                />
                
                <TextField
                  fullWidth
                  label="Description"
                  placeholder="Briefly describe your project idea..."
                  multiline
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleAddProject}
                    disabled={!projectForm.title.trim() || !projectForm.description.trim()}
                    sx={{
                      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                      textTransform: 'none',
                    }}
                  >
                    Add Project
                  </Button>
                </Box>
              </Paper>
              
              {/* Added projects */}
              {formData.projects.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748b', mb: 2 }}>
                    Your projects ({formData.projects.length}):
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {formData.projects.map((project, index) => (
                      <Paper
                        key={index}
                        sx={{
                          p: 2,
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a' }}>
                              {project.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
                              {project.description}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveProject(index)}
                            sx={{ color: '#ef4444' }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </Paper>
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
        // Prevent closing by clicking outside or pressing escape
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Progress bar - only show for founder onboarding */}
        {userType === 'founder' && (
        <LinearProgress 
          variant="determinate" 
          value={progress}
          sx={{
            height: 6,
            borderRadius: '3px 3px 0 0',
            bgcolor: 'rgba(14, 165, 233, 0.1)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)',
              borderRadius: 1,
            }
          }}
        />
        )}
        
        <DialogContent sx={{ p: 4 }}>
          {/* Step indicator - only show when user has selected founder */}
          {userType === 'founder' && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              Step {currentStep + 1} of {totalSteps}
            </Typography>
          </Box>
          )}
          
          {/* Content */}
          <Box sx={{ minHeight: 400 }}>
            {renderStepContent()}
          </Box>
          
          {/* Navigation buttons - only show when user has selected founder */}
          {userType === 'founder' && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 3, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={handleBack}
              disabled={currentStep === 0}
              sx={{ textTransform: 'none' }}
            >
              Back
            </Button>
            
            {currentStep === totalSteps - 1 ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleComplete}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Skip for now
                </Button>
                <Button
                  variant="contained"
                  onClick={handleComplete}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                    textTransform: 'none',
                    px: 4,
                  }}
                >
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                endIcon={<ArrowForward />}
                onClick={handleNext}
                disabled={!canProceed()}
                sx={{
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
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
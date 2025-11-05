import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Add, Remove, ArrowBack, ArrowForward } from '@mui/icons-material';

const ProfileSetup = ({ onProfileComplete }) => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    looking_for: '',
    skills: [],
    location: '',
    website_url: '',
    linkedin_url: ''
  });
  const [projects, setProjects] = useState([
    { title: '', description: '', stage: '' }
  ]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = ['Basic Info', 'Projects', 'About You', 'Review'];

  const projectStages = [
    { value: 'idea', label: 'Just an Idea' },
    { value: 'mvp', label: 'MVP Development' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth Stage' }
  ];

  const commonSkills = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript', 'AWS', 'Docker',
    'Machine Learning', 'AI', 'Blockchain', 'Mobile Development', 'Web Design',
    'Marketing', 'Sales', 'Finance', 'Operations', 'Product Management'
  ];

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSkillsChange = (event) => {
    setFormData(prev => ({
      ...prev,
      skills: event.target.value
    }));
  };

  const handleProjectChange = (index, field) => (event) => {
    const updatedProjects = [...projects];
    updatedProjects[index][field] = event.target.value;
    setProjects(updatedProjects);
  };

  const addProject = () => {
    setProjects([...projects, { title: '', description: '', stage: '' }]);
  };

  const removeProject = (index) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Basic Info
        return formData.name && formData.email;
      case 1: // Projects
        const validProjects = projects.filter(p => p.title && p.description && p.stage);
        return validProjects.length > 0;
      case 2: // About You
        return formData.looking_for && formData.skills.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setError(null);
      setActiveStep((prevStep) => prevStep + 1);
    } else {
      setError('Please fill in all required fields before continuing');
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate at least one project has title and description
    const validProjects = projects.filter(p => p.title && p.description && p.stage);
    if (validProjects.length === 0) {
      setError('Please add at least one project with title, description, and stage');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/founders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          clerk_user_id: user.id,
          projects: validProjects
        }),
      });

      if (!response.ok) throw new Error('Failed to create profile');
      
      onProfileComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Basic Information
            </Typography>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleChange('name')}
              margin="dense"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              margin="dense"
              required
              type="email"
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
                  Your Projects
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  At least 1 required (5 credits each)
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={addProject}
                sx={{ textTransform: 'none' }}
              >
                Add Project
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '400px', overflowY: 'auto' }}>
              {projects.map((project, index) => (
                <Box key={index} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Project {index + 1}
                    </Typography>
                    {projects.length > 1 && (
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        startIcon={<Remove />}
                        onClick={() => removeProject(index)}
                        sx={{ textTransform: 'none', minWidth: 'auto', p: 0.5 }}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>

                  <TextField
                    fullWidth
                    label="Project Title"
                    value={project.title}
                    onChange={handleProjectChange(index, 'title')}
                    margin="dense"
                    size="small"
                    placeholder="e.g., AI-Powered Fitness App"
                    required
                    sx={{ mb: 1.5 }}
                  />

                  <TextField
                    fullWidth
                    label="Description"
                    value={project.description}
                    onChange={handleProjectChange(index, 'description')}
                    margin="dense"
                    size="small"
                    multiline
                    rows={2}
                    placeholder="Describe your project..."
                    required
                    sx={{ mb: 1.5 }}
                  />

                  <FormControl fullWidth size="small" margin="dense">
                    <InputLabel>Stage</InputLabel>
                    <Select
                      value={project.stage}
                      onChange={handleProjectChange(index, 'stage')}
                      label="Stage"
                      required
                    >
                      {projectStages.map((stage) => (
                        <MenuItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              About You
            </Typography>
            <TextField
              fullWidth
              label="What are you looking for?"
              value={formData.looking_for}
              onChange={handleChange('looking_for')}
              margin="dense"
              size="small"
              multiline
              rows={3}
              placeholder="Describe what kind of partner you're looking for..."
              required
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth size="small" margin="dense" sx={{ mb: 2 }}>
              <InputLabel>Skills</InputLabel>
              <Select
                multiple
                value={formData.skills}
                onChange={handleSkillsChange}
                input={<OutlinedInput label="Skills" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {commonSkills.map((skill) => (
                  <MenuItem key={skill} value={skill}>
                    {skill}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={handleChange('location')}
              margin="dense"
              size="small"
              placeholder="e.g., San Francisco, CA"
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Contact & Review
            </Typography>
            <TextField
              fullWidth
              label="Website URL"
              value={formData.website_url}
              onChange={handleChange('website_url')}
              margin="dense"
              size="small"
              placeholder="https://yourwebsite.com"
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="LinkedIn URL"
              value={formData.linkedin_url}
              onChange={handleChange('linkedin_url')}
              margin="dense"
              size="small"
              placeholder="https://linkedin.com/in/yourprofile"
              sx={{ mb: 2 }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Review Your Profile
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                <strong>Name:</strong> {formData.name}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                <strong>Email:</strong> {formData.email}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                <strong>Location:</strong> {formData.location || 'Not specified'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                <strong>Skills:</strong> {formData.skills.join(', ') || 'None selected'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                <strong>Projects:</strong> {projects.filter(p => p.title).length}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>Looking for:</strong> {formData.looking_for || 'Not specified'}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ 
      maxWidth: '900px', 
      mx: 'auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Card sx={{ 
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <CardContent sx={{ 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden'
        }}>
          <Typography variant="h5" component="h1" gutterBottom align="center" sx={{ mb: 2, fontWeight: 600 }}>
            Complete Your Profile
          </Typography>
          
          {/* Stepper */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel sx={{ '& .MuiStepLabel-label': { fontSize: '0.75rem' } }}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step Content - Scrollable area */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
              flex: 1,
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
            }}
          >
            {renderStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons - Fixed at bottom */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none' }}
            >
              Previous
            </Button>
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ 
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                {loading ? 'Creating Profile...' : 'Complete Profile'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                sx={{ 
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                Next
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfileSetup;


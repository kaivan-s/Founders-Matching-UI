import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
} from '@mui/material';
import { Business, Rocket, Psychology, ArrowBack, ArrowForward, TrendingUp, AttachMoney, Groups, Schedule } from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import ProjectCompatibilityQuiz from './ProjectCompatibilityQuiz';
import { API_BASE } from '../config/api';

const NewProjectDialog = ({ open, onClose, onProjectCreated }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stage: 'idea',
    genre: '',
    needed_skills: [],
  });
  const [otherSkill, setOtherSkill] = useState('');
  const [compatibilityAnswers, setCompatibilityAnswers] = useState({});
  
  const steps = [
    { label: 'Project Info', icon: <Business />, category: null },
    { label: 'Work Style', icon: <Schedule />, category: 'Work style' },
    { label: 'Vision & Funding', icon: <TrendingUp />, category: 'Vision & funding' },
    { label: 'Roles & Equity', icon: <AttachMoney />, category: 'Roles & equity' },
    { label: 'Culture & Team', icon: <Groups />, category: 'Culture & team setup' },
    { label: 'Conflict & Stress', icon: <Psychology />, category: 'Conflict & communication under stress' },
  ];
  
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  // Define questions per category for validation
  const questionsByCategory = {
    'Work style': ['decision_making', 'work_hours', 'communication'],
    'Vision & funding': ['ideal_outcome', 'funding', 'timeline', 'financial_risk'],
    'Roles & equity': ['primary_role', 'equity_split', 'final_say'],
    'Culture & team setup': ['team_size', 'work_model', 'formal_process'],
    'Conflict & communication under stress': ['disagreement', 'things_go_wrong'],
  };

  const projectStages = [
    { value: 'idea', label: 'Just an Idea' },
    { value: 'mvp', label: 'MVP Development' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth Stage' }
  ];

  const projectGenres = [
    { value: 'fitness', label: 'Fitness & Health' },
    { value: 'gaming', label: 'Gaming & Entertainment' },
    { value: 'fintech', label: 'Fintech & Finance' },
    { value: 'healthcare', label: 'Healthcare & Medical' },
    { value: 'education', label: 'Education & EdTech' },
    { value: 'ecommerce', label: 'E-commerce & Retail' },
    { value: 'saas', label: 'SaaS & Software' },
    { value: 'social', label: 'Social Media & Networking' },
    { value: 'food', label: 'Food & Beverage' },
    { value: 'travel', label: 'Travel & Hospitality' },
    { value: 'real_estate', label: 'Real Estate & PropTech' },
    { value: 'ai_ml', label: 'AI & Machine Learning' },
    { value: 'blockchain', label: 'Blockchain & Crypto' },
    { value: 'sustainability', label: 'Sustainability & Green Tech' },
    { value: 'media', label: 'Media & Content' },
    { value: 'logistics', label: 'Logistics & Supply Chain' },
    { value: 'other', label: 'Other' },
  ];

  const neededSkillsOptions = [
    'Marketing',
    'Sales',
    'Product Management',
    'Engineering/Technical',
    'Design',
    'Finance',
    'Operations',
    'Business Development',
    'Content Creation',
    'Data Analytics',
    'Customer Success',
    'Legal',
    'HR/Recruiting',
  ];

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleNeededSkillsChange = (skill) => (event) => {
    const checked = event.target.checked;
    setFormData(prev => {
      const currentSkills = prev.needed_skills || [];
      if (checked) {
        return {
          ...prev,
          needed_skills: [...currentSkills, skill]
        };
      } else {
        return {
          ...prev,
          needed_skills: currentSkills.filter(s => s !== skill)
        };
      }
    });
  };

  const handleAddOtherSkill = () => {
    if (otherSkill.trim() && !formData.needed_skills.includes(otherSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        needed_skills: [...(prev.needed_skills || []), otherSkill.trim()]
      }));
      setOtherSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      needed_skills: (prev.needed_skills || []).filter(s => s !== skillToRemove)
    }));
  };

  const handleCompatibilityAnswerChange = (questionId, value) => {
    setCompatibilityAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateStep = (step) => {
    if (step === 0) {
      return formData.title.trim() && formData.description.trim() && formData.genre && formData.needed_skills && formData.needed_skills.length > 0;
    }
    
    // For compatibility quiz steps, validate questions for that category
    const category = steps[step]?.category;
    if (category && questionsByCategory[category]) {
      const requiredQuestions = questionsByCategory[category];
      return requiredQuestions.every(qId => compatibilityAnswers[qId]);
    }
    
    return true;
  };
  
  const getCategoryProgress = (step) => {
    const category = steps[step]?.category;
    if (!category || !questionsByCategory[category]) return 0;
    
    const requiredQuestions = questionsByCategory[category];
    const answeredQuestions = requiredQuestions.filter(qId => compatibilityAnswers[qId]);
    return (answeredQuestions.length / requiredQuestions.length) * 100;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setError(null);
      setCurrentStep(prev => prev + 1);
    } else {
      if (currentStep === 0) {
        setError('Please fill in project title, description, genre, and select at least one needed skill');
      } else {
        const category = steps[currentStep]?.category;
        setError(`Please answer all ${category || 'compatibility'} questions`);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      const category = steps[currentStep]?.category;
      setError(`Please answer all ${category || 'compatibility'} questions`);
      return;
    }
    
    // Final validation: ensure all 15 questions are answered
    const allQuestions = Object.values(questionsByCategory).flat();
    if (allQuestions.some(qId => !compatibilityAnswers[qId])) {
      setError('Please answer all compatibility questions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          ...formData,
          compatibility_answers: compatibilityAnswers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // Note: Credits system replaced with plan-based system
      
      // Call success callback
      if (onProjectCreated) {
        onProjectCreated(data);
      }

      // Reset form and close
      setFormData({
        title: '',
        description: '',
        stage: 'idea',
        genre: '',
        needed_skills: [],
      });
      setOtherSkill('');
      setCompatibilityAnswers({});
      setCurrentStep(0);
      onClose();
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        stage: 'idea',
        genre: '',
        needed_skills: [],
      });
      setOtherSkill('');
      setCompatibilityAnswers({});
      setCurrentStep(0);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          height: '90vh',
          maxHeight: '800px',
          width: '90vw',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Rocket sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add New Project
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Add a new project to your profile
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              }
            }} 
          />
          <Box sx={{ mt: 2, overflowX: 'auto', overflowY: 'hidden' }}>
            <Stepper 
              activeStep={currentStep} 
              alternativeLabel
              sx={{ minWidth: '600px' }}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {currentStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt:2 }}>
            <TextField
              fullWidth
              label="Project Title"
              placeholder="e.g., AI-powered Learning Platform"
              value={formData.title}
              onChange={handleChange('title')}
              required
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Description"
              placeholder="Describe your project idea, goals, and what kind of co-founder you're looking for..."
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange('description')}
              required
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel id="stage-label">Project Stage</InputLabel>
              <Select
                labelId="stage-label"
                value={formData.stage}
                label="Project Stage"
                onChange={handleChange('stage')}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                }}
              >
                {projectStages.map(stage => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel id="genre-label">Project Genre</InputLabel>
              <Select
                labelId="genre-label"
                value={formData.genre}
                label="Project Genre"
                onChange={handleChange('genre')}
                disabled={loading}
                required
                sx={{
                  borderRadius: 2,
                }}
              >
                {projectGenres.map(genre => (
                  <MenuItem key={genre.value} value={genre.value}>
                    {genre.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                What kind of support do you need? *
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Select all that apply
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                  {neededSkillsOptions.map(skill => (
                    <FormControlLabel
                      key={skill}
                      control={
                        <Checkbox
                          checked={(formData.needed_skills || []).includes(skill)}
                          onChange={handleNeededSkillsChange(skill)}
                          disabled={loading}
                        />
                      }
                      label={skill}
                    />
                  ))}
                </Box>
              </FormGroup>
              
              {/* Custom skill input */}
              <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  placeholder="Other (specify)"
                  value={otherSkill}
                  onChange={(e) => setOtherSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOtherSkill();
                    }
                  }}
                  disabled={loading}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  onClick={handleAddOtherSkill}
                  disabled={loading || !otherSkill.trim()}
                  variant="outlined"
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Add
                </Button>
              </Box>

              {/* Display selected skills as chips */}
              {formData.needed_skills && formData.needed_skills.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.needed_skills.map(skill => (
                    <Chip
                      key={skill}
                      label={skill}
                      onDelete={() => handleRemoveSkill(skill)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Each new project will appear separately in the discovery feed. 
                Other founders can swipe on specific projects, allowing you to collaborate on different 
                ideas with different people.
              </Typography>
            </Alert>
          </Box>
        )}

        {currentStep > 0 && (
          <ProjectCompatibilityQuiz
            answers={compatibilityAnswers}
            onChange={handleCompatibilityAnswerChange}
            category={steps[currentStep]?.category}
            progress={getCategoryProgress(currentStep)}
          />
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: 'none' }}
        >
          Cancel
        </Button>
        {currentStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading}
            startIcon={<ArrowBack />}
            sx={{ textTransform: 'none' }}
          >
            Back
          </Button>
        )}
        {currentStep < totalSteps - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading || !validateStep(currentStep)}
            endIcon={<ArrowForward />}
            sx={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              textTransform: 'none',
              px: 3,
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !validateStep(currentStep)}
            startIcon={loading ? <CircularProgress size={20} /> : <Business />}
            sx={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
              textTransform: 'none',
              px: 3,
            }}
          >
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewProjectDialog;

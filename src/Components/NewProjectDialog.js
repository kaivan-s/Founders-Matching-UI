import React, { useState, useRef, useEffect } from 'react';
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
  Tooltip,
  FormHelperText,
  Paper,
} from '@mui/material';
import { InfoOutlined, Lock, LockOpen, AutoAwesome, SkipNext } from '@mui/icons-material';
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
    visibility: 'open',
    application_questions: ['', '', ''],
  });
  const [otherSkill, setOtherSkill] = useState('');
  const [compatibilityAnswers, setCompatibilityAnswers] = useState({});
  const dialogContentRef = useRef(null);
  const [projectLimit, setProjectLimit] = useState(null);
  const [insightsUsage, setInsightsUsage] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    dialogContentRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  useEffect(() => {
    if (open && user?.id) {
      fetchProjectLimit();
      fetchInsightsUsage();
    }
  }, [open, user]);

  const fetchProjectLimit = async () => {
    try {
      const response = await fetch(`${API_BASE}/billing/project-limit`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setProjectLimit(data);
      }
    } catch (err) {
      console.error('Failed to fetch project limit:', err);
    }
  };

  const fetchInsightsUsage = async () => {
    try {
      const response = await fetch(`${API_BASE}/insights/usage`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setInsightsUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch insights usage:', err);
    }
  };
  
  const steps = [
    { label: 'Project Info', icon: <Business />, category: null },
    { label: 'Work Style', icon: <Schedule />, category: 'Work style' },
    { label: 'Vision & Funding', icon: <TrendingUp />, category: 'Vision & funding' },
    { label: 'Roles & Equity', icon: <AttachMoney />, category: 'Roles & equity' },
    { label: 'Culture & Team', icon: <Groups />, category: 'Culture & team setup' },
    { label: 'Conflict & Stress', icon: <Psychology />, category: 'Conflict & communication under stress' },
    { label: 'Review & Insights', icon: <AutoAwesome />, category: null, isValidation: true },
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
    { 
      value: 'idea', 
      label: 'Just an Idea',
      tooltip: 'You have a concept but haven\'t started building yet. Like having an idea for a business but nothing built.'
    },
    { 
      value: 'mvp', 
      label: 'MVP Development',
      tooltip: 'Building the first basic version of your product. MVP means "Minimum Viable Product" - the simplest version that works.'
    },
    { 
      value: 'early-stage', 
      label: 'Early Stage',
      tooltip: 'You have a working product with some users, but still early in the journey. Like having customers but still figuring things out.'
    },
    { 
      value: 'growth', 
      label: 'Growth Stage',
      tooltip: 'Your product is working and you\'re focused on growing fast. Like a business that\'s established and expanding quickly.'
    }
  ];

  const projectGenres = [
    { value: 'fitness', label: 'Fitness & Health', tooltip: 'Apps and services for exercise, health tracking, wellness, and fitness.' },
    { value: 'gaming', label: 'Gaming & Entertainment', tooltip: 'Video games, mobile games, entertainment apps, and gaming platforms.' },
    { value: 'fintech', label: 'Fintech & Finance', tooltip: 'Financial technology - banking apps, payment systems, investing tools, money management.' },
    { value: 'healthcare', label: 'Healthcare & Medical', tooltip: 'Medical apps, healthcare services, telemedicine, patient care platforms.' },
    { value: 'education', label: 'Education & EdTech', tooltip: 'Learning apps, online courses, educational tools, teaching platforms.' },
    { value: 'ecommerce', label: 'E-commerce & Retail', tooltip: 'Online stores, marketplaces, selling products online, retail platforms.' },
    { value: 'saas', label: 'SaaS & Software', tooltip: 'Software as a Service - business software you subscribe to, like project management or CRM tools.' },
    { value: 'social', label: 'Social Media & Networking', tooltip: 'Social networks, community platforms, connecting people online.' },
    { value: 'food', label: 'Food & Beverage', tooltip: 'Food delivery, recipe apps, restaurant tech, food service platforms.' },
    { value: 'travel', label: 'Travel & Hospitality', tooltip: 'Travel booking, hotel apps, trip planning, tourism services.' },
    { value: 'real_estate', label: 'Real Estate & PropTech', tooltip: 'Real estate apps, property management, buying/selling homes, property technology.' },
    { value: 'ai_ml', label: 'AI & Machine Learning', tooltip: 'Artificial intelligence products, machine learning tools, AI-powered services.' },
    { value: 'blockchain', label: 'Blockchain & Crypto', tooltip: 'Cryptocurrency, blockchain technology, decentralized apps, Web3 projects.' },
    { value: 'sustainability', label: 'Sustainability & Green Tech', tooltip: 'Environmental tech, green energy, sustainability solutions, eco-friendly products.' },
    { value: 'media', label: 'Media & Content', tooltip: 'Content creation platforms, media apps, streaming, publishing tools.' },
    { value: 'logistics', label: 'Logistics & Supply Chain', tooltip: 'Shipping, delivery, supply chain management, logistics software.' },
    { value: 'other', label: 'Other', tooltip: 'Your project doesn\'t fit into the categories above.' },
  ];

  const visibilityOptions = [
    { 
      value: 'open', 
      label: 'Open to All', 
      icon: <LockOpen sx={{ fontSize: 20 }} />,
      description: 'Anyone can see your full project details',
      color: '#22c55e'
    },
    { 
      value: 'request_access', 
      label: 'Request Access', 
      icon: <Lock sx={{ fontSize: 20 }} />,
      description: 'Users must request access, you approve or decline',
      color: '#f59e0b'
    },
  ];

  const neededSkillsOptions = [
    { skill: 'Marketing', tooltip: 'Promoting your product, getting customers to know about it, advertising, social media marketing.' },
    { skill: 'Sales', tooltip: 'Selling your product to customers, closing deals, building relationships with buyers.' },
    { skill: 'Product Management', tooltip: 'Planning what features to build, deciding product direction, coordinating what gets built.' },
    { skill: 'Engineering/Technical', tooltip: 'Building the actual product - coding, software development, making the technology work.' },
    { skill: 'Design', tooltip: 'Making your product look good and easy to use - user interface, user experience, visual design.' },
    { skill: 'Finance', tooltip: 'Managing money, accounting, budgeting, financial planning, handling company finances.' },
    { skill: 'Operations', tooltip: 'Running day-to-day business operations, managing processes, keeping things running smoothly.' },
    { skill: 'Business Development', tooltip: 'Finding partnerships, building relationships with other companies, expanding business opportunities.' },
    { skill: 'Content Creation', tooltip: 'Creating content like blog posts, videos, social media content, marketing materials.' },
    { skill: 'Data Analytics', tooltip: 'Analyzing data to understand customers and business performance, making data-driven decisions.' },
    { skill: 'Customer Success', tooltip: 'Helping customers succeed with your product, support, onboarding, keeping customers happy.' },
    { skill: 'Legal', tooltip: 'Legal matters, contracts, compliance, intellectual property, legal advice for the business.' },
    { skill: 'HR/Recruiting', tooltip: 'Hiring people, managing employees, human resources, building a team.' },
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

  // Helper to get skill name from skill object
  const getSkillName = (skillObj) => typeof skillObj === 'string' ? skillObj : skillObj.skill;

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
    
    // Validation step (last step) - always valid, it's a review step
    if (steps[step]?.isValidation) {
      return true;
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

  const handleSubmit = async (generateInsights = false) => {
    // Final validation: ensure all 15 questions are answered
    const allQuestions = Object.values(questionsByCategory).flat();
    if (allQuestions.some(qId => !compatibilityAnswers[qId])) {
      setError('Please answer all compatibility questions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, create the project
      const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          stage: formData.stage,
          genre: formData.genre,
          needed_skills: formData.needed_skills,
          visibility: formData.visibility,
          compatibility_answers: compatibilityAnswers,
          application_questions: formData.application_questions.filter(q => q && q.trim()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      // If user wants to generate insights, do it now
      if (generateInsights && data.id) {
        setGeneratingInsights(true);
        try {
          await fetch(`${API_BASE}/projects/${data.id}/insights/generate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Clerk-User-Id': user.id,
            },
          });
          // Insights generation started - it may take a while
        } catch (insightsErr) {
          console.error('Failed to generate insights:', insightsErr);
          // Don't fail the whole project creation if insights fail
        }
        setGeneratingInsights(false);
      }

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
        visibility: 'open',
        application_questions: ['', '', ''],
      });
      setOtherSkill('');
      setCompatibilityAnswers({});
      setCurrentStep(0);
      setInsightsUsage(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setLoading(false);
      setGeneratingInsights(false);
    }
  };

  const handleClose = () => {
    if (!loading && !generatingInsights) {
      setFormData({
        title: '',
        description: '',
        stage: 'idea',
        genre: '',
        needed_skills: [],
        visibility: 'open',
        application_questions: ['', '', ''],
      });
      setOtherSkill('');
      setCompatibilityAnswers({});
      setCurrentStep(0);
      setError(null);
      setInsightsUsage(null);
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
          borderRadius: '16px',
          height: '90vh',
          maxHeight: '800px',
          width: '90vw',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e2e8f0',
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: '12px',
            bgcolor: '#0d9488',
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
              Share your idea and find co-founders
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              height: 6, 
              borderRadius: '12px',
              bgcolor: 'rgba(13, 148, 136, 0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: '#0d9488',
                borderRadius: '12px',
              }
            }} 
          />
          <Box sx={{ mt: 2, overflowX: 'auto', overflowY: 'hidden' }}>
            <Stepper 
              activeStep={currentStep} 
              alternativeLabel
              sx={{ 
                minWidth: '600px',
                '& .MuiStepLabel-root .Mui-completed': {
                  color: '#0d9488',
                },
                '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel': {
                  color: '#0d9488',
                },
                '& .MuiStepLabel-root .Mui-active': {
                  color: '#0d9488',
                },
                '& .MuiStepLabel-label.Mui-active.MuiStepLabel-alternativeLabel': {
                  color: '#0d9488',
                },
                '& .MuiStepIcon-root': {
                  fontSize: '1.5rem',
                  '&.Mui-completed': {
                    color: '#0d9488',
                  },
                  '&.Mui-active': {
                    color: '#0d9488',
                  },
                },
              }}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: index === currentStep ? 600 : 400 }}>
                      {step.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent ref={dialogContentRef} sx={{ pt: 3, flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Project limit reached message */}
        {projectLimit && !projectLimit.can_create && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 2, 
              borderRadius: '12px',
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Project limit reached ({projectLimit.current_count}/{projectLimit.max_allowed})
              </Typography>
              <Typography variant="body2">
                Upgrade to Pro for up to 3 projects, or Pro+ for unlimited projects.
              </Typography>
              <Button 
                variant="contained" 
                size="small"
                href="/pricing"
                sx={{ 
                  mt: 1, 
                  alignSelf: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  bgcolor: '#0d9488',
                  '&:hover': { bgcolor: '#14b8a6' }
                }}
              >
                View Plans
              </Button>
            </Box>
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
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
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
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
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
                renderValue={(val) => projectStages.find(s => s.value === val)?.label || val}
                sx={{
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#0d9488',
                  },
                }}
              >
                {projectStages.map(stage => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ position: 'relative' }}>
              <FormControl fullWidth>
                <InputLabel id="genre-label">Project Genre</InputLabel>
                <Select
                  labelId="genre-label"
                  value={formData.genre}
                  label="Project Genre"
                  onChange={handleChange('genre')}
                  disabled={loading}
                  required
                  renderValue={(val) => projectGenres.find(g => g.value === val)?.label || val}
                  sx={{
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0d9488',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#0d9488',
                    },
                  }}
                >
                  {projectGenres.map(genre => (
                    <MenuItem key={genre.value} value={genre.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography>{genre.label}</Typography>
                        <Tooltip title={genre.tooltip} arrow placement="bottom" disableInteractive>
                          <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.6, ml: 'auto', pointerEvents: 'auto' }} />
                        </Tooltip>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formData.genre && (
                  <FormHelperText>
                    {projectGenres.find(g => g.value === formData.genre)?.tooltip}
                  </FormHelperText>
                )}
              </FormControl>
              {formData.genre && (
                <Tooltip 
                  title={projectGenres.find(g => g.value === formData.genre)?.tooltip || ''}
                  arrow
                  placement="bottom"
                >
                  <InfoOutlined 
                    sx={{ 
                      position: 'absolute',
                      right: 40,
                      top: 32,
                      fontSize: 16, 
                      color: 'text.secondary', 
                      opacity: 0.7, 
                      cursor: 'help',
                      pointerEvents: 'auto',
                    }} 
                  />
                </Tooltip>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                What kind of support do you need? *
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Select all that apply
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1 }}>
                  {neededSkillsOptions.map(skillObj => {
                    const skill = getSkillName(skillObj);
                    return (
                      <Tooltip
                        key={skill}
                        title={skillObj.tooltip}
                        arrow
                        placement="bottom"
                        componentsProps={{
                          tooltip: {
                            sx: {
                              bgcolor: 'rgba(15, 23, 42, 0.95)',
                              maxWidth: 350,
                              fontSize: '0.875rem',
                              lineHeight: 1.5,
                              p: 1.5,
                            },
                          },
                          arrow: {
                            sx: {
                              color: 'rgba(15, 23, 42, 0.95)',
                            },
                          },
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={(formData.needed_skills || []).includes(skill)}
                              onChange={handleNeededSkillsChange(skill)}
                              disabled={loading}
                              sx={{
                                color: '#0d9488',
                                '&.Mui-checked': {
                                  color: '#0d9488',
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography>{skill}</Typography>
                              <InfoOutlined 
                                sx={{ 
                                  fontSize: 14, 
                                  color: 'text.secondary',
                                  opacity: 0.6,
                                }} 
                              />
                            </Box>
                          }
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    );
                  })}
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
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#0d9488',
                    color: '#0d9488',
                    borderRadius: '12px',
                    '&:hover': {
                      borderColor: '#14b8a6',
                      bgcolor: 'rgba(13, 148, 136, 0.04)',
                    },
                    '&:disabled': {
                      borderColor: '#cbd5e1',
                      color: '#94a3b8',
                    },
                  }}
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
                      sx={{
                        bgcolor: 'rgba(13, 148, 136, 0.08)',
                        color: '#0d9488',
                        border: '1px solid rgba(13, 148, 136, 0.15)',
                        fontWeight: 500,
                        '& .MuiChip-deleteIcon': {
                          color: '#0d9488',
                          '&:hover': {
                            color: '#14b8a6',
                          }
                        }
                      }}
                      size="small"
                    />
                  ))}
                </Box>
              )}
            </Box>
            
            {/* Visibility Settings */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lock sx={{ fontSize: 18, color: '#64748b' }} />
                Project Visibility
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Control who can see your project details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.5 }}>
                {visibilityOptions.map(option => (
                  <Box
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, visibility: option.value }))}
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: formData.visibility === option.value ? option.color : '#e2e8f0',
                      bgcolor: formData.visibility === option.value ? `${option.color}08` : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: option.color,
                        bgcolor: `${option.color}05`,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box sx={{ color: formData.visibility === option.value ? option.color : '#64748b' }}>
                        {option.icon}
                      </Box>
                      <Typography variant="subtitle2" sx={{ 
                        fontWeight: 600, 
                        color: formData.visibility === option.value ? option.color : '#0f172a' 
                      }}>
                        {option.label}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
                      {option.description}
                    </Typography>
                  </Box>
                ))}
              </Box>

              </Box>

            {/* Application Questions - Only show for request_access visibility */}
            {formData.visibility === 'request_access' && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ fontSize: 18, color: '#64748b' }} />
                  Application Questions
                  <Chip label="Optional" size="small" sx={{ ml: 1, fontSize: '0.65rem', height: 20, bgcolor: '#f1f5f9', color: '#64748b' }} />
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Ask up to 3 questions that potential co-founders must answer when requesting to connect. This helps you evaluate their fit and seriousness.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[0, 1, 2].map((index) => (
                    <TextField
                      key={index}
                      fullWidth
                      label={`Question ${index + 1}`}
                      placeholder={
                        index === 0 ? "e.g., Why are you interested in this project?" :
                        index === 1 ? "e.g., What relevant experience do you have?" :
                        "e.g., What's your availability and commitment level?"
                      }
                      value={formData.application_questions[index] || ''}
                      onChange={(e) => {
                        const newQuestions = [...formData.application_questions];
                        newQuestions[index] = e.target.value;
                        setFormData(prev => ({ ...prev, application_questions: newQuestions }));
                      }}
                      disabled={loading}
                      multiline
                      rows={2}
                      inputProps={{ maxLength: 500 }}
                      helperText={`${(formData.application_questions[index] || '').length}/500`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0d9488',
                          },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#0d9488',
                        },
                      }}
                    />
                  ))}
                </Box>
                <Alert severity="info" sx={{ mt: 2, borderRadius: '12px', bgcolor: 'rgba(13, 148, 136, 0.05)', border: '1px solid rgba(13, 148, 136, 0.15)' }}>
                  <Typography variant="caption">
                    <strong>Tip:</strong> Good questions help filter serious applicants. Ask about specific experience, availability, or their vision for the collaboration.
                  </Typography>
                </Alert>
              </Box>
            )}

            <Alert severity="info" sx={{ borderRadius: '12px', bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Typography variant="body2">
                <strong>Note:</strong> Each new project will appear separately in the discovery feed. 
                Other founders can swipe on specific projects, allowing you to collaborate on different 
                ideas with different people.
              </Typography>
            </Alert>
          </Box>
        )}

        {currentStep > 0 && currentStep < totalSteps - 1 && (
          <ProjectCompatibilityQuiz
            answers={compatibilityAnswers}
            onChange={handleCompatibilityAnswerChange}
            category={steps[currentStep]?.category}
            progress={getCategoryProgress(currentStep)}
          />
        )}

        {/* Validation Step - Review & Generate Insights */}
        {currentStep === totalSteps - 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            {/* Project Summary */}
            <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#0f172a' }}>
                Project Summary
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Title</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formData.title}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Description</Typography>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    {formData.description.length > 200 ? `${formData.description.substring(0, 200)}...` : formData.description}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Stage</Typography>
                    <Typography variant="body2">{projectStages.find(s => s.value === formData.stage)?.label}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Genre</Typography>
                    <Typography variant="body2">{projectGenres.find(g => g.value === formData.genre)?.label}</Typography>
                  </Box>
                </Box>
                {formData.needed_skills.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, mb: 0.5, display: 'block' }}>Skills Needed</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.needed_skills.map(skill => (
                        <Chip key={skill} label={skill} size="small" sx={{ bgcolor: 'rgba(13, 148, 136, 0.08)', color: '#0d9488', fontSize: '0.7rem' }} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>

            {/* AI Insights Section */}
            <Paper sx={{ 
              p: 3, 
              borderRadius: '12px', 
              border: '2px solid',
              borderColor: insightsUsage?.can_generate ? '#0d9488' : '#e2e8f0',
              bgcolor: insightsUsage?.can_generate ? 'rgba(13, 148, 136, 0.02)' : '#fff'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: '12px', 
                  bgcolor: insightsUsage?.can_generate ? 'rgba(13, 148, 136, 0.1)' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <AutoAwesome sx={{ fontSize: 24, color: insightsUsage?.can_generate ? '#0d9488' : '#94a3b8' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5, color: '#0f172a' }}>
                    AI-Powered Idea Validation
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                    Get comprehensive market research, competitor analysis, SWOT analysis, and actionable recommendations powered by AI.
                  </Typography>

                  {/* Show tier-specific messaging */}
                  {insightsUsage?.tier === 'FREE' && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        borderRadius: '8px', 
                        bgcolor: '#f0f9ff', 
                        border: '1px solid #bae6fd',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Upgrade to Pro to unlock AI Insights
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Pro users get 3 reports/month, Pro+ users get 10 reports/month.
                      </Typography>
                      <Button 
                        size="small" 
                        href="/pricing" 
                        sx={{ 
                          mt: 1, 
                          textTransform: 'none', 
                          fontWeight: 600, 
                          color: '#0d9488' 
                        }}
                      >
                        View Plans
                      </Button>
                    </Alert>
                  )}

                  {insightsUsage?.tier !== 'FREE' && insightsUsage?.can_generate && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip 
                          label={insightsUsage.tier === 'PRO_PLUS' ? 'Pro+' : 'Pro'} 
                          size="small" 
                          sx={{ 
                            bgcolor: insightsUsage.tier === 'PRO_PLUS' ? '#8b5cf6' : '#0d9488', 
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }} 
                        />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {insightsUsage.remaining} of {insightsUsage.max_allowed} reports remaining this month
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#475569' }}>
                        The report includes: Market Overview, Competitor Analysis, SWOT, Key Risks, and Recommendations.
                      </Typography>
                    </Box>
                  )}

                  {insightsUsage?.tier !== 'FREE' && !insightsUsage?.can_generate && (
                    <Alert 
                      severity="warning" 
                      sx={{ 
                        borderRadius: '8px',
                        '& .MuiAlert-message': { width: '100%' }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Monthly limit reached ({insightsUsage.current_usage}/{insightsUsage.max_allowed})
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Your limit resets at the beginning of next month. You can still generate insights later from the My Projects page.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Box>
            </Paper>

            <Alert severity="info" sx={{ borderRadius: '12px', bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Typography variant="body2">
                <strong>Note:</strong> You can always generate insights later from the My Projects page or view them in your workspace after finding a match.
              </Typography>
            </Alert>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button 
          onClick={handleClose}
          disabled={loading || generatingInsights}
          sx={{ 
            textTransform: 'none',
            color: '#64748b',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'rgba(100, 116, 139, 0.08)',
            },
          }}
        >
          Cancel
        </Button>
        {currentStep > 0 && (
          <Button
            onClick={handleBack}
            disabled={loading || generatingInsights}
            startIcon={<ArrowBack />}
            sx={{ 
              textTransform: 'none',
              color: '#64748b',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'rgba(100, 116, 139, 0.08)',
              },
            }}
          >
            Back
          </Button>
        )}
        {currentStep < totalSteps - 1 ? (
          <Button
            onClick={handleNext}
            variant="contained"
            disabled={loading || !validateStep(currentStep) || (projectLimit && !projectLimit.can_create)}
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: '#0d9488',
              color: 'white',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: '12px',
              '&:hover': {
                bgcolor: '#14b8a6',
              },
              '&:disabled': {
                bgcolor: '#cbd5e1',
                color: '#94a3b8',
              },
            }}
          >
            Next
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {/* Skip & Create button */}
            <Button
              onClick={() => handleSubmit(false)}
              variant="outlined"
              disabled={loading || generatingInsights || (projectLimit && !projectLimit.can_create)}
              startIcon={loading && !generatingInsights ? <CircularProgress size={20} color="inherit" /> : <SkipNext />}
              sx={{
                borderColor: '#64748b',
                color: '#64748b',
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: '12px',
                '&:hover': {
                  borderColor: '#475569',
                  bgcolor: 'rgba(100, 116, 139, 0.08)',
                },
                '&:disabled': {
                  borderColor: '#cbd5e1',
                  color: '#94a3b8',
                },
              }}
            >
              {loading && !generatingInsights ? 'Creating...' : 'Skip & Create'}
            </Button>
            
            {/* Generate Insights & Create button - only if user can generate */}
            {insightsUsage?.can_generate && (
              <Button
                onClick={() => handleSubmit(true)}
                variant="contained"
                disabled={loading || generatingInsights || (projectLimit && !projectLimit.can_create)}
                startIcon={generatingInsights ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                sx={{
                  bgcolor: '#0d9488',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: '#14b8a6',
                  },
                  '&:disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8',
                  },
                }}
              >
                {generatingInsights ? 'Generating...' : 'Generate Insights & Create'}
              </Button>
            )}

            {/* If user can't generate (FREE or limit reached), show simple Create button */}
            {!insightsUsage?.can_generate && (
              <Button
                onClick={() => handleSubmit(false)}
                variant="contained"
                disabled={loading || (projectLimit && !projectLimit.can_create)}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Business />}
                sx={{
                  bgcolor: '#0d9488',
                  color: 'white',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  '&:hover': {
                    bgcolor: '#14b8a6',
                  },
                  '&:disabled': {
                    bgcolor: '#cbd5e1',
                    color: '#94a3b8',
                  },
                }}
              >
                {loading ? 'Creating...' : 'Create Project'}
              </Button>
            )}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewProjectDialog;

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
  Tooltip,
  FormHelperText,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
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
            
            <Box sx={{ position: 'relative' }}>
              <FormControl fullWidth>
                <InputLabel id="stage-label">Project Stage</InputLabel>
                <Select
                  labelId="stage-label"
                  value={formData.stage}
                  label="Project Stage"
                  onChange={handleChange('stage')}
                  disabled={loading}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography>{stage.label}</Typography>
                        <Tooltip title={stage.tooltip} arrow placement="right" disableInteractive>
                          <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.6, ml: 'auto', pointerEvents: 'auto' }} />
                        </Tooltip>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formData.stage && (
                  <FormHelperText>
                    {projectStages.find(s => s.value === formData.stage)?.tooltip}
                  </FormHelperText>
                )}
              </FormControl>
              {formData.stage && (
                <Tooltip 
                  title={projectStages.find(s => s.value === formData.stage)?.tooltip || ''}
                  arrow
                  placement="right"
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
                        <Tooltip title={genre.tooltip} arrow placement="right" disableInteractive>
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
                  placement="right"
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
                        placement="right"
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
            
            <Alert severity="info" sx={{ borderRadius: '12px', bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
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
      
      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
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
            disabled={loading}
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
            disabled={loading || !validateStep(currentStep)}
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
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !validateStep(currentStep)}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Business />}
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
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default NewProjectDialog;

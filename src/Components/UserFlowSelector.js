import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton } from '@clerk/clerk-react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  alpha,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Search,
  RocketLaunch,
  Handshake,
  ArrowForward,
  Close,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import LocationAutocomplete from './LocationAutocomplete';
import FounderPlanNavTag from './FounderPlanNavTag';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

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
];

const UserFlowSelector = ({ onFounderVerified }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [location, setLocation] = useState('');

  const handleCardClick = async (flowId) => {
    if (flowId === 'advisor') {
      navigate('/advisor/onboarding');
      return;
    }

    if (!user?.id) return;

    setCheckingOnboarding(true);
    setSelectedFlow(flowId);
    
    try {
      const response = await fetch(`${API_BASE}/founders/onboarding-status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });

      if (response.ok) {
        const data = await response.json();
        
        // If fully onboarded, navigate directly
        if (data.exists && data.onboarding_completed && data.has_purpose && data.has_skills) {
          if (onFounderVerified) onFounderVerified();
          navigate(flowId === 'create' ? '/projects' : '/discover');
          return;
        }
      }
      
      // Need onboarding - show modal
      setShowModal(true);
      setSkills([]);
      setLocation('');
      setSkillInput('');
    } catch (error) {
      setShowModal(true);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleQuickAddSkill = (skill) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
    }
  };

  const handleSubmit = async () => {
    if (skills.length === 0) {
      return;
    }

    setSubmitting(true);
    
    try {
      const purpose = selectedFlow === 'create' ? 'idea_needs_cofounder' : 'skills_want_project';
      const name = user?.fullName || user?.firstName || '';
      const email = user?.primaryEmailAddress?.emailAddress || '';

      const response = await fetch(`${API_BASE}/founders/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          name,
          email,
          purpose,
          location,
          skills,
          projects: [],
          onboarding_completed: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setShowModal(false);
      if (onFounderVerified) onFounderVerified();
      navigate(selectedFlow === 'create' ? '/projects' : '/discover');
    } catch (error) {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFlow(null);
  };

  const getModalColor = () => {
    return selectedFlow === 'create' ? NAVY : TEAL;
  };

  const options = [
    {
      id: 'join',
      icon: <Search sx={{ fontSize: 48 }} />,
      title: 'Join a Project',
      description: 'Browse projects looking for co-founders. Apply with your skills and find the right fit.',
      color: TEAL,
    },
    {
      id: 'create',
      icon: <RocketLaunch sx={{ fontSize: 48 }} />,
      title: 'Create a Project',
      description: 'Have an idea? Post your project and find collaborators who believe in your vision.',
      color: NAVY,
    },
    {
      id: 'advisor',
      icon: <Handshake sx={{ fontSize: 48 }} />,
      title: 'Join as Advisor',
      description: 'Help founders succeed. Offer paid consultations and build your advisory network.',
      color: '#7c3aed',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 4, md: 8 }, position: 'relative' }}>
      {/* Account menu */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 16, md: 24 },
          right: { xs: 16, md: 32 },
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <FounderPlanNavTag />
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: { width: 36, height: 36 },
            },
          }}
        />
      </Box>

      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              mb: 2,
              color: SLATE_900,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              letterSpacing: '-0.02em',
            }}
          >
            What brings you here today?
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: SLATE_500,
              maxWidth: 480,
              mx: 'auto',
              fontSize: '1.05rem',
            }}
          >
            Choose your path. You can always explore other options later.
          </Typography>
        </Box>

        {/* Options Grid */}
        <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto' }}>
          {options.map((option) => (
            <Grid item xs={12} md={4} key={option.id}>
              <Card
                onClick={() => handleCardClick(option.id)}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  border: '2px solid',
                  borderColor: SLATE_200,
                  borderRadius: 3,
                  bgcolor: '#fff',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: option.color,
                    boxShadow: `0 12px 24px ${alpha(option.color, 0.15)}`,
                    '& .option-icon': {
                      transform: 'scale(1.1)',
                      color: option.color,
                    },
                    '& .option-arrow': {
                      transform: 'translateX(4px)',
                      opacity: 1,
                    },
                  },
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <Box
                    className="option-icon"
                    sx={{
                      color: alpha(option.color, 0.7),
                      mb: 3,
                      transition: 'all 0.25s ease',
                    }}
                  >
                    {option.icon}
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      color: SLATE_900,
                      fontSize: '1.25rem',
                    }}
                  >
                    {option.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      color: SLATE_500,
                      mb: 3,
                      lineHeight: 1.7,
                      minHeight: 60,
                    }}
                  >
                    {option.description}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: option.color,
                    }}
                  >
                    {checkingOnboarding && selectedFlow === option.id ? (
                      <CircularProgress size={24} sx={{ color: option.color }} />
                    ) : (
                      <>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                        >
                          Get Started
                        </Typography>
                        <ArrowForward
                          className="option-arrow"
                          sx={{
                            fontSize: 18,
                            transition: 'all 0.25s ease',
                            opacity: 0.7,
                          }}
                        />
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer note */}
        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            mt: 5,
            color: SLATE_500,
            fontSize: '0.875rem',
          }}
        >
          Not sure yet? Start by browsing projects — you can create your own anytime.
        </Typography>
      </Container>

      {/* Simple Onboarding Modal */}
      <Dialog
        open={showModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogContent sx={{ p: { xs: 3, md: 4 } }}>
          {/* Close button */}
          <IconButton
            onClick={handleCloseModal}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: SLATE_400,
              '&:hover': { color: SLATE_900 },
            }}
          >
            <Close />
          </IconButton>

          {/* Modal content */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: SLATE_900,
              mb: 1,
            }}
          >
            Almost there!
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: SLATE_500,
              mb: 4,
            }}
          >
            Tell us a bit about yourself to get started
          </Typography>

          {/* Skills Section */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
            What are your skills?
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <Button
              variant="contained"
              onClick={handleAddSkill}
              disabled={!skillInput.trim()}
              sx={{
                bgcolor: getModalColor(),
                '&:hover': { bgcolor: alpha(getModalColor(), 0.85) },
                textTransform: 'none',
                px: 3,
              }}
            >
              Add
            </Button>
          </Box>

          {/* Selected skills */}
          {skills.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {skills.map((skill) => (
                <Chip
                  key={skill}
                  label={skill}
                  onDelete={() => handleRemoveSkill(skill)}
                  sx={{
                    bgcolor: alpha(getModalColor(), 0.1),
                    color: getModalColor(),
                    '& .MuiChip-deleteIcon': {
                      color: alpha(getModalColor(), 0.6),
                      '&:hover': { color: getModalColor() },
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Quick add */}
          <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mb: 1 }}>
            Quick add:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            {commonSkills.filter(s => !skills.includes(s)).slice(0, 8).map((skill) => (
              <Chip
                key={skill}
                label={skill}
                size="small"
                onClick={() => handleQuickAddSkill(skill)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: alpha(SLATE_400, 0.1),
                  color: SLATE_500,
                  border: `1px solid ${alpha(SLATE_400, 0.2)}`,
                  fontSize: '0.75rem',
                  '&:hover': {
                    bgcolor: alpha(getModalColor(), 0.1),
                    color: getModalColor(),
                    borderColor: alpha(getModalColor(), 0.3),
                  },
                }}
              />
            ))}
          </Box>

          {/* Location Section */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
            Where are you based?{' '}
            <Typography component="span" sx={{ color: SLATE_400, fontWeight: 400, fontSize: '0.8rem' }}>
              (optional)
            </Typography>
          </Typography>
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            placeholder="City or Remote"
            sx={{ mb: 4 }}
          />

          {/* Submit Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={submitting || skills.length === 0}
            sx={{
              bgcolor: getModalColor(),
              '&:hover': { bgcolor: alpha(getModalColor(), 0.85) },
              '&:disabled': { bgcolor: SLATE_200 },
              textTransform: 'none',
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: 2,
            }}
          >
            {submitting ? (
              <CircularProgress size={24} sx={{ color: '#fff' }} />
            ) : (
              'Continue'
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default UserFlowSelector;

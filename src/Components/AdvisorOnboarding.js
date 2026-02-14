import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  Slider,
  alpha,
} from '@mui/material';
import { CheckCircle, LinkedIn } from '@mui/icons-material';
import { API_BASE } from '../config/api';

const STAGES = ['idea', 'pre-seed', 'seed', 'series-a', 'series-b-plus'];
const DOMAINS = [
  'SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML',
  'Marketplace', 'Consumer', 'B2B', 'Hardware', 'Other'
];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Portuguese', 'Other'];
const CADENCE_OPTIONS = ['weekly', 'bi-weekly', 'monthly'];

const AdvisorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  // LinkedIn verification state
  const [linkedinStatus, setLinkedinStatus] = useState({
    linkedin_verified: false,
    linkedin_configured: false,
    linkedin_name: null,
  });
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Info
    headline: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Expertise
    expertise_stages: [],
    domains: [],
    languages: ['English'],
    
    // Capacity
    max_active_workspaces: 3,
    preferred_cadence: 'weekly',
    
    // Contact
    contact_email: user?.emailAddresses?.[0]?.emailAddress || '',
    meeting_link: '',
    contact_note: '',
    linkedin_url: '',
    twitter_url: '',
    
    // Questionnaire
    questionnaire_data: {
      years_experience: '',
      previous_companies: '',
      areas_of_expertise: '',
      typical_engagement_length: '',
      preferred_communication_style: '',
      availability_hours_per_week: '',
      success_stories: '',
      what_makes_you_unique: '',
    }
  });

  const steps = ['Basic Information', 'Expertise & Experience', 'Capacity & Preferences', 'Contact & Social', 'Questionnaire'];

  // Fetch LinkedIn verification status
  const fetchLinkedinStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedinStatus(data);
      }
    } catch (err) {
      // Ignore errors - verification is optional
    }
  }, [user?.id]);

  // Initiate LinkedIn OAuth flow
  const handleLinkedInConnect = async () => {
    if (!user?.id) return;
    setLinkedinLoading(true);
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        // Redirect to LinkedIn OAuth
        window.location.href = data.auth_url;
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to initiate LinkedIn verification');
      }
    } catch (err) {
      setError('Failed to connect to LinkedIn');
    } finally {
      setLinkedinLoading(false);
    }
  };

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const handleLinkedInCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      if (code && user?.id) {
        setLinkedinLoading(true);
        try {
          const response = await fetch(`${API_BASE}/advisors/linkedin/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Clerk-User-Id': user.id,
            },
            body: JSON.stringify({ code, state }),
          });
          
          if (response.ok) {
            const data = await response.json();
            setLinkedinStatus({
              linkedin_verified: true,
              linkedin_configured: true,
              linkedin_name: data.linkedin_name,
            });
            // Clear URL params
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            const err = await response.json();
            setError(err.error || 'LinkedIn verification failed');
          }
        } catch (err) {
          setError('Failed to complete LinkedIn verification');
        } finally {
          setLinkedinLoading(false);
        }
      }
    };
    
    handleLinkedInCallback();
  }, [searchParams, user?.id]);

  // Check if advisor profile already exists on mount
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user?.id) {
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/advisors/profile`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          // Profile exists - only redirect if APPROVED; PENDING/REJECTED can edit
          if (profileData !== null && profileData !== undefined && typeof profileData === 'object' && Object.keys(profileData).length > 0) {
            const status = profileData.status || 'PENDING';
            if (status === 'APPROVED') {
              navigate('/advisor/dashboard', { replace: true });
              return;
            }
            // PENDING or REJECTED: load existing data for editing
            setFormData(prev => ({
              ...prev,
              headline: profileData.headline || prev.headline,
              bio: profileData.bio || prev.bio,
              timezone: profileData.timezone || prev.timezone,
              expertise_stages: profileData.expertise_stages || prev.expertise_stages,
              domains: profileData.domains || prev.domains,
              languages: profileData.languages || prev.languages,
              max_active_workspaces: profileData.max_active_workspaces ?? prev.max_active_workspaces,
              preferred_cadence: profileData.preferred_cadence || prev.preferred_cadence,
              contact_email: profileData.contact_email || prev.contact_email,
              meeting_link: profileData.meeting_link || prev.meeting_link,
              contact_note: profileData.contact_note || prev.contact_note,
              linkedin_url: profileData.linkedin_url || prev.linkedin_url,
              twitter_url: profileData.twitter_url || prev.twitter_url,
              questionnaire_data: { ...prev.questionnaire_data, ...(profileData.questionnaire_data || {}) },
            }));
          }
        }
      } catch (err) {
        // On error, allow onboarding to proceed
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProfile();
    fetchLinkedinStatus();
  }, [user?.id, navigate, fetchLinkedinStatus]);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => {
      const current = prev[field] || [];
      if (checked) {
        return { ...prev, [field]: [...current, value] };
      } else {
        return { ...prev, [field]: current.filter(item => item !== value) };
      }
    });
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return formData.headline.length >= 10 && formData.bio.length >= 50;
      case 1:
        return formData.expertise_stages.length > 0 && formData.domains.length > 0;
      case 2:
        return formData.max_active_workspaces >= 1 && formData.max_active_workspaces <= 10;
      case 3:
        return formData.contact_email && formData.contact_email.includes('@');
      case 4:
        return true; // Questionnaire is optional but recommended
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/advisors/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
          'X-User-Email': user.emailAddresses?.[0]?.emailAddress || '',
          'X-User-Name': user.fullName || user.firstName || '',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create advisor profile');
      }

      const profile = await response.json();
      if (onComplete) {
        onComplete(profile);
      } else {
        navigate('/advisor/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Professional Headline"
              placeholder="e.g., Serial Entrepreneur & Startup Advisor"
              value={formData.headline}
              onChange={(e) => handleChange('headline', e.target.value)}
              required
              helperText="A brief professional headline (min 10 characters)"
              fullWidth
            />
            <TextField
              label="Bio"
              placeholder="Tell us about your background, experience, and what makes you a great advisor..."
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              required
              multiline
              rows={6}
              helperText="Minimum 50 characters. Describe your experience and expertise."
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                label="Timezone"
              >
                <MenuItem value="UTC">UTC</MenuItem>
                <MenuItem value="America/New_York">Eastern Time (ET)</MenuItem>
                <MenuItem value="America/Chicago">Central Time (CT)</MenuItem>
                <MenuItem value="America/Denver">Mountain Time (MT)</MenuItem>
                <MenuItem value="America/Los_Angeles">Pacific Time (PT)</MenuItem>
                <MenuItem value="Europe/London">London (GMT)</MenuItem>
                <MenuItem value="Europe/Paris">Paris (CET)</MenuItem>
                <MenuItem value="Asia/Tokyo">Tokyo (JST)</MenuItem>
                <MenuItem value="Asia/Shanghai">Shanghai (CST)</MenuItem>
                <MenuItem value="Asia/Dubai">Dubai (GST)</MenuItem>
                <MenuItem value="Asia/Kolkata">Mumbai (IST)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Startup Stages You Advise</FormLabel>
              <FormGroup>
                {STAGES.map((stage) => (
                  <FormControlLabel
                    key={stage}
                    control={
                      <Checkbox
                        checked={formData.expertise_stages.includes(stage)}
                        onChange={(e) => handleArrayChange('expertise_stages', stage, e.target.checked)}
                      />
                    }
                    label={stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                  />
                ))}
              </FormGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend">Domains/Industries</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DOMAINS.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      onClick={() => {
                        const checked = formData.domains.includes(domain);
                        handleArrayChange('domains', domain, !checked);
                      }}
                      color={formData.domains.includes(domain) ? 'primary' : 'default'}
                      variant={formData.domains.includes(domain) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend">Languages</FormLabel>
              <FormGroup>
                {LANGUAGES.map((lang) => (
                  <FormControlLabel
                    key={lang}
                    control={
                      <Checkbox
                        checked={formData.languages.includes(lang)}
                        onChange={(e) => handleArrayChange('languages', lang, e.target.checked)}
                      />
                    }
                    label={lang}
                  />
                ))}
              </FormGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography gutterBottom>
                Maximum Active Workspaces: {formData.max_active_workspaces}
              </Typography>
              <Slider
                value={formData.max_active_workspaces}
                onChange={(e, value) => handleChange('max_active_workspaces', value)}
                min={1}
                max={10}
                marks
                step={1}
              />
              <Typography variant="caption" color="text.secondary">
                How many startups can you actively advise at once?
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Preferred Meeting Cadence</InputLabel>
              <Select
                value={formData.preferred_cadence}
                onChange={(e) => handleChange('preferred_cadence', e.target.value)}
                label="Preferred Meeting Cadence"
              >
                {CADENCE_OPTIONS.map((cadence) => (
                  <MenuItem key={cadence} value={cadence}>
                    {cadence.charAt(0).toUpperCase() + cadence.slice(1).replace('-', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Contact Email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              required
              fullWidth
              helperText="Email where founders can reach you"
            />
            <TextField
              label="Meeting Link (Calendly, etc.)"
              placeholder="https://calendly.com/yourname"
              value={formData.meeting_link}
              onChange={(e) => handleChange('meeting_link', e.target.value)}
              fullWidth
              helperText="Optional: Link to schedule meetings with you"
            />
            <TextField
              label="Contact Note"
              placeholder="Best times to reach me, preferred communication method, etc."
              value={formData.contact_note}
              onChange={(e) => handleChange('contact_note', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            {/* LinkedIn Verification Section */}
            <Box sx={{ 
              p: 2.5, 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: linkedinStatus.linkedin_verified ? 'success.main' : 'divider',
              bgcolor: linkedinStatus.linkedin_verified ? alpha('#10b981', 0.04) : 'background.paper',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LinkedIn sx={{ color: '#0A66C2', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      LinkedIn Verification
                      {linkedinStatus.linkedin_verified && (
                        <Chip 
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label="Verified"
                          size="small"
                          color="success"
                          sx={{ ml: 1, height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {linkedinStatus.linkedin_verified 
                        ? `Verified as ${linkedinStatus.linkedin_name || 'LinkedIn User'}`
                        : 'Verify your identity with LinkedIn to build trust with founders'
                      }
                    </Typography>
                  </Box>
                </Box>
                {!linkedinStatus.linkedin_verified && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleLinkedInConnect}
                    disabled={linkedinLoading || !linkedinStatus.linkedin_configured}
                    startIcon={linkedinLoading ? <CircularProgress size={16} /> : <LinkedIn />}
                    sx={{ 
                      borderColor: '#0A66C2', 
                      color: '#0A66C2',
                      textTransform: 'none',
                      fontWeight: 500,
                      '&:hover': { borderColor: '#004182', bgcolor: alpha('#0A66C2', 0.04) },
                    }}
                  >
                    {linkedinLoading ? 'Connecting...' : 'Verify with LinkedIn'}
                  </Button>
                )}
              </Box>
              {!linkedinStatus.linkedin_configured && !linkedinStatus.linkedin_verified && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  LinkedIn verification coming soon
                </Typography>
              )}
            </Box>
            
            <TextField
              label="LinkedIn URL (Optional)"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={(e) => handleChange('linkedin_url', e.target.value)}
              fullWidth
              helperText="You can also add your profile URL manually"
            />
            <TextField
              label="Twitter/X URL"
              placeholder="https://twitter.com/yourhandle"
              value={formData.twitter_url}
              onChange={(e) => handleChange('twitter_url', e.target.value)}
              fullWidth
            />
          </Box>
        );

      case 4:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Years of Experience"
              placeholder="e.g., 10+ years"
              value={formData.questionnaire_data.years_experience}
              onChange={(e) => handleChange('questionnaire_data.years_experience', e.target.value)}
              fullWidth
            />
            <TextField
              label="Previous Companies/Roles"
              placeholder="List companies you've worked at or founded"
              value={formData.questionnaire_data.previous_companies}
              onChange={(e) => handleChange('questionnaire_data.previous_companies', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Areas of Expertise"
              placeholder="What specific areas can you advise on?"
              value={formData.questionnaire_data.areas_of_expertise}
              onChange={(e) => handleChange('questionnaire_data.areas_of_expertise', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Typical Engagement Length"
              placeholder="e.g., 3-6 months, 1 year, ongoing"
              value={formData.questionnaire_data.typical_engagement_length}
              onChange={(e) => handleChange('questionnaire_data.typical_engagement_length', e.target.value)}
              fullWidth
            />
            <TextField
              label="Preferred Communication Style"
              placeholder="e.g., Direct and honest, supportive and encouraging"
              value={formData.questionnaire_data.preferred_communication_style}
              onChange={(e) => handleChange('questionnaire_data.preferred_communication_style', e.target.value)}
              fullWidth
            />
            <TextField
              label="Hours Per Week Available"
              placeholder="e.g., 2-5 hours per week"
              value={formData.questionnaire_data.availability_hours_per_week}
              onChange={(e) => handleChange('questionnaire_data.availability_hours_per_week', e.target.value)}
              fullWidth
            />
            <TextField
              label="Success Stories"
              placeholder="Share examples of startups you've helped succeed"
              value={formData.questionnaire_data.success_stories}
              onChange={(e) => handleChange('questionnaire_data.success_stories', e.target.value)}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="What Makes You Unique"
              placeholder="What sets you apart as an advisor?"
              value={formData.questionnaire_data.what_makes_you_unique}
              onChange={(e) => handleChange('questionnaire_data.what_makes_you_unique', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        );

      default:
        return null;
    }
  };

  // Show loading while checking for existing profile
  if (checkingProfile) {
    return (
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f5f5f5'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: { xs: 2, sm: 3 }
      }}
    >
      <Paper 
        sx={{ 
          width: '100%',
          maxWidth: { xs: '100%', sm: '90%', md: 800, lg: 900 },
          height: { xs: 'calc(100vh - 32px)', sm: '85vh', md: '80vh' },
          minHeight: { xs: 'auto', sm: 600 },
          display: 'flex',
          flexDirection: 'column',
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: 3,
          overflow: 'hidden'
        }}
      >
        {/* Fixed Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderBottom: 1, 
          borderColor: 'divider', 
          bgcolor: 'white',
          flexShrink: 0
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Become an Advisor
          </Typography>
          
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 0,
              '& .MuiStepLabel-root': {
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Scrollable Content Area */}
        <Box 
          sx={{ 
            flex: 1,
            overflowY: 'auto',
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'white',
            minHeight: 0
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minHeight: '100%' }}>
            {renderStepContent()}
          </Box>
        </Box>

        {/* Fixed Footer */}
        <Box 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: { xs: 1, sm: 2 }
          }}
        >
          <Button
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!validateStep() || loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Submit'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdvisorOnboarding;

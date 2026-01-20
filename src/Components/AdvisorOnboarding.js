import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
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
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
            <TextField
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={(e) => handleChange('linkedin_url', e.target.value)}
              fullWidth
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

  return (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: 3
      }}
    >
      <Paper 
        sx={{ 
          width: '100%',
          maxWidth: 900,
          height: '90vh',
          minHeight: 700,
          maxHeight: 900,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 2,
          boxShadow: 3,
          overflow: 'hidden'
        }}
      >
        {/* Fixed Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
            Become an Advisor
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 0 }}>
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
            p: 4,
            bgcolor: 'white'
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
            p: 3, 
            borderTop: 1, 
            borderColor: 'divider',
            bgcolor: 'white',
            display: 'flex',
            justifyContent: 'space-between'
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

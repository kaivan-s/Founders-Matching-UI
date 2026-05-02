import React, { useState, useEffect } from 'react';
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
const CADENCE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const ADVISORY_TYPES = [
  { value: 'strategic', label: 'Strategic/Business Advice', description: 'High-level strategy, business model, market positioning' },
  { value: 'technical', label: 'Technical Mentorship', description: 'Engineering, architecture, technology decisions' },
  { value: 'fundraising', label: 'Fundraising & Investor Intros', description: 'Pitch preparation, investor connections, deal terms' },
  { value: 'gtm', label: 'Go-to-Market & Sales', description: 'Sales strategy, customer acquisition, partnerships' },
  { value: 'operations', label: 'Operations & Scaling', description: 'Hiring, processes, team building, scaling challenges' },
  { value: 'product', label: 'Product & Design', description: 'Product strategy, UX/UI, roadmap prioritization' },
];

const HOURS_PER_WEEK_OPTIONS = [
  { value: '1-2', label: '1-2 hours/week', description: 'Light touch - quick calls and async support' },
  { value: '2-5', label: '2-5 hours/week', description: 'Regular engagement - weekly calls plus support' },
  { value: '5-10', label: '5-10 hours/week', description: 'Deep involvement - multiple sessions per week' },
  { value: '10+', label: '10+ hours/week', description: 'Intensive - nearly part-time commitment' },
];

const AdvisorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [formData, setFormData] = useState({
    // Basic Info
    headline: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Expertise
    expertise_stages: [],
    preferred_stages: [], // Stages they PREFER to advise (may differ from experience)
    advisory_types: [], // Types of advisory they provide
    domains: [],
    languages: ['English'],
    
    // Capacity
    max_active_workspaces: 3,
    preferred_cadence: 'weekly',
    availability_hours_per_week: '', // Structured hours selection
    
    // Pay-per-consultation pricing (optional — advisor can set later)
    // Founders pay you DIRECTLY via the methods below; the platform doesn't process payment.
    consultation_rate_30min_usd: '',
    consultation_rate_60min_usd: '',
    payment_methods: {
      upi_id: '',
      paypal_url: '',
      razorpay_link: '',
      bank_details: '',
    },
    
    // Contact
    contact_email: user?.emailAddresses?.[0]?.emailAddress || '',
    contact_note: '',
    linkedin_url: '',
    twitter_url: '',
    
    // Questionnaire
    questionnaire_data: {
      years_experience: '',
      previous_companies: '',
      areas_of_expertise: '',
      success_stories: '',
      what_makes_you_unique: '',
    }
  });

  const steps = ['Basic Information', 'Expertise & Experience', 'Capacity & Preferences', 'Contact & Social', 'Questionnaire'];

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
              preferred_stages: profileData.preferred_stages || prev.preferred_stages,
              advisory_types: profileData.advisory_types || prev.advisory_types,
              domains: profileData.domains || prev.domains,
              languages: profileData.languages || prev.languages,
              max_active_workspaces: profileData.max_active_workspaces ?? prev.max_active_workspaces,
              preferred_cadence: profileData.preferred_cadence || prev.preferred_cadence,
              availability_hours_per_week: profileData.availability_hours_per_week || prev.availability_hours_per_week,
              consultation_rate_30min_usd: profileData.consultation_rate_30min_usd ?? prev.consultation_rate_30min_usd,
              consultation_rate_60min_usd: profileData.consultation_rate_60min_usd ?? prev.consultation_rate_60min_usd,
              payment_methods: { ...prev.payment_methods, ...(profileData.payment_methods || {}) },
              contact_email: profileData.contact_email || prev.contact_email,
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
  }, [user?.id, navigate]);

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

  const isValidLinkedInUrl = (url) => {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('https://') &&
      (trimmed.includes('linkedin.com') || trimmed.includes('linked.in'))
    );
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        return formData.headline.length >= 10 && formData.bio.length >= 50;
      case 1:
        // Require experience stages, preferred stages, advisory types, and domains
        return (
          formData.expertise_stages.length > 0 && 
          formData.preferred_stages.length > 0 &&
          formData.advisory_types.length > 0 &&
          formData.domains.length > 0
        );
      case 2:
        // Require max workspaces and hours per week selection
        return (
          formData.max_active_workspaces >= 1 && 
          formData.max_active_workspaces <= 10 &&
          formData.availability_hours_per_week
        );
      case 3:
        return (
          formData.contact_email &&
          formData.contact_email.includes('@') &&
          isValidLinkedInUrl(formData.linkedin_url)
        );
      case 4: {
        const q = formData.questionnaire_data;
        return (
          (q.years_experience || '').trim() &&
          (q.previous_companies || '').trim() &&
          (q.areas_of_expertise || '').trim() &&
          (q.success_stories || '').trim() &&
          (q.what_makes_you_unique || '').trim()
        );
      }
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
            {/* Type of Advisory */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                What type of advisory do you provide? *
              </FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                Select all that apply - this helps founders understand how you can help
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {ADVISORY_TYPES.map((type) => (
                    <Paper
                      key={type.value}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: formData.advisory_types.includes(type.value) ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        bgcolor: formData.advisory_types.includes(type.value) ? 'primary.50' : 'transparent',
                        '&:hover': { borderColor: 'primary.light' },
                      }}
                      onClick={() => {
                        const checked = formData.advisory_types.includes(type.value);
                        handleArrayChange('advisory_types', type.value, !checked);
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={formData.advisory_types.includes(type.value)}
                          onChange={(e) => handleArrayChange('advisory_types', type.value, e.target.checked)}
                          size="small"
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{type.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{type.description}</Typography>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Startup Stages - Experience */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                Startup stages you have experience advising *
              </FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                Which stages have you worked with in the past?
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {STAGES.map((stage) => (
                    <Chip
                      key={stage}
                      label={stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                      onClick={() => {
                        const checked = formData.expertise_stages.includes(stage);
                        handleArrayChange('expertise_stages', stage, !checked);
                      }}
                      color={formData.expertise_stages.includes(stage) ? 'primary' : 'default'}
                      variant={formData.expertise_stages.includes(stage) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Preferred Stages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                Stages you prefer to work with now *
              </FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                You may have Series A experience but prefer advising early-stage founders - that's fine!
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {STAGES.map((stage) => (
                    <Chip
                      key={stage}
                      label={stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                      onClick={() => {
                        const checked = formData.preferred_stages.includes(stage);
                        handleArrayChange('preferred_stages', stage, !checked);
                      }}
                      color={formData.preferred_stages.includes(stage) ? 'secondary' : 'default'}
                      variant={formData.preferred_stages.includes(stage) ? 'filled' : 'outlined'}
                      sx={{
                        '&.MuiChip-filled': {
                          bgcolor: '#0d9488',
                          color: 'white',
                        }
                      }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Domains */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>Domains/Industries *</FormLabel>
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

            {/* Languages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>Languages</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {LANGUAGES.map((lang) => (
                    <Chip
                      key={lang}
                      label={lang}
                      onClick={() => {
                        const checked = formData.languages.includes(lang);
                        handleArrayChange('languages', lang, !checked);
                      }}
                      color={formData.languages.includes(lang) ? 'primary' : 'default'}
                      variant={formData.languages.includes(lang) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Hours Per Week - Structured Selection */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1 }}>
                How many hours per week can you dedicate? *
              </FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                This is per startup you advise, not total across all startups
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {HOURS_PER_WEEK_OPTIONS.map((option) => (
                  <Paper
                    key={option.value}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '2px solid',
                      borderColor: formData.availability_hours_per_week === option.value ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      bgcolor: formData.availability_hours_per_week === option.value ? 'primary.50' : 'transparent',
                      '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
                    }}
                    onClick={() => handleChange('availability_hours_per_week', option.value)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: formData.availability_hours_per_week === option.value ? 'primary.main' : 'divider',
                          bgcolor: formData.availability_hours_per_week === option.value ? 'primary.main' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {formData.availability_hours_per_week === option.value && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight={600}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </FormControl>

            {/* Max Active Workspaces */}
            <Box>
              <Typography gutterBottom fontWeight={500}>
                Maximum Active Startups: {formData.max_active_workspaces}
              </Typography>
              <Slider
                value={formData.max_active_workspaces}
                onChange={(e, value) => handleChange('max_active_workspaces', value)}
                min={1}
                max={10}
                marks
                step={1}
                sx={{
                  '& .MuiSlider-thumb': { bgcolor: '#0d9488' },
                  '& .MuiSlider-track': { bgcolor: '#0d9488' },
                }}
              />
              <Typography variant="caption" color="text.secondary">
                How many startups can you actively advise at the same time?
              </Typography>
            </Box>

            {/* Meeting Cadence */}
            <FormControl fullWidth>
              <InputLabel>Preferred Meeting Cadence</InputLabel>
              <Select
                value={formData.preferred_cadence}
                onChange={(e) => handleChange('preferred_cadence', e.target.value)}
                label="Preferred Meeting Cadence"
              >
                {CADENCE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                How often would you like to meet with founders?
              </Typography>
            </FormControl>

            {/* Divider */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                Pay-Per-Consultation Pricing
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Set your rates for one-off consultations. Founders pay you <strong>directly</strong> via the methods you add below — Guild Space does not process this payment. You can leave these blank for now and update later in your profile.
              </Typography>

              {/* Rates */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="30-min consultation rate"
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.consultation_rate_30min_usd}
                  onChange={(e) => handleChange('consultation_rate_30min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                  helperText="USD. Leave blank if you don't offer 30-min calls."
                />
                <TextField
                  label="60-min consultation rate"
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.consultation_rate_60min_usd}
                  onChange={(e) => handleChange('consultation_rate_60min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                  helperText="USD. Leave blank if you don't offer 60-min calls."
                />
              </Box>

              {/* Payment Methods */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                Where should founders pay you?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Add at least one method. Founders will see these on the booking screen and pay you directly.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="UPI ID (recommended for India)"
                  size="small"
                  fullWidth
                  value={formData.payment_methods.upi_id}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, upi_id: e.target.value })}
                  placeholder="name@bank"
                />
                <TextField
                  label="PayPal link"
                  size="small"
                  fullWidth
                  value={formData.payment_methods.paypal_url}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, paypal_url: e.target.value })}
                  placeholder="https://paypal.me/yourname"
                />
                <TextField
                  label="Razorpay payment link"
                  size="small"
                  fullWidth
                  value={formData.payment_methods.razorpay_link}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, razorpay_link: e.target.value })}
                  placeholder="https://razorpay.me/@yourname"
                />
                <TextField
                  label="Bank account (account no. + IFSC)"
                  size="small"
                  fullWidth
                  multiline
                  minRows={2}
                  value={formData.payment_methods.bank_details}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, bank_details: e.target.value })}
                  placeholder="Account: 1234567890&#10;IFSC: HDFC0001234&#10;Name: Your Full Name"
                />
              </Box>
            </Box>
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
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={(e) => handleChange('linkedin_url', e.target.value)}
              required
              fullWidth
              helperText="Your full LinkedIn profile URL (required)"
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
              required
              fullWidth
            />
            <TextField
              label="Previous Companies/Roles"
              placeholder="List companies you've worked at or founded"
              value={formData.questionnaire_data.previous_companies}
              onChange={(e) => handleChange('questionnaire_data.previous_companies', e.target.value)}
              required
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Areas of Expertise"
              placeholder="What specific areas can you advise on?"
              value={formData.questionnaire_data.areas_of_expertise}
              onChange={(e) => handleChange('questionnaire_data.areas_of_expertise', e.target.value)}
              required
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Success Stories"
              placeholder="Share examples of startups you've helped succeed"
              value={formData.questionnaire_data.success_stories}
              onChange={(e) => handleChange('questionnaire_data.success_stories', e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              label="What Makes You Unique"
              placeholder="What sets you apart as an advisor?"
              value={formData.questionnaire_data.what_makes_you_unique}
              onChange={(e) => handleChange('questionnaire_data.what_makes_you_unique', e.target.value)}
              required
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

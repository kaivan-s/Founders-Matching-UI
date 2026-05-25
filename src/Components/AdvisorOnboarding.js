import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepButton,
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
  Avatar,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  PhotoCamera,
  CheckCircle,
  Warning,
  LinkedIn,
  Add,
  Delete,
  WorkHistory,
  Link as LinkIcon,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const STAGES = ['idea', 'pre-seed', 'seed', 'series-a', 'series-b-plus'];
const DOMAINS = [
  'SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML',
  'Marketplace', 'Consumer', 'B2B', 'Hardware', 'Other'
];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Mandarin', 'Hindi', 'Portuguese', 'Other'];

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

const YEARS_EXPERIENCE_OPTIONS = [
  { value: '1-3', label: '1-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-10', label: '5-10 years' },
  { value: '10-15', label: '10-15 years' },
  { value: '15-20', label: '15-20 years' },
  { value: '20+', label: '20+ years' },
];

const STARTUPS_ADVISED_OPTIONS = [
  { value: '0', label: 'None yet (first time advisor)' },
  { value: '1-3', label: '1-3 startups' },
  { value: '4-10', label: '4-10 startups' },
  { value: '10-20', label: '10-20 startups' },
  { value: '20+', label: '20+ startups' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

const STORAGE_KEY = 'advisor_onboarding_draft';

const AdvisorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [linkedinStatus, setLinkedinStatus] = useState({ linkedin_verified: false, linkedin_configured: false });
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  
  // Load saved draft from localStorage on mount
  const loadSavedDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (e) {
      console.error('Error loading saved draft:', e);
    }
    return null;
  };
  
  // Save current form data to localStorage
  const saveDraft = (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  };
  
  // Clear saved draft
  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing draft:', e);
    }
  };
  
  const [formData, setFormData] = useState({
    // Basic Info
    headline: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Expertise
    preferred_stages: [],
    advisory_types: [],
    domains: [],
    languages: ['English'],
    
    // Capacity
    availability_hours_per_week: '',
    max_active_workspaces: 5, // Default value (hidden from UI but required by backend)
    
    // Pay-per-consultation pricing
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
    name: user?.fullName || user?.firstName || '',
    
    // Professional Background
    professional_background: {
      years_experience: '',
      current_role: { title: '', company: '', start_year: '' },
      previous_roles: [],
      startups_advised_count: '',
      notable_achievements: '',
      success_story: '', // NEW: Describe a specific startup you helped
    },
    
    // Portfolio - simplified
    portfolio: {
      personal_website: '',
      other_links: [],
    },
    
    // How you help founders (combined question)
    questionnaire_data: {
      how_you_help_founders: '',
    }
  });

  // Reduced to 4 steps
  const steps = [
    'Profile & Verification',
    'Experience & Expertise',
    'Consultation Setup',
    'Review & Submit'
  ];

  // Check if advisor profile already exists on mount, or load from localStorage
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user?.id) {
        setCheckingProfile(false);
        return;
      }
      
      // First, check localStorage for saved draft (from LinkedIn redirect)
      const savedDraft = loadSavedDraft();
      if (savedDraft) {
        setFormData(prev => ({
          ...prev,
          ...savedDraft,
          // Preserve nested objects properly
          professional_background: {
            ...prev.professional_background,
            ...(savedDraft.professional_background || {}),
            current_role: {
              ...prev.professional_background.current_role,
              ...(savedDraft.professional_background?.current_role || {}),
            },
          },
          portfolio: {
            ...prev.portfolio,
            ...(savedDraft.portfolio || {}),
          },
          payment_methods: {
            ...prev.payment_methods,
            ...(savedDraft.payment_methods || {}),
          },
          questionnaire_data: {
            ...prev.questionnaire_data,
            ...(savedDraft.questionnaire_data || {}),
          },
        }));
        // Don't clear draft yet - user might navigate away again
      }

      try {
        const response = await fetch(`${API_BASE}/advisors/profile`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          if (profileData !== null && profileData !== undefined && typeof profileData === 'object' && Object.keys(profileData).length > 0) {
            const status = profileData.status || 'PENDING';
            if (status === 'APPROVED') {
              clearDraft(); // Clear draft on successful profile
              navigate('/advisor/dashboard', { replace: true });
              return;
            }
            // PENDING or REJECTED: load existing data for editing (but prefer localStorage if it has more data)
            if (profileData.profile_image_url) {
              setExistingImageUrl(profileData.profile_image_url);
            }
            // Only load from server if we didn't have a saved draft
            if (!savedDraft) {
              setFormData(prev => ({
                ...prev,
                name: profileData.name || prev.name,
                headline: profileData.headline || prev.headline,
                bio: profileData.bio || prev.bio,
                timezone: profileData.timezone || prev.timezone,
                preferred_stages: profileData.preferred_stages || prev.preferred_stages,
                advisory_types: profileData.advisory_types || prev.advisory_types,
                domains: profileData.domains || prev.domains,
                languages: profileData.languages || prev.languages,
                availability_hours_per_week: profileData.availability_hours_per_week || prev.availability_hours_per_week,
                consultation_rate_30min_usd: profileData.consultation_rate_30min_usd ?? prev.consultation_rate_30min_usd,
                consultation_rate_60min_usd: profileData.consultation_rate_60min_usd ?? prev.consultation_rate_60min_usd,
                payment_methods: { ...prev.payment_methods, ...(profileData.payment_methods || {}) },
                contact_email: profileData.contact_email || prev.contact_email,
                contact_note: profileData.contact_note || prev.contact_note,
                linkedin_url: profileData.linkedin_url || prev.linkedin_url,
                twitter_url: profileData.twitter_url || prev.twitter_url,
                professional_background: {
                  ...prev.professional_background,
                  ...(profileData.professional_background || {}),
                  current_role: {
                    ...prev.professional_background.current_role,
                    ...(profileData.professional_background?.current_role || {}),
                },
                previous_roles: profileData.professional_background?.previous_roles || prev.professional_background.previous_roles,
                success_story: profileData.professional_background?.success_story || prev.professional_background.success_story,
              },
              portfolio: {
                personal_website: profileData.portfolio?.personal_website || prev.portfolio.personal_website,
                other_links: profileData.portfolio?.other_links || prev.portfolio.other_links,
              },
              questionnaire_data: { 
                how_you_help_founders: profileData.questionnaire_data?.how_you_help_founders || 
                                       profileData.questionnaire_data?.what_makes_you_unique || // Backward compat
                                       prev.questionnaire_data.how_you_help_founders 
              },
            }));
            }
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

  // Check LinkedIn verification status
  useEffect(() => {
    const checkLinkedinStatus = async () => {
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
        // Ignore errors
      }
    };
    checkLinkedinStatus();
  }, [user?.id]);

  const handleConnectLinkedin = async () => {
    if (!user?.id) return;
    setConnectingLinkedin(true);
    
    // Save form data before redirecting to LinkedIn OAuth
    saveDraft(formData);
    
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.auth_url) {
          window.location.href = data.auth_url;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to connect LinkedIn');
      }
    } catch (err) {
      setError('Failed to connect to LinkedIn');
    } finally {
      setConnectingLinkedin(false);
    }
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage({
        preview: e.target.result,
        file: file,
        contentType: file.type,
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setProfileImage(null);
  };

  const hasValidProfilePicture = () => {
    return !!(profileImage?.preview || existingImageUrl);
  };

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
    const parts = field.split('.');
    if (parts.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (parts.length === 2) {
      const [parent, child] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (parts.length === 3) {
      const [parent, child, grandchild] = parts;
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: {
            ...prev[parent][child],
            [grandchild]: value
          }
        }
      }));
    }
  };

  const addPreviousRole = () => {
    setFormData(prev => ({
      ...prev,
      professional_background: {
        ...prev.professional_background,
        previous_roles: [
          ...prev.professional_background.previous_roles,
          { title: '', company: '', start_year: '', end_year: '' }
        ]
      }
    }));
  };

  const updatePreviousRole = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      professional_background: {
        ...prev.professional_background,
        previous_roles: prev.professional_background.previous_roles.map((role, i) =>
          i === index ? { ...role, [field]: value } : role
        )
      }
    }));
  };

  const removePreviousRole = (index) => {
    setFormData(prev => ({
      ...prev,
      professional_background: {
        ...prev.professional_background,
        previous_roles: prev.professional_background.previous_roles.filter((_, i) => i !== index)
      }
    }));
  };

  const addPortfolioLink = () => {
    setFormData(prev => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        other_links: [...prev.portfolio.other_links, { label: '', url: '' }]
      }
    }));
  };

  const updatePortfolioLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        other_links: prev.portfolio.other_links.map((link, i) =>
          i === index ? { ...link, [field]: value } : link
        )
      }
    }));
  };

  const removePortfolioLink = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolio: {
        ...prev.portfolio,
        other_links: prev.portfolio.other_links.filter((_, i) => i !== index)
      }
    }));
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

  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true;
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  };

  // Check if a specific step is complete
  const isStepComplete = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Profile & Verification
        return (
          formData.name && formData.name.trim().length >= 2 &&
          hasValidProfilePicture() &&
          formData.headline.length >= 10 &&
          formData.bio.length >= 100 &&
          formData.contact_email &&
          formData.contact_email.includes('@') &&
          linkedinStatus.linkedin_verified
        );
      case 1: { // Experience & Expertise
        const bg = formData.professional_background;
        return (
          bg.years_experience &&
          bg.current_role.title.trim() &&
          bg.current_role.company.trim() &&
          bg.startups_advised_count &&
          formData.advisory_types.length > 0 &&
          formData.preferred_stages.length > 0 &&
          formData.domains.length > 0
        );
      }
      case 2: // Consultation Setup
        return formData.availability_hours_per_week !== '';
      case 3: // Review
        return true;
      default:
        return true;
    }
  };

  const allStepsComplete = () => {
    return isStepComplete(0) && isStepComplete(1) && isStepComplete(2);
  };

  const validateStep = () => {
    if (activeStep === steps.length - 1) {
      return allStepsComplete();
    }
    return true;
  };

  const handleStepClick = (stepIndex) => {
    setActiveStep(stepIndex);
  };

  const getCompletionScore = () => {
    let score = 0;
    
    if (hasValidProfilePicture()) score += 15;
    if (formData.headline.length >= 10) score += 5;
    if (formData.bio.length >= 100) score += 10;
    if (linkedinStatus.linkedin_verified) score += 10;
    
    const bg = formData.professional_background;
    if (bg.years_experience) score += 5;
    if (bg.current_role.title && bg.current_role.company) score += 10;
    if (bg.previous_roles.length > 0) score += 5;
    if (bg.notable_achievements?.trim()) score += 5;
    if (bg.success_story?.trim()) score += 10;
    
    if (formData.advisory_types.length > 0) score += 5;
    if (formData.preferred_stages.length > 0) score += 5;
    if (formData.domains.length > 0) score += 5;
    
    if (formData.portfolio.personal_website?.trim()) score += 5;
    if (formData.availability_hours_per_week) score += 5;
    
    return Math.min(score, 100);
  };

  const getBadgesEarned = () => {
    const badges = [];
    
    if (hasValidProfilePicture()) {
      badges.push({ id: 'photo', label: 'Photo Verified', icon: PhotoCamera });
    }
    if (linkedinStatus.linkedin_verified) {
      badges.push({ id: 'linkedin', label: 'LinkedIn Verified', icon: LinkedIn });
    }
    if (formData.professional_background.years_experience) {
      const years = formData.professional_background.years_experience;
      if (['10-15', '15-20', '20+'].includes(years)) {
        badges.push({ id: 'veteran', label: 'Veteran Advisor', icon: WorkHistory });
      }
    }
    if (formData.portfolio.personal_website) {
      badges.push({ id: 'portfolio', label: 'Portfolio Verified', icon: LinkIcon });
    }
    
    return badges;
  };

  const validateForm = () => {
    const errors = [];
    
    // Step 1: Profile & Verification
    if (!formData.name || formData.name.trim().length < 2) {
      errors.push('Full name is required (minimum 2 characters)');
    }
    if (!hasValidProfilePicture()) {
      errors.push('Profile picture is required');
    }
    if (!formData.headline || formData.headline.length < 10) {
      errors.push('Professional headline is required (minimum 10 characters)');
    }
    if (!formData.bio || formData.bio.length < 100) {
      errors.push('Bio is required (minimum 100 characters)');
    }
    if (!formData.contact_email) {
      errors.push('Contact email is required');
    }
    
    // Step 2: Experience & Expertise
    if (!formData.professional_background.years_experience) {
      errors.push('Years of experience is required');
    }
    if (!formData.professional_background.startups_advised_count) {
      errors.push('Number of startups advised is required');
    }
    if (!formData.professional_background.current_role.title) {
      errors.push('Current role title is required');
    }
    if (!formData.professional_background.current_role.company) {
      errors.push('Current company is required');
    }
    if (!formData.expertise_areas || formData.expertise_areas.length === 0) {
      errors.push('Please select at least one area of expertise');
    }
    if (!formData.how_you_help_founders || formData.how_you_help_founders.length < 50) {
      errors.push('Please describe how you help founders (minimum 50 characters)');
    }
    
    // Step 3: Consultation Setup
    if (!formData.consultation_rate_30min_usd && !formData.consultation_rate_60min_usd) {
      errors.push('Please set at least one consultation rate (30 min or 60 min)');
    }
    if (!formData.availability_hours_per_week) {
      errors.push('Please specify your weekly availability');
    }
    
    // Check if at least one payment method is provided
    const hasPaymentMethod = Object.values(formData.payment_methods || {}).some(v => v && v.trim());
    if (!hasPaymentMethod) {
      errors.push('Please provide at least one payment method');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    // Validate form before submission
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'));
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/advisors/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
          'X-User-Email': user.emailAddresses?.[0]?.emailAddress || '',
          'X-User-Name': formData.name.trim(),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create advisor profile');
      }

      const profile = await response.json();

      if (profileImage?.file) {
        setUploadingImage(true);
        try {
          const imageResponse = await fetch(`${API_BASE}/advisors/profile/image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Clerk-User-Id': user.id,
            },
            body: JSON.stringify({
              image: profileImage.preview,
              content_type: profileImage.contentType,
            }),
          });
          
          if (!imageResponse.ok) {
            console.error('Failed to upload image, but profile was created');
          }
        } catch (imgErr) {
          console.error('Image upload error:', imgErr);
        }
        setUploadingImage(false);
      }

      // Clear saved draft on successful submission
      clearDraft();
      
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
      case 0: // Profile & Verification
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Profile Picture Section */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2, 
              p: 1.5, 
              bgcolor: '#f8fafc', 
              borderRadius: 1.5,
              border: hasValidProfilePicture() ? '1px solid #10b981' : '1px dashed #f59e0b'
            }}>
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar
                  src={profileImage?.preview || existingImageUrl || user?.imageUrl}
                  alt={user?.fullName || 'Profile'}
                  sx={{ width: 64, height: 64, border: '2px solid white', boxShadow: 1 }}
                />
                <input
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  id="profile-image-upload"
                  type="file"
                  onChange={handleImageSelect}
                />
                <label htmlFor="profile-image-upload">
                  <IconButton
                    component="span"
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      bgcolor: '#0f172a',
                      color: 'white',
                      '&:hover': { bgcolor: '#1e293b' },
                      width: 24,
                      height: 24,
                    }}
                  >
                    <PhotoCamera sx={{ fontSize: 14 }} />
                  </IconButton>
                </label>
              </Box>
              
              {hasValidProfilePicture() ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: '#10b981', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={600} color="#10b981">Photo added</Typography>
                  {profileImage && (
                    <Button size="small" variant="text" color="error" onClick={handleImageRemove} sx={{ ml: 1, minWidth: 'auto', p: 0.5 }}>
                      Remove
                    </Button>
                  )}
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f59e0b' }}>
                    <Warning sx={{ fontSize: 16 }} />
                    <Typography variant="body2" fontWeight={600}>Photo required</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Click camera to upload. Photos get 3x more bookings.
                  </Typography>
                </Box>
              )}
            </Box>

            <TextField
              label="Full Name *"
              placeholder="e.g., John Smith"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              helperText="Your name as it will appear to founders"
              fullWidth
              error={formData.name.length > 0 && formData.name.trim().length < 2}
            />

            <TextField
              label="Professional Headline *"
              placeholder="e.g., Serial Entrepreneur | 3x Founder | Startup Advisor"
              value={formData.headline}
              onChange={(e) => handleChange('headline', e.target.value)}
              required
              helperText={`${formData.headline.length}/10 characters minimum`}
              fullWidth
              error={formData.headline.length > 0 && formData.headline.length < 10}
            />
            
            <TextField
              label="Bio *"
              placeholder="Share your journey: What drives you? Key achievements? How do you help founders succeed?"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              required
              multiline
              rows={4}
              helperText={`${formData.bio.length}/100 characters minimum`}
              fullWidth
              error={formData.bio.length > 0 && formData.bio.length < 100}
            />

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <TextField
                label="Contact Email *"
                type="email"
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                required
                fullWidth
                helperText="Where founders can reach you"
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

            {/* LinkedIn Verification */}
            <Box sx={{ 
              p: 2, 
              bgcolor: linkedinStatus.linkedin_verified ? '#ecfdf5' : '#f8fafc', 
              borderRadius: 2,
              border: '2px solid',
              borderColor: linkedinStatus.linkedin_verified ? '#10b981' : '#e2e8f0',
            }}>
              {linkedinStatus.linkedin_verified ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 36, height: 36, borderRadius: '50%', 
                    bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <CheckCircle sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={600} color="#10b981">
                      LinkedIn Connected
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Verified as {linkedinStatus.linkedin_name || 'LinkedIn User'}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{ 
                      width: 36, height: 36, borderRadius: '50%', 
                      bgcolor: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <LinkedIn sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Connect LinkedIn *</Typography>
                      <Typography variant="caption" color="text.secondary">Required for verification</Typography>
                    </Box>
                  </Box>
                  {linkedinStatus.linkedin_configured !== false ? (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={connectingLinkedin ? <CircularProgress size={14} color="inherit" /> : <LinkedIn />}
                      onClick={handleConnectLinkedin}
                      disabled={connectingLinkedin}
                      sx={{ bgcolor: '#0077b5', '&:hover': { bgcolor: '#005582' }, textTransform: 'none' }}
                    >
                      {connectingLinkedin ? 'Connecting...' : 'Connect LinkedIn'}
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>LinkedIn verification being set up.</Alert>
                  )}
                </Box>
              )}
            </Box>

            <TextField
              label="Twitter/X URL (Optional)"
              placeholder="https://twitter.com/yourhandle"
              value={formData.twitter_url}
              onChange={(e) => handleChange('twitter_url', e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        );

      case 1: // Experience & Expertise (Combined)
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Professional Background */}
            <Typography variant="subtitle1" fontWeight={600} color="primary">Professional Background</Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth required size="small">
                <InputLabel>Years of Experience *</InputLabel>
                <Select
                  value={formData.professional_background.years_experience}
                  onChange={(e) => handleChange('professional_background.years_experience', e.target.value)}
                  label="Years of Experience *"
                >
                  {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth required size="small">
                <InputLabel>Startups Advised *</InputLabel>
                <Select
                  value={formData.professional_background.startups_advised_count}
                  onChange={(e) => handleChange('professional_background.startups_advised_count', e.target.value)}
                  label="Startups Advised *"
                >
                  {STARTUPS_ADVISED_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Current Role */}
            <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkHistory fontSize="small" color="primary" />
                Current Role *
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <TextField
                  label="Title"
                  placeholder="e.g., CEO, CTO, Founder"
                  value={formData.professional_background.current_role.title}
                  onChange={(e) => handleChange('professional_background.current_role.title', e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Company"
                  placeholder="e.g., Google, Your Startup"
                  value={formData.professional_background.current_role.company}
                  onChange={(e) => handleChange('professional_background.current_role.company', e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 100 } }}>
                  <InputLabel>Since</InputLabel>
                  <Select
                    value={formData.professional_background.current_role.start_year}
                    onChange={(e) => handleChange('professional_background.current_role.start_year', e.target.value)}
                    label="Since"
                  >
                    {YEAR_OPTIONS.slice(0, 20).map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Previous Roles */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Previous Roles (Optional)</Typography>
                <Button size="small" startIcon={<Add />} onClick={addPreviousRole} disabled={formData.professional_background.previous_roles.length >= 3}>
                  Add
                </Button>
              </Box>
              {formData.professional_background.previous_roles.map((role, index) => (
                <Paper key={index} elevation={0} sx={{ p: 1.5, mb: 1, border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField label="Title" size="small" value={role.title} onChange={(e) => updatePreviousRole(index, 'title', e.target.value)} sx={{ flex: 1 }} />
                    <TextField label="Company" size="small" value={role.company} onChange={(e) => updatePreviousRole(index, 'company', e.target.value)} sx={{ flex: 1 }} />
                    <IconButton size="small" onClick={() => removePreviousRole(index)} color="error"><Delete fontSize="small" /></IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Notable Achievements */}
            <TextField
              label="Notable Achievements (Optional)"
              placeholder="e.g., Led company to $50M exit, Helped 3 startups raise Series A..."
              value={formData.professional_background.notable_achievements}
              onChange={(e) => handleChange('professional_background.notable_achievements', e.target.value)}
              multiline
              rows={2}
              fullWidth
              size="small"
            />

            {/* Success Story - NEW */}
            <TextField
              label="Success Story - Describe a startup you helped"
              placeholder="Share a specific example: What was the startup? What was the challenge? How did you help? What was the outcome?"
              value={formData.professional_background.success_story}
              onChange={(e) => handleChange('professional_background.success_story', e.target.value)}
              multiline
              rows={3}
              fullWidth
              helperText="Specific examples build trust with founders"
            />

            {/* Expertise Section */}
            <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mt: 1 }}>Your Expertise</Typography>

            {/* Advisory Types */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>What type of advisory do you provide? *</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {ADVISORY_TYPES.map((type) => (
                    <Chip
                      key={type.value}
                      label={type.label}
                      onClick={() => handleArrayChange('advisory_types', type.value, !formData.advisory_types.includes(type.value))}
                      sx={{
                        bgcolor: formData.advisory_types.includes(type.value) ? '#0d9488' : 'transparent',
                        color: formData.advisory_types.includes(type.value) ? 'white' : 'text.primary',
                        border: '1px solid',
                        borderColor: formData.advisory_types.includes(type.value) ? '#0d9488' : 'divider',
                        '&:hover': { bgcolor: formData.advisory_types.includes(type.value) ? '#0f766e' : 'action.hover' },
                      }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Preferred Stages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Preferred startup stages *</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {STAGES.map((stage) => (
                    <Chip
                      key={stage}
                      label={stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                      onClick={() => handleArrayChange('preferred_stages', stage, !formData.preferred_stages.includes(stage))}
                      color={formData.preferred_stages.includes(stage) ? 'primary' : 'default'}
                      variant={formData.preferred_stages.includes(stage) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Domains */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Industries you specialize in *</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {DOMAINS.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      onClick={() => handleArrayChange('domains', domain, !formData.domains.includes(domain))}
                      color={formData.domains.includes(domain) ? 'primary' : 'default'}
                      variant={formData.domains.includes(domain) ? 'filled' : 'outlined'}
                      size="small"
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Languages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>Languages</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {LANGUAGES.map((lang) => (
                    <Chip
                      key={lang}
                      label={lang}
                      onClick={() => handleArrayChange('languages', lang, !formData.languages.includes(lang))}
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

      case 2: // Consultation Setup
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">Availability & Pricing</Typography>

            {/* Hours Per Week */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1 }}>
                Hours available per week *
              </FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {HOURS_PER_WEEK_OPTIONS.map((option) => (
                  <Paper
                    key={option.value}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      border: '2px solid',
                      borderColor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'divider',
                      borderRadius: 1.5,
                      cursor: 'pointer',
                      bgcolor: formData.availability_hours_per_week === option.value ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                      '&:hover': { borderColor: '#0d9488' },
                    }}
                    onClick={() => handleChange('availability_hours_per_week', option.value)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: '2px solid',
                          borderColor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'divider',
                          bgcolor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {formData.availability_hours_per_week === option.value && (
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'white' }} />
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{option.description}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </FormControl>

            {/* Consultation Pricing */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Consultation Pricing (Optional)</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Founders pay you directly — set this up later if you prefer.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 2 }}>
                <TextField
                  label="30-min rate ($)"
                  type="number"
                  fullWidth size="small"
                  value={formData.consultation_rate_30min_usd}
                  onChange={(e) => handleChange('consultation_rate_30min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                />
                <TextField
                  label="60-min rate ($)"
                  type="number"
                  fullWidth size="small"
                  value={formData.consultation_rate_60min_usd}
                  onChange={(e) => handleChange('consultation_rate_60min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                />
              </Box>

              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Payment Methods</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <TextField
                  label="UPI ID (India)"
                  size="small" fullWidth
                  value={formData.payment_methods.upi_id}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, upi_id: e.target.value })}
                  placeholder="name@bank"
                />
                <TextField
                  label="PayPal"
                  size="small" fullWidth
                  value={formData.payment_methods.paypal_url}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, paypal_url: e.target.value })}
                  placeholder="https://paypal.me/yourname"
                />
              </Box>
            </Box>

            {/* Portfolio - Simplified */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Portfolio Links (Optional)</Typography>
              <TextField
                label="Personal Website"
                placeholder="https://yourname.com"
                value={formData.portfolio.personal_website}
                onChange={(e) => handleChange('portfolio.personal_website', e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Additional links</Typography>
                <Button size="small" startIcon={<Add />} onClick={addPortfolioLink} disabled={formData.portfolio.other_links.length >= 3}>
                  Add
                </Button>
              </Box>
              {formData.portfolio.other_links.map((link, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField label="Label" size="small" value={link.label} onChange={(e) => updatePortfolioLink(index, 'label', e.target.value)} sx={{ width: '30%' }} />
                  <TextField label="URL" size="small" fullWidth value={link.url} onChange={(e) => updatePortfolioLink(index, 'url', e.target.value)} />
                  <IconButton size="small" onClick={() => removePortfolioLink(index)} color="error"><Delete fontSize="small" /></IconButton>
                </Box>
              ))}
            </Box>

            {/* How you help - Combined question */}
            <TextField
              label="How do you typically help founders?"
              placeholder="Describe your advisory style. What should founders expect from working with you?"
              value={formData.questionnaire_data.how_you_help_founders}
              onChange={(e) => handleChange('questionnaire_data.how_you_help_founders', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        );

      case 3: // Review & Submit
        const badges = getBadgesEarned();
        const score = getCompletionScore();
        
        const incompleteSteps = [];
        if (!isStepComplete(0)) incompleteSteps.push({ index: 0, name: 'Profile & Verification' });
        if (!isStepComplete(1)) incompleteSteps.push({ index: 1, name: 'Experience & Expertise' });
        if (!isStepComplete(2)) incompleteSteps.push({ index: 2, name: 'Consultation Setup' });
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Incomplete Warning */}
            {incompleteSteps.length > 0 && (
              <Alert severity="warning" sx={{ bgcolor: '#fef3c7', '& .MuiAlert-icon': { color: '#d97706' } }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Complete these sections to submit:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {incompleteSteps.map((step) => (
                    <Chip
                      key={step.index}
                      label={step.name}
                      size="small"
                      onClick={() => handleStepClick(step.index)}
                      sx={{ cursor: 'pointer', bgcolor: '#fff', border: '1px solid #d97706', color: '#92400e' }}
                    />
                  ))}
                </Box>
              </Alert>
            )}

            {/* Completion Score */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Profile Completeness</Typography>
                <Typography variant="h6" fontWeight={700} color={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}>
                  {score}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={score}
                sx={{
                  height: 6, borderRadius: 3, bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>

            {/* Badges */}
            {badges.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Badges You'll Earn</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {badges.map((badge) => (
                    <Chip
                      key={badge.id}
                      icon={<badge.icon fontSize="small" />}
                      label={badge.label}
                      size="small"
                      sx={{ bgcolor: '#0d9488', color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Summary */}
            <Box sx={{ p: { xs: 1.5, sm: 2 }, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Profile Summary</Typography>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 2, mb: 2, textAlign: { xs: 'center', sm: 'left' } }}>
                <Avatar src={profileImage?.preview || existingImageUrl || user?.imageUrl} sx={{ width: 56, height: 56 }} />
                <Box>
                  <Typography variant="body1" fontWeight={600}>{formData.name || 'Your Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">{formData.headline || 'No headline'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.professional_background.years_experience || '?'} years • {formData.professional_background.startups_advised_count || '?'} startups advised
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                {formData.advisory_types.map((type) => (
                  <Chip key={type} label={ADVISORY_TYPES.find(t => t.value === type)?.label || type} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>

            {/* What's next */}
            <Alert severity="info" sx={{ bgcolor: '#eff6ff', '& .MuiAlert-icon': { color: '#3b82f6' } }}>
              <Typography variant="body2" fontWeight={600}>What happens next?</Typography>
              <Typography variant="caption">
                Your profile will be reviewed (usually 24-48 hours). Once approved, founders can book consultations with you.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (checkingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100%', p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
      <Paper sx={{ width: '100%', maxWidth: { xs: '100%', sm: '90%', md: 850, lg: 950 }, maxHeight: { xs: 'none', sm: 680 }, display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: { xs: 1.5, sm: 2.5 }, borderBottom: 1, borderColor: 'divider', bgcolor: 'white', flexShrink: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Become an Advisor</Typography>
          <Stepper activeStep={activeStep} nonLinear alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.6rem', sm: '0.7rem' } } }}>
            {steps.map((label, index) => {
              const stepComplete = isStepComplete(index);
              return (
                <Step key={label} completed={stepComplete}>
                  <StepButton onClick={() => handleStepClick(index)}>
                    {label}
                  </StepButton>
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 2.5 }, bgcolor: 'white', minHeight: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.includes('\n') ? (
                <Box component="ul" sx={{ m: 0, pl: 2 }}>
                  {error.split('\n').map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </Box>
              ) : error}
            </Alert>
          )}
          {renderStepContent()}
        </Box>

        {/* Footer */}
        <Box sx={{ p: { xs: 1.5, sm: 2 }, borderTop: 1, borderColor: 'divider', bgcolor: 'white', display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', gap: { xs: 1, sm: 0 }, flexShrink: 0 }}>
          <Button disabled={activeStep === 0 || loading} onClick={handleBack} variant="outlined" size="small" fullWidth sx={{ display: { sm: 'inline-flex' }, width: { sm: 'auto' } }}>
            Back
          </Button>
          <Button variant="contained" onClick={handleNext} disabled={!validateStep() || loading} size="small" fullWidth sx={{ display: { sm: 'inline-flex' }, width: { sm: 'auto' } }}>
            {loading ? <CircularProgress size={20} /> : activeStep === steps.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdvisorOnboarding;

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
  Avatar,
  IconButton,
  Tooltip,
  LinearProgress,
  Collapse,
} from '@mui/material';
import {
  PhotoCamera,
  CheckCircle,
  Warning,
  LinkedIn,
  Add,
  Delete,
  VerifiedUser,
  Star,
  WorkHistory,
  School,
  Link as LinkIcon,
} from '@mui/icons-material';
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

const isDefaultAvatar = (imageUrl) => {
  if (!imageUrl) return true;
  return imageUrl.includes('gravatar.com/avatar') && imageUrl.includes('d=blank');
};

const AdvisorOnboarding = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [linkedinStatus, setLinkedinStatus] = useState({ linkedin_verified: false, linkedin_configured: false });
  const [connectingLinkedin, setConnectingLinkedin] = useState(false);
  const [profileImage, setProfileImage] = useState(null); // { preview: dataURL, file: File }
  const [uploadingImage, setUploadingImage] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState(null); // From database
  
  const [formData, setFormData] = useState({
    // Basic Info
    headline: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Expertise
    expertise_stages: [],
    preferred_stages: [],
    advisory_types: [],
    domains: [],
    languages: ['English'],
    
    // Capacity
    max_active_workspaces: 3,
    preferred_cadence: 'weekly',
    availability_hours_per_week: '',
    
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
    
    // Professional Background (structured)
    professional_background: {
      years_experience: '',
      current_role: { title: '', company: '', start_year: '' },
      previous_roles: [], // Array of { title, company, start_year, end_year }
      startups_advised_count: '',
      notable_achievements: '', // Exits, IPOs, funding rounds
    },
    
    // Portfolio & Proof
    portfolio: {
      personal_website: '',
      crunchbase_url: '',
      angellist_url: '',
      medium_url: '',
      youtube_url: '',
      other_links: [], // Array of { label, url }
    },
    
    // Legacy questionnaire (for additional free-text)
    questionnaire_data: {
      what_makes_you_unique: '',
      how_you_help_founders: '',
    }
  });

  const steps = [
    'Profile & Photo',
    'Professional Background',
    'Expertise & Advisory',
    'Portfolio & Links',
    'Consultation Setup',
    'Review & Submit'
  ];

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
            if (profileData.profile_image_url) {
              setExistingImageUrl(profileData.profile_image_url);
            }
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
              professional_background: {
                ...prev.professional_background,
                ...(profileData.professional_background || {}),
                current_role: {
                  ...prev.professional_background.current_role,
                  ...(profileData.professional_background?.current_role || {}),
                },
                previous_roles: profileData.professional_background?.previous_roles || prev.professional_background.previous_roles,
              },
              portfolio: {
                ...prev.portfolio,
                ...(profileData.portfolio || {}),
                other_links: profileData.portfolio?.other_links || prev.portfolio.other_links,
              },
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
        // Ignore errors - LinkedIn status is optional
      }
    };
    checkLinkedinStatus();
  }, [user?.id]);

  const handleConnectLinkedin = async () => {
    if (!user?.id) return;
    setConnectingLinkedin(true);
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
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }
    
    // Create preview
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

  const hasProfileImage = () => {
    return !!(profileImage?.preview || existingImageUrl);
  };

  const getProfileImageSrc = () => {
    if (profileImage?.preview) return profileImage.preview;
    if (existingImageUrl) return existingImageUrl;
    return null;
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

  const hasValidProfilePicture = () => {
    // Check our custom upload first, then fall back to existing URL
    return !!(profileImage?.preview || existingImageUrl);
  };

  const isValidLinkedInUrl = (url) => {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith('https://') &&
      (trimmed.includes('linkedin.com') || trimmed.includes('linked.in'))
    );
  };

  const isValidUrl = (url) => {
    if (!url || !url.trim()) return true; // Optional URLs are valid if empty
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://');
  };

  const validateStep = () => {
    switch (activeStep) {
      case 0: // Profile & Photo
        return (
          hasValidProfilePicture() &&
          formData.headline.length >= 10 &&
          formData.bio.length >= 100 &&
          formData.contact_email &&
          formData.contact_email.includes('@') &&
          linkedinStatus.linkedin_verified
        );
      case 1: { // Professional Background
        const bg = formData.professional_background;
        return (
          bg.years_experience &&
          bg.current_role.title.trim() &&
          bg.current_role.company.trim() &&
          bg.startups_advised_count
        );
      }
      case 2: // Expertise & Advisory
        return (
          formData.advisory_types.length > 0 &&
          formData.preferred_stages.length > 0 &&
          formData.domains.length > 0
        );
      case 3: // Portfolio & Links
        // Portfolio is optional but if provided, URLs must be valid
        const p = formData.portfolio;
        return (
          isValidUrl(p.personal_website) &&
          isValidUrl(p.crunchbase_url) &&
          isValidUrl(p.angellist_url)
        );
      case 4: // Consultation Setup
        return (
          formData.max_active_workspaces >= 1 &&
          formData.max_active_workspaces <= 10 &&
          formData.availability_hours_per_week
        );
      case 5: // Review & Submit
        return true; // Review page, always valid
      default:
        return true;
    }
  };

  const getCompletionScore = () => {
    let score = 0;
    const maxScore = 100;
    
    // Profile picture (15 points)
    if (hasValidProfilePicture()) score += 15;
    
    // Basic info (15 points)
    if (formData.headline.length >= 10) score += 5;
    if (formData.bio.length >= 100) score += 5;
    if (linkedinStatus.linkedin_verified) score += 5;
    
    // Professional background (25 points)
    const bg = formData.professional_background;
    if (bg.years_experience) score += 5;
    if (bg.current_role.title && bg.current_role.company) score += 10;
    if (bg.previous_roles.length > 0) score += 5;
    if (bg.notable_achievements?.trim()) score += 5;
    
    // Expertise (15 points)
    if (formData.advisory_types.length > 0) score += 5;
    if (formData.preferred_stages.length > 0) score += 5;
    if (formData.domains.length > 0) score += 5;
    
    // Portfolio (15 points)
    const p = formData.portfolio;
    if (p.personal_website?.trim()) score += 5;
    if (p.crunchbase_url?.trim() || p.angellist_url?.trim()) score += 5;
    if (p.other_links?.length > 0) score += 5;
    
    // Consultation setup (15 points)
    if (formData.availability_hours_per_week) score += 5;
    if (formData.consultation_rate_30min_usd || formData.consultation_rate_60min_usd) score += 5;
    if (Object.values(formData.payment_methods).some(v => v?.trim())) score += 5;
    
    return Math.min(score, maxScore);
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
        badges.push({ id: 'veteran', label: 'Veteran Advisor', icon: Star });
      }
    }
    if (formData.professional_background.previous_roles?.length >= 2) {
      badges.push({ id: 'experienced', label: 'Extensive Background', icon: WorkHistory });
    }
    if (formData.portfolio.personal_website || formData.portfolio.crunchbase_url) {
      badges.push({ id: 'portfolio', label: 'Portfolio Verified', icon: LinkIcon });
    }
    
    return badges;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // First create/update the advisor profile
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

      // Then upload the profile image if one was selected
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
      case 0: // Profile & Photo
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Profile Picture Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: 2, 
              p: 3, 
              bgcolor: '#f8fafc', 
              borderRadius: 2,
              border: hasValidProfilePicture() ? '2px solid #10b981' : '2px dashed #f59e0b'
            }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={profileImage?.preview || existingImageUrl || user?.imageUrl}
                  alt={user?.fullName || 'Profile'}
                  sx={{ width: 120, height: 120, border: '4px solid white', boxShadow: 2 }}
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
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: '#0f172a',
                      color: 'white',
                      '&:hover': { bgcolor: '#1e293b' },
                      width: 36,
                      height: 36,
                    }}
                  >
                    <PhotoCamera fontSize="small" />
                  </IconButton>
                </label>
              </Box>
              
              {hasValidProfilePicture() ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#10b981' }}>
                    <CheckCircle fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Profile picture added</Typography>
                  </Box>
                  {profileImage && (
                    <Button
                      size="small"
                      variant="text"
                      color="error"
                      onClick={handleImageRemove}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#f59e0b', mb: 1 }}>
                    <Warning fontSize="small" />
                    <Typography variant="body2" fontWeight={600}>Profile picture required</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Click the camera icon to upload a professional photo.
                    <br />
                    Advisors with photos get 3x more consultations booked.
                  </Typography>
                </Box>
              )}
            </Box>

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
              placeholder="Share your journey: What drives you? Key achievements? How do you help founders succeed? Include specific examples of startups you've helped..."
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              required
              multiline
              rows={5}
              helperText={`${formData.bio.length}/100 characters minimum. Be specific about your expertise and how you help founders.`}
              fullWidth
              error={formData.bio.length > 0 && formData.bio.length < 100}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
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
              p: 2.5, 
              bgcolor: linkedinStatus.linkedin_verified ? '#ecfdf5' : '#f8fafc', 
              borderRadius: 2,
              border: '2px solid',
              borderColor: linkedinStatus.linkedin_verified ? '#10b981' : '#e2e8f0',
            }}>
              {linkedinStatus.linkedin_verified ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ 
                    width: 40, height: 40, borderRadius: '50%', 
                    bgcolor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    <CheckCircle sx={{ color: 'white', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600} color="#10b981">
                      LinkedIn Connected
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified as {linkedinStatus.linkedin_name || 'LinkedIn User'}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ 
                      width: 40, height: 40, borderRadius: '50%', 
                      bgcolor: '#0077b5', display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <LinkedIn sx={{ color: 'white', fontSize: 24 }} />
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Connect LinkedIn *
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Required to verify your professional identity
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    We'll verify your identity and pull your profile information.
                    Advisors with verified LinkedIn get 3x more consultation bookings.
                  </Typography>
                  {linkedinStatus.linkedin_configured !== false ? (
                    <Button
                      variant="contained"
                      startIcon={connectingLinkedin ? <CircularProgress size={16} color="inherit" /> : <LinkedIn />}
                      onClick={handleConnectLinkedin}
                      disabled={connectingLinkedin}
                      sx={{
                        bgcolor: '#0077b5',
                        '&:hover': { bgcolor: '#005582' },
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {connectingLinkedin ? 'Connecting...' : 'Connect with LinkedIn'}
                    </Button>
                  ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      LinkedIn verification is being set up. Please check back later.
                    </Alert>
                  )}
                </Box>
              )}
            </Box>

            <TextField
              label="Twitter/X URL"
              placeholder="https://twitter.com/yourhandle"
              value={formData.twitter_url}
              onChange={(e) => handleChange('twitter_url', e.target.value)}
              fullWidth
              helperText="Optional"
            />
          </Box>
        );

      case 1: // Professional Background
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Tell us about your professional experience
            </Typography>

            {/* Years of Experience */}
            <FormControl fullWidth required>
              <InputLabel>Total Years of Professional Experience *</InputLabel>
              <Select
                value={formData.professional_background.years_experience}
                onChange={(e) => handleChange('professional_background.years_experience', e.target.value)}
                label="Total Years of Professional Experience *"
              >
                {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Current Role */}
            <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkHistory fontSize="small" color="primary" />
                Current or Most Recent Role *
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Job Title"
                  placeholder="e.g., CEO, CTO, VP of Engineering, Founder"
                  value={formData.professional_background.current_role.title}
                  onChange={(e) => handleChange('professional_background.current_role.title', e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Company Name"
                  placeholder="e.g., Google, Stripe, Your Startup Name"
                  value={formData.professional_background.current_role.company}
                  onChange={(e) => handleChange('professional_background.current_role.company', e.target.value)}
                  required
                  fullWidth
                  size="small"
                />
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Start Year</InputLabel>
                  <Select
                    value={formData.professional_background.current_role.start_year}
                    onChange={(e) => handleChange('professional_background.current_role.start_year', e.target.value)}
                    label="Start Year"
                  >
                    {YEAR_OPTIONS.map((year) => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Previous Roles */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Previous Roles (Optional but recommended)
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={addPreviousRole}
                  disabled={formData.professional_background.previous_roles.length >= 5}
                >
                  Add Role
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Adding 2+ roles earns you the "Extensive Background" badge
              </Typography>
              
              {formData.professional_background.previous_roles.map((role, index) => (
                <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">Role {index + 1}</Typography>
                    <IconButton size="small" onClick={() => removePreviousRole(index)} color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <TextField
                        label="Title"
                        size="small"
                        fullWidth
                        value={role.title}
                        onChange={(e) => updatePreviousRole(index, 'title', e.target.value)}
                      />
                      <TextField
                        label="Company"
                        size="small"
                        fullWidth
                        value={role.company}
                        onChange={(e) => updatePreviousRole(index, 'company', e.target.value)}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <FormControl size="small" sx={{ width: 120 }}>
                        <InputLabel>From</InputLabel>
                        <Select
                          value={role.start_year}
                          onChange={(e) => updatePreviousRole(index, 'start_year', e.target.value)}
                          label="From"
                        >
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ width: 120 }}>
                        <InputLabel>To</InputLabel>
                        <Select
                          value={role.end_year}
                          onChange={(e) => updatePreviousRole(index, 'end_year', e.target.value)}
                          label="To"
                        >
                          <MenuItem value="present">Present</MenuItem>
                          {YEAR_OPTIONS.map((year) => (
                            <MenuItem key={year} value={year}>{year}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Startups Advised */}
            <FormControl fullWidth required>
              <InputLabel>Number of Startups You've Advised *</InputLabel>
              <Select
                value={formData.professional_background.startups_advised_count}
                onChange={(e) => handleChange('professional_background.startups_advised_count', e.target.value)}
                label="Number of Startups You've Advised *"
              >
                {STARTUPS_ADVISED_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Notable Achievements */}
            <TextField
              label="Notable Achievements (Optional)"
              placeholder="e.g., Led company to $50M exit, Helped 3 portfolio companies raise Series A, Built engineering team from 5 to 100..."
              value={formData.professional_background.notable_achievements}
              onChange={(e) => handleChange('professional_background.notable_achievements', e.target.value)}
              multiline
              rows={3}
              fullWidth
              helperText="Exits, funding rounds you helped with, teams you built, etc."
            />
          </Box>
        );

      case 2: // Expertise & Advisory
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Type of Advisory */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
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
                        borderColor: formData.advisory_types.includes(type.value) ? '#0d9488' : 'divider',
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        bgcolor: formData.advisory_types.includes(type.value) ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                        '&:hover': { borderColor: '#0d9488', bgcolor: 'rgba(13, 148, 136, 0.04)' },
                      }}
                      onClick={() => handleArrayChange('advisory_types', type.value, !formData.advisory_types.includes(type.value))}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Checkbox
                          checked={formData.advisory_types.includes(type.value)}
                          size="small"
                          sx={{ '&.Mui-checked': { color: '#0d9488' } }}
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

            {/* Preferred Stages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Startup stages you prefer to advise *
              </FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {STAGES.map((stage) => (
                    <Chip
                      key={stage}
                      label={stage.charAt(0).toUpperCase() + stage.slice(1).replace('-', ' ')}
                      onClick={() => handleArrayChange('preferred_stages', stage, !formData.preferred_stages.includes(stage))}
                      sx={{
                        bgcolor: formData.preferred_stages.includes(stage) ? '#0d9488' : 'transparent',
                        color: formData.preferred_stages.includes(stage) ? 'white' : 'text.primary',
                        border: '1px solid',
                        borderColor: formData.preferred_stages.includes(stage) ? '#0d9488' : 'divider',
                        '&:hover': { bgcolor: formData.preferred_stages.includes(stage) ? '#0f766e' : 'action.hover' },
                      }}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Domains */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>Domains/Industries you specialize in *</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {DOMAINS.map((domain) => (
                    <Chip
                      key={domain}
                      label={domain}
                      onClick={() => handleArrayChange('domains', domain, !formData.domains.includes(domain))}
                      color={formData.domains.includes(domain) ? 'primary' : 'default'}
                      variant={formData.domains.includes(domain) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </FormGroup>
            </FormControl>

            {/* Languages */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>Languages you can advise in</FormLabel>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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

            {/* What makes you unique */}
            <TextField
              label="What makes you unique as an advisor?"
              placeholder="What specific value do you bring? What's your advisory style? What should founders expect from working with you?"
              value={formData.questionnaire_data.what_makes_you_unique}
              onChange={(e) => handleChange('questionnaire_data.what_makes_you_unique', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        );

      case 3: // Portfolio & Links
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ mb: 0.5 }}>
                Showcase Your Work
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Adding portfolio links helps founders verify your background and increases trust.
                Profiles with portfolio links get 2x more consultation bookings.
              </Typography>
            </Box>

            <TextField
              label="Personal Website / Portfolio"
              placeholder="https://yourname.com"
              value={formData.portfolio.personal_website}
              onChange={(e) => handleChange('portfolio.personal_website', e.target.value)}
              fullWidth
              InputProps={{ startAdornment: <LinkIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
              helperText="Your personal site, blog, or portfolio"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Crunchbase Profile"
                placeholder="https://crunchbase.com/person/..."
                value={formData.portfolio.crunchbase_url}
                onChange={(e) => handleChange('portfolio.crunchbase_url', e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="AngelList Profile"
                placeholder="https://angel.co/u/..."
                value={formData.portfolio.angellist_url}
                onChange={(e) => handleChange('portfolio.angellist_url', e.target.value)}
                fullWidth
                size="small"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Medium / Substack"
                placeholder="https://medium.com/@yourname"
                value={formData.portfolio.medium_url}
                onChange={(e) => handleChange('portfolio.medium_url', e.target.value)}
                fullWidth
                size="small"
                helperText="Your blog or newsletter"
              />
              <TextField
                label="YouTube Channel"
                placeholder="https://youtube.com/@yourchannel"
                value={formData.portfolio.youtube_url}
                onChange={(e) => handleChange('portfolio.youtube_url', e.target.value)}
                fullWidth
                size="small"
                helperText="Talks, interviews, tutorials"
              />
            </Box>

            {/* Additional Links */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Additional Links
                </Typography>
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={addPortfolioLink}
                  disabled={formData.portfolio.other_links.length >= 5}
                >
                  Add Link
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Podcast appearances, conference talks, press mentions, etc.
              </Typography>
              
              {formData.portfolio.other_links.map((link, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                  <TextField
                    label="Label"
                    placeholder="e.g., TechCrunch Interview"
                    size="small"
                    value={link.label}
                    onChange={(e) => updatePortfolioLink(index, 'label', e.target.value)}
                    sx={{ width: '35%' }}
                  />
                  <TextField
                    label="URL"
                    placeholder="https://..."
                    size="small"
                    fullWidth
                    value={link.url}
                    onChange={(e) => updatePortfolioLink(index, 'url', e.target.value)}
                  />
                  <IconButton size="small" onClick={() => removePortfolioLink(index)} color="error">
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>

            {/* How you help */}
            <TextField
              label="How do you typically help founders?"
              placeholder="Describe your advisory style. Do you prefer hands-on involvement or high-level guidance? How often do you like to meet? What's your communication style?"
              value={formData.questionnaire_data.how_you_help_founders}
              onChange={(e) => handleChange('questionnaire_data.how_you_help_founders', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        );

      case 4: // Consultation Setup
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary">
              Set up your consultation availability
            </Typography>

            {/* Hours Per Week */}
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Hours available per week for advising *
              </FormLabel>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {HOURS_PER_WEEK_OPTIONS.map((option) => (
                  <Paper
                    key={option.value}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '2px solid',
                      borderColor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'divider',
                      borderRadius: 2,
                      cursor: 'pointer',
                      bgcolor: formData.availability_hours_per_week === option.value ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                      '&:hover': { borderColor: '#0d9488' },
                    }}
                    onClick={() => handleChange('availability_hours_per_week', option.value)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 20, height: 20, borderRadius: '50%',
                          border: '2px solid',
                          borderColor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'divider',
                          bgcolor: formData.availability_hours_per_week === option.value ? '#0d9488' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                min={1} max={10} marks step={1}
                sx={{ '& .MuiSlider-thumb': { bgcolor: '#0d9488' }, '& .MuiSlider-track': { bgcolor: '#0d9488' } }}
              />
              <Typography variant="caption" color="text.secondary">
                How many startups can you actively advise at once?
              </Typography>
            </Box>

            {/* Consultation Pricing */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 0.5 }}>
                Consultation Pricing (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Founders pay you directly — Guild Space doesn't process payment. You can set this up later.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  label="30-min rate"
                  type="number"
                  fullWidth size="small"
                  value={formData.consultation_rate_30min_usd}
                  onChange={(e) => handleChange('consultation_rate_30min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                  helperText="Leave blank if not offered"
                />
                <TextField
                  label="60-min rate"
                  type="number"
                  fullWidth size="small"
                  value={formData.consultation_rate_60min_usd}
                  onChange={(e) => handleChange('consultation_rate_60min_usd', e.target.value)}
                  inputProps={{ min: 0, step: 5 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                  helperText="Leave blank if not offered"
                />
              </Box>

              <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 2, mb: 1 }}>
                Payment Methods
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="UPI ID (for India)"
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
                <TextField
                  label="Razorpay link"
                  size="small" fullWidth
                  value={formData.payment_methods.razorpay_link}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, razorpay_link: e.target.value })}
                  placeholder="https://razorpay.me/@yourname"
                />
                <TextField
                  label="Bank details"
                  size="small" fullWidth multiline minRows={2}
                  value={formData.payment_methods.bank_details}
                  onChange={(e) => handleChange('payment_methods', { ...formData.payment_methods, bank_details: e.target.value })}
                  placeholder="Account + IFSC + Name"
                />
              </Box>
            </Box>
          </Box>
        );

      case 5: // Review & Submit
        const badges = getBadgesEarned();
        const score = getCompletionScore();
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Completion Score */}
            <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>Profile Completeness</Typography>
                <Typography variant="h5" fontWeight={700} color={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}>
                  {score}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={score}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444',
                    borderRadius: 4,
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {score >= 80 ? 'Excellent! Your profile is well-optimized.' :
                 score >= 50 ? 'Good start! Consider adding more details.' :
                 'Add more information to increase visibility.'}
              </Typography>
            </Box>

            {/* Badges Earned */}
            {badges.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                  Badges You'll Earn
                </Typography>
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

            {/* Profile Summary */}
            <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>Profile Summary</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar src={profileImage?.preview || existingImageUrl || user?.imageUrl} sx={{ width: 64, height: 64 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>{user?.fullName || 'Your Name'}</Typography>
                  <Typography variant="body2" color="text.secondary">{formData.headline || 'No headline'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.professional_background.years_experience || '?'} years experience • 
                    {formData.professional_background.startups_advised_count || '?'} startups advised
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {formData.advisory_types.map((type) => (
                  <Chip key={type} label={ADVISORY_TYPES.find(t => t.value === type)?.label || type} size="small" variant="outlined" />
                ))}
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {formData.domains.slice(0, 5).map((domain) => (
                  <Chip key={domain} label={domain} size="small" sx={{ bgcolor: '#f1f5f9' }} />
                ))}
              </Box>
            </Box>

            {/* What happens next */}
            <Alert severity="info" sx={{ bgcolor: '#eff6ff', '& .MuiAlert-icon': { color: '#3b82f6' } }}>
              <Typography variant="subtitle2" fontWeight={600}>What happens next?</Typography>
              <Typography variant="body2">
                Your profile will be reviewed by our team (usually within 24-48 hours).
                Once approved, you'll appear in the advisor marketplace and founders can book consultations with you.
              </Typography>
            </Alert>
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

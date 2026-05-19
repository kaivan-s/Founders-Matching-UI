import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  RocketLaunch,
  LinkedIn,
  CheckCircle,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const EXPERTISE_OPTIONS = [
  { value: 'strategic', label: 'Strategy & Business' },
  { value: 'technical', label: 'Technical / Engineering' },
  { value: 'fundraising', label: 'Fundraising & Investors' },
  { value: 'gtm', label: 'Sales & Go-to-Market' },
  { value: 'operations', label: 'Operations & Scaling' },
  { value: 'product', label: 'Product & Design' },
];

const AdvisorOnboardingQuick = ({ onComplete }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: user?.fullName || user?.firstName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    linkedin_url: '',
    headline: '',
    primary_expertise: '',
  });

  // Check if advisor profile already exists
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user?.id) {
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/advisors/profile`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });

        if (response.ok) {
          const profileData = await response.json();
          if (profileData && Object.keys(profileData).length > 0) {
            // Profile exists - redirect to dashboard
            navigate('/advisor/dashboard', { replace: true });
            return;
          }
        }
      } catch (err) {
        // Allow onboarding to proceed on error
      } finally {
        setCheckingProfile(false);
      }
    };

    checkExistingProfile();
  }, [user?.id, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      formData.name.trim().length >= 2 &&
      formData.email.trim() && emailRegex.test(formData.email.trim()) &&
      formData.headline.trim().length >= 5 &&
      formData.primary_expertise
    );
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    setLoading(true);
    setError(null);

    try {
      // Format data for backend
      const profileData = {
        headline: formData.headline.trim(),
        linkedin_url: formData.linkedin_url.trim() || null,
        advisory_types: [formData.primary_expertise],
        max_active_workspaces: 5,
        // Minimal defaults
        bio: '',
        preferred_stages: [],
        domains: [],
        languages: ['English'],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        contact_email: formData.email.trim(),
      };

      const response = await fetch(`${API_BASE}/advisors/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
          'X-User-Email': user?.emailAddresses?.[0]?.emailAddress || '',
          'X-User-Name': formData.name.trim(),
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create profile');
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

  if (checkingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center',
      bgcolor: '#f8fafc',
      p: { xs: 2, sm: 4 },
      pt: { xs: 4, sm: 6 },
    }}>
      <Paper sx={{ 
        maxWidth: 720, 
        width: '100%', 
        p: { xs: 3, sm: 4 }, 
        borderRadius: 3,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ 
              width: 48, 
              height: 48, 
              borderRadius: '50%', 
              bgcolor: 'rgba(13, 148, 136, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RocketLaunch sx={{ fontSize: 24, color: '#0d9488' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Become an Advisor
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Get started in 30 seconds. Complete your full profile later.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Name */}
          <TextField
            label="Your Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            size="small"
            placeholder="John Smith"
            helperText="How founders will see you"
          />

          {/* Email */}
          <TextField
            label="Contact Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            fullWidth
            required
            size="small"
            placeholder="you@example.com"
            helperText="Founders will contact you here"
          />

          {/* Headline */}
          <TextField
            label="Professional Headline"
            value={formData.headline}
            onChange={(e) => handleChange('headline', e.target.value)}
            fullWidth
            required
            size="small"
            placeholder="Ex-Google PM | 2x Founder | Startup Advisor"
            helperText="A short intro that describes your expertise"
          />

          {/* Primary Expertise */}
          <FormControl fullWidth required size="small">
            <InputLabel>Primary Expertise</InputLabel>
            <Select
              value={formData.primary_expertise}
              onChange={(e) => handleChange('primary_expertise', e.target.value)}
              label="Primary Expertise"
            >
              {EXPERTISE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* LinkedIn URL - Optional */}
          <TextField
            sx={{ mt: 1 }}
            label="LinkedIn Profile (Optional)"
            value={formData.linkedin_url}
            onChange={(e) => handleChange('linkedin_url', e.target.value)}
            fullWidth
            size="small"
            placeholder="https://linkedin.com/in/yourname"
            InputProps={{
              startAdornment: <LinkedIn sx={{ color: '#0077b5', mr: 1, fontSize: 18 }} />,
            }}
            helperText="Helps founders verify your background"
          />
        </Box>

        {/* What's Next */}
        <Box sx={{ 
          mt: 2.5, 
          p: 2, 
          bgcolor: 'rgba(13, 148, 136, 0.04)', 
          borderRadius: 2,
          border: '1px solid rgba(13, 148, 136, 0.1)',
        }}>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#0d9488', display: 'block', mb: 1 }}>
            What happens next?
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 14, color: '#0d9488' }} />
              <Typography variant="caption" color="text.secondary">
                Instant dashboard access
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 14, color: '#0d9488' }} />
              <Typography variant="caption" color="text.secondary">
                Complete profile at your pace
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircle sx={{ fontSize: 14, color: '#0d9488' }} />
              <Typography variant="caption" color="text.secondary">
                Get discovered once approved
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Submit Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2.5 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!isValid() || loading}
            sx={{ 
              py: 1.25,
              px: 4,
              bgcolor: '#0d9488',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': { bgcolor: '#0f766e' },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : 'Get Started'}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Free to join. No credit card required.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdvisorOnboardingQuick;

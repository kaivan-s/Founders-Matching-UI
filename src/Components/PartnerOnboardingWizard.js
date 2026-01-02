import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
  Divider,
} from '@mui/material';
import { API_BASE } from '../config/api';
import {
  ArrowForward,
  ArrowBack,
  CheckCircle,
  Close,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../config/supabase';

const PartnerOnboardingWizard = ({ open, onComplete, onClose, existingProfile, useDirectSupabase = false }) => {
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form data - pre-populate if editing existing profile
  const [formData, setFormData] = useState({
    headline: existingProfile?.headline || '',
    bio: existingProfile?.bio || '',
    linkedin_url: existingProfile?.linkedin_url || '',
    twitter_url: existingProfile?.twitter_url || '',
    timezone: existingProfile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    languages: existingProfile?.languages || [],
    expertise_stages: existingProfile?.expertise_stages || [],
    domains: existingProfile?.domains || [],
    max_active_workspaces: existingProfile?.max_active_workspaces || 3,
    preferred_cadence: existingProfile?.preferred_cadence || 'weekly',
    is_discoverable: existingProfile?.is_discoverable || true,
    contact_email: existingProfile?.contact_email || '',
    meeting_link: existingProfile?.meeting_link || '',
    contact_note: existingProfile?.contact_note || '',
  });
  
  const [twitterNotActive, setTwitterNotActive] = useState(!existingProfile?.twitter_url);
  
  // Reset form when dialog opens/closes or existingProfile changes
  useEffect(() => {
    if (open && existingProfile) {
      setFormData({
        headline: existingProfile.headline || '',
        bio: existingProfile.bio || '',
        linkedin_url: existingProfile.linkedin_url || '',
        twitter_url: existingProfile.twitter_url || '',
        timezone: existingProfile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        languages: existingProfile.languages || [],
        expertise_stages: existingProfile.expertise_stages || [],
        domains: existingProfile.domains || [],
        max_active_workspaces: existingProfile.max_active_workspaces || 3,
        preferred_cadence: existingProfile.preferred_cadence || 'weekly',
        is_discoverable: existingProfile.is_discoverable || true,
        contact_email: existingProfile.contact_email || '',
        meeting_link: existingProfile.meeting_link || '',
        contact_note: existingProfile.contact_note || '',
      });
      setTwitterNotActive(!existingProfile.twitter_url);
      setCurrentStep(0);
    } else if (open && !existingProfile) {
      // Reset to defaults for new profile
      setFormData({
        headline: '',
        bio: '',
        linkedin_url: '',
        twitter_url: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        languages: [],
        expertise_stages: [],
        domains: [],
        max_active_workspaces: 3,
        preferred_cadence: 'weekly',
        is_discoverable: true,
        contact_email: '',
        meeting_link: '',
        contact_note: '',
      });
      setTwitterNotActive(false);
      setCurrentStep(0);
    }
  }, [open, existingProfile]);
  
  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const expertiseStages = [
    { value: 'idea', label: 'Idea Stage' },
    { value: 'pre-seed', label: 'Pre-Seed' },
    { value: 'seed', label: 'Seed' },
    { value: 'seriesA', label: 'Series A' },
  ];

  const domains = [
    'SaaS',
    'Fintech',
    'Healthcare',
    'E-commerce',
    'EdTech',
    'AI/ML',
    'Blockchain',
    'Consumer',
    'B2B',
    'Marketplace',
    'Hardware',
    'Other',
  ];

  const languages = [
    'English',
    'Spanish',
    'French',
    'German',
    'Mandarin',
    'Hindi',
    'Portuguese',
    'Japanese',
    'Korean',
    'Arabic',
  ];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
  ];

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate required fields
      if (!formData.headline || !formData.linkedin_url) {
        alert('Please fill in all required fields (Headline and LinkedIn URL)');
        setLoading(false);
        return;
      }

      if (useDirectSupabase) {
        // Save directly to Supabase
        await saveToSupabaseDirect();
      } else {
        // Use backend API
        await saveViaBackendAPI();
      }
    } catch (error) {
      console.error('Error creating partner profile:', error);
      const errorMessage = error.message || 'Failed to create partner profile. Please check your connection and try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const saveViaBackendAPI = async () => {
    const requestBody = {
      ...formData,
      // Don't send twitter_url if user checked "not active"
      twitter_url: twitterNotActive ? '' : formData.twitter_url,
      user_name: user.fullName || user.firstName || 'Accountability Partner',
      user_email: user.primaryEmailAddress?.emailAddress || '',
    };

    console.log('Submitting partner profile:', requestBody);
    console.log('User ID:', user.id);

    const response = await fetch(`${API_BASE}/accountability-partners/profile`, {
      method: existingProfile ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Clerk-User-Id': user.id,
        'X-User-Name': user.fullName || user.firstName || 'Accountability Partner',
        'X-User-Email': user.primaryEmailAddress?.emailAddress || '',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create partner profile';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        console.error('Error response:', errorData);
      } catch (e) {
        console.error('Failed to parse error response:', e);
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Partner profile created successfully:', result);
    onComplete(result);
  };

  const saveToSupabaseDirect = async () => {
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }

    const userEmail = user.primaryEmailAddress?.emailAddress || '';
    const userName = user.fullName || user.firstName || 'Accountability Partner';

    // Step 1: Get or create founder profile
    let founderId;
    
    // Check if founder profile exists
    const { data: existingFounder } = await supabase
      .from('founders')
      .select('id')
      .eq('clerk_user_id', user.id)
      .single();

    if (existingFounder) {
      founderId = existingFounder.id;
    } else {
      // Create minimal founder profile
      const { data: newFounder, error: founderError } = await supabase
        .from('founders')
        .insert({
          clerk_user_id: user.id,
          name: userName,
          email: userEmail,
          purpose: 'both',
          location: '',
          looking_for: 'Accountability partner and advisor',
          skills: [],
          onboarding_completed: false,
          credits: 0,
        })
        .select('id')
        .single();

      if (founderError) {
        console.error('Error creating founder profile:', founderError);
        throw new Error(`Failed to create founder profile: ${founderError.message}`);
      }

      founderId = newFounder.id;
    }

    // Step 2: Check if partner profile exists
    const { data: existingPartner } = await supabase
      .from('accountability_partner_profiles')
      .select('id, status')
      .eq('user_id', founderId)
      .single();

    const profileData = {
      user_id: founderId,
      headline: formData.headline,
      bio: formData.bio || '',
      linkedin_url: formData.linkedin_url,
      twitter_url: twitterNotActive ? null : (formData.twitter_url || null),
      timezone: formData.timezone || 'UTC',
      languages: formData.languages || [],
      expertise_stages: formData.expertise_stages || [],
      domains: formData.domains || [],
      max_active_workspaces: formData.max_active_workspaces || 3,
      preferred_cadence: formData.preferred_cadence || 'weekly',
      contact_email: formData.contact_email || null,
      meeting_link: formData.meeting_link || null,
      contact_note: formData.contact_note || null,
    };

    if (existingPartner) {
      // Update existing profile
      const currentStatus = existingPartner.status || 'PENDING';
      
      // If status is PENDING or REJECTED, keep it as PENDING (user is updating application)
      if (currentStatus === 'PENDING' || currentStatus === 'REJECTED') {
        profileData.status = 'PENDING';
        profileData.is_discoverable = false;
      }
      // For APPROVED profiles, don't change status or is_discoverable

      const { data: updatedProfile, error: updateError } = await supabase
        .from('accountability_partner_profiles')
        .update(profileData)
        .eq('id', existingPartner.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating partner profile:', updateError);
        throw new Error(`Failed to update partner profile: ${updateError.message}`);
      }

      onComplete(updatedProfile);
    } else {
      // Create new profile - force PENDING status and is_discoverable = false
      profileData.status = 'PENDING';
      profileData.is_discoverable = false;

      const { data: newProfile, error: insertError } = await supabase
        .from('accountability_partner_profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating partner profile:', insertError);
        throw new Error(`Failed to create partner profile: ${insertError.message}`);
      }

      onComplete(newProfile);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Basic Information
            </Typography>
            
            <TextField
              label="Headline"
              placeholder="e.g., Ex-founder & growth coach"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              required
              fullWidth
              helperText="A short tagline that describes your expertise"
            />
            
            <TextField
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              value={formData.linkedin_url}
              onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
              required
              fullWidth
              type="url"
              helperText="Your LinkedIn profile URL (required)"
            />
            
            <TextField
              label="X/Twitter URL"
              placeholder="https://x.com/yourhandle or https://twitter.com/yourhandle"
              value={formData.twitter_url}
              onChange={(e) => {
                setFormData({ ...formData, twitter_url: e.target.value });
                if (e.target.value) setTwitterNotActive(false);
              }}
              disabled={twitterNotActive}
              fullWidth
              type="url"
              helperText="Your X/Twitter profile URL"
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={twitterNotActive}
                  onChange={(e) => {
                    setTwitterNotActive(e.target.checked);
                    if (e.target.checked) {
                      setFormData({ ...formData, twitter_url: '' });
                    }
                  }}
                />
              }
              label="I'm not active on X/Twitter"
            />
            
            <TextField
              label="Bio"
              placeholder="Tell us about your background and experience..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              multiline
              rows={4}
              fullWidth
              helperText="Describe your experience as a founder, coach, or advisor"
            />
            
            <FormControl fullWidth>
              <InputLabel>Timezone</InputLabel>
              <Select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                label="Timezone"
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>{tz}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              options={languages}
              value={formData.languages}
              onChange={(event, newValue) => {
                setFormData({ ...formData, languages: newValue });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Languages" placeholder="Select languages" />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
          </Box>
        );

      case 1: // Fit Preferences
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Fit Preferences
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the startup stages and domains you want to work with
            </Typography>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Expertise Stages
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {expertiseStages.map((stage) => (
                  <Chip
                    key={stage.value}
                    label={stage.label}
                    onClick={() => {
                      const stages = formData.expertise_stages.includes(stage.value)
                        ? formData.expertise_stages.filter((s) => s !== stage.value)
                        : [...formData.expertise_stages, stage.value];
                      setFormData({ ...formData, expertise_stages: stages });
                    }}
                    color={formData.expertise_stages.includes(stage.value) ? 'primary' : 'default'}
                    variant={formData.expertise_stages.includes(stage.value) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Domains
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {domains.map((domain) => (
                  <Chip
                    key={domain}
                    label={domain}
                    onClick={() => {
                      const domainList = formData.domains.includes(domain)
                        ? formData.domains.filter((d) => d !== domain)
                        : [...formData.domains, domain];
                      setFormData({ ...formData, domains: domainList });
                    }}
                    color={formData.domains.includes(domain) ? 'primary' : 'default'}
                    variant={formData.domains.includes(domain) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );

      case 2: // Capacity
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Capacity & Preferences
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>How many startups can you actively support?</InputLabel>
              <Select
                value={formData.max_active_workspaces}
                onChange={(e) => setFormData({ ...formData, max_active_workspaces: e.target.value })}
                label="How many startups can you actively support?"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <MenuItem key={num} value={num}>{num} {num === 1 ? 'startup' : 'startups'}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Preferred Cadence</InputLabel>
              <Select
                value={formData.preferred_cadence}
                onChange={(e) => setFormData({ ...formData, preferred_cadence: e.target.value })}
                label="Preferred Cadence"
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="biweekly">Bi-weekly</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_discoverable}
                  onChange={(e) => setFormData({ ...formData, is_discoverable: e.target.checked })}
                />
              }
              label="Make me discoverable in the marketplace"
            />
            <Typography variant="caption" color="text.secondary">
              When enabled, founders can find and request you as an accountability partner
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Contact Information
            </Typography>
            
            <TextField
              label="Contact Email (optional)"
              placeholder={user.primaryEmailAddress?.emailAddress || 'your@email.com'}
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              fullWidth
              type="email"
              helperText="Leave empty to use your login email. This is what founders will use to contact you."
            />
            
            <TextField
              label="Booking Link (optional)"
              placeholder="https://calendly.com/yourname or https://meet.google.com/..."
              value={formData.meeting_link}
              onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
              fullWidth
              helperText="Calendly, Google Meet, Zoom, or other calendar booking link"
            />
            
            <TextField
              label="Best Way to Reach Me (optional)"
              placeholder="e.g., Best reached by email; calls Tue–Thu 2-4pm EST"
              value={formData.contact_note}
              onChange={(e) => setFormData({ ...formData, contact_note: e.target.value })}
              multiline
              rows={2}
              fullWidth
              helperText="Let founders know your preferred contact method and availability"
            />
          </Box>
        );

      case 3: // Review
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Review Your Profile
            </Typography>
            
            <Paper sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" color="text.secondary">Headline</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.headline || 'Not set'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">LinkedIn URL</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.linkedin_url || 'Not set'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">X/Twitter URL</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{twitterNotActive ? 'Not active' : (formData.twitter_url || 'Not set')}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Bio</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.bio || 'Not set'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Timezone</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.timezone}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Languages</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {formData.languages.length > 0 ? (
                  formData.languages.map((lang) => (
                    <Chip key={lang} label={lang} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">None selected</Typography>
                )}
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary">Expertise Stages</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {formData.expertise_stages.length > 0 ? (
                  formData.expertise_stages.map((stage) => (
                    <Chip key={stage} label={stage} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">None selected</Typography>
                )}
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary">Domains</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {formData.domains.length > 0 ? (
                  formData.domains.map((domain) => (
                    <Chip key={domain} label={domain} size="small" />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">None selected</Typography>
                )}
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary">Capacity</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.max_active_workspaces} {formData.max_active_workspaces === 1 ? 'startup' : 'startups'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Preferred Cadence</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formData.preferred_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Discoverable</Typography>
              <Typography variant="body1">{formData.is_discoverable ? 'Yes' : 'No'}</Typography>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.headline.trim().length > 0 && formData.linkedin_url.trim().length > 0;
      case 1:
        return formData.expertise_stages.length > 0 || formData.domains.length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: '85vh',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexShrink: 0
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Become an Accountability Partner
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ mb: 3, height: 6, borderRadius: 3, flexShrink: 0 }} 
        />
        
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 0,
          pr: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555',
            },
          },
        }}>
          {renderStepContent()}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mt: 4,
          flexShrink: 0,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            startIcon={<ArrowBack />}
          >
            Back
          </Button>
          
          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed()}
              endIcon={<ArrowForward />}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading || !canProceed()}
              startIcon={<CheckCircle />}
            >
              {loading ? 'Creating...' : 'Complete Setup'}
            </Button>
          )}
        </Box>
      </Box>
    </Dialog>
  );
};

export default PartnerOnboardingWizard;

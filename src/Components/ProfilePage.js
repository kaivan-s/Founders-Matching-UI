import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Snackbar,
  Avatar,
  IconButton,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tabs,
  Tab,
  alpha,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save,
  Add,
  Delete,
  LinkedIn,
  Twitter,
  Language,
  GitHub,
  Person,
  Work,
  School,
  Settings,
  CheckCircle,
  Warning,
  Link as LinkIcon,
  Search,
  AutoAwesome,
  LightbulbOutlined,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';
import ActivationPanel from './ActivationPanel';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const ProfilePage = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [options, setOptions] = useState({ interests: [], work_preferences: {} });
  const [completeness, setCompleteness] = useState({ score: 0, missing: [], complete: false });
  const [verification, setVerification] = useState(null);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [skillInput, setSkillInput] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  
  // Bio templates
  const [bioTemplates, setBioTemplates] = useState([]);
  const [bioTemplateMenuAnchor, setBioTemplateMenuAnchor] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const tabs = [
    { label: 'Basic Info', icon: <Person fontSize="small" /> },
    { label: 'Skills & Interests', icon: <School fontSize="small" /> },
    { label: 'Experience', icon: <Work fontSize="small" /> },
    { label: 'Past Projects', icon: <Work fontSize="small" /> },
    { label: 'Preferences', icon: <Settings fontSize="small" /> },
    { label: 'Links', icon: <LinkIcon fontSize="small" /> },
    { label: 'Verification', icon: <CheckCircle fontSize="small" /> },
  ];

  const fetchVerification = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/founders/verification/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setVerification(data);
      }
    } catch (error) {
      console.error('Error fetching verification:', error);
    }
  }, [user?.id]);

  const fetchBioTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/activation/bio-templates`);
      if (res.ok) {
        const data = await res.json();
        setBioTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching bio templates:', error);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [profileRes, optionsRes, completenessRes] = await Promise.all([
        fetch(`${API_BASE}/profile`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/profile/options`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/profile/completeness`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data);
      }
      
      if (optionsRes.ok) {
        const data = await optionsRes.json();
        setOptions(data);
      }
      
      if (completenessRes.ok) {
        const data = await completenessRes.json();
        setCompleteness(data);
      }

      // Also fetch verification status
      await fetchVerification();
    } catch (error) {
      console.error('Error fetching profile:', error);
      setSnackbar({ open: true, message: 'Failed to load profile', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchVerification]);

  useEffect(() => {
    fetchProfile();
    fetchBioTemplates();
  }, [fetchProfile, fetchBioTemplates]);

  const handleSave = async () => {
    if (!user?.id || !profile) return;
    
    try {
      setSaving(true);
      const response = await fetch(`${API_BASE}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        setSnackbar({ open: true, message: 'Profile saved successfully!', severity: 'success' });
        
        const completenessRes = await fetch(`${API_BASE}/profile/completeness`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (completenessRes.ok) {
          setCompleteness(await completenessRes.json());
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({ open: true, message: error.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent, field, value) => {
    setProfile(prev => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [field]: value },
    }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !profile.skills?.includes(skillInput.trim())) {
      updateField('skills', [...(profile.skills || []), skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    updateField('skills', (profile.skills || []).filter(s => s !== skillToRemove));
  };

  const handleAddPastProject = () => {
    const newProject = { title: '', role: '', years: '', outcome: '', description: '' };
    updateField('past_projects', [...(profile.past_projects || []), newProject]);
  };

  const handleUpdatePastProject = (index, field, value) => {
    const updated = [...(profile.past_projects || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField('past_projects', updated);
  };

  const handleRemovePastProject = (index) => {
    const updated = [...(profile.past_projects || [])];
    updated.splice(index, 1);
    updateField('past_projects', updated);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">Failed to load profile. Please try again.</Typography>
        <Button onClick={fetchProfile} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const renderBasicInfo = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Full Name"
            fullWidth
            value={profile.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            required
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Location"
            fullWidth
            value={profile.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="e.g., San Francisco, CA"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Headline"
            fullWidth
            value={profile.headline || ''}
            onChange={(e) => updateField('headline', e.target.value)}
            placeholder="e.g., Ex-Google PM building in sports tech"
            helperText="A short one-liner about yourself (max 200 characters)"
            inputProps={{ maxLength: 200 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              label="Bio"
              fullWidth
              multiline
              rows={4}
              value={profile.bio || ''}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell others about your background, experience, and what drives you..."
              helperText={`${(profile.bio || '').length}/2000 characters`}
              inputProps={{ maxLength: 2000 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            {bioTemplates.length > 0 && (
              <Button
                size="small"
                startIcon={<AutoAwesome />}
                onClick={(e) => setBioTemplateMenuAnchor(e.currentTarget)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  textTransform: 'none',
                  fontSize: '0.75rem',
                  bgcolor: alpha(TEAL, 0.1),
                  color: TEAL,
                  fontWeight: 600,
                  '&:hover': { bgcolor: alpha(TEAL, 0.15) },
                }}
              >
                Use Template
              </Button>
            )}
            <Menu
              anchorEl={bioTemplateMenuAnchor}
              open={Boolean(bioTemplateMenuAnchor)}
              onClose={() => setBioTemplateMenuAnchor(null)}
              PaperProps={{
                sx: { 
                  maxWidth: 340, 
                  maxHeight: 400,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: SLATE_200,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }
              }}
            >
              {bioTemplates.map((template, index) => (
                <MenuItem
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setTemplateDialogOpen(true);
                    setBioTemplateMenuAnchor(null);
                  }}
                  sx={{ 
                    whiteSpace: 'normal',
                    py: 1.5,
                    px: 2,
                    borderBottom: index < bioTemplates.length - 1 ? '1px solid' : 'none',
                    borderColor: SLATE_200,
                    '&:hover': { bgcolor: alpha(TEAL, 0.05) },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                      {template.archetype}
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mt: 0.5 }}>
                      {template.template.substring(0, 80)}...
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );

  const renderSkillsInterests = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: SLATE_900 }}>Your Skills</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              size="small"
              placeholder="Add a skill..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
            <Button 
              variant="outlined" 
              onClick={handleAddSkill} 
              sx={{ borderColor: TEAL, color: TEAL, borderRadius: '10px', '&:hover': { borderColor: TEAL_LIGHT, bgcolor: alpha(TEAL, 0.05) } }}
            >
              <Add />
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(profile.skills || []).map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => handleRemoveSkill(skill)}
                sx={{ 
                  bgcolor: alpha(TEAL, 0.1), 
                  color: TEAL,
                  '& .MuiChip-deleteIcon': { color: TEAL, '&:hover': { color: TEAL_LIGHT } }
                }}
              />
            ))}
            {(profile.skills || []).length === 0 && (
              <Typography variant="body2" sx={{ color: SLATE_400, fontStyle: 'italic' }}>
                No skills added yet
              </Typography>
            )}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: SLATE_900 }}>Industries You're Interested In</Typography>
          <Autocomplete
            multiple
            options={options.interests || []}
            value={profile.interests || []}
            onChange={(_, newValue) => updateField('interests', newValue)}
            freeSolo
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  label={option} 
                  {...getTagProps({ index })} 
                  sx={{ bgcolor: alpha(NAVY, 0.1), color: NAVY }} 
                />
              ))
            }
            renderInput={(params) => (
              <TextField 
                {...params} 
                placeholder="Select or type industries..." 
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderExperience = () => (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Years of Experience</InputLabel>
            <Select
              value={profile.expertise_details?.years_experience || ''}
              onChange={(e) => updateNestedField('expertise_details', 'years_experience', e.target.value)}
              label="Years of Experience"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="0-2">0-2 years</MenuItem>
              <MenuItem value="3-5">3-5 years</MenuItem>
              <MenuItem value="6-10">6-10 years</MenuItem>
              <MenuItem value="10+">10+ years</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Key Achievements"
            fullWidth
            multiline
            rows={4}
            value={profile.expertise_details?.key_achievements || ''}
            onChange={(e) => updateNestedField('expertise_details', 'key_achievements', e.target.value)}
            placeholder="e.g., Led product team at Google, raised $5M seed round, scaled startup to 100K users..."
            helperText="Highlight your most impressive accomplishments"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: SLATE_900 }}>
            What You're Looking For in a Co-founder
          </Typography>
          <TextField
            label="Ideal Co-founder"
            fullWidth
            multiline
            rows={3}
            value={profile.looking_for_description || ''}
            onChange={(e) => updateField('looking_for_description', e.target.value)}
            placeholder="Describe your ideal co-founder - their skills, experience, values, and what you'd want them to bring to a partnership..."
            helperText={`${(profile.looking_for_description || '').length}/1000 characters`}
            inputProps={{ maxLength: 1000 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderPastProjects = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
          Your Previous Projects & Startups
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={handleAddPastProject}
          sx={{ 
            borderColor: TEAL, 
            color: TEAL, 
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { borderColor: TEAL_LIGHT, bgcolor: alpha(TEAL, 0.05) }
          }}
        >
          Add Project
        </Button>
      </Box>

      {(profile.past_projects || []).length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6, 
          px: 3,
          bgcolor: alpha(SLATE_400, 0.05),
          borderRadius: 2,
          border: `1px dashed ${SLATE_200}`,
        }}>
          <Work sx={{ fontSize: 48, color: SLATE_400, mb: 2 }} />
          <Typography variant="body1" sx={{ color: SLATE_500, mb: 1 }}>
            No past projects added yet
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400 }}>
            Add your previous startup experience or notable projects to showcase your track record
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {(profile.past_projects || []).map((project, index) => (
            <Box 
              key={index} 
              sx={{ 
                p: 2.5, 
                bgcolor: BG, 
                borderRadius: 2,
                border: `1px solid ${SLATE_200}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  Project {index + 1}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleRemovePastProject(index)} 
                  sx={{ color: '#ef4444', '&:hover': { bgcolor: alpha('#ef4444', 0.1) } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Project/Company Name"
                    fullWidth
                    size="small"
                    value={project.title || ''}
                    onChange={(e) => handleUpdatePastProject(index, 'title', e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Your Role"
                    fullWidth
                    size="small"
                    value={project.role || ''}
                    onChange={(e) => handleUpdatePastProject(index, 'role', e.target.value)}
                    placeholder="e.g., Co-founder, CTO"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Years"
                    fullWidth
                    size="small"
                    value={project.years || ''}
                    onChange={(e) => handleUpdatePastProject(index, 'years', e.target.value)}
                    placeholder="e.g., 2019-2022"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Outcome</InputLabel>
                    <Select
                      value={project.outcome || ''}
                      onChange={(e) => handleUpdatePastProject(index, 'outcome', e.target.value)}
                      label="Outcome"
                      sx={{ borderRadius: '8px' }}
                    >
                      <MenuItem value="">Select...</MenuItem>
                      <MenuItem value="acquired">Acquired</MenuItem>
                      <MenuItem value="still_running">Still Running</MenuItem>
                      <MenuItem value="shut_down">Shut Down</MenuItem>
                      <MenuItem value="pivoted">Pivoted</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Brief Description"
                    fullWidth
                    size="small"
                    multiline
                    rows={2}
                    value={project.description || ''}
                    onChange={(e) => handleUpdatePastProject(index, 'description', e.target.value)}
                    placeholder="What did the company do? What was your impact?"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );

  const renderPreferences = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: SLATE_900 }}>
        Work Style Preferences
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Commitment Level</InputLabel>
            <Select
              value={profile.work_preferences?.commitment || ''}
              onChange={(e) => updateNestedField('work_preferences', 'commitment', e.target.value)}
              label="Commitment Level"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="full_time">Full-time</MenuItem>
              <MenuItem value="part_time">Part-time</MenuItem>
              <MenuItem value="flexible">Flexible</MenuItem>
              <MenuItem value="advisory">Advisory only</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Location Preference</InputLabel>
            <Select
              value={profile.work_preferences?.location_preference || ''}
              onChange={(e) => updateNestedField('work_preferences', 'location_preference', e.target.value)}
              label="Location Preference"
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">Select...</MenuItem>
              <MenuItem value="remote">Remote</MenuItem>
              <MenuItem value="hybrid">Hybrid</MenuItem>
              <MenuItem value="in_person">In-person</MenuItem>
              <MenuItem value="flexible">Flexible</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Timezone"
            fullWidth
            value={profile.work_preferences?.timezone || ''}
            onChange={(e) => updateNestedField('work_preferences', 'timezone', e.target.value)}
            placeholder="e.g., PST (UTC-8)"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const handleLinkedInConnect = async () => {
    if (!user?.id) return;
    setVerificationLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founders/linkedin/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.auth_url;
      } else {
        const err = await res.json();
        setSnackbar({ open: true, message: err.error || 'Failed to connect LinkedIn', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to connect LinkedIn', severity: 'error' });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleLinkedInDisconnect = async () => {
    if (!user?.id) return;
    setVerificationLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founders/linkedin/revoke`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'LinkedIn disconnected', severity: 'success' });
        await fetchVerification();
      } else {
        const err = await res.json();
        setSnackbar({ open: true, message: err.error || 'Failed to disconnect LinkedIn', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to disconnect LinkedIn', severity: 'error' });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGitHubConnect = async () => {
    if (!user?.id) return;
    setVerificationLoading(true);
    try {
      const res = await fetch(`${API_BASE}/integrations/github/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.auth_url;
      } else {
        const err = await res.json();
        setSnackbar({ open: true, message: err.error || 'Failed to connect GitHub', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to connect GitHub', severity: 'error' });
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleGitHubDisconnect = async () => {
    if (!user?.id) return;
    setVerificationLoading(true);
    try {
      const res = await fetch(`${API_BASE}/integrations/github/revoke`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) {
        setSnackbar({ open: true, message: 'GitHub disconnected', severity: 'success' });
        await fetchVerification();
      } else {
        const err = await res.json();
        setSnackbar({ open: true, message: err.error || 'Failed to disconnect GitHub', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to disconnect GitHub', severity: 'error' });
    } finally {
      setVerificationLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'HIGHLY_VERIFIED': return '#16a34a';
      case 'PRO_VERIFIED': return '#2563eb';
      case 'VERIFIED': return '#0d9488';
      default: return SLATE_400;
    }
  };

  const getTierLabel = (tier) => {
    switch (tier) {
      case 'HIGHLY_VERIFIED': return 'Highly Verified';
      case 'PRO_VERIFIED': return 'Pro Verified';
      case 'VERIFIED': return 'Verified';
      default: return 'Unverified';
    }
  };

  const renderVerification = () => (
    <Box sx={{ p: 3 }}>
      {/* Current Verification Status */}
      <Box sx={{ 
        mb: 4, 
        p: 3, 
        borderRadius: 2, 
        bgcolor: verification?.tier !== 'UNVERIFIED' ? alpha(getTierColor(verification?.tier), 0.08) : alpha(SLATE_400, 0.08),
        border: '1px solid',
        borderColor: verification?.tier !== 'UNVERIFIED' ? alpha(getTierColor(verification?.tier), 0.2) : SLATE_200,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CheckCircle sx={{ 
            fontSize: 40, 
            color: getTierColor(verification?.tier) 
          }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900 }}>
              {getTierLabel(verification?.tier)}
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              {verification?.tier === 'UNVERIFIED' 
                ? 'Connect your accounts to get a verification badge'
                : 'Your profile has a verification badge visible to others'
              }
            </Typography>
          </Box>
        </Box>
        {verification?.next_tier?.message && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${SLATE_200}` }}>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              <strong>Next level:</strong> {verification.next_tier.message}
            </Typography>
          </Box>
        )}
      </Box>

      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: SLATE_900 }}>
        Connect Your Accounts
      </Typography>

      <Grid container spacing={3}>
        {/* LinkedIn */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: '1px solid',
            borderColor: verification?.linkedin?.verified ? '#0077b5' : SLATE_200,
            bgcolor: verification?.linkedin?.verified ? alpha('#0077b5', 0.05) : '#fff',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinkedIn sx={{ fontSize: 32, color: '#0077b5' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  LinkedIn
                </Typography>
                {verification?.linkedin?.verified ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 16, color: '#16a34a' }} />
                    <Typography variant="body2" sx={{ color: '#16a34a' }}>
                      Connected
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: SLATE_500 }}>
                    Not connected
                  </Typography>
                )}
              </Box>
            </Box>

            {verification?.linkedin?.verified ? (
              <>
                <Box sx={{ mb: 2, p: 2, bgcolor: alpha(SLATE_400, 0.05), borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                    {verification.linkedin.name}
                  </Typography>
                  {verification.linkedin.email && (
                    <Typography variant="caption" sx={{ color: SLATE_500 }}>
                      {verification.linkedin.email}
                    </Typography>
                  )}
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleLinkedInDisconnect}
                  disabled={verificationLoading}
                  sx={{ 
                    borderColor: '#ef4444', 
                    color: '#ef4444', 
                    borderRadius: '10px',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#ef4444', 0.05) }
                  }}
                >
                  {verificationLoading ? <CircularProgress size={20} /> : 'Disconnect'}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Verify your professional identity by connecting your LinkedIn account.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<LinkedIn />}
                  onClick={handleLinkedInConnect}
                  disabled={verificationLoading}
                  sx={{
                    bgcolor: '#0077b5',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#005885' }
                  }}
                >
                  {verificationLoading ? <CircularProgress size={20} color="inherit" /> : 'Connect LinkedIn'}
                </Button>
              </>
            )}
          </Box>
        </Grid>

        {/* GitHub */}
        <Grid item xs={12} md={6}>
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: '1px solid',
            borderColor: verification?.github?.verified ? '#333' : SLATE_200,
            bgcolor: verification?.github?.verified ? alpha('#333', 0.03) : '#fff',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GitHub sx={{ fontSize: 32, color: '#333' }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  GitHub
                </Typography>
                {verification?.github?.verified ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 16, color: '#16a34a' }} />
                    <Typography variant="body2" sx={{ color: '#16a34a' }}>
                      Connected
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: SLATE_500 }}>
                    Not connected
                  </Typography>
                )}
              </Box>
            </Box>

            {verification?.github?.verified ? (
              <>
                <Box sx={{ mb: 2, p: 2, bgcolor: alpha(SLATE_400, 0.05), borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                    @{verification.github.login}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    {verification.github.public_repos !== undefined && (
                      <Typography variant="caption" sx={{ color: SLATE_500 }}>
                        {verification.github.public_repos} repos
                      </Typography>
                    )}
                    {verification.github.followers !== undefined && (
                      <Typography variant="caption" sx={{ color: SLATE_500 }}>
                        {verification.github.followers} followers
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleGitHubDisconnect}
                  disabled={verificationLoading}
                  sx={{ 
                    borderColor: '#ef4444', 
                    color: '#ef4444', 
                    borderRadius: '10px',
                    textTransform: 'none',
                    '&:hover': { borderColor: '#dc2626', bgcolor: alpha('#ef4444', 0.05) }
                  }}
                >
                  {verificationLoading ? <CircularProgress size={20} /> : 'Disconnect'}
                </Button>
              </>
            ) : (
              <>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Show your technical credibility by connecting your GitHub profile.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<GitHub />}
                  onClick={handleGitHubConnect}
                  disabled={verificationLoading}
                  sx={{
                    bgcolor: '#333',
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1a1a1a' }
                  }}
                >
                  {verificationLoading ? <CircularProgress size={20} color="inherit" /> : 'Connect GitHub'}
                </Button>
              </>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Benefits */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: SLATE_900 }}>
          Why Verify?
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: alpha(TEAL, 0.05), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: TEAL, mb: 0.5 }}>
                Build Trust
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Verified profiles are trusted 3x more by potential co-founders
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: alpha(NAVY, 0.05), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: NAVY, mb: 0.5 }}>
                Stand Out
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Get a verification badge visible on your profile
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ p: 2, bgcolor: alpha('#16a34a', 0.05), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a', mb: 0.5 }}>
                Better Matches
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Project owners prefer verified founders
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderLinks = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: SLATE_900 }}>
        Social Profiles & Links
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="LinkedIn URL"
            fullWidth
            value={profile.linkedin_url || ''}
            onChange={(e) => updateField('linkedin_url', e.target.value)}
            InputProps={{
              startAdornment: <LinkedIn sx={{ color: '#0077b5', mr: 1 }} />,
            }}
            placeholder="https://linkedin.com/in/..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Twitter URL"
            fullWidth
            value={profile.twitter_url || ''}
            onChange={(e) => updateField('twitter_url', e.target.value)}
            InputProps={{
              startAdornment: <Twitter sx={{ color: '#1da1f2', mr: 1 }} />,
            }}
            placeholder="https://twitter.com/..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Portfolio / Website"
            fullWidth
            value={profile.portfolio_url || ''}
            onChange={(e) => updateField('portfolio_url', e.target.value)}
            InputProps={{
              startAdornment: <Language sx={{ color: TEAL, mr: 1 }} />,
            }}
            placeholder="https://..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="GitHub URL"
            fullWidth
            value={profile.github_url || ''}
            onChange={(e) => updateField('github_url', e.target.value)}
            InputProps={{
              startAdornment: <GitHub sx={{ color: '#333', mr: 1 }} />,
            }}
            placeholder="https://github.com/..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: return renderBasicInfo();
      case 1: return renderSkillsInterests();
      case 2: return renderExperience();
      case 3: return renderPastProjects();
      case 4: return renderPreferences();
      case 5: return renderLinks();
      case 6: return renderVerification();
      default: return renderBasicInfo();
    }
  };

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5 }}>
            Your Profile
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
            This information will be visible to project owners when you apply to connect
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: TEAL,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: '10px',
            '&:hover': { bgcolor: TEAL_LIGHT },
          }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </Box>

      {/* Completeness Bar */}
      <Box sx={{ 
        mb: 3, 
        p: 2,
        borderRadius: 2,
        bgcolor: completeness.complete ? alpha('#16a34a', 0.08) : alpha('#d97706', 0.08),
        border: '1px solid',
        borderColor: completeness.complete ? alpha('#16a34a', 0.2) : alpha('#d97706', 0.2),
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {completeness.complete ? (
            <CheckCircle sx={{ color: '#16a34a', fontSize: 28 }} />
          ) : (
            <Warning sx={{ color: '#d97706', fontSize: 28 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Profile Completeness
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: completeness.complete ? '#16a34a' : '#d97706' }}>
                {completeness.score}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completeness.score}
              sx={{
                height: 6,
                borderRadius: 3,
                bgcolor: alpha(completeness.complete ? '#16a34a' : '#d97706', 0.15),
                '& .MuiLinearProgress-bar': {
                  bgcolor: completeness.complete ? '#16a34a' : '#d97706',
                  borderRadius: 3,
                },
              }}
            />
            {completeness.missing?.length > 0 && (
              <Typography variant="caption" sx={{ color: SLATE_500, mt: 1, display: 'block' }}>
                Missing: {completeness.missing.map(f => f.replace(/_/g, ' ')).join(', ')}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Activation Panel - Next Steps */}
      <ActivationPanel variant="full" />

      {/* Tabbed Content Box */}
      <Box sx={{ 
        flex: 1,
        bgcolor: '#fff',
        borderRadius: 2,
        border: '1px solid',
        borderColor: SLATE_200,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: '1px solid',
            borderColor: SLATE_200,
            bgcolor: BG,
            flexShrink: 0,
            '& .MuiTab-root': {
              textTransform: 'none',
              minHeight: 56,
              fontSize: '0.875rem',
              fontWeight: 600,
              color: SLATE_500,
              display: 'flex',
              flexDirection: 'row',
              gap: 1,
              '&.Mui-selected': {
                color: TEAL,
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: TEAL,
              height: 3,
            },
          }}
        >
          {tabs.map((tab, index) => (
            <Tab 
              key={index} 
              icon={tab.icon} 
              iconPosition="start"
              label={tab.label}
            />
          ))}
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: SLATE_200,
            borderRadius: '3px',
            '&:hover': {
              background: SLATE_400,
            },
          },
        }}>
          {renderTabContent()}
        </Box>
      </Box>

      {/* Bio Template Preview Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3, 
            bgcolor: '#fff',
            border: '1px solid',
            borderColor: SLATE_200,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: alpha('#fbbf24', 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <LightbulbOutlined sx={{ color: '#f59e0b', fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
              {selectedTemplate?.archetype}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: SLATE_500, fontWeight: 600, mb: 1 }}>
              Template (fill in the brackets):
            </Typography>
            <Box sx={{ 
              p: 2.5, 
              bgcolor: alpha(TEAL, 0.05), 
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(TEAL, 0.2),
            }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: SLATE_900, lineHeight: 1.7 }}>
                {selectedTemplate?.template}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ color: SLATE_500, fontWeight: 600, mb: 1 }}>
              Example:
            </Typography>
            <Box sx={{ 
              p: 2.5, 
              bgcolor: alpha('#10b981', 0.05), 
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha('#10b981', 0.2),
            }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: SLATE_900, lineHeight: 1.7 }}>
                {selectedTemplate?.example}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button 
            onClick={() => setTemplateDialogOpen(false)}
            sx={{ color: SLATE_500, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              updateField('bio', selectedTemplate?.template || '');
              setTemplateDialogOpen(false);
              setSnackbar({ open: true, message: 'Template added - fill in the brackets!', severity: 'info' });
            }}
            sx={{ 
              borderColor: TEAL, 
              color: TEAL,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { borderColor: TEAL_LIGHT, bgcolor: alpha(TEAL, 0.05) }
            }}
          >
            Use Template
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              updateField('bio', selectedTemplate?.example || '');
              setTemplateDialogOpen(false);
              setSnackbar({ open: true, message: 'Example added - customize it to fit your story!', severity: 'success' });
            }}
            sx={{ 
              bgcolor: TEAL, 
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: TEAL_LIGHT } 
            }}
          >
            Use Example
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;

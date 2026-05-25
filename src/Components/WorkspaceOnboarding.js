import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  LinearProgress,
  alpha,
  Fade,
  Grid,
} from '@mui/material';
import {
  Celebration,
  Groups,
  Schedule,
  Handshake,
  ArrowForward,
  ArrowBack,
  CheckCircle,
  AccessTime,
  Language,
  Chat,
  AccountBalance,
  Link as LinkIcon,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const COMMUNICATION_PREFERENCES = [
  { value: 'async', label: 'Async-first', description: 'Prefer messages, docs, and async updates' },
  { value: 'sync', label: 'Sync-first', description: 'Prefer live calls and real-time collaboration' },
  { value: 'mixed', label: 'Flexible', description: 'Comfortable with both async and sync' },
];

const WorkspaceOnboarding = ({ 
  workspaceId, 
  workspace, 
  participants, 
  onComplete,
  onSkip,
}) => {
  const { user } = useUser();
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    commitment_hours: 20,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
    communication_preference: 'mixed',
  });

  const currentUser = participants?.find(p => p.user?.clerk_user_id === user?.id);
  const partner = participants?.find(p => p.user?.clerk_user_id !== user?.id && p.role !== 'ADVISOR');

  const steps = [
    { label: 'Welcome', icon: <Celebration /> },
    { label: 'Your Commitment', icon: <Schedule /> },
    { label: 'Meet Your Partner', icon: <Groups /> },
    { label: 'Get Started', icon: <Handshake /> },
  ];

  const handleNext = async () => {
    if (activeStep < steps.length - 1) {
      // Save progress
      try {
        setSaving(true);
        await fetch(`${API_BASE}/workspaces/${workspaceId}/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({
            step: activeStep + 1,
            ...formData,
          }),
        });
      } catch (err) {
        console.error('Error saving progress:', err);
      } finally {
        setSaving(false);
      }
      setActiveStep(prev => prev + 1);
    } else {
      // Complete onboarding
      try {
        setSaving(true);
        await fetch(`${API_BASE}/workspaces/${workspaceId}/onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({
            ...formData,
            complete: true,
          }),
        });
        onComplete?.();
      } catch (err) {
        console.error('Error completing onboarding:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const renderWelcomeStep = () => (
    <Fade in timeout={400}>
      <Box sx={{ textAlign: 'center', py: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: alpha(TEAL, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <Celebration sx={{ fontSize: 32, color: TEAL }} />
        </Box>
        
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Welcome to Your Workspace!
        </Typography>
        
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, maxWidth: { xs: '100%', sm: 450 }, mx: 'auto', px: { xs: 1, sm: 0 } }}>
          This is your shared space with {partner?.user?.name || 'your co-founder'}. 
          Let's set things up so you can collaborate effectively.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          {participants?.filter(p => p.role !== 'ADVISOR').map((p, i) => (
            <Box key={p.id} sx={{ textAlign: 'center' }}>
              <Avatar
                src={p.user?.profile_photo_url}
                sx={{ width: 56, height: 56, mx: 'auto', mb: 0.5, border: `2px solid ${TEAL}` }}
              >
                {p.user?.name?.[0]}
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 600, color: NAVY }}>
                {p.user?.name}
              </Typography>
            </Box>
          ))}
        </Box>

        <Card sx={{ bgcolor: SLATE_100, border: 'none', maxWidth: 360, mx: 'auto' }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: NAVY, mb: 0.5, fontSize: '0.8rem' }}>
              What you'll do:
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
              {['Set your weekly commitment', 'Review compatibility', 'Plan your first steps'].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                  <CheckCircle sx={{ fontSize: 14, color: TEAL }} />
                  <Typography variant="caption" sx={{ color: SLATE_500 }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );

  const renderCommitmentStep = () => (
    <Fade in timeout={400}>
      <Box sx={{ py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: NAVY, mb: 0.5, textAlign: 'center' }}>
          Your Commitment
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 2, textAlign: 'center' }}>
          Help your partner know what to expect from you
        </Typography>

        <Grid container spacing={2} sx={{ maxWidth: 500, mx: 'auto' }}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ border: `1px solid ${SLATE_200}`, height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTime sx={{ color: TEAL, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Weekly Hours
                  </Typography>
                </Box>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={formData.commitment_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, commitment_hours: parseInt(e.target.value) || 0 }))}
                  InputProps={{
                    endAdornment: <Typography variant="caption" sx={{ color: SLATE_500 }}>hrs/week</Typography>,
                  }}
                  inputProps={{ min: 1, max: 80 }}
                />
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                  {[10, 20, 40].map(hrs => (
                    <Chip
                      key={hrs}
                      label={`${hrs}h`}
                      size="small"
                      onClick={() => setFormData(prev => ({ ...prev, commitment_hours: hrs }))}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: formData.commitment_hours === hrs ? alpha(TEAL, 0.1) : 'transparent',
                        borderColor: formData.commitment_hours === hrs ? TEAL : SLATE_200,
                        color: formData.commitment_hours === hrs ? TEAL : SLATE_500,
                        border: '1px solid',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ border: `1px solid ${SLATE_200}`, height: '100%' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Language sx={{ color: TEAL, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Timezone
                  </Typography>
                </Box>
                <FormControl fullWidth size="small">
                  <Select
                    value={formData.timezone}
                    onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    {TIMEZONES.map(tz => (
                      <MenuItem key={tz.value} value={tz.value}>{tz.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card sx={{ border: `1px solid ${SLATE_200}` }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chat sx={{ color: TEAL, fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Communication Style
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                  {COMMUNICATION_PREFERENCES.map(pref => (
                    <Box
                      key={pref.value}
                      onClick={() => setFormData(prev => ({ ...prev, communication_preference: pref.value }))}
                      sx={{
                        flex: 1,
                        p: { xs: 1, sm: 1.5 },
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: formData.communication_preference === pref.value ? TEAL : SLATE_200,
                        bgcolor: formData.communication_preference === pref.value ? alpha(TEAL, 0.05) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'center',
                        '&:hover': { borderColor: TEAL },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: NAVY, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        {pref.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: SLATE_500, fontSize: { xs: '0.6rem', sm: '0.65rem' }, display: 'block' }}>
                        {pref.description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Fade>
  );

  const renderPartnerStep = () => (
    <Fade in timeout={400}>
      <Box sx={{ py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: NAVY, mb: 0.5, textAlign: 'center' }}>
          Meet {partner?.user?.name || 'Your Partner'}
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 2, textAlign: 'center' }}>
          Here's why you were matched
        </Typography>

        <Card sx={{ maxWidth: 450, mx: 'auto', border: `1px solid ${SLATE_200}` }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                src={partner?.user?.profile_photo_url}
                sx={{ width: 52, height: 52, border: `2px solid ${TEAL}` }}
              >
                {partner?.user?.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: NAVY }}>
                  {partner?.user?.name || 'Your Partner'}
                </Typography>
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  {partner?.user?.email}
                </Typography>
              </Box>
            </Box>

            {partner?.weekly_commitment_hours && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: SLATE_100, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: NAVY, mb: 0.5, display: 'block' }}>
                  Their Commitment
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: SLATE_500 }}>Hours/week</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{partner.weekly_commitment_hours}h</Typography>
                  </Box>
                  {partner.timezone && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_500 }}>Timezone</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {TIMEZONES.find(t => t.value === partner.timezone)?.label || partner.timezone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            <Typography variant="caption" sx={{ fontWeight: 600, color: NAVY, mb: 1, display: 'block' }}>
              Compatibility Highlights
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {['Similar vision', 'Complementary skills', 'Aligned work style'].map((item, i) => (
                <Chip
                  key={i}
                  label={item}
                  size="small"
                  icon={<CheckCircle sx={{ fontSize: 14 }} />}
                  sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, height: 24, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );

  const renderGetStartedStep = () => (
    <Fade in timeout={400}>
      <Box sx={{ py: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: NAVY, mb: 0.5, textAlign: 'center' }}>
          You're All Set!
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 2, textAlign: 'center' }}>
          Here's what you can do next
        </Typography>

        <Grid container spacing={1.5} sx={{ maxWidth: 500, mx: 'auto' }}>
          {[
            {
              icon: <Chat sx={{ fontSize: 20 }} />,
              title: 'Start a Conversation',
              description: 'Say hi in the chat',
              color: TEAL,
            },
            {
              icon: <AccountBalance sx={{ fontSize: 20 }} />,
              title: 'Set Up Equity',
              description: 'Discuss equity splits',
              color: '#8b5cf6',
            },
            {
              icon: <LinkIcon sx={{ fontSize: 20 }} />,
              title: 'Connect Tools',
              description: 'Link Slack or Notion',
              color: '#f59e0b',
            },
            {
              icon: <Schedule sx={{ fontSize: 20 }} />,
              title: 'Weekly Check-ins',
              description: 'Stay aligned',
              color: '#3b82f6',
            },
          ].map((item, i) => (
            <Grid item xs={6} key={i}>
              <Card sx={{ height: '100%', border: `1px solid ${SLATE_200}`, '&:hover': { borderColor: item.color } }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.5,
                      bgcolor: alpha(item.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: NAVY, display: 'block', lineHeight: 1.3 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>
                    {item.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Fade>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: return renderWelcomeStep();
      case 1: return renderCommitmentStep();
      case 2: return renderPartnerStep();
      case 3: return renderGetStartedStep();
      default: return null;
    }
  };

  return (
    <Box sx={{ maxWidth: { xs: '100%', sm: 600, md: 700 }, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Progress */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: { xs: '0.7rem', sm: '0.875rem' } } }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    '&.Mui-active': { color: TEAL },
                    '&.Mui-completed': { color: TEAL },
                  },
                }}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        <LinearProgress
          variant="determinate"
          value={((activeStep + 1) / steps.length) * 100}
          sx={{ mt: 2, borderRadius: 1, bgcolor: SLATE_200, '& .MuiLinearProgress-bar': { bgcolor: TEAL } }}
        />
      </Box>

      {/* Content */}
      <Card sx={{ mb: { xs: 2, sm: 3 }, minHeight: { xs: 'auto', sm: 480 }, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <CardContent sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', p: { xs: 2, sm: 3 } }}>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'space-between', gap: { xs: 1.5, sm: 0 } }}>
        <Button
          onClick={activeStep === 0 ? onSkip : handleBack}
          startIcon={activeStep === 0 ? null : <ArrowBack />}
          sx={{ color: SLATE_500 }}
        >
          {activeStep === 0 ? 'Skip for now' : 'Back'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={saving}
          endIcon={activeStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
          sx={{
            bgcolor: TEAL,
            '&:hover': { bgcolor: '#0f766e' },
            px: 4,
          }}
        >
          {saving ? 'Saving...' : activeStep === steps.length - 1 ? 'Get Started' : 'Continue'}
        </Button>
      </Box>
    </Box>
  );
};

export default WorkspaceOnboarding;

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
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: alpha(TEAL, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <Celebration sx={{ fontSize: 40, color: TEAL }} />
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 700, color: NAVY, mb: 2 }}>
          Welcome to Your Workspace!
        </Typography>
        
        <Typography variant="body1" sx={{ color: SLATE_500, mb: 4, maxWidth: 500, mx: 'auto' }}>
          This is your shared space with {partner?.user?.name || 'your co-founder'}. 
          Let's set things up so you can collaborate effectively.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
          {participants?.filter(p => p.role !== 'ADVISOR').map((p, i) => (
            <Box key={p.id} sx={{ textAlign: 'center' }}>
              <Avatar
                src={p.user?.profile_photo_url}
                sx={{ width: 64, height: 64, mx: 'auto', mb: 1, border: `3px solid ${TEAL}` }}
              >
                {p.user?.name?.[0]}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 600, color: NAVY }}>
                {p.user?.name}
              </Typography>
            </Box>
          ))}
        </Box>

        <Card sx={{ bgcolor: SLATE_100, border: 'none', maxWidth: 400, mx: 'auto' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: NAVY, mb: 1 }}>
              What you'll do:
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
              {['Set your weekly commitment', 'Review compatibility', 'Plan your first steps'].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CheckCircle sx={{ fontSize: 16, color: TEAL }} />
                  <Typography variant="body2" sx={{ color: SLATE_500 }}>{item}</Typography>
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
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 1, textAlign: 'center' }}>
          Your Commitment
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 4, textAlign: 'center' }}>
          Help your partner know what to expect from you
        </Typography>

        <Grid container spacing={3} sx={{ maxWidth: 500, mx: 'auto' }}>
          <Grid item xs={12}>
            <Card sx={{ border: `1px solid ${SLATE_200}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccessTime sx={{ color: TEAL }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Weekly Hours
                  </Typography>
                </Box>
                <TextField
                  type="number"
                  fullWidth
                  value={formData.commitment_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, commitment_hours: parseInt(e.target.value) || 0 }))}
                  InputProps={{
                    endAdornment: <Typography sx={{ color: SLATE_500 }}>hrs/week</Typography>,
                  }}
                  inputProps={{ min: 1, max: 80 }}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                  {[10, 20, 40].map(hrs => (
                    <Chip
                      key={hrs}
                      label={`${hrs}h`}
                      size="small"
                      onClick={() => setFormData(prev => ({ ...prev, commitment_hours: hrs }))}
                      sx={{
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

          <Grid item xs={12}>
            <Card sx={{ border: `1px solid ${SLATE_200}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Language sx={{ color: TEAL }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Timezone
                  </Typography>
                </Box>
                <FormControl fullWidth>
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
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Chat sx={{ color: TEAL }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Communication Style
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {COMMUNICATION_PREFERENCES.map(pref => (
                    <Box
                      key={pref.value}
                      onClick={() => setFormData(prev => ({ ...prev, communication_preference: pref.value }))}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '2px solid',
                        borderColor: formData.communication_preference === pref.value ? TEAL : SLATE_200,
                        bgcolor: formData.communication_preference === pref.value ? alpha(TEAL, 0.05) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: TEAL },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 600, color: NAVY }}>
                        {pref.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: SLATE_500 }}>
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
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 1, textAlign: 'center' }}>
          Meet {partner?.user?.name || 'Your Partner'}
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 4, textAlign: 'center' }}>
          Here's why you were matched
        </Typography>

        <Card sx={{ maxWidth: 500, mx: 'auto', border: `1px solid ${SLATE_200}` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar
                src={partner?.user?.profile_photo_url}
                sx={{ width: 64, height: 64, border: `3px solid ${TEAL}` }}
              >
                {partner?.user?.name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: NAVY }}>
                  {partner?.user?.name || 'Your Partner'}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>
                  {partner?.user?.email}
                </Typography>
              </Box>
            </Box>

            {partner?.weekly_commitment_hours && (
              <Box sx={{ mb: 2, p: 2, bgcolor: SLATE_100, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: NAVY, mb: 1 }}>
                  Their Commitment
                </Typography>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" sx={{ color: SLATE_500 }}>Hours/week</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{partner.weekly_commitment_hours}h</Typography>
                  </Box>
                  {partner.timezone && (
                    <Box>
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>Timezone</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {TIMEZONES.find(t => t.value === partner.timezone)?.label || partner.timezone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: NAVY, mb: 1.5 }}>
              Compatibility Highlights
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {['Similar vision', 'Complementary skills', 'Aligned work style'].map((item, i) => (
                <Chip
                  key={i}
                  label={item}
                  size="small"
                  icon={<CheckCircle sx={{ fontSize: 16 }} />}
                  sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL }}
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
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 1, textAlign: 'center' }}>
          You're All Set!
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 4, textAlign: 'center' }}>
          Here's what you can do next
        </Typography>

        <Grid container spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
          {[
            {
              icon: <Chat />,
              title: 'Start a Conversation',
              description: 'Say hi to your co-founder in the chat',
              color: TEAL,
            },
            {
              icon: <AccountBalance />,
              title: 'Set Up Equity',
              description: 'Use our wizard to discuss equity splits',
              color: '#8b5cf6',
            },
            {
              icon: <LinkIcon />,
              title: 'Connect Tools',
              description: 'Link Slack, Notion, or Calendar',
              color: '#f59e0b',
            },
            {
              icon: <Schedule />,
              title: 'Weekly Check-ins',
              description: 'Track progress and stay aligned',
              color: '#3b82f6',
            },
          ].map((item, i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Card sx={{ height: '100%', border: `1px solid ${SLATE_200}`, '&:hover': { borderColor: item.color } }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: alpha(item.color, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1.5,
                      color: item.color,
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: NAVY }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500 }}>
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
    <Box sx={{ maxWidth: 700, mx: 'auto', p: 3 }}>
      {/* Progress */}
      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
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
      <Card sx={{ mb: 3, minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ width: '100%' }}>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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

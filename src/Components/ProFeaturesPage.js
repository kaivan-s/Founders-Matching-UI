import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
  alpha,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  Visibility,
  Speed,
  AutoAwesome,
  BarChart,
  Insights,
  People,
  Bolt,
  CheckCircle,
  Groups,
  ArrowBack,
  Lock,
  LockOpen,
  Schedule,
  Reply,
  PeopleAlt,
  CardGiftcard,
  AccessTime,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const TEAL = '#0d9488';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';

const ProFeaturesPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  // Trial states
  const [trialStatus, setTrialStatus] = useState(null);
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialReason, setTrialReason] = useState('');
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialError, setTrialError] = useState('');
  const [trialSuccess, setTrialSuccess] = useState(false);

  // Fetch trial status on mount
  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${API_BASE}/trials/status`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (response.ok) {
          const data = await response.json();
          setTrialStatus(data);
        }
      } catch (err) {
        console.error('Error fetching trial status:', err);
      }
    };
    fetchTrialStatus();
  }, [user]);

  const handleTrialRequest = async () => {
    if (!trialReason.trim() || trialReason.length < 20) {
      setTrialError('Please provide a more detailed reason (at least 20 characters)');
      return;
    }
    
    setTrialSubmitting(true);
    setTrialError('');
    
    try {
      const response = await fetch(`${API_BASE}/trials/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ reason: trialReason }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }
      
      setTrialSuccess(true);
      setTrialStatus(prev => ({ ...prev, has_pending_request: true }));
      setTimeout(() => {
        setTrialDialogOpen(false);
        setTrialReason('');
        setTrialSuccess(false);
      }, 2000);
    } catch (err) {
      setTrialError(err.message);
    } finally {
      setTrialSubmitting(false);
    }
  };

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      title: 'Deeper Match Pool',
      description: 'See 25+ curated opportunities instead of 3. More surface area means better odds.',
      stat: '25+',
      statLabel: 'daily matches',
    },
    {
      icon: <Speed sx={{ fontSize: 28 }} />,
      title: 'No Application Limits',
      description: 'When you find the right project, move fast. No waiting for tomorrow.',
      stat: '∞',
      statLabel: 'per day',
    },
    {
      icon: <Visibility sx={{ fontSize: 28 }} />,
      title: 'See Why You Matched',
      description: 'Understand the skill gaps you fill and goals you share. Context before commitment.',
      stat: 'Full',
      statLabel: 'breakdown',
    },
    {
      icon: <Insights sx={{ fontSize: 28 }} />,
      title: 'Founder Activity Signals',
      description: 'Is the founder active? How fast do they respond? How many others applied?',
      stat: 'Before',
      statLabel: 'you apply',
    },
    {
      icon: <BarChart sx={{ fontSize: 28 }} />,
      title: 'Your Skills, Ranked',
      description: 'See where your skillset sits in the market. Know your leverage before you pitch.',
      stat: 'Your',
      statLabel: 'position',
    },
    {
      icon: <People sx={{ fontSize: 28 }} />,
      title: 'Expert Access',
      description: 'Browse advisors in fundraising, legal, product, and growth. Book directly.',
      stat: '44+',
      statLabel: 'advisors',
    },
  ];

  const comparisonData = [
    { feature: 'Curated opportunities', free: '3/day', pro: '25+/day' },
    { feature: 'Swipes', free: '10/day', pro: 'No limit' },
    { feature: 'Applications', free: '1/day', pro: 'No limit' },
    { feature: 'Match reasoning', free: '—', pro: 'Skill & goal breakdown' },
    { feature: 'Founder activity & response rate', free: '—', pro: 'Visible' },
    { feature: 'Skill market position', free: 'Overview', pro: 'Full analysis' },
    { feature: 'Advisor marketplace', free: '—', pro: 'Full access' },
    { feature: 'AI project analysis', free: '—', pro: '3 credits/month' },
    { feature: 'Projects you can list', free: '1', pro: '3' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: SLATE_100 }}>
      {/* Header */}
      <Box sx={{
        bgcolor: '#fff',
        borderBottom: `1px solid ${SLATE_200}`,
        py: 1.5,
        px: { xs: 2, sm: 4 },
      }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/home')}
            sx={{
              color: SLATE_500,
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha(TEAL, 0.05), color: TEAL },
            }}
          >
            Back to Home
          </Button>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box sx={{
        bgcolor: '#fff',
        borderBottom: `1px solid ${SLATE_200}`,
        py: { xs: 5, md: 6 },
        px: { xs: 2, sm: 4 },
        textAlign: 'center',
      }}>
        <Box sx={{ maxWidth: 600, mx: 'auto' }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: alpha(TEAL, 0.1),
            color: TEAL,
            px: 2,
            py: 0.5,
            borderRadius: 2,
            mb: 2.5,
          }}>
            <AutoAwesome sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: '0.02em' }}>
              GUILD SPACE PRO
            </Typography>
          </Box>

          <Typography variant="h3" sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            color: SLATE_900,
            mb: 1.5,
            lineHeight: 1.2,
          }}>
            The information gap is real
          </Typography>

          <Typography variant="body1" sx={{
            color: SLATE_500,
            mb: 3.5,
            maxWidth: 480,
            mx: 'auto',
            lineHeight: 1.7,
          }}>
            Is the founder active? Will they respond? How many others applied? Pro answers these - plus gives you direct access to expert advisors.
          </Typography>

          {/* Quick benefits */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'nowrap', 
            justifyContent: 'center', 
            gap: { xs: 1, sm: 1.5 }, 
            mb: 3.5,
            mx: 'auto',
          }}>
            {[
              '25+ daily matches',
              'Unlimited applications',
              'Match insights',
              'Advisor access',
            ].map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: { xs: 1, sm: 1.5 },
                  py: 0.5,
                  borderRadius: 1.5,
                  bgcolor: alpha(TEAL, 0.06),
                  border: `1px solid ${alpha(TEAL, 0.12)}`,
                  whiteSpace: 'nowrap',
                }}
              >
                <CheckCircle sx={{ fontSize: { xs: 12, sm: 14 }, color: TEAL }} />
                <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 500, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Trial CTA */}
          {trialStatus?.has_active_trial ? (
            <Chip
              icon={<AccessTime />}
              label={`Trial active: ${trialStatus.trial_info?.days_remaining} days left`}
              color="success"
              sx={{ fontSize: '0.9rem', py: 2.5, px: 1 }}
            />
          ) : trialStatus?.has_pending_request ? (
            <Chip
              icon={<AccessTime />}
              label="Your trial request is under review"
              variant="outlined"
              sx={{ fontSize: '0.9rem', py: 2.5, px: 1 }}
            />
          ) : trialStatus?.has_used_trial ? (
            <Typography variant="body2" sx={{ color: SLATE_400 }}>
              You've already used your free trial
            </Typography>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => setTrialDialogOpen(true)}
              startIcon={<CardGiftcard />}
              sx={{
                bgcolor: TEAL,
                color: '#fff',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { bgcolor: alpha(TEAL, 0.9) },
              }}
            >
              Try Pro free for 7 days
            </Button>
          )}
        </Box>

        {/* Visual Mockups */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'center', 
          mt: 5,
          flexWrap: { xs: 'wrap', lg: 'nowrap' },
          maxWidth: 1200,
          mx: 'auto',
          px: 2,
        }}>
          {/* Match Insights Mockup */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: 2.5, 
            border: `1px solid ${SLATE_200}`,
            flex: '1 1 220px',
            maxWidth: { xs: 280, lg: 260 },
            minWidth: 220,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LockOpen sx={{ fontSize: 16, color: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, letterSpacing: '0.05em' }}>
                MATCH INSIGHTS
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
              Why you matched
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mb: 1.5, lineHeight: 1.4 }}>
              Understand compatibility before you commit
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { label: 'React skills fill their tech gap', pct: 95 },
                { label: 'Both targeting B2B SaaS', pct: 88 },
                { label: 'Timezone overlap: 6+ hrs', pct: 82 },
                { label: 'Complementary experience', pct: 79 },
              ].map((item, i) => (
                <Box key={i} sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.04), border: `1px solid ${alpha(TEAL, 0.08)}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: SLATE_900, fontWeight: 500, fontSize: '0.7rem' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, fontSize: '0.7rem' }}>
                      {item.pct}%
                    </Typography>
                  </Box>
                  <Box sx={{ height: 3, bgcolor: SLATE_200, borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${item.pct}%`, bgcolor: TEAL, borderRadius: 1 }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Pre-Apply Intel Mockup */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: 2.5, 
            border: `1px solid ${SLATE_200}`,
            flex: '1 1 220px',
            maxWidth: { xs: 280, lg: 260 },
            minWidth: 220,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Insights sx={{ fontSize: 16, color: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, letterSpacing: '0.05em' }}>
                PRE-APPLY INTEL
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
              Founder signals
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mb: 1.5, lineHeight: 1.4 }}>
              Know if it's worth your application
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 0.75, borderRadius: 1, bgcolor: alpha('#10b981', 0.05) }}>
                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha('#10b981', 0.15) }}>
                  <Schedule sx={{ fontSize: 14, color: '#10b981' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', fontSize: '0.65rem' }}>Last active</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#10b981' }}>2 hours ago</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 0.75, borderRadius: 1, bgcolor: alpha('#3b82f6', 0.05) }}>
                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha('#3b82f6', 0.15) }}>
                  <Reply sx={{ fontSize: 14, color: '#3b82f6' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', fontSize: '0.65rem' }}>Response rate</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#3b82f6' }}>Replies to 78% of apps</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 0.75, borderRadius: 1, bgcolor: alpha('#f59e0b', 0.05) }}>
                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: alpha('#f59e0b', 0.15) }}>
                  <PeopleAlt sx={{ fontSize: 14, color: '#f59e0b' }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', fontSize: '0.65rem' }}>Competition</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#f59e0b' }}>Low — 3 pending apps</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Skill Market Position Mockup */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: 2.5, 
            border: `1px solid ${SLATE_200}`,
            flex: '1 1 220px',
            maxWidth: { xs: 280, lg: 260 },
            minWidth: 220,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <BarChart sx={{ fontSize: 16, color: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, letterSpacing: '0.05em' }}>
                SKILL ANALYSIS
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
              Your market position
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mb: 1.5, lineHeight: 1.4 }}>
              See where you stand vs other applicants
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { skill: 'React', demand: 'High demand', pct: 8, color: '#10b981' },
                { skill: 'Node.js', demand: 'Balanced', pct: 32, color: '#3b82f6' },
                { skill: 'Product Strategy', demand: 'Critical shortage', pct: 4, color: '#ef4444' },
                { skill: 'AWS', demand: 'Growing need', pct: 15, color: '#8b5cf6' },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 0.75, borderRadius: 1, bgcolor: alpha(item.color, 0.05) }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '0.75rem' }}>
                      {item.skill}
                    </Typography>
                    <Typography variant="caption" sx={{ color: item.color, fontWeight: 500, display: 'block', fontSize: '0.65rem' }}>
                      {item.demand}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    px: 0.75, py: 0.25, borderRadius: 1, 
                    bgcolor: alpha(item.color, 0.15), 
                    color: item.color,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                  }}>
                    Top {item.pct}%
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>

          {/* Advisor Access Mockup */}
          <Paper elevation={0} sx={{ 
            p: 2, 
            borderRadius: 2.5, 
            border: `1px solid ${SLATE_200}`,
            flex: '1 1 220px',
            maxWidth: { xs: 280, lg: 260 },
            minWidth: 220,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <People sx={{ fontSize: 16, color: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, letterSpacing: '0.05em' }}>
                ADVISOR ACCESS
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
              Expert guidance
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mb: 1.5, lineHeight: 1.4 }}>
              Browse & book verified advisors directly
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {[
                { name: 'Sarah Chen', role: 'Fundraising', exp: 'Ex-a16z', rate: '$150' },
                { name: 'Mike Torres', role: 'Legal', exp: '15+ startups', rate: '$120' },
                { name: 'Priya Sharma', role: 'Product', exp: 'Ex-Stripe', rate: '$180' },
              ].map((advisor, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1.5, border: `1px solid ${SLATE_200}` }}>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    bgcolor: alpha(TEAL, 0.08 + i * 0.04),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: TEAL, fontWeight: 600, fontSize: '0.6rem',
                  }}>
                    {advisor.name.split(' ').map(n => n[0]).join('')}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '0.75rem', display: 'block' }}>
                      {advisor.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.65rem' }}>
                      {advisor.role} · {advisor.exp}
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    px: 0.5, py: 0.25, borderRadius: 0.75, 
                    bgcolor: alpha(TEAL, 0.1),
                    color: TEAL,
                    fontWeight: 600,
                    fontSize: '0.6rem',
                  }}>
                    {advisor.rate}/hr
                  </Box>
                </Box>
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 1, textAlign: 'center', fontSize: '0.65rem' }}>
              + 41 more advisors
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Features Grid */}
      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 5, md: 6 } }}>
        <Typography variant="h5" sx={{
          fontWeight: 700,
          color: SLATE_900,
          textAlign: 'center',
          mb: 1,
        }}>
          What changes with Pro
        </Typography>
        <Typography variant="body2" sx={{
          color: SLATE_500,
          textAlign: 'center',
          mb: 4,
        }}>
          The same platform, but you see more of it
        </Typography>

        <Grid container spacing={2.5}>
          {features.map((feature, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: 2.5,
                  border: `1px solid ${SLATE_200}`,
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: alpha(TEAL, 0.4),
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    bgcolor: alpha(TEAL, 0.08),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: TEAL,
                  }}>
                    {feature.icon}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: TEAL, lineHeight: 1 }}>
                      {feature.stat}
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 500 }}>
                      {feature.statLabel}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.5 }}>
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Comparison Table */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 5, md: 6 }, borderTop: `1px solid ${SLATE_200}` }}>
        <Box sx={{ maxWidth: 700, mx: 'auto', px: { xs: 2, sm: 4 } }}>
          <Typography variant="h5" sx={{
            fontWeight: 700,
            color: SLATE_900,
            textAlign: 'center',
            mb: 4,
          }}>
            The breakdown
          </Typography>

          <Paper elevation={0} sx={{ borderRadius: 2.5, overflow: 'hidden', border: `1px solid ${SLATE_200}` }}>
            {/* Header */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 100px 140px',
              bgcolor: SLATE_100,
              borderBottom: `1px solid ${SLATE_200}`,
            }}>
              <Box sx={{ p: 1.5, pl: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500, textTransform: 'uppercase' }}>
                  Feature
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_400, textTransform: 'uppercase' }}>
                  Free
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, textAlign: 'center', bgcolor: alpha(TEAL, 0.05) }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: TEAL, textTransform: 'uppercase' }}>
                  Pro
                </Typography>
              </Box>
            </Box>

            {/* Rows */}
            {comparisonData.map((row, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 140px',
                  borderBottom: idx < comparisonData.length - 1 ? `1px solid ${SLATE_200}` : 'none',
                }}
              >
                <Box sx={{ p: 1.5, pl: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ color: SLATE_900 }}>
                    {row.feature}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" sx={{ color: SLATE_400 }}>
                    {row.free}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(TEAL, 0.03) }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: TEAL }}>
                    {row.pro}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, sm: 4 }, py: { xs: 4, md: 5 } }}>
        <Grid container spacing={3}>
          {[
            { stat: '500+', label: 'Partnerships formed', icon: <Groups /> },
            { stat: '2.3x', label: 'Faster time to match', icon: <Bolt /> },
            { stat: '85%', label: 'Pro match rate', icon: <CheckCircle /> },
            { stat: '44+', label: 'Advisors on platform', icon: <People /> },
          ].map((item, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 1,
                  color: TEAL,
                }}>
                  {item.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.25 }}>
                  {item.stat}
                </Typography>
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  {item.label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Final CTA */}
      <Box sx={{
        bgcolor: '#fff',
        borderTop: `1px solid ${SLATE_200}`,
        py: { xs: 4, md: 5 },
        px: { xs: 2, sm: 4 },
        textAlign: 'center',
      }}>
        {/* Show trial badge if active */}
        {trialStatus?.has_active_trial && (
          <Chip
            icon={<AccessTime />}
            label={`Trial active: ${trialStatus.trial_info?.days_remaining} days left`}
            color="success"
            sx={{ mb: 2 }}
          />
        )}
        
        <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1 }}>
          Make your search count
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
          Less guesswork, more signal. Pro pays for itself with one right partnership.
        </Typography>

        {trialStatus?.has_active_trial ? (
          <Chip
            icon={<AccessTime />}
            label={`Trial active: ${trialStatus.trial_info?.days_remaining} days left`}
            color="success"
            sx={{ fontSize: '0.85rem', py: 2, px: 1 }}
          />
        ) : trialStatus?.has_pending_request ? (
          <Chip
            icon={<AccessTime />}
            label="Your trial request is under review"
            variant="outlined"
            sx={{ fontSize: '0.85rem', py: 2, px: 1 }}
          />
        ) : trialStatus?.has_used_trial ? (
          <Typography variant="body2" sx={{ color: SLATE_400 }}>
            You've already used your free trial
          </Typography>
        ) : (
          <Button
            variant="contained"
            size="large"
            onClick={() => setTrialDialogOpen(true)}
            startIcon={<CardGiftcard />}
            sx={{
              bgcolor: TEAL,
              color: '#fff',
              fontWeight: 600,
              px: 4,
              py: 1.25,
              borderRadius: 2,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha(TEAL, 0.9) },
            }}
          >
            Try Pro free for 7 days
          </Button>
        )}
      </Box>

      {/* Trial Request Dialog */}
      <Dialog 
        open={trialDialogOpen} 
        onClose={() => !trialSubmitting && setTrialDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          Request 7-day free trial
        </DialogTitle>
        <DialogContent>
          {trialSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Your request has been submitted! We'll review it shortly.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                Tell us how you plan to use Pro features. We review requests manually and typically respond within 24 hours.
              </Typography>
              
              {trialError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {trialError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="I'm looking for a technical co-founder for my fintech startup. I want to use Pro to see which founders are actively looking and understand why we might be a good match before applying..."
                value={trialReason}
                onChange={(e) => setTrialReason(e.target.value)}
                disabled={trialSubmitting}
                helperText={`${trialReason.length}/1000 characters (minimum 20)`}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:focus-within fieldset': { borderColor: TEAL },
                  },
                }}
              />
            </>
          )}
        </DialogContent>
        {!trialSuccess && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button 
              onClick={() => setTrialDialogOpen(false)}
              disabled={trialSubmitting}
              sx={{ color: SLATE_500 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleTrialRequest}
              disabled={trialSubmitting || trialReason.length < 20}
              sx={{
                bgcolor: TEAL,
                '&:hover': { bgcolor: alpha(TEAL, 0.9) },
              }}
            >
              {trialSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Request'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default ProFeaturesPage;

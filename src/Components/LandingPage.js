import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Grid,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import { 
  ArrowForward,
  CheckCircle,
  TrendingUp,
  People,
  Handshake,
  Bolt,
  Shield,
  BarChart,
  Groups,
  AutoAwesome,
} from '@mui/icons-material';
import { SignInButton, useUser } from '@clerk/clerk-react';
import FeedbackDialog from './FeedbackDialog';

// Theme constants
const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const NetworkBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const config = {
      particleColor: 'rgba(30, 58, 138, 0.08)',
      lineColor: 'rgba(13, 148, 136, 0.12)',
      particleAmount: 60,
      defaultSpeed: 0.15,
      variantSpeed: 0.3,
      linkRadius: 160,
    };

    let w, h, particles = [];

    const resizeReset = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        w = rect.width;
        h = rect.height;
      }
    };

    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = config.defaultSpeed + Math.random() * config.variantSpeed * (Math.random() < 0.5 ? -1 : 1);
        this.vy = config.defaultSpeed + Math.random() * config.variantSpeed * (Math.random() < 0.5 ? -1 : 1);
        this.radius = 1.5 + Math.random() * 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = config.particleColor;
        ctx.fill();
      }
    }

    const init = () => {
      resizeReset();
      particles = [];
      for (let i = 0; i < config.particleAmount; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < config.linkRadius) {
            const opacity = (1 - distance / config.linkRadius) * 0.4;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(14, 165, 233, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    requestAnimationFrame(() => { init(); animate(); });

    const handleResize = () => { resizeReset(); particles = []; for (let i = 0; i < config.particleAmount; i++) particles.push(new Particle()); };
    window.addEventListener('resize', handleResize);
    let resizeObserver;
    if (canvas.parentElement) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1,
    }} />
  );
};

const LandingPage = () => {
  const { isSignedIn } = useUser();
  const navigate = useNavigate();
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  const problems = [
    { num: '01', title: 'Ghosting & Flakiness', desc: 'Founders match, exchange a few messages, then vanish.' },
    { num: '02', title: 'Equity Confusion', desc: 'No clear splits or vesting. Months later, you\'re arguing over ownership.' },
    { num: '03', title: 'Misaligned Expectations', desc: 'Work styles, commitment levels, and goals don\'t align until it\'s too late.' },
    { num: '04', title: 'Zero Structure', desc: 'Scattered across Zoom, WhatsApp, and Docs. No decisions logged. No accountability.' },
  ];

  const features = [
    { icon: <Bolt />, title: 'Smart Discovery', desc: 'Swipe through project-based profiles. Match on skills, stage, and preferences.' },
    { icon: <Handshake />, title: 'Equity & Agreements', desc: 'Guided equity questionnaire, scenario builder, and auto-generated co-founder agreements.' },
    { icon: <BarChart />, title: 'KPIs & Accountability', desc: 'Joint KPI dashboard, weekly check-ins, and commitment tracking.' },
    { icon: <Groups />, title: 'Workspace OS', desc: 'Dedicated workspace per partnership with chat, tasks, decisions, and documents.' },
    { icon: <Shield />, title: 'Compatibility Insights', desc: 'Preference-based matching and partnership health monitoring.' },
    { icon: <AutoAwesome />, title: 'Advisor Marketplace', desc: 'Connect with vetted advisors who earn equity in the projects they guide.' },
  ];

  const plans = [
    {
      name: 'Free', price: '$0', period: 'forever', popular: false,
      features: ['1 lite workspace', '10 swipes / month', 'Basic KPIs & decisions', 'Weekly check-ins', 'Preference matching'],
    },
    {
      name: 'Pro', price: '$29', period: '/month', popular: true,
      features: ['Up to 2 full workspaces', 'Unlimited discovery', 'Equity tools & agreements', 'Full task board', 'Compatibility insights', 'Advisor marketplace'],
    },
    {
      name: 'Pro+', price: '$79', period: '/month', popular: false,
      features: ['Up to 5 workspaces', 'Everything in Pro', 'Enhanced analytics', 'Priority advisor access', 'Investor-facing features'],
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: BG, position: 'relative', width: '100%' }}>
      {/* ─── Hero ─── */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pb: { xs: 12, md: 18 } }}>
        {/* Header - part of hero */}
        <Box sx={{
          position: 'relative', zIndex: 10,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: { xs: 3, md: 6 }, py: 3,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, letterSpacing: '-0.03em' }}>
            Guild Space
          </Typography>
          {!isSignedIn && (
            <SignInButton mode="modal" afterSignInUrl="/home">
              <Button sx={{
                textTransform: 'none', borderRadius: 2, px: 3, py: 0.8, fontWeight: 600, fontSize: '0.875rem',
                color: NAVY, border: '1px solid', borderColor: SLATE_200, bgcolor: 'rgba(255,255,255,0.7)',
                '&:hover': { bgcolor: NAVY, color: '#fff', borderColor: NAVY },
              }}>
                Sign In
              </Button>
            </SignInButton>
          )}
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: '#f0f9ff', zIndex: 0, overflow: 'hidden' }}>
          <NetworkBackground />
          <Box sx={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(180deg, rgba(240,249,255,0.3) 0%, ${BG} 100%)`,
            zIndex: 1, pointerEvents: 'none',
          }} />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center', pt: { xs: 6, md: 10 } }}>
          <Chip
            label="For Founders Who Ship"
            size="small"
            sx={{
              mb: 3, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.05em',
              bgcolor: alpha(TEAL, 0.08), color: TEAL, border: '1px solid', borderColor: alpha(TEAL, 0.2),
            }}
          />

          <Typography variant="h1" sx={{
            fontWeight: 800, mb: 3,
            fontSize: { xs: '2.75rem', sm: '3.75rem', md: '4.5rem' },
            lineHeight: 1.08, color: SLATE_900, letterSpacing: '-0.04em',
          }}>
            Match. Build. Scale.
            <br />
            <Box component="span" sx={{ color: TEAL }}>
              All in one workspace.
            </Box>
          </Typography>

          <Typography variant="h6" sx={{
            color: SLATE_500, fontWeight: 400, maxWidth: 560, mx: 'auto', mb: 5,
            fontSize: { xs: '1.05rem', md: '1.2rem' }, lineHeight: 1.65,
          }}>
            Discover committed co-founders, agree on equity, and run your early-stage partnership from one workspace.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {isSignedIn ? (
              <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/home')} sx={{
                px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
                bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
              }}>
                Go to Dashboard
              </Button>
            ) : (
              <SignInButton mode="modal" afterSignInUrl="/home">
                <Button variant="contained" endIcon={<ArrowForward />} sx={{
                  px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
                  bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
                }}>
                  Get Started Free
                </Button>
              </SignInButton>
            )}
          </Box>

          {/* Trust line */}
          <Typography variant="caption" sx={{ display: 'block', mt: 3, color: SLATE_400, fontSize: '0.8rem' }}>
            No credit card required &middot; Free tier available
          </Typography>
        </Container>
      </Box>

      {/* ─── Problems ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
            The Problem
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 700, mt: 1.5, color: SLATE_900,
            fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
          }}>
            Co-founder matching is broken
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {problems.map((p) => (
            <Grid item xs={12} sm={6} lg={3} key={p.num}>
              <Box sx={{
                p: 3.5, borderRadius: 3, border: '1px solid', borderColor: SLATE_200, bgcolor: '#fff',
                height: '100%', transition: 'all 0.25s ease',
                '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 8px 24px ${alpha(TEAL, 0.08)}` },
              }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: alpha(SLATE_200, 1), fontSize: '2.5rem', lineHeight: 1, mb: 2 }}>
                  {p.num}
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 1, fontSize: '1.05rem' }}>
                  {p.title}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.7 }}>
                  {p.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* ─── Features ─── */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid', borderBottom: '1px solid', borderColor: SLATE_200 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
              The Solution
            </Typography>
            <Typography variant="h3" sx={{
              fontWeight: 700, mt: 1.5, color: SLATE_900,
              fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
            }}>
              Everything you need to build together
            </Typography>
            <Typography variant="body1" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 520, mx: 'auto' }}>
              From first swipe to signed agreement, Guild Space keeps your partnership on track.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {features.map((f) => (
              <Grid item xs={12} sm={6} lg={4} key={f.title}>
                <Box sx={{
                  p: 3.5, borderRadius: 3, border: '1px solid', borderColor: SLATE_200,
                  height: '100%', transition: 'all 0.25s ease',
                  '&:hover': { borderColor: alpha(SKY, 0.4), boxShadow: `0 8px 24px ${alpha(SKY, 0.06)}` },
                }}>
                  <Box sx={{
                    display: 'inline-flex', p: 1.25, borderRadius: 2,
                    bgcolor: alpha(TEAL, 0.08), color: TEAL, mb: 2.5,
                  }}>
                    {React.cloneElement(f.icon, { sx: { fontSize: 24 } })}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 1, fontSize: '1.05rem' }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.75 }}>
                    {f.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ─── How It Works ─── */}
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
            How It Works
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 700, mt: 1.5, color: SLATE_900,
            fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
          }}>
            Three steps to a real partnership
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '1', title: 'Discover & Match', desc: 'Swipe through project profiles. Match based on skills, stage, location, and working style.' },
            { step: '2', title: 'Set the Foundation', desc: 'Use the equity questionnaire, scenario builder, and agreement generator to align on terms.' },
            { step: '3', title: 'Build Together', desc: 'Track KPIs, assign tasks, log decisions, and check in weekly from your shared workspace.' },
          ].map((s, idx) => (
            <Box key={s.step} sx={{ display: 'flex', gap: 3, py: 4, borderBottom: idx < 2 ? '1px solid' : 'none', borderColor: SLATE_200 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(TEAL, 0.08), color: TEAL, fontWeight: 800, fontSize: '1.1rem',
              }}>
                {s.step}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5 }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.75, maxWidth: 480 }}>
                  {s.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* ─── Pricing ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
            Pricing
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 700, mt: 1.5, color: SLATE_900,
            fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
          }}>
            Start free, scale when ready
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto', mb: 6 }}>
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Box sx={{
                p: 4, borderRadius: 3, height: '100%', position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? TEAL : SLATE_200,
                bgcolor: '#fff',
                transition: 'all 0.25s ease',
                '&:hover': {
                  boxShadow: plan.popular ? `0 12px 32px ${alpha(TEAL, 0.15)}` : `0 8px 24px ${alpha(NAVY, 0.06)}`,
                },
              }}>
                {plan.popular && (
                  <Chip label="Popular" size="small" sx={{
                    position: 'absolute', top: 16, right: 16,
                    bgcolor: TEAL, color: '#fff', fontWeight: 600, fontSize: '0.7rem', height: 24,
                  }} />
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, mb: 3 }}>
                  <Typography variant="h3" sx={{ fontWeight: 800, color: SLATE_900, letterSpacing: '-0.02em' }}>
                    {plan.price}
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_400, ml: 0.5 }}>
                    {plan.period}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {plan.features.map((f, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#10b981', flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>{f}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

      </Container>

      {/* ─── For Advisors ─── */}
      <Box sx={{ bgcolor: alpha(TEAL, 0.03), borderTop: '1px solid', borderBottom: '1px solid', borderColor: SLATE_200 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
              For Advisors
            </Typography>
            <Typography variant="h3" sx={{
              fontWeight: 700, mt: 1.5, color: SLATE_900,
              fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
            }}>
              Guide founders. Earn equity.
            </Typography>
            <Typography variant="body1" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 600, mx: 'auto' }}>
              Join our marketplace and help early-stage founders build better partnerships. Get equity in the projects you guide.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{mb:5}}>
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 3.5, borderRadius: 3, height: '100%',
                bgcolor: '#fff', border: '1px solid', borderColor: SLATE_200,
                transition: 'all 0.25s ease',
                '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 8px 24px ${alpha(TEAL, 0.08)}` },
              }}>
                <Box sx={{
                  display: 'inline-flex', p: 1.25, borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.08), color: TEAL, mb: 2.5,
                }}>
                  <People sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 1.5, fontSize: '1.05rem' }}>
                  What You Do
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    'Review project requests from founders seeking guidance',
                    'Accept projects that align with your expertise',
                    'Provide strategic advice through structured check-ins',
                    'Track partnership health and progress metrics',
                    'Earn equity in the projects you successfully guide',
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#10b981', flexShrink: 0, mt: 0.25 }} />
                      <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.7, fontSize: '0.9rem' }}>
                        {item}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 3.5, borderRadius: 3, height: '100%',
                bgcolor: '#fff', border: '2px solid', borderColor: TEAL,
                position: 'relative',
                transition: 'all 0.25s ease',
                '&:hover': { boxShadow: `0 8px 24px ${alpha(TEAL, 0.12)}` },
              }}>
                <Chip
                  label="Simple Pricing"
                  size="small"
                  sx={{
                    position: 'absolute', top: 12, right: 12,
                    bgcolor: TEAL, color: '#fff', fontWeight: 600, fontSize: '0.7rem', height: 20,
                  }}
                />
                <Box sx={{
                  display: 'inline-flex', p: 1.25, borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.08), color: TEAL, mb: 2.5,
                }}>
                  <TrendingUp sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 2.5, fontSize: '1.05rem' }}>
                  Fee Structure
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: SLATE_900 }}>
                        $69
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_400, fontSize: '0.85rem' }}>
                        one-time
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.9rem' }}>
                      Onboarding fee to join the marketplace
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 0.5 }}>
                      Get listed, receive requests, access full dashboard
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: SLATE_200 }} />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: SLATE_900 }}>
                        $39
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_400, fontSize: '0.85rem' }}>
                        /year
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.9rem' }}>
                      Annual renewal to keep your dashboard active
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 0.5 }}>
                      Maintain your profile and continue receiving requests
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{
                  mt: 2.5, p: 2, borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.05), border: '1px solid', borderColor: alpha(TEAL, 0.2),
                }}>
                  <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
                    💰 Earn Equity
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500, lineHeight: 1.6 }}>
                    Receive equity allocations in the projects you guide, typically 1-3% based on your contribution and the partnership's equity structure.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ textAlign: 'center' }}>
            {isSignedIn ? (
              <Button
                variant="contained"
                onClick={() => navigate('/advisor/onboarding')}
                sx={{
                  px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
                  bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
                }}
              >
                Join as Advisor
              </Button>
            ) : (
              <SignInButton mode="modal" afterSignInUrl="/advisor/onboarding">
                <Button
                  variant="contained"
                  sx={{
                    px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
                    bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
                  }}
                >
                  Join as Advisor
                </Button>
              </SignInButton>
            )}
          </Box>
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: SLATE_900, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '-0.02em' }}>
          Ready to find your co-founder?
        </Typography>
        <Typography variant="body1" sx={{ color: SLATE_500, mb: 4, maxWidth: 400, mx: 'auto' }}>
          Join Guild Space and start building a partnership that lasts.
        </Typography>
        {isSignedIn ? (
          <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/home')} sx={{
            px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
            bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
          }}>
            Go to Dashboard
          </Button>
        ) : (
          <SignInButton mode="modal" afterSignInUrl="/home">
            <Button variant="contained" endIcon={<ArrowForward />} sx={{
              px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
              bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
            }}>
              Get Started Free
            </Button>
          </SignInButton>
        )}
      </Container>

      {/* ─── Footer ─── */}
      <Divider sx={{ borderColor: SLATE_200 }} />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" sx={{ color: SLATE_400, fontWeight: 600 }}>
            Guild Space
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              onClick={() => navigate('/privacy-policy')}
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: '0.8rem',
                '&:hover': { color: TEAL },
              }}
            >
              Privacy Policy
            </Button>
            <Button
              onClick={() => navigate('/terms-and-conditions')}
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: '0.8rem',
                '&:hover': { color: TEAL },
              }}
            >
              Terms & Conditions
            </Button>
            {isSignedIn && (
              <Button onClick={() => setFeedbackDialogOpen(true)} sx={{
                textTransform: 'none', color: SLATE_400, fontSize: '0.8rem',
                '&:hover': { color: TEAL },
              }}>
                Feedback
              </Button>
            )}
            <Typography variant="caption" sx={{ color: SLATE_400 }}>
              &copy; {new Date().getFullYear()} Guild Space
            </Typography>
          </Box>
        </Box>
      </Container>

      <FeedbackDialog open={feedbackDialogOpen} onClose={() => setFeedbackDialogOpen(false)} />
    </Box>
  );
};

export default LandingPage;

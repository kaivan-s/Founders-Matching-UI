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

      {/* ─── Bento Grid Showcase ─── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
          <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
            See It In Action
          </Typography>
          <Typography variant="h3" sx={{
            fontWeight: 700, mt: 1.5, color: SLATE_900,
            fontSize: { xs: '1.85rem', md: '2.5rem' }, letterSpacing: '-0.02em',
          }}>
            Your partnership, organized
          </Typography>
        </Box>

        {/* Bento Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' },
          gap: 2.5,
        }}>

          {/* ─ Card 1: Discovery Carousel (wide, 8 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 8' },
            p: 3, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 12px 32px ${alpha(TEAL, 0.1)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.08), color: TEAL, display: 'flex' }}>
                <Bolt sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Swipe & Discover
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Browse project profiles in a carousel. Match scores show compatibility at a glance.
            </Typography>
            {/* Mini filter bar */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {['All', 'MVP Ready', 'Pre-seed', 'Idea Stage'].map((f, i) => (
                <Box key={i} sx={{
                  px: 1.5, py: 0.5, borderRadius: 5, fontSize: '0.65rem', fontWeight: 600,
                  bgcolor: i === 0 ? TEAL : 'transparent', color: i === 0 ? '#fff' : SLATE_400,
                  border: '1px solid', borderColor: i === 0 ? TEAL : SLATE_200,
                  cursor: 'default',
                }}>
                  {f}
                </Box>
              ))}
            </Box>
            {/* Carousel mockup */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center' }}>
              {[
                { name: 'Alex Chen', loc: 'San Francisco', project: 'FinTech SaaS', stage: 'MVP', skills: ['React', 'Node.js', 'AWS'], match: 92, scale: 0.88, opacity: 0.6 },
                { name: 'Sarah Kim', loc: 'New York', project: 'AI Health Platform', stage: 'Pre-seed', skills: ['Python', 'ML', 'Product'], match: 87, scale: 1, opacity: 1 },
                { name: 'James Liu', loc: 'London', project: 'EdTech Marketplace', stage: 'Idea', skills: ['Sales', 'Growth', 'Finance'], match: 78, scale: 0.88, opacity: 0.6 },
              ].map((p, i) => (
                <Box key={i} sx={{
                  flex: i === 1 ? '0 0 200px' : '0 0 160px', p: 2, borderRadius: 2.5, position: 'relative',
                  bgcolor: BG, border: i === 1 ? `2px solid ${alpha(TEAL, 0.3)}` : '1px solid', borderColor: i === 1 ? alpha(TEAL, 0.3) : SLATE_200,
                  transform: `scale(${p.scale})`, opacity: p.opacity,
                  boxShadow: i === 1 ? `0 8px 24px ${alpha(TEAL, 0.12)}` : 'none',
                  display: { xs: i === 1 ? 'block' : 'none', sm: 'block' },
                }}>
                  {/* Match badge */}
                  <Box sx={{
                    position: 'absolute', top: 8, right: 8,
                    px: 1, py: 0.25, borderRadius: 1,
                    bgcolor: p.match >= 90 ? alpha(TEAL, 0.12) : p.match >= 80 ? alpha(SKY, 0.12) : alpha(SLATE_400, 0.12),
                    color: p.match >= 90 ? TEAL : p.match >= 80 ? SKY : SLATE_500,
                    fontSize: '0.6rem', fontWeight: 700,
                  }}>
                    {p.match}% match
                  </Box>
                  {/* Avatar */}
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%', mb: 1.5,
                    bgcolor: alpha(i === 0 ? TEAL : i === 1 ? SKY : NAVY, 0.15),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i === 0 ? TEAL : i === 1 ? SKY : NAVY, fontWeight: 700, fontSize: '0.8rem',
                    border: '2px solid #fff', boxShadow: `0 2px 8px ${alpha(SLATE_900, 0.1)}`,
                  }}>
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, fontSize: '0.8rem', mb: 0.25 }}>
                    {p.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_400, display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, fontSize: '0.65rem' }}>
                    {p.loc}
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                    {p.project}
                  </Typography>
                  <Box sx={{ px: 1, py: 0.25, borderRadius: 1, display: 'inline-block', mb: 1, bgcolor: alpha(SKY, 0.1), color: SKY, fontSize: '0.6rem', fontWeight: 600 }}>
                    {p.stage}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {p.skills.slice(0, i === 1 ? 3 : 2).map((s, j) => (
                      <Box key={j} sx={{ px: 0.75, py: 0.15, borderRadius: 0.75, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha(TEAL, 0.08), color: TEAL }}>
                        {s}
                      </Box>
                    ))}
                    {i !== 1 && p.skills.length > 2 && (
                      <Box sx={{ px: 0.75, py: 0.15, borderRadius: 0.75, fontSize: '0.55rem', fontWeight: 500, bgcolor: alpha(SLATE_400, 0.08), color: SLATE_400 }}>
                        +{p.skills.length - 2}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
            {/* Swipe action bar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2.5 }}>
              <Box sx={{
                px: 2.5, py: 0.75, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1,
                border: '1px solid', borderColor: SLATE_200, cursor: 'default',
              }}>
                <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600 }}>Skip</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {[0, 1, 2, 3, 4].map(d => (
                  <Box key={d} sx={{ width: d === 2 ? 8 : 5, height: d === 2 ? 8 : 5, borderRadius: '50%', bgcolor: d === 2 ? TEAL : SLATE_200 }} />
                ))}
              </Box>
              <Box sx={{
                px: 2.5, py: 0.75, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1,
                bgcolor: TEAL, cursor: 'default',
              }}>
                <Handshake sx={{ fontSize: 14, color: '#fff' }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>Connect</Typography>
              </Box>
            </Box>
          </Box>

          {/* ─ Card 2: Equity & Agreements (tall, 4 cols, spans 2 rows) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 4' },
            gridRow: { xs: 'auto', md: 'span 2' },
            p: 3, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(SKY, 0.4), boxShadow: `0 12px 32px ${alpha(SKY, 0.1)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(SKY, 0.08), color: SKY, display: 'flex' }}>
                <Handshake sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Equity & Agreements
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              7-step guided questionnaire, AI-calculated splits, and auto-generated legal docs.
            </Typography>

            {/* Questionnaire steps mockup */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.06em' }}>
                QUESTIONNAIRE
              </Typography>
              {[
                { label: 'Startup Context', done: true },
                { label: 'My Details', done: true },
                { label: 'Vesting Terms', done: true },
                { label: 'Calculate Split', done: false },
              ].map((step, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    bgcolor: step.done ? TEAL : 'transparent',
                    border: step.done ? 'none' : `2px solid ${SLATE_200}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {step.done && <CheckCircle sx={{ fontSize: 14, color: '#fff' }} />}
                    {!step.done && (
                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: SLATE_400, fontWeight: 600 }}>{i + 1}</Typography>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{
                    color: step.done ? SLATE_500 : SLATE_400, fontWeight: step.done ? 500 : 400,
                  }}>
                    {step.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Split result mockup */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: BG, border: '1px solid', borderColor: SLATE_200, mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, letterSpacing: '0.06em' }}>
                  RECOMMENDED SPLIT
                </Typography>
                <Box sx={{ px: 1, py: 0.15, borderRadius: 1, bgcolor: alpha(TEAL, 0.1), color: TEAL, fontSize: '0.6rem', fontWeight: 600 }}>
                  AI
                </Box>
              </Box>
              {[
                { name: 'Founder A', pct: 52, color: TEAL },
                { name: 'Founder B', pct: 45, color: SKY },
                { name: 'Advisor', pct: 3, color: NAVY },
              ].map((f, i) => (
                <Box key={i} sx={{ mb: i < 2 ? 1.25 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35 }}>
                    <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.7rem' }}>{f.name}</Typography>
                    <Typography variant="caption" sx={{ color: SLATE_900, fontWeight: 700, fontSize: '0.7rem' }}>{f.pct}%</Typography>
                  </Box>
                  <Box sx={{ height: 6, borderRadius: 3, bgcolor: alpha(f.color, 0.15), overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${f.pct}%`, bgcolor: f.color, borderRadius: 3 }} />
                  </Box>
                </Box>
              ))}
            </Box>

            {/* Approval status mockup */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(TEAL, 0.04), border: '1px solid', borderColor: alpha(TEAL, 0.15), mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Shield sx={{ fontSize: 16, color: TEAL }} />
                <Typography variant="caption" sx={{ color: TEAL, fontWeight: 600 }}>BOTH APPROVED</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                {['Founder A', 'Founder B'].map((name, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 12, color: TEAL }} />
                    <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>{name}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Download */}
            <Box sx={{
              mt: 'auto', p: 1.5, borderRadius: 2, bgcolor: SLATE_900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>Download Agreement</Typography>
              <ArrowForward sx={{ fontSize: 14, color: '#fff' }} />
            </Box>
          </Box>

          {/* ─ Card 3: Kanban Task Board (5 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 5' },
            p: 3, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(NAVY, 0.4), boxShadow: `0 12px 32px ${alpha(NAVY, 0.08)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(NAVY, 0.08), color: NAVY, display: 'flex' }}>
                <Groups sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Workspace Kanban
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Drag-and-drop task board. Assign owners, set due dates, link to KPIs.
            </Typography>
            {/* 3-column kanban mockup */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
              {[
                { col: 'To-do', colColor: SLATE_400, tasks: [
                  { title: 'Market research', owner: 'SK', due: 'Feb 10', overdue: false },
                ] },
                { col: 'In Progress', colColor: SKY, tasks: [
                  { title: 'MVP wireframes', owner: 'AC', due: 'Feb 8', overdue: false },
                  { title: 'Pitch deck v2', owner: 'SK', due: 'Feb 5', overdue: true },
                ] },
                { col: 'Done', colColor: TEAL, tasks: [
                  { title: 'Domain setup', owner: 'AC', due: 'Jan 28', overdue: false },
                ] },
              ].map((column, ci) => (
                <Box key={ci}>
                  {/* Column header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: column.colColor }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: SLATE_900, fontSize: '0.7rem' }}>
                      {column.col}
                    </Typography>
                    <Box sx={{
                      ml: 'auto', width: 18, height: 18, borderRadius: '50%',
                      bgcolor: alpha(column.colColor, 0.12), color: column.colColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', fontWeight: 700,
                    }}>
                      {column.tasks.length}
                    </Box>
                  </Box>
                  {/* Tasks */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {column.tasks.map((t, ti) => (
                      <Box key={ti} sx={{
                        p: 1.25, borderRadius: 1.5, bgcolor: BG,
                        border: '1px solid', borderColor: t.overdue ? alpha('#ef4444', 0.3) : SLATE_200,
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', mb: 0.75, fontSize: '0.7rem', lineHeight: 1.3 }}>
                          {t.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{
                            width: 18, height: 18, borderRadius: '50%',
                            bgcolor: alpha(SKY, 0.15), color: SKY,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.5rem', fontWeight: 700,
                          }}>
                            {t.owner}
                          </Box>
                          <Typography variant="caption" sx={{
                            fontSize: '0.55rem', fontWeight: 500,
                            color: t.overdue ? '#ef4444' : SLATE_400,
                          }}>
                            {t.due}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* ─ Card 4: Partnership Health (3 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 3' },
            p: 3, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 12px 32px ${alpha(TEAL, 0.08)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.08), color: TEAL, display: 'flex' }}>
                <TrendingUp sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Partnership Health
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              90-day milestones and live health tracking.
            </Typography>

            {/* Health badge */}
            <Box sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 2,
              px: 1.5, py: 0.5, borderRadius: 5,
              bgcolor: alpha(TEAL, 0.08), color: TEAL,
            }}>
              <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: TEAL }} />
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>Healthy</Typography>
            </Box>

            {/* Milestones mockup */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: 'Equity agreed', done: true },
                { label: 'Roles defined', done: true },
                { label: 'First 3 KPIs set', done: false },
              ].map((m, i) => (
                <Box key={i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  px: 1.5, py: 1, borderRadius: 1.5,
                  bgcolor: m.done ? alpha(TEAL, 0.05) : BG,
                  border: '1px solid', borderColor: m.done ? alpha(TEAL, 0.15) : SLATE_200,
                }}>
                  <CheckCircle sx={{ fontSize: 16, color: m.done ? TEAL : SLATE_200 }} />
                  <Typography variant="caption" sx={{ color: m.done ? SLATE_900 : SLATE_400, fontWeight: m.done ? 600 : 400, fontSize: '0.7rem' }}>
                    {m.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Progress */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ flex: 1, height: 5, borderRadius: 3, bgcolor: alpha(TEAL, 0.12), overflow: 'hidden' }}>
                <Box sx={{ width: '66%', height: '100%', bgcolor: TEAL, borderRadius: 3 }} />
              </Box>
              <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, fontSize: '0.7rem' }}>2/3</Typography>
            </Box>
          </Box>

          {/* ─ Card 5: Chat & Check-ins (full width) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 12' },
            p: 3, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 12px 32px ${alpha(TEAL, 0.1)}` },
          }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Chat side */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.08), color: TEAL, display: 'flex' }}>
                    <People sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    Workspace Chat
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Real-time messaging within your workspace. Keep all discussions in one place.
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Date separator */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: SLATE_200 }} />
                    <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.6rem', fontWeight: 500 }}>Today</Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: SLATE_200 }} />
                  </Box>
                  {/* Other message */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      bgcolor: alpha(SKY, 0.15), color: SKY,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.55rem', fontWeight: 700,
                    }}>SK</Box>
                    <Box sx={{
                      maxWidth: '75%', px: 1.5, py: 1, borderRadius: '12px 12px 12px 4px',
                      bgcolor: BG, border: '1px solid', borderColor: SLATE_200,
                    }}>
                      <Typography variant="caption" sx={{ color: SLATE_900, lineHeight: 1.5, fontSize: '0.7rem' }}>
                        I've updated the pitch deck with the new market data. Can you review?
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: SLATE_400, fontSize: '0.55rem', mt: 0.5 }}>
                        10:24 AM
                      </Typography>
                    </Box>
                  </Box>
                  {/* Own message */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                    <Box sx={{
                      maxWidth: '75%', px: 1.5, py: 1, borderRadius: '12px 12px 4px 12px',
                      bgcolor: TEAL, boxShadow: `0 2px 8px ${alpha(TEAL, 0.25)}`,
                    }}>
                      <Typography variant="caption" sx={{ color: '#fff', lineHeight: 1.5, fontSize: '0.7rem' }}>
                        Looks great! I'll review it tonight and we can discuss in our check-in.
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: alpha('#fff', 0.7), fontSize: '0.55rem', mt: 0.5 }}>
                        10:31 AM
                      </Typography>
                    </Box>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      bgcolor: alpha(TEAL, 0.15), color: TEAL,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.55rem', fontWeight: 700,
                    }}>AC</Box>
                  </Box>
                  {/* Input mockup */}
                  <Box sx={{
                    mt: 1, display: 'flex', alignItems: 'center', gap: 1,
                    px: 2, py: 1, borderRadius: 3, border: '1px solid', borderColor: SLATE_200, bgcolor: BG,
                  }}>
                    <Typography variant="caption" sx={{ color: SLATE_400, flex: 1, fontSize: '0.7rem' }}>Type a message...</Typography>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(TEAL, 0.12),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ArrowForward sx={{ fontSize: 14, color: TEAL }} />
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Check-ins & KPIs side */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(SKY, 0.08), color: SKY, display: 'flex' }}>
                    <BarChart sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    Weekly Check-ins & KPIs
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Log progress weekly, set KPI targets, and track commitments per founder.
                </Typography>
                {/* Check-in card mockup */}
                <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: SLATE_200, bgcolor: BG, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: SLATE_900, fontSize: '0.7rem' }}>Week of Feb 3</Typography>
                    <Box sx={{
                      px: 1, py: 0.25, borderRadius: 1,
                      bgcolor: alpha(TEAL, 0.1), color: TEAL,
                      fontSize: '0.6rem', fontWeight: 600,
                    }}>On Track</Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: SLATE_500, lineHeight: 1.5, display: 'block', mb: 1.5, fontSize: '0.7rem' }}>
                    Completed market research. MVP wireframes in review. Pitch deck v2 needs one more round.
                  </Typography>
                  {/* Progress bar */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.6rem' }}>Progress</Typography>
                    <Box sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: alpha(TEAL, 0.12), overflow: 'hidden' }}>
                      <Box sx={{ width: '72%', height: '100%', bgcolor: TEAL, borderRadius: 2 }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, fontSize: '0.6rem' }}>72%</Typography>
                  </Box>
                </Box>
                {/* KPI table mockup */}
                <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: SLATE_200, overflow: 'hidden' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', px: 1.5, py: 0.75, bgcolor: BG }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_400, fontSize: '0.6rem' }}>KPI</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_400, fontSize: '0.6rem' }}>Target</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_400, fontSize: '0.6rem' }}>Status</Typography>
                  </Box>
                  {[
                    { kpi: 'User signups', target: '100', status: 'In Progress', sColor: SKY },
                    { kpi: 'Revenue', target: '$5k MRR', status: 'Not Started', sColor: SLATE_400 },
                    { kpi: 'Ship MVP', target: 'Mar 15', status: 'Done', sColor: TEAL },
                  ].map((row, i) => (
                    <Box key={i} sx={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                      px: 1.5, py: 0.75, alignItems: 'center',
                      borderTop: '1px solid', borderColor: SLATE_200,
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 500, color: SLATE_900, fontSize: '0.65rem' }}>{row.kpi}</Typography>
                      <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem' }}>{row.target}</Typography>
                      <Box sx={{
                        px: 0.75, py: 0.15, borderRadius: 1, display: 'inline-block', width: 'fit-content',
                        bgcolor: alpha(row.sColor, 0.1), color: row.sColor, fontSize: '0.55rem', fontWeight: 600,
                      }}>
                        {row.status}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

        </Box>
      </Container>

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

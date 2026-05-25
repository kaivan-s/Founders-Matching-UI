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
  AutoAwesome,
  Instagram,
  Hub,
  MarkEmailUnread,
  School,
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
  
  // Store the intended URL in localStorage for redirect after sign-in
  // This is more reliable than relying on Clerk's afterSignInUrl prop
  useEffect(() => {
    const intendedPath = window.location.pathname;
    if (intendedPath && intendedPath !== '/' && !intendedPath.startsWith('/advisor/')) {
      localStorage.setItem('redirectAfterSignIn', intendedPath);
    }
  }, []);

  const problems = [
    { num: '01', title: 'IP Theft Risk', desc: 'Share your idea with strangers, get rejected, and watch them build it without you.' },
    { num: '02', title: 'Ghosting & Flakiness', desc: 'People connect, exchange a few messages, then vanish without commitment.' },
    { num: '03', title: 'Misaligned Expectations', desc: 'Work styles, commitment levels, and goals don\'t align until it\'s too late.' },
    { num: '04', title: 'Zero Structure', desc: 'No equity clarity, no accountability, no partnership framework.' },
  ];

  const features = [
    { 
      icon: <Bolt />, 
      title: 'Smart Discovery', 
      tagline: 'Personalized opportunities',
      preview: {
        items: ['92% match', '87% match', '78% match'],
        label: 'AI-ranked by compatibility'
      }
    },
    { 
      icon: <MarkEmailUnread />, 
      title: 'Email Notifications', 
      tagline: 'Never miss an opportunity',
      preview: {
        items: ['New opportunities!', 'Application updates', 'Partner messages'],
        label: 'Stay in the loop'
      }
    },
    { 
      icon: <Shield />, 
      title: 'Screening Questions', 
      tagline: 'Protect your ideas',
      preview: {
        items: ['Custom questions', 'Review answers', 'Control access'],
        label: 'You decide who sees what'
      }
    },
    { 
      icon: <Hub />, 
      title: 'Workspace Tools', 
      tagline: 'Chat, equity, Slack & Notion',
      preview: {
        items: ['Real-time chat', 'Equity calculator', 'Integrations'],
        label: 'Everything in one place'
      }
    },
    { 
      icon: <School />, 
      title: 'First Match Coaching', 
      tagline: 'Guided partnership start',
      preview: {
        items: ['Define roles', 'Set expectations', 'Plan next steps'],
        label: 'Start strong together'
      }
    },
    { 
      icon: <AutoAwesome />, 
      title: 'AI Project Insights', 
      tagline: 'Validate ideas when you create a project',
      preview: {
        items: ['Market overview', 'Competitor landscape', 'SWOT & recommendations'],
        label: 'Pro & Pro+ — generate on project creation'
      }
    },
    { 
      icon: <Handshake />, 
      title: 'Advisor Marketplace', 
      tagline: 'Expert guidance on demand',
      preview: {
        items: ['Browse advisors', 'Book sessions', 'Direct payments'],
        label: 'Get expert help'
      }
    },
  ];

  const subscriptionPlans = [
    {
      name: 'Free', price: '$0', popular: false,
      features: [
        '5 personalized opportunities',
        '1 application per day',
        '1 project & 1 workspace',
        'All workspace tools',
      ],
    },
    {
      name: 'Pro', price: '$15/mo', popular: true,
      features: [
        '25 personalized opportunities (5x more)',
        'Unlimited applications',
        'Up to 3 projects',
        'Unlimited workspaces',
        'AI project insights on creation (3/month)',
        'Revisit passed opportunities',
        'Advisor marketplace',
      ],
    },
    {
      name: 'Pro+', price: '$35/mo', popular: false,
      features: [
        '50 personalized opportunities (10x more)',
        'AI project insights (10/month)',
        '30-day post-match support',
        'Priority support',
        'Everything in Pro',
      ],
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
            <SignInButton mode="modal">
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
            label="Where partnerships begin"
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
            Build Together
            <br />
            <Box component="span" sx={{ color: TEAL }}>
              From Day One.
            </Box>
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: SLATE_500,
              fontWeight: 400,
              maxWidth: 560,
              mx: 'auto',
              mb: 5,
              fontSize: { xs: '1rem', md: '1.075rem' },
              lineHeight: 1.6,
            }}
          >
            Join a team, lead your own idea, or advise—fit-first intros and a nudge when something new lines up.
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
              <SignInButton mode="modal">
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
            The partnership gap
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
            <Typography variant="body1" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 560, mx: 'auto' }}>
              From discovery to partnership—everything in one place.
            </Typography>
          </Box>

          <Grid container spacing={2.5} justifyContent="center">
            {features.map((f, index) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Box sx={{
                  perspective: '1000px',
                  height: { xs: 180, sm: 200 },
                  opacity: 0,
                  animation: `fadeInUp 0.6s ease forwards`,
                  animationDelay: `${index * 0.1}s`,
                  '@keyframes fadeInUp': {
                    '0%': { opacity: 0, transform: 'translateY(30px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}>
                  <Box sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    transformStyle: 'preserve-3d',
                    transition: 'transform 0.6s ease',
                    '&:hover': {
                      transform: 'rotateY(180deg)',
                    },
                  }}>
                    {/* Front Face */}
                    <Box sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      p: 2.5, borderRadius: 3, border: '1px solid', borderColor: SLATE_200,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      textAlign: 'center',
                      bgcolor: '#fff',
                    }}>
                      <Box sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 56, height: 56, borderRadius: '50%',
                        bgcolor: alpha(TEAL, 0.1), color: TEAL, mb: 2,
                      }}>
                        {React.cloneElement(f.icon, { sx: { fontSize: 28 } })}
                      </Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5, fontSize: '0.9rem', lineHeight: 1.3 }}>
                        {f.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.75rem' }}>
                        {f.tagline}
                      </Typography>
                    </Box>
                    
                    {/* Back Face - Mockup Preview */}
                    <Box sx={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      p: 2, borderRadius: 3, 
                      bgcolor: '#fff',
                      border: `2px solid ${TEAL}`,
                      display: 'flex', flexDirection: 'column',
                      overflow: 'hidden',
                    }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: TEAL, mb: 1 }}>
                        {f.title}
                      </Typography>
                      
                      {/* Mini Mockup based on feature type */}
                      {index === 0 && (
                        /* Smart Discovery - Mini Cards */
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flex: 1, alignItems: 'center' }}>
                          {['92%', '87%', '78%'].map((match, i) => (
                            <Box key={i} sx={{
                              flex: 1, p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.05),
                              textAlign: 'center', transform: i === 1 ? 'scale(1.1)' : 'scale(0.9)',
                              border: i === 1 ? `2px solid ${TEAL}` : `1px solid ${SLATE_200}`,
                            }}>
                              <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha(TEAL, 0.2), mx: 'auto', mb: 0.5 }} />
                              <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: i === 1 ? TEAL : SLATE_500 }}>{match}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 1 && (
                        /* Email Notifications - Inbox Preview */
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {['New opportunities!', 'Application update', 'Partner message'].map((msg, i) => (
                            <Box key={i} sx={{ 
                              p: 0.75, borderRadius: 1, bgcolor: i === 0 ? alpha(TEAL, 0.1) : alpha(TEAL, 0.03),
                              border: `1px solid ${i === 0 ? TEAL : SLATE_200}`,
                              display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: i === 0 ? TEAL : SLATE_400 }} />
                              <Typography sx={{ fontSize: '0.55rem', color: SLATE_900 }}>{msg}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 2 && (
                        /* Screening Questions - Form Preview */
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {['Why this project?', 'Your experience?', 'Availability?'].map((q, i) => (
                            <Box key={i} sx={{ p: 0.75, borderRadius: 1, bgcolor: alpha(TEAL, 0.03), border: `1px solid ${SLATE_200}` }}>
                              <Typography sx={{ fontSize: '0.5rem', color: SLATE_500, mb: 0.25 }}>{q}</Typography>
                              <Box sx={{ height: 8, bgcolor: alpha(TEAL, 0.1), borderRadius: 0.5 }} />
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 3 && (
                        /* Workspace Tools - Icons Grid */
                        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                          {['💬 Chat', '⚖️ Equity', '🔗 Slack', '📝 Notion'].map((tool, i) => (
                            <Box key={i} sx={{ 
                              p: 0.75, borderRadius: 1, bgcolor: alpha(TEAL, 0.05),
                              border: `1px solid ${SLATE_200}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.55rem', color: SLATE_900,
                            }}>
                              {tool}
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 4 && (
                        /* First Match Coaching - Checklist */
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {['Define roles', 'Set expectations', 'Plan sprint 1'].map((step, i) => (
                            <Box key={i} sx={{ 
                              p: 0.75, borderRadius: 1, bgcolor: alpha(TEAL, 0.03),
                              border: `1px solid ${SLATE_200}`,
                              display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                              <Box sx={{ 
                                width: 12, height: 12, borderRadius: '50%', 
                                border: `1px solid ${i < 2 ? TEAL : SLATE_400}`,
                                bgcolor: i < 2 ? TEAL : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.5rem', color: '#fff',
                              }}>
                                {i < 2 && '✓'}
                              </Box>
                              <Typography sx={{ fontSize: '0.55rem', color: SLATE_900, textDecoration: i < 2 ? 'line-through' : 'none', opacity: i < 2 ? 0.5 : 1 }}>{step}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 5 && (
                        /* AI Project Insights - Report sections */
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {['Market overview', 'Competitors', 'SWOT'].map((section, i) => (
                            <Box key={i} sx={{ 
                              p: 0.75, borderRadius: 1, bgcolor: alpha(TEAL, 0.05),
                              border: `1px solid ${i === 0 ? TEAL : SLATE_200}`,
                              display: 'flex', alignItems: 'center', gap: 0.75,
                            }}>
                              <AutoAwesome sx={{ fontSize: 10, color: TEAL }} />
                              <Typography sx={{ fontSize: '0.55rem', color: SLATE_900, fontWeight: i === 0 ? 600 : 400 }}>{section}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {index === 6 && (
                        /* Advisor Marketplace - Advisor Cards */
                        <Box sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
                          {['⭐ 4.9', '⭐ 4.8'].map((rating, i) => (
                            <Box key={i} sx={{ 
                              flex: 1, p: 1, borderRadius: 1, bgcolor: alpha(TEAL, 0.05),
                              border: `1px solid ${SLATE_200}`,
                              textAlign: 'center',
                            }}>
                              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: alpha(TEAL, 0.2), mx: 'auto', mb: 0.5 }} />
                              <Typography sx={{ fontSize: '0.5rem', color: SLATE_900, mb: 0.25 }}>Advisor</Typography>
                              <Typography sx={{ fontSize: '0.5rem', color: TEAL, fontWeight: 600 }}>{rating}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      <Typography sx={{ fontSize: '0.55rem', color: TEAL, fontWeight: 600, mt: 1, textAlign: 'center' }}>
                        {f.preview.label}
                      </Typography>
                    </Box>
                  </Box>
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
            Home to match, workspace to build
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 560, mx: 'auto', lineHeight: 1.7 }}>
            Preview home, personalized discovery, workspace chat, first-match coaching, and what opens after you connect—equity, check-ins, integrations, and advisors.
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
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
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
                Personalized discovery
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Browse opportunities ranked by your preferences and skills. See compatibility scores, review founder profiles, and apply to ideas that match what you're looking for.
            </Typography>
            {/* Mini questionnaire / intent cues */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {['Goals', 'Stage fit', 'Time commit'].map((f, i) => (
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
            {/* Carousel / daily batch mockup */}
            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', justifyContent: 'center', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              {[
                { name: 'Alex Chen', loc: 'San Francisco', project: 'FinTech SaaS', stage: 'MVP', skills: ['React', 'Node.js', 'AWS'], match: 92, scale: 0.88, opacity: 0.6 },
                { name: 'Sarah Kim', loc: 'New York', project: 'AI Health Platform', stage: 'Pre-seed', skills: ['Python', 'ML', 'Product'], match: 87, scale: 1, opacity: 1 },
                { name: 'James Liu', loc: 'London', project: 'EdTech Marketplace', stage: 'Idea', skills: ['Sales', 'Growth', 'Finance'], match: 78, scale: 0.88, opacity: 0.6 },
              ].map((p, i) => (
                <Box key={i} sx={{
                  flex: { xs: i === 1 ? '0 0 180px' : '0 0 140px', sm: i === 1 ? '0 0 200px' : '0 0 160px' }, p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, position: 'relative',
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
            {/* Action bar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2.5 }}>
              <Box sx={{
                px: 2.5, py: 0.75, borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1,
                border: '1px solid', borderColor: SLATE_200, cursor: 'default',
              }}>
                <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600 }}>Later</Typography>
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
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>Apply</Typography>
              </Box>
            </Box>
          </Box>

          {/* ─ Card 2: Apply to Connect (4 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 4' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 12px 32px ${alpha(TEAL, 0.1)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.08), color: TEAL, display: 'flex' }}>
                <Shield sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Apply to Connect
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Screen applicants with custom questions. Protect your ideas before sharing details.
            </Typography>

            {/* Application Questions mockup */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, mb: 1.5, display: 'block', letterSpacing: '0.06em' }}>
                YOUR SCREENING QUESTIONS
              </Typography>
              {[
                'Why are you interested in this project?',
                'What relevant experience do you bring?',
                'What\'s your availability?',
              ].map((q, i) => (
                <Box key={i} sx={{
                  p: 1.5, mb: 1, borderRadius: 2, bgcolor: BG,
                  border: '1px solid', borderColor: SLATE_200,
                }}>
                  <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: alpha(TEAL, 0.1), color: TEAL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>{i + 1}</Box>
                    {q}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Applicant preview */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(SKY, 0.04), border: '1px solid', borderColor: alpha(SKY, 0.15) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%',
                  bgcolor: alpha(SKY, 0.15), color: SKY,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.7rem',
                }}>JD</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.75rem' }}>
                    Jane Doe
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.6rem' }}>
                    Ex-Meta PM • 8 years exp
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: '#ef4444', color: '#fff', fontSize: '0.55rem', fontWeight: 600 }}>✕</Box>
                  <Box sx={{ px: 1, py: 0.3, borderRadius: 1, bgcolor: TEAL, color: '#fff', fontSize: '0.55rem', fontWeight: 600 }}>✓</Box>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.65rem', fontStyle: 'italic' }}>
                "I've built 3 fintech products and want to bring my expertise..."
              </Typography>
            </Box>
          </Box>

          {/* ─ Card 3: Equity & Agreements (tall, 4 cols, spans 2 rows) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 4' },
            gridRow: { xs: 'auto', md: 'span 2' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
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
              Choose from equity templates or use our detailed questionnaire. Auto-generate legal docs.
            </Typography>

            {/* Questionnaire steps mockup */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, mb: 1, display: 'block', letterSpacing: '0.06em' }}>
                SIMPLE 3-STEP FLOW
              </Typography>
              {[
                { label: 'Quick Context', done: true },
                { label: 'Choose Split Template', done: true },
                { label: 'Approve & Sign', done: false },
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
                { name: 'Founder B', pct: 48, color: SKY },
              ].map((f, i) => (
                <Box key={i} sx={{ mb: i < 1 ? 1.25 : 0 }}>
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

          {/* ─ Card 4: Rich Profiles (4 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 4' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(NAVY, 0.4), boxShadow: `0 12px 32px ${alpha(NAVY, 0.08)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(NAVY, 0.08), color: NAVY, display: 'flex' }}>
                <People sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Rich Builder Profiles
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Showcase your experience. Let potential collaborators know who you really are.
            </Typography>

            {/* Profile mockup */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: BG, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: alpha(TEAL, 0.15), color: TEAL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.85rem',
                }}>SK</Box>
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.8rem' }}>
                    Sarah Kim
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEAL, fontStyle: 'italic', fontSize: '0.65rem' }}>
                    "Ex-Meta PM building the future of health tech"
                  </Typography>
                </Box>
              </Box>

              {/* Profile sections */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.05em' }}>SKILLS</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {['Product', 'Python', 'ML', 'Strategy'].map((s, i) => (
                      <Box key={i} sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: alpha(TEAL, 0.08), color: TEAL, fontSize: '0.55rem', fontWeight: 600 }}>{s}</Box>
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.05em' }}>INTERESTS</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {['AI/ML', 'Healthcare', 'B2B SaaS'].map((s, i) => (
                      <Box key={i} sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: alpha(NAVY, 0.08), color: NAVY, fontSize: '0.55rem', fontWeight: 600 }}>{s}</Box>
                    ))}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.05em' }}>WORK STYLE</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: alpha(SKY, 0.08), color: SKY, fontSize: '0.55rem', fontWeight: 600 }}>Full-time</Box>
                    <Box sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: alpha(SKY, 0.08), color: SKY, fontSize: '0.55rem', fontWeight: 600 }}>Remote</Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* ─ Card 5: Video & Voice Intros (4 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 4' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(SKY, 0.4), boxShadow: `0 12px 32px ${alpha(SKY, 0.08)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(SKY, 0.08), color: SKY, display: 'flex' }}>
                <BarChart sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Personal Introductions
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Go beyond text. Add video or voice intros to stand out and show who you are.
            </Typography>

            {/* Video/Voice mockup */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Video intro button */}
              <Box sx={{
                p: 2, borderRadius: 2, bgcolor: BG,
                border: '1px solid', borderColor: SLATE_200,
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  bgcolor: alpha('#ef4444', 0.1), color: '#ef4444',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Box sx={{ width: 0, height: 0, borderLeft: '8px solid #ef4444', borderTop: '5px solid transparent', borderBottom: '5px solid transparent', ml: 0.5 }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.75rem' }}>
                    Watch Video Intro
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.6rem' }}>
                    2:30 • Loom recording
                  </Typography>
                </Box>
              </Box>

              {/* Voice note button */}
              <Box sx={{
                p: 2, borderRadius: 2, bgcolor: BG,
                border: '1px solid', borderColor: SLATE_200,
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.1), color: TEAL,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem',
                }}>
                  🎙️
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.75rem' }}>
                    Listen to Voice Note
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.6rem' }}>
                    1:15 • Audio intro
                  </Typography>
                </Box>
              </Box>

              {/* Audio waveform mockup */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1 }}>
                {[3, 5, 8, 6, 9, 4, 7, 10, 6, 8, 5, 7, 4, 6, 8, 5, 3].map((h, i) => (
                  <Box key={i} sx={{ width: 3, height: h * 2, borderRadius: 1, bgcolor: i < 10 ? TEAL : alpha(TEAL, 0.3) }} />
                ))}
              </Box>
            </Box>
          </Box>

          {/* ─ Card 6: Advisor Marketplace (5 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 5' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(NAVY, 0.4), boxShadow: `0 12px 32px ${alpha(NAVY, 0.08)}` },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(NAVY, 0.08), color: NAVY, display: 'flex' }}>
                <AutoAwesome sx={{ fontSize: 20 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                Advisor Marketplace
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 2.5 }}>
              Book paid 30- or 60-minute sessions. Pricing is per advisor; scheduling uses their Cal.com link after you lock in a booking.
            </Typography>
            {/* Advisor cards mockup */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { name: 'Michael Chen', role: 'Ex-Stripe PM • 30m / 60m', tag: '$75 / $140', rating: '4.9' },
                { name: 'Sarah Johnson', role: 'Serial founder • 30m / 60m', tag: '$90 / $160', rating: '5.0' },
                { name: 'David Park', role: 'Staff eng • 30m / 60m', tag: '$120 / $220', rating: '4.8' },
              ].map((advisor, i) => (
                <Box key={i} sx={{
                  p: 1.5, borderRadius: 2, bgcolor: BG,
                  border: '1px solid', borderColor: SLATE_200,
                  display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    bgcolor: alpha(i === 0 ? TEAL : i === 1 ? SKY : NAVY, 0.15),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i === 0 ? TEAL : i === 1 ? SKY : NAVY, fontWeight: 700, fontSize: '0.7rem',
                  }}>
                    {advisor.name.split(' ').map(n => n[0]).join('')}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.75rem' }}>
                      {advisor.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.65rem' }}>
                      {advisor.role}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
                    <Typography variant="caption" sx={{ color: TEAL, fontWeight: 700, fontSize: '0.65rem' }}>
                      {advisor.tag}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.7rem' }}>★</Typography>
                      <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 600, fontSize: '0.65rem' }}>{advisor.rating}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            {/* CTA */}
            <Box sx={{
              mt: 2, p: 1.25, borderRadius: 2, bgcolor: alpha(TEAL, 0.06),
              border: '1px solid', borderColor: alpha(TEAL, 0.15),
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
            }}>
              <Typography variant="caption" sx={{ color: TEAL, fontWeight: 600, fontSize: '0.7rem' }}>
                Pro/Pro+ feature — pay advisors directly
              </Typography>
              <ArrowForward sx={{ fontSize: 12, color: TEAL }} />
            </Box>
          </Box>

          {/* ─ Card 4: Partnership Health (3 cols) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 3' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
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
                { label: 'First check-in logged', done: false },
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

          {/* ─ Card 5: Check-ins & Roles (full width) ─ */}
          <Box sx={{
            gridColumn: { xs: '1', md: 'span 12' },
            p: { xs: 2, sm: 3 }, borderRadius: 3, bgcolor: '#fff',
            border: '1px solid', borderColor: SLATE_200,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': { borderColor: alpha(TEAL, 0.4), boxShadow: `0 12px 32px ${alpha(TEAL, 0.1)}` },
          }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Weekly Check-ins side */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(TEAL, 0.08), color: TEAL, display: 'flex' }}>
                    <TrendingUp sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    Weekly Check-ins
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Stay aligned with structured weekly updates, track partnership health, and keep day-to-day decisions in workspace chat.
                </Typography>
                {/* Check-in cards mockup */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { week: 'Week of Feb 10', status: 'On Track', statusColor: TEAL, note: 'Completed user research. Starting MVP development next week.' },
                    { week: 'Week of Feb 3', status: 'On Track', statusColor: TEAL, note: 'Finished pitch deck v2. Scheduled 3 investor calls.' },
                    { week: 'Week of Jan 27', status: 'Needs Attention', statusColor: '#f59e0b', note: 'Had alignment discussion on product direction. Resolved priorities.' },
                  ].map((checkin, i) => (
                    <Box key={i} sx={{
                      p: 1.5, borderRadius: 2, bgcolor: BG,
                      border: '1px solid', borderColor: SLATE_200,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: SLATE_900, fontSize: '0.7rem' }}>{checkin.week}</Typography>
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: alpha(checkin.statusColor, 0.1), color: checkin.statusColor,
                          fontSize: '0.6rem', fontWeight: 600,
                        }}>{checkin.status}</Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: SLATE_500, lineHeight: 1.5, fontSize: '0.7rem' }}>
                        {checkin.note}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Roles & Responsibilities side */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(SKY, 0.08), color: SKY, display: 'flex' }}>
                    <People sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    Roles & Responsibilities
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
                  Define clear ownership areas. Know who handles what from day one.
                </Typography>
                {/* Roles mockup */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { name: 'Alex Chen', role: 'CEO / Product', areas: ['Product Strategy', 'Fundraising', 'Hiring'], equity: '52%' },
                    { name: 'Sarah Kim', role: 'CTO', areas: ['Engineering', 'Architecture', 'DevOps'], equity: '45%' },
                  ].map((collaborator, i) => (
                    <Box key={i} sx={{
                      p: 2, borderRadius: 2, bgcolor: BG,
                      border: '1px solid', borderColor: SLATE_200,
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          bgcolor: alpha(i === 0 ? TEAL : SKY, 0.15),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: i === 0 ? TEAL : SKY, fontWeight: 700, fontSize: '0.7rem',
                        }}>
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_900, display: 'block', fontSize: '0.75rem' }}>
                            {collaborator.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: SLATE_400, fontSize: '0.65rem' }}>
                            {collaborator.role}
                          </Typography>
                        </Box>
                        <Box sx={{
                          px: 1, py: 0.25, borderRadius: 1,
                          bgcolor: alpha(TEAL, 0.08), color: TEAL,
                          fontSize: '0.65rem', fontWeight: 700,
                        }}>{collaborator.equity}</Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {collaborator.areas.map((area, j) => (
                          <Box key={j} sx={{
                            px: 1, py: 0.35, borderRadius: 1,
                            bgcolor: '#fff', border: '1px solid', borderColor: SLATE_200,
                            fontSize: '0.6rem', fontWeight: 500, color: SLATE_500,
                          }}>
                            {area}
                          </Box>
                        ))}
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
            Three paths on home, personalized discovery afterward
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[
            { step: '1', title: 'Choose why you landed here', desc: 'Sign in, land on Home, and pick Join a Project, Create a Project, or Join as an Advisor—that choice routes you instantly while the sidebar keeps workspaces, payouts, advisors, and more one click away.' },
            { step: '2', title: 'Set your discovery preferences', desc: 'For builders who want seats on teams, answer a focused two-step questionnaire once. Your preferences power the matching algorithm so you see opportunities ranked by compatibility, skills, and what matters to you.' },
            { step: '3', title: 'Browse opportunities & build partnerships', desc: 'Explore personalized opportunities ranked by your preferences. Apply with context, message in workspace chat, get first-match coaching after acceptance, then align on equity and add advisors when you need them.' },
          ].map((s, idx) => (
            <Box key={s.step} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 }, py: { xs: 3, sm: 4 }, borderBottom: idx < 2 ? '1px solid' : 'none', borderColor: SLATE_200 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: alpha(TEAL, 0.08), color: TEAL, fontWeight: 800, fontSize: '1.1rem',
              }}>
                {s.step}
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5, fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  {s.title}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.75, maxWidth: { xs: '100%', sm: 480 }, fontSize: { xs: '0.875rem', sm: '0.9375rem' } }}>
                  {s.desc}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>

      {/* ─── Works With Your Tools ─── */}
      <Box sx={{ bgcolor: '#fff', borderTop: '1px solid', borderBottom: '1px solid', borderColor: SLATE_200 }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem' }}>
              Native Integrations
            </Typography>
            <Typography variant="h5" sx={{
              fontWeight: 700, mt: 1, mb: 2, color: SLATE_900,
              fontSize: { xs: '1.25rem', md: '1.5rem' }, letterSpacing: '-0.01em',
            }}>
              Sync with your favorite tools
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, maxWidth: 500, mx: 'auto' }}>
              Connect Slack and Notion to keep your partnership in sync. No more switching between apps.
            </Typography>
          </Box>
          
          <Grid container spacing={3} sx={{ maxWidth: 900, mx: 'auto' }}>
            {/* Slack Integration */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 3, borderRadius: 3, bgcolor: BG, border: '1px solid', borderColor: SLATE_200,
                height: '100%', transition: 'all 0.25s ease',
                '&:hover': { borderColor: alpha('#4A154B', 0.4), boxShadow: `0 8px 24px ${alpha('#4A154B', 0.08)}` },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: 2, bgcolor: '#4A154B', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>#</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>Slack</Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400 }}>Team communication</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {['Auto-create private channels for your partnership', 'Real-time notifications for connections & check-ins', 'Invite all collaborators automatically'].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
                      <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.75rem' }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
            
            {/* Notion Integration */}
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: 3, borderRadius: 3, bgcolor: BG, border: '1px solid', borderColor: SLATE_200,
                height: '100%', transition: 'all 0.25s ease',
                '&:hover': { borderColor: alpha('#000', 0.3), boxShadow: `0 8px 24px ${alpha('#000', 0.06)}` },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ 
                    width: 48, height: 48, borderRadius: 2, bgcolor: '#000', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>N</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>Notion</Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400 }}>Project management</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {['Sync project docs and notes from Notion', 'Summary dashboard shows everything at a glance', 'Get notified when collaborators make changes'].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 14, color: '#10b981' }} />
                      <Typography variant="caption" sx={{ color: SLATE_500, fontSize: '0.75rem' }}>{item}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

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
            Simple subscription plans
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            All workspace features included in every plan. Upgrade for more opportunities, unlimited applications, AI project insights when you create a project, and access to the advisor marketplace.
          </Typography>
        </Box>

        {/* Subscription Plans */}
        <Grid container spacing={3} sx={{ maxWidth: 1000, mx: 'auto', mb: 5 }}>
          {subscriptionPlans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.name}>
              <Box sx={{
                p: { xs: 2.5, sm: 3 }, borderRadius: 3, height: '100%', position: 'relative',
                border: plan.popular ? '2px solid' : '1px solid',
                borderColor: plan.popular ? TEAL : SLATE_200,
                bgcolor: '#fff',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  boxShadow: plan.popular ? `0 12px 32px ${alpha(TEAL, 0.15)}` : `0 8px 24px ${alpha(NAVY, 0.06)}`,
                },
              }}>
                {plan.popular && (
                  <Chip label="Most Popular" size="small" sx={{
                    position: 'absolute', top: 12, right: 12,
                    bgcolor: TEAL, color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 20,
                  }} />
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.7rem' }}>
                  {plan.name}
                </Typography>
                <Box sx={{ mt: 1, mb: 2 }}>
                  {plan.originalPrice && (
                    <Typography 
                      component="span" 
                      sx={{ 
                        textDecoration: 'line-through', 
                        color: SLATE_400, 
                        fontSize: '1.1rem',
                        mr: 1,
                      }}
                    >
                      {plan.originalPrice}
                    </Typography>
                  )}
                  <Typography 
                    component="span" 
                    variant="h4" 
                    sx={{ fontWeight: 800, color: plan.originalPrice ? '#0d9488' : SLATE_900, letterSpacing: '-0.02em' }}
                  >
                    {plan.price}
                  </Typography>
                  {plan.originalPrice && (
                    <Chip 
                      label="58% OFF" 
                      size="small" 
                      sx={{ 
                        ml: 1, 
                        bgcolor: '#ecfdf5', 
                        color: '#059669', 
                        fontWeight: 700,
                        fontSize: '0.7rem',
                      }} 
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {plan.features.map((feature, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>{feature}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Key differentiator note */}
        <Box sx={{ maxWidth: 700, mx: 'auto', p: 3, borderRadius: 3, bgcolor: alpha(TEAL, 0.04), border: '1px solid', borderColor: alpha(TEAL, 0.15), textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
            <strong>Personalized matching:</strong> All users see opportunities ranked by compatibility. Upgrade to see more opportunities and apply without daily limits.
          </Typography>
        </Box>
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
              Paid consultations
            </Typography>
            <Typography variant="body1" sx={{ color: SLATE_500, mt: 1.5, maxWidth: 600, mx: 'auto' }}>
              List for free, set your own 30- and 60-minute rates, and add your Cal.com scheduling link. Pro/Pro+ founders can browse and book—they pay you directly and you meet on your calendar.
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{mb:5}}>
            <Grid item xs={12} md={6}>
              <Box sx={{
                p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, height: '100%',
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
                  How It Works
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    'Build your advisor profile and set separate rates for 30- and 60-minute sessions',
                    'Paste your Cal.com booking URL so founders schedule on your terms',
                    'Accept or decline consultation requests from Pro/Pro+ founders',
                    'Founders pay you directly (UPI, PayPal, bank transfer). Guild Space records confirmations for transparency',
                    'After your first confirmed consultation, enjoy a 30-day Pro Advisor trial—then stay bookable with a small subscription',
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
                p: { xs: 2.5, sm: 3.5 }, borderRadius: 3, height: '100%',
                bgcolor: '#fff', border: '2px solid', borderColor: TEAL,
                position: 'relative',
                transition: 'all 0.25s ease',
                '&:hover': { boxShadow: `0 8px 24px ${alpha(TEAL, 0.12)}` },
              }}>
                <Chip
                  label="Your rates"
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
                  How you get paid
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: SLATE_900 }}>
                        You set
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_400, fontSize: '0.85rem' }}>
                        session prices
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.9rem' }}>
                      Choose your own USD rates for 30- and 60-minute consultations (within platform limits).
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 0.5 }}>
                      Pro+ members submit bookings; you collect payment outside Guild Space using whatever method you agree on.
                    </Typography>
                  </Box>

                  <Divider sx={{ borderColor: SLATE_200 }} />

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: SLATE_900 }}>
                        $19
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_400, fontSize: '0.85rem' }}>
                        / mo Pro Advisor
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: SLATE_500, fontWeight: 500, fontSize: '0.9rem' }}>
                      30-day trial after your first confirmed consultation, then stay bookable.
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_400, display: 'block', mt: 0.5 }}>
                      Or $99/yr if you prefer annual billing. Listing your profile stays free.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{
                  mt: 2.5, p: 2, borderRadius: 2,
                  bgcolor: alpha(TEAL, 0.05), border: '1px solid', borderColor: alpha(TEAL, 0.2),
                }}>
                  <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 600, mb: 0.5, fontSize: '0.9rem' }}>
                    Cal.com scheduling
                  </Typography>
                  <Typography variant="caption" sx={{ color: SLATE_500, lineHeight: 1.6 }}>
                    Paste your full Cal.com booking link so members can pick a time.
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
                Become an Advisor
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
                  Become an Advisor
                </Button>
              </SignInButton>
            )}
          </Box>
        </Container>
      </Box>

      {/* ─── CTA ─── */}
      <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: SLATE_900, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' }, letterSpacing: '-0.02em' }}>
          Ready to find your people?
        </Typography>
        <Typography variant="body1" sx={{ color: SLATE_500, mb: 4, maxWidth: 440, mx: 'auto' }}>
          Discover personalized opportunities after you choose join, create, or advise—then collaborate with founders who share your vision.
        </Typography>
        {isSignedIn ? (
          <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/home')} sx={{
            px: 4.5, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem', fontWeight: 600,
            bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT },
          }}>
            Go to Dashboard
          </Button>
        ) : (
          <SignInButton mode="modal">
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
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', sm: 'center' }, gap: { xs: 2, sm: 2 } }}>
          <Typography variant="body2" sx={{ color: SLATE_400, fontWeight: 600 }}>
            Guild Space
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              onClick={() => navigate('/privacy-policy')}
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: { xs: '0.75rem', sm: '0.8rem' },
                px: { xs: 1, sm: 2 }, minWidth: 'auto',
                '&:hover': { color: TEAL },
              }}
            >
              Privacy
            </Button>
            <Button
              onClick={() => navigate('/terms-and-conditions')}
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: { xs: '0.75rem', sm: '0.8rem' },
                px: { xs: 1, sm: 2 }, minWidth: 'auto',
                '&:hover': { color: TEAL },
              }}
            >
              Terms
            </Button>
            <Button
              onClick={() => navigate('/faq')}
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: { xs: '0.75rem', sm: '0.8rem' },
                px: { xs: 1, sm: 2 }, minWidth: 'auto',
                '&:hover': { color: TEAL },
              }}
            >
              FAQ
            </Button>
            {isSignedIn && (
              <Button onClick={() => setFeedbackDialogOpen(true)} sx={{
                textTransform: 'none', color: SLATE_400, fontSize: { xs: '0.75rem', sm: '0.8rem' },
                px: { xs: 1, sm: 2 }, minWidth: 'auto',
                '&:hover': { color: TEAL },
              }}>
                Feedback
              </Button>
            )}
            <Button
              component="a"
              href="https://www.instagram.com/guild.space/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textTransform: 'none', color: SLATE_400, fontSize: '0.8rem',
                minWidth: 'auto', p: 0.5,
                '&:hover': { color: TEAL },
              }}
            >
              <Instagram sx={{ fontSize: 18 }} />
            </Button>
            <Typography variant="caption" sx={{ color: SLATE_400, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
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

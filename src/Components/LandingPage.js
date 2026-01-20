import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Container,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { 
  ArrowForward,
  CheckCircle,
  Business,
  SwipeRight,
  Favorite,
  LocationOn,
  Chat,
  Security,
  TrendingUp,
  People,
  VerifiedUser,
  Assignment,
  CheckCircleOutline,
  Notifications,
  Dashboard,
  Message,
  Group
} from '@mui/icons-material';
import { SignInButton, useUser } from '@clerk/clerk-react';
import { supabase } from '../config/supabase';
import FeedbackDialog from './FeedbackDialog';

const NetworkBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Configuration for the network look - updated colors to match Navy/Teal theme
    const config = {
      particleColor: 'rgba(30, 58, 138, 0.1)', // Navy with low opacity
      lineColor: 'rgba(13, 148, 136, 0.15)', // Teal with low opacity
      particleAmount: 80,
      defaultSpeed: 0.2,
      variantSpeed: 0.4,
      linkRadius: 150,
    };

    let w, h;
    let particles = [];

    // Resize canvas to fit container
    const resizeReset = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        // Use device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        const logicalWidth = rect.width;
        const logicalHeight = rect.height;
        
        // Set canvas size in physical pixels
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        
        // Scale context to match device pixel ratio
        ctx.scale(dpr, dpr);
        
        // Use logical dimensions for particle calculations
        w = logicalWidth;
        h = logicalHeight;
      } else {
        // Fallback to viewport if parent not found
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight * 0.5;
      }
    };

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = config.defaultSpeed + Math.random() * config.variantSpeed * (Math.random() < 0.5 ? -1 : 1);
        this.vy = config.defaultSpeed + Math.random() * config.variantSpeed * (Math.random() < 0.5 ? -1 : 1);
        this.radius = 2 + Math.random() * 2; // radius between 2 and 4
      }

      update() {
        // Move particle
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
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

    // Initialize particles
    const init = () => {
      resizeReset();
      particles = [];
      for (let i = 0; i < config.particleAmount; i++) {
        particles.push(new Particle());
      }
    };

    // The main drawing loop
    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Loop through particles to draw them and connect lines
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Check connections to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < config.linkRadius) {
            const opacity = (1 - distance / config.linkRadius) * 0.5; // Fade line based on distance, more visible
            ctx.beginPath();
            ctx.strokeStyle = `rgba(218, 223, 255, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    // Start hooks - use requestAnimationFrame to ensure DOM is ready
    const startAnimation = () => {
      init();
      animate();
    };
    
    requestAnimationFrame(startAnimation);
    
    const handleResize = () => {
      resizeReset();
      // Reinitialize particles with new dimensions
      particles = [];
      for (let i = 0; i < config.particleAmount; i++) {
        particles.push(new Particle());
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for container size changes
    let resizeObserver;
    if (canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserver.observe(canvas.parentElement);
    }

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }} 
    />
  );
};

const LandingPage = () => {
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const [pendingPartnerOnboarding, setPendingPartnerOnboarding] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  // Redirect to partner onboarding after sign-in if user clicked "Become a Partner" before signing in
  useEffect(() => {
    if (isSignedIn && pendingPartnerOnboarding) {
      navigate('/partner/onboarding');
      setPendingPartnerOnboarding(false);
    }
  }, [isSignedIn, pendingPartnerOnboarding, navigate]);


  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      position: 'relative',
      width: '100%',
      pb: 4
    }}>
      {/* Header */}
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        px: { xs: 2, sm: 4, md: 6 },
        py: 3,
        zIndex: 10,
        background: 'transparent',
      }}>
        <Typography 
          variant="h5" 
          component="h1" 
          sx={{ 
            color: '#1e3a8a',
            fontWeight: 800,
            letterSpacing: '-0.03em',
          }}
          aria-label="GuildSpace - Co-founder Matching Platform"
        >
          GuildSpace
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {!isSignedIn && (
            <SignInButton mode="modal" afterSignInUrl="/select-flow">
              <Button 
                variant="outlined" 
                sx={{ 
                  textTransform: 'none',
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                  borderColor: '#e2e8f0',
                  color: '#1e3a8a',
                  fontWeight: 600,
                  bgcolor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderColor: '#1e3a8a',
                    bgcolor: '#1e3a8a',
                    color: 'white',
                  },
                }}
              >
                Sign In
              </Button>
            </SignInButton>
          )}
        </Box>
      </Box>

      {/* Network Background - Top Section */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60%', // Extended height
          bgcolor: '#f0f9ff', // Very light blue tint
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <NetworkBackground />
        {/* Gradient fade overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '100%',
            background: 'linear-gradient(180deg, rgba(240, 249, 255, 0.5) 0%, #f8fafc 100%)', // Smoother transition
            zIndex: 1,
            pointerEvents: 'none',
        }}
      />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 12 } }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: { xs: 8, md: 12 } }}>
            <Typography 
              variant="h1" 
              component="h1"
              sx={{ 
                fontWeight: 800,
                mb: 3,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                lineHeight: 1.1,
                color: '#1e3a8a', // Navy
                letterSpacing: '-0.03em',
              }}
            >
              Build your core team
              <br />
              <Box component="span" sx={{ 
                color: '#0d9488', // Teal
              }}>
                Stop Ghosting, Start Building
              </Box>
            </Typography>

            <Typography 
              variant="h5" 
              sx={{ 
                color: '#475569',
                fontWeight: 400,
                maxWidth: '700px',
                mx: 'auto',
                mb: 6,
                fontSize: { xs: '1.1rem', md: '1.25rem' },
                lineHeight: 1.6,
              }}
            >
              Find your perfect co-founder, clarify equity splits, and build successful partnerships that actually work.
            </Typography>

          {/* Sign In Button */}
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
          }}>
            {isSignedIn ? (
              <Button
                variant="contained"
                onClick={() => navigate('/select-flow')}
                endIcon={<ArrowForward />}
                sx={{
                  px: 5,
                  py: 1.5,
                  height: '56px',
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#0d9488',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#14b8a6',
                  },
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <SignInButton mode="modal" afterSignInUrl="/select-flow">
                <Button
                  variant="contained"
                  endIcon={<ArrowForward />}
                  sx={{
                    px: 5,
                    py: 1.5,
                    height: '56px',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                  bgcolor: '#0d9488',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#14b8a6',
                    },
                  }}
                >
                  Get Started
                </Button>
              </SignInButton>
            )}
          </Box>
        </Box>

        {/* Why Cofounder Matching is Broken */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 10, md: 14 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2"
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#1e3a8a',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Why Cofounder Matching is Broken
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#475569', 
                maxWidth: '600px', 
                mx: 'auto',
                fontSize: '1rem',
                mb: 6,
              }}
            >
              The problems every founder faces
            </Typography>
          </Box>

          <Grid container spacing={3} sx={{ maxWidth: '1400px', mx: 'auto' }}>
            {[
              { 
                icon: <People sx={{ fontSize: 28 }} />, 
                title: 'Ghosting & Flakiness', 
                desc: 'They match, exchange messages, then disappear. No explanation.',
                number: '01'
              },
              { 
                icon: <TrendingUp sx={{ fontSize: 28 }} />, 
                title: 'Equity Confusion', 
                desc: 'No clear splits or vesting. Months later, you\'re arguing about ownership.',
                number: '02'
              },
              { 
                icon: <VerifiedUser sx={{ fontSize: 28 }} />, 
                title: 'Personality Clashes', 
                desc: 'Work styles don\'t align. You realize you\'re incompatible after weeks.',
                number: '03'
              },
              { 
                icon: <Chat sx={{ fontSize: 28 }} />, 
                title: 'No Structure', 
                desc: 'Scattered across Zoom, WhatsApp, Docs. No decisions. No accountability.',
                number: '04'
              },
            ].map((step) => (
              <Grid item xs={12} sm={6} lg={3} key={step.title}>
                <Card sx={{
                  height: '100%',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  p: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    borderColor: '#0d9488',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(13, 148, 136, 0.1)',
                  },
                }}>
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: '12px',
                        bgcolor: 'rgba(13, 148, 136, 0.1)',
                        color: '#0d9488',
                        mr: 2,
                      }}>
                        {step.icon}
                      </Box>
                      <Typography 
                        variant="h2" 
                        sx={{ 
                          fontWeight: 700,
                          color: '#cbd5e1',
                          fontSize: '3rem',
                          lineHeight: 1,
                        }}
                      >
                        {step.number}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600, 
                        mb: 2,
                        color: '#1e3a8a',
                        fontSize: '1.25rem',
                      }}
                    >
                      {step.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#475569', 
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                      }}
                    >
                      {step.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* What GuildSpace Does Differently */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 10, md: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              component="h2"
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#1e3a8a',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              What GuildSpace Does Differently
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#475569', 
                maxWidth: '600px', 
                mx: 'auto',
                fontSize: '1rem',
              }}
            >
              How we fix it
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth: '1200px', mx: 'auto', mb: 8 }}>
            {[
              { 
                icon: <VerifiedUser sx={{ fontSize: 28 }} />,
                title: 'Serious Founders Only', 
                desc: 'Project-based matching and smart filters to find committed co-founders.',
                features: [
                  'Project-based discovery mode',
                  'Smart filters (skills, location, stage)',
                  'Preference-based matching',
                  'Compatibility insights'
                ]
              },
              { 
                icon: <TrendingUp sx={{ fontSize: 28 }} />,
                title: 'Clear Equity & Expectations', 
                desc: 'Equity calculator, decision log, and agreement templates.',
                features: [
                  'Interactive equity split calculator',
                  'Multiple equity scenarios',
                  'Auto-timestamped decision log',
                  'Cofounder agreement templates',
                  'Equity approval workflow'
                ]
              },
              { 
                icon: <People sx={{ fontSize: 28 }} />,
                title: 'Compatibility Matching', 
                desc: 'Preference-based matching helps you find aligned co-founders.',
                features: [
                  'Preference-based matching',
                  'Project compatibility quiz',
                  'Compatibility insights',
                  'Communication style tips'
                ]
              },
              { 
                icon: <Chat sx={{ fontSize: 28 }} />,
                title: 'Stay Aligned', 
                desc: 'Commitment contracts and joint KPI dashboard.',
                features: [
                  'Commitment contracts',
                  'Joint KPI dashboard',
                  'Real-time messaging',
                  'Weekly check-ins'
                ]
              },
              { 
                icon: <Assignment sx={{ fontSize: 28 }} />,
                title: 'Task Management', 
                desc: 'Organized task board to track progress and accountability.',
                features: [
                  'Task assignment and tracking',
                  'Status management (To-do, In Progress, Done)',
                  'Task metrics and completion tracking',
                  'Weekly progress reports'
                ]
              },
              { 
                icon: <Group sx={{ fontSize: 28 }} />,
                title: 'Workspace Collaboration', 
                desc: 'Dedicated workspace for each co-founder partnership.',
                features: [
                  'Multi-workspace support',
                  'Role-based access control',
                  'Real-time notifications',
                  'Workspace chat integration'
                ]
              },
            ].map((feature) => (
              <Grid item xs={12} sm={6} lg={4} key={feature.title}>
                <Card sx={{
                  height: '100%',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  p: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    borderColor: '#0d9488',
                    boxShadow: '0 8px 16px rgba(13, 148, 136, 0.1)',
                  },
                }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: 'rgba(13, 148, 136, 0.1)',
                    color: '#0d9488',
                    mb: 2.5,
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: '#1e3a8a',
                      fontSize: '1.3rem',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#0d9488',
                      fontWeight: 600,
                      mb: 2.5,
                      fontSize: '0.95rem',
                    }}
                  >
                    {feature.desc}
                  </Typography>
                  <Box component="ul" sx={{ pl: 2.5, m: 0 }}>
                    {feature.features.map((item, idx) => (
                      <Typography
                        key={idx}
                        component="li"
                        variant="body2"
                        sx={{
                          color: '#475569',
                          lineHeight: 1.8,
                          fontSize: '0.9rem',
                          mb: 1.5,
                        }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Social Proof Section */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 8, md: 10 }, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              mb: 4,
              color: '#1e3a8a',
              fontSize: { xs: '1.75rem', md: '2rem' },
            }}
          >
            Built for Serious Founders
          </Typography>
          <Box sx={{ maxWidth: '700px', mx: 'auto' }}>
            <Box sx={{ 
              bgcolor: '#f8fafc', 
              p: 4, 
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#1e3a8a',
                  fontStyle: 'italic',
                  mb: 2,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                "The project-based matching helped me find someone who's actually serious about building."
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  fontWeight: 500,
                }}
              >
                — Early beta user
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Pricing Section */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 8, md: 10 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#1e3a8a',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Simple, Transparent Pricing
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#475569', 
                maxWidth: '600px', 
                mx: 'auto',
                fontSize: '1rem',
              }}
            >
              Start free, upgrade as you grow
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth: '1200px', mx: 'auto', mb: 6 }}>
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'Forever',
                popular: false,
                features: [
                  '1 lite workspace',
                  '10 swipes/month',
                  'Preference-based matching',
                  'Basic KPIs & decisions',
                  'Weekly check-ins'
                ],
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                popular: true,
                features: [
                  'Up to 2 full workspaces',
                  'Unlimited discovery & matching',
                  'Compatibility insights',
                  'Full workspace OS',
                  'Equity & roles',
                  'Tasks board',
                  'Advisor marketplace'
                ]
              },
              {
                name: 'Pro+',
                price: '$79',
                period: '/month',
                popular: false,
                features: [
                  'Up to 5 workspaces',
                  'Everything in Pro',
                  'Enhanced compatibility insights',
                  'Investor-facing features',
                  'Priority partner access',
                  'Discounted partner rates'
                ]
              }
            ].map((plan) => (
              <Grid item xs={12} md={4} key={plan.name}>
                <Card sx={{
                  height: '100%',
                  bgcolor: '#ffffff',
                  border: plan.popular ? '2px solid #0d9488' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  p: 4,
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: plan.popular 
                      ? '0 12px 24px rgba(13, 148, 136, 0.2)' 
                      : '0 8px 16px rgba(30, 58, 138, 0.1)',
                  },
                }}>
                  {plan.popular && (
                    <Chip
                      label="Most Popular"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        bgcolor: '#0d9488',
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: '#1e3a8a',
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 700,
                        color: '#1e3a8a',
                      }}
                    >
                      {plan.price}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#64748b',
                        ml: 1,
                      }}
                    >
                      {plan.period}
                    </Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0, mb: 3 }}>
                    {plan.features.map((feature, idx) => (
                      <Box component="li" key={idx} sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
                        <CheckCircleOutline sx={{ fontSize: 18, color: '#10b981', mr: 1, mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.9rem' }}>
                          {feature}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Advisor Pricing */}
          <Box sx={{ 
            bgcolor: '#ffffff',
            p: { xs: 4, md: 6 },
            borderRadius: '24px',
            border: '1px solid #e2e8f0',
            maxWidth: '900px',
            mx: 'auto',
            textAlign: 'center',
          }}>
            <Box sx={{ 
              display: 'inline-flex',
              p: 1.5,
              borderRadius: '12px',
              bgcolor: 'rgba(13, 148, 136, 0.1)',
              color: '#0d9488',
              mb: 3,
            }}>
              <People sx={{ fontSize: 32 }} />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                color: '#1e3a8a',
                fontSize: { xs: '1.75rem', md: '2rem' },
              }}
            >
              For Advisors
            </Typography>
            <Grid container spacing={4} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#1e3a8a' }}>
                    One-time Onboarding
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d9488', mb: 1 }}>
                    $69
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Join the marketplace and get listed
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#1e3a8a' }}>
                    Annual Renewal
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#0d9488', mb: 1 }}>
                    $39/year
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>
                    Keep your dashboard active
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              Set your rate: $50–$150/month per workspace
            </Typography>
          </Box>
        </Box>

        {/* Roadmap Section */}
        <Box sx={{ mt: { xs: 8, md: 12 }, mb: { xs: 8, md: 10 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#1e3a8a',
                fontSize: { xs: '1.75rem', md: '2rem' },
              }}
            >
              What's Coming Next
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#475569', 
                maxWidth: '500px', 
                mx: 'auto',
                fontSize: '0.95rem',
              }}
            >
              Coming soon
            </Typography>
          </Box>
          
          <Grid container spacing={3} sx={{ maxWidth: '900px', mx: 'auto' }}>
            {[
              'Advisory circle and mentor network',
              'Built-in conflict mediation support',
              'Deeper integrations (calendar, tools, etc.)',
              'Advanced compatibility matching',
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#0d9488',
                    mr: 2,
                  }} />
                  <Typography variant="body1" sx={{ color: '#475569', fontSize: '0.95rem' }}>
                    {item}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>


        {/* Footer */}
        <Divider sx={{ borderColor: '#e2e8f0', my: { xs: 8, md: 10 } }} />
        <Box sx={{ 
          textAlign: 'center',
          pb: 4,
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: '#1e3a8a', 
              mb: 1,
              fontSize: '1.25rem',
            }}
          >
            GuildSpace
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              fontSize: '0.9rem',
            }}
          >
            © {new Date().getFullYear()} GuildSpace. All rights reserved.
          </Typography>
          {isSignedIn && (
            <Button
              variant="text"
              onClick={() => setFeedbackDialogOpen(true)}
              sx={{
                mt: 2,
                color: '#64748b',
                fontSize: '0.875rem',
                textTransform: 'none',
                '&:hover': {
                  color: '#0d9488',
                },
              }}
            >
              Got an idea? Give feedback
            </Button>
          )}
        </Box>
      </Container>

      {/* Feedback Dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
      />
    </Box>
  );
};

export default LandingPage;


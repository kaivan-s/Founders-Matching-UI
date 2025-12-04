import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { 
  Email,
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
  VerifiedUser
} from '@mui/icons-material';
import { supabase } from '../config/supabase';

const NetworkBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Configuration for the network look - updated colors to match mesh gradient
    const config = {
      particleColor: 'rgba(199, 240, 255, 0.7)', // #C7F0FF with higher opacity
      lineColor: 'rgba(218, 223, 255, 0.5)', // #DADFFF with higher opacity
      particleAmount: 80, // More particles for visibility
      defaultSpeed: 0.2, // Slow movement for subtlety
      variantSpeed: 0.4,
      linkRadius: 150, // Larger connection radius
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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'error' | null
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage('');

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        setStatus('success');
        setMessage("You're already on the waitlist!");
        setEmail('');
        setLoading(false);
        return;
      }

      // Insert email into waitlist
      const { error } = await supabase
        .from('waitlist')
        .insert([{ email: email.toLowerCase() }]);

      if (error) {
        // Handle unique constraint violation
        if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
          setStatus('success');
          setMessage("You're already on the waitlist!");
        } else {
          setStatus('error');
          setMessage(error.message || 'Something went wrong. Please try again.');
        }
      } else {
        setStatus('success');
        setMessage('Successfully joined the waitlist!');
        setEmail('');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
      console.error('Waitlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8fafc',
      position: 'relative',
      width: '100%',
      pb: 4
    }}>
      {/* Network Background - Top Section */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          bgcolor: '#F8FBFF',
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
            background: 'linear-gradient(180deg, rgba(248, 251, 255, 1) 0%, rgba(248, 251, 255, 0) 100%)',
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
              sx={{ 
                fontWeight: 700,
                mb: 3,
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
                lineHeight: 1.1,
                color: '#0f172a',
                letterSpacing: '-0.02em',
              }}
            >
              Co‑founder partnership platform
              <br />
              <Box component="span" sx={{ 
                background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Beyond matching.
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
              Stop ghosting. Avoid equity fights. Make the partnership work.
            </Typography>

          {/* Email Form */}
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ 
              maxWidth: '560px',
              mx: 'auto',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 0,
              flexDirection: { xs: 'column', sm: 'row' },
              mb: 2,
            }}>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    borderRadius: { xs: '12px', sm: '12px 0 0 12px' },
                    height: '56px',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      bgcolor: '#ffffff',
                      borderColor: '#0ea5e9',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#ffffff',
                      borderColor: '#0ea5e9',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#94a3b8',
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ mr: 1.5, color: '#64748b', fontSize: 20 }} />
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
                endIcon={loading ? null : <ArrowForward />}
                sx={{
                  px: 4,
                  py: 0,
                  height: '56px',
                  borderRadius: { xs: '12px', sm: '0 12px 12px 0' },
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#0ea5e9 !important',
                  backgroundColor: '#0ea5e9 !important',
                  color: 'white !important',
                  minWidth: { xs: '100%', sm: '160px' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: '#0284c7 !important',
                    backgroundColor: '#0284c7 !important',
                  },
                  '&:disabled': {
                    bgcolor: '#94a3b8 !important',
                    backgroundColor: '#94a3b8 !important',
                    color: '#ffffff !important',
                  },
                }}
              >
                {loading ? 'Joining...' : 'Get Early Access'}
              </Button>
            </Box>

            {status && (
              <Alert 
                severity={status}
                icon={status === 'success' ? <CheckCircle /> : null}
                sx={{
                  borderRadius: '12px',
                  bgcolor: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: status === 'success' ? '#10b981' : '#ef4444',
                  border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  '& .MuiAlert-icon': {
                    color: status === 'success' ? '#10b981' : '#ef4444',
                  },
                }}
              >
                {message}
              </Alert>
            )}
          </Box>
        </Box>

        {/* Why Cofounder Matching is Broken */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 10, md: 14 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#0f172a',
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
                    borderColor: '#0ea5e9',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(14, 165, 233, 0.1)',
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
                        bgcolor: 'rgba(14, 165, 233, 0.1)',
                        color: '#0ea5e9',
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
                        color: '#0f172a',
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

        {/* What Founder Match Does Differently */}
        <Box sx={{ mt: { xs: 12, md: 16 }, mb: { xs: 10, md: 12 } }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#0f172a',
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              What Founder Match Does Differently
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
                desc: 'Reliability scores and verified badges. Filter by 4.5★+ only.',
                features: [
                  'Reliability Score (response rate, consistency)',
                  'Verified badges for serious founders',
                  'Smart filters to avoid flaky matches'
                ]
              },
              { 
                icon: <TrendingUp sx={{ fontSize: 28 }} />,
                title: 'Clear Equity & Expectations', 
                desc: 'Equity calculator, decision log, and agreement templates.',
                features: [
                  'Interactive equity split calculator',
                  'Auto-timestamped decision log',
                  'Cofounder agreement templates'
                ]
              },
              { 
                icon: <People sx={{ fontSize: 28 }} />,
                title: 'Personality Matching', 
                desc: 'Compatibility reports show strengths and potential friction points.',
                features: [
                  'Personality assessment',
                  'Compatibility report',
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
                  'Advisor network (coming soon)'
                ]
              },
            ].map((feature) => (
              <Grid item xs={12} sm={6} lg={3} key={feature.title}>
                <Card sx={{
                  height: '100%',
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  p: 4,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: '#ffffff',
                    borderColor: '#0ea5e9',
                    boxShadow: '0 8px 16px rgba(14, 165, 233, 0.1)',
                  },
                }}>
                  <Box sx={{ 
                    display: 'inline-flex',
                    p: 1.5,
                    borderRadius: '10px',
                    bgcolor: 'rgba(14, 165, 233, 0.1)',
                    color: '#0ea5e9',
                    mb: 2.5,
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: '#0f172a',
                      fontSize: '1.3rem',
                    }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#0ea5e9',
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
              color: '#0f172a',
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
                  color: '#0f172a',
                  fontStyle: 'italic',
                  mb: 2,
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                "The reliability scores alone saved me weeks of wasted time."
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

        {/* Roadmap Section */}
        <Box sx={{ mt: { xs: 8, md: 12 }, mb: { xs: 8, md: 10 } }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                color: '#0f172a',
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
                    bgcolor: '#0ea5e9',
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

        {/* Final CTA Section */}
        <Box sx={{ 
          mt: { xs: 12, md: 16 }, 
          mb: { xs: 8, md: 10 },
          textAlign: 'center',
          bgcolor: '#ffffff',
          p: { xs: 4, md: 6 },
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          maxWidth: '800px',
          mx: 'auto',
        }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 2,
              color: '#0f172a',
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            Ready to Find a Cofounder Who Actually Shows Up?
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#475569', 
              maxWidth: '500px', 
              mx: 'auto',
              fontSize: '1rem',
              mb: 4,
            }}
          >
            Join the early access waitlist
          </Typography>
          
          {/* Email Form - Reuse the same form from hero */}
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ 
              maxWidth: '560px',
              mx: 'auto',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 0,
              flexDirection: { xs: 'column', sm: 'row' },
              mb: 2,
            }}>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#ffffff',
                    borderRadius: { xs: '12px', sm: '12px 0 0 12px' },
                    height: '56px',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      bgcolor: '#ffffff',
                      borderColor: '#0ea5e9',
                    },
                    '&.Mui-focused': {
                      bgcolor: '#ffffff',
                      borderColor: '#0ea5e9',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#94a3b8',
                    opacity: 1,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ mr: 1.5, color: '#64748b', fontSize: 20 }} />
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
                endIcon={loading ? null : <ArrowForward />}
                sx={{
                  px: 4,
                  py: 0,
                  height: '56px',
                  borderRadius: { xs: '12px', sm: '0 12px 12px 0' },
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: '#0ea5e9 !important',
                  backgroundColor: '#0ea5e9 !important',
                  color: 'white !important',
                  minWidth: { xs: '100%', sm: '160px' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: '#0284c7 !important',
                    backgroundColor: '#0284c7 !important',
                  },
                  '&:disabled': {
                    bgcolor: '#94a3b8 !important',
                    backgroundColor: '#94a3b8 !important',
                    color: '#ffffff !important',
                  },
                }}
              >
                {loading ? 'Joining...' : 'Get Early Access'}
              </Button>
            </Box>

            {status && (
              <Alert 
                severity={status}
                icon={status === 'success' ? <CheckCircle /> : null}
                sx={{
                  borderRadius: '12px',
                  bgcolor: status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: status === 'success' ? '#10b981' : '#ef4444',
                  border: `1px solid ${status === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  '& .MuiAlert-icon': {
                    color: status === 'success' ? '#10b981' : '#ef4444',
                  },
                }}
              >
                {message}
              </Alert>
            )}
          </Box>
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
              color: '#0f172a', 
              mb: 1,
              fontSize: '1.25rem',
            }}
          >
            Founder Match
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#64748b',
              fontSize: '0.9rem',
            }}
          >
            © {new Date().getFullYear()} Founder Match. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;


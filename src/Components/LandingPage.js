import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container,
  Alert,
  Fade,
  Grow
} from '@mui/material';
import { 
  Email,
  ArrowForward,
  CheckCircle,
  AutoAwesome,
  SwipeRight,
  SwipeLeft,
  Favorite,
  Close,
  Business,
  TrendingUp,
  People
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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
      const response = await fetch('http://localhost:5000/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Successfully joined the waitlist!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to connect. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      position: 'relative',
      overflowY: 'auto',
      overflowX: 'hidden',
      px: { xs: 2, sm: 4 },
      py: 6
    }}>
      {/* Background gradient elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Box sx={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                mb: 3,
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)',
              }}>
                <AutoAwesome sx={{ fontSize: 40, color: 'white' }} />
              </Box>
            </motion.div>

            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 700,
                mb: 2,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
                lineHeight: 1.2,
              }}
            >
              Find Your Perfect
              <br />
              Co-Founder Match
            </Typography>

            <Typography 
              variant="h6" 
              sx={{ 
                color: 'text.secondary',
                fontWeight: 400,
                maxWidth: '800px',
                mx: 'auto',
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                lineHeight: 1.6,
              }}
            >
              Swipe through talented founders and discover your ideal collaboration partner.
            </Typography>

            <Typography 
              variant="body1" 
              sx={{ 
                color: 'text.secondary',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                opacity: 0.8,
              }}
            >
              Coming soon. Join the waitlist to be notified when we launch.
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ 
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              gap: 0,
              flexDirection: { xs: 'column', sm: 'row' },
              mb: 2,
              alignItems: 'stretch',
            }}>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper',
                    borderRadius: { xs: 2, sm: '8px 0 0 8px' },
                    height: '56px',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !email}
                endIcon={loading ? null : <ArrowForward />}
                sx={{
                  px: { xs: 4, sm: 5 },
                  py: 0,
                  height: '56px',
                  borderRadius: { xs: 2, sm: '0 8px 8px 0' },
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
                  minWidth: { xs: '100%', sm: '180px' },
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                    boxShadow: '0 6px 25px rgba(139, 92, 246, 0.5)',
                    transform: 'translateY(-1px)',
                  },
                  '&:disabled': {
                    bgcolor: 'grey.300',
                    color: 'grey.500',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {loading ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </Box>

            <Fade in={status !== null}>
              <Box>
                {status && (
                  <Alert 
                    severity={status}
                    icon={status === 'success' ? <CheckCircle /> : null}
                    sx={{
                      borderRadius: 2,
                      '& .MuiAlert-message': {
                        width: '100%',
                      },
                    }}
                  >
                    {message}
                  </Alert>
                )}
              </Box>
            </Fade>
          </Box>
        </motion.div>

        {/* How It Works - Visual Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Box sx={{ mt: 10, mb: 8, textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              How It Works
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 6, maxWidth: '800px', mx: 'auto', fontSize: { xs: '1rem', md: '1.125rem' } }}>
              Discover potential co-founders through an intuitive swipe-based interface
            </Typography>

            {/* Animated Card Demo */}
            <Box sx={{ 
              position: 'relative',
              maxWidth: { xs: '400px', md: '500px', lg: '600px' },
              mx: 'auto',
              height: { xs: '500px', md: '600px' },
              mb: 6
            }}>
              <SwipeCardDemo />
            </Box>

            {/* Steps */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: { xs: 3, md: 4, lg: 5 },
              maxWidth: '1200px',
              mx: 'auto',
              mt: 8
            }}>
              {[
                { 
                  icon: <Business sx={{ fontSize: 40 }} />, 
                  title: 'Create Your Profile', 
                  desc: 'Showcase your projects, skills, and what you\'re looking for in a co-founder',
                  color: 'primary'
                },
                { 
                  icon: <SwipeRight sx={{ fontSize: 40 }} />, 
                  title: 'Swipe & Discover', 
                  desc: 'Browse through founder profiles. Swipe right if interested, left to pass',
                  color: 'secondary'
                },
                { 
                  icon: <Favorite sx={{ fontSize: 40 }} />, 
                  title: 'Match & Connect', 
                  desc: 'When both founders swipe right, it\'s a match! Start collaborating',
                  color: 'error'
                },
              ].map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + index * 0.2, duration: 0.5 }}
                >
                  <Box sx={{
                    textAlign: 'center',
                    p: 4,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                    },
                  }}>
                    <Box sx={{ 
                      display: 'inline-flex',
                      p: 2,
                      borderRadius: '50%',
                      bgcolor: `${step.color}.main`,
                      color: 'white',
                      mb: 2,
                      boxShadow: `0 4px 20px rgba(139, 92, 246, 0.3)`,
                    }}>
                      {step.icon}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* Features section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <Box sx={{ 
            mt: 10,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: { xs: 3, md: 4, lg: 5 },
            maxWidth: '1200px',
            mx: 'auto',
          }}>
            {[
              { 
                icon: <TrendingUp sx={{ fontSize: 32 }} />,
                title: 'Smart Matching', 
                desc: 'AI-powered compatibility for perfect founder pairs' 
              },
              { 
                icon: <People sx={{ fontSize: 32 }} />,
                title: 'Secure Platform', 
                desc: 'Privacy-first design with end-to-end encryption' 
              },
              { 
                icon: <AutoAwesome sx={{ fontSize: 32 }} />,
                title: 'Easy Discovery', 
                desc: 'Swipe through profiles to find your ideal match' 
              },
            ].map((feature, index) => (
              <Grow in={true} timeout={1600 + index * 200} key={feature.title}>
                <Box sx={{
                  textAlign: 'center',
                  p: 4,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Grow>
            ))}
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

// Animated Swipe Card Demo Component
const SwipeCardDemo = () => {
  const [currentCard, setCurrentCard] = useState(0);
  const cards = [
    { name: 'Sarah Chen', project: 'AI Health Platform', stage: 'MVP' },
    { name: 'Alex Rodriguez', project: 'Sustainable E-commerce', stage: 'Early Stage' },
    { name: 'Emma Thompson', project: 'EdTech Learning App', stage: 'Growth' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {cards.map((card, index) => {
        const isActive = index === currentCard;
        const offset = index - currentCard;
        
        return (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
            }}
            animate={{
              x: offset * 20,
              y: Math.abs(offset) * 10,
              scale: isActive ? 1 : 0.9,
              opacity: Math.abs(offset) > 1 ? 0 : 1,
              rotate: offset * 5,
              zIndex: cards.length - Math.abs(offset),
            }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Box sx={{
              width: '100%',
              height: '100%',
              bgcolor: 'background.paper',
              borderRadius: 4,
              boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.15)' : '0 8px 24px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: 'divider',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}>
              {/* Card Header */}
              <Box>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 700,
                }}>
                  {card.name.split(' ').map(n => n[0]).join('')}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {card.name}
                </Typography>
              </Box>

              {/* Card Content */}
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 1, fontWeight: 600 }}>
                  {card.project}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Looking for a technical co-founder with experience in healthcare technology and product design.
                </Typography>
                <Box sx={{ display: 'inline-block' }}>
                  <Box sx={{
                    display: 'inline-block',
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    {card.stage}
                  </Box>
                </Box>
              </Box>

              {/* Swipe Actions */}
              {isActive && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: 3,
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Box sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: 'error.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                    }}>
                      <Close sx={{ fontSize: 28 }} />
                    </Box>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Box sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}>
                      <Favorite sx={{ fontSize: 28 }} />
                    </Box>
                  </motion.div>
                </Box>
              )}
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};

export default LandingPage;


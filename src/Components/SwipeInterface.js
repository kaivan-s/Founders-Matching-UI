import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button, 
  Box, 
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  ThumbUp, 
  ThumbDown, 
  LocationOn, 
  Language, 
  LinkedIn 
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const SwipeInterface = () => {
  const { user } = useUser();
  const [founders, setFounders] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchFounders();
    }
  }, [user]);

  const fetchFounders = async () => {
    if (!user || !user.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/founders', {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch founders');
      }
      const data = await response.json();
      setFounders(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (currentIndex >= founders.length) return;

    const currentFounder = founders[currentIndex];
    
    try {
      await fetch('http://localhost:5000/api/swipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          swiped_id: currentFounder.id,
          swipe_type: direction
        }),
      });
    } catch (err) {
      console.error('Error recording swipe:', err);
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (currentIndex >= founders.length) {
    return (
      <Box 
        textAlign="center" 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 3,
          p: 4,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 1, color: 'text.primary' }}>
          All caught up!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Check back later for new founders.
        </Typography>
      </Box>
    );
  }

  const currentFounder = founders[currentIndex];

  return (
    <Box sx={{ 
      position: 'relative', 
      height: '100%',
      maxWidth: '600px',
      mx: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 300 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CardMedia
              component="img"
              sx={{ 
                height: '240px',
                objectFit: 'cover',
                bgcolor: 'grey.100',
                flexShrink: 0
              }}
              image={currentFounder.profile_picture_url || 'https://via.placeholder.com/400x320?text=No+Image'}
              alt={currentFounder.name}
            />
            <CardContent sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              p: 2.5,
              overflow: 'hidden',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '3px',
              },
            }}>
              <Box sx={{ 
                flex: 1, 
                overflowY: 'auto',
                pr: 0.5,
              }}>
              <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
                {currentFounder.name}
              </Typography>
              
              {/* Projects */}
              {currentFounder.projects && currentFounder.projects.length > 0 ? (
                currentFounder.projects.map((project, index) => (
                  <Box 
                    key={project.id || index} 
                    sx={{ 
                      mb: index < currentFounder.projects.length - 1 ? 3 : 3,
                      pt: index > 0 ? 2 : 0,
                      borderTop: index > 0 ? '1px solid' : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="subtitle1" 
                      color={index % 2 === 0 ? 'primary' : 'secondary'} 
                      gutterBottom 
                      sx={{ fontWeight: 500, mb: 1 }}
                    >
                      {project.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1.5, lineHeight: 1.6 }}>
                      {project.description}
                    </Typography>
                    <Chip 
                      label={project.stage} 
                      color={index % 2 === 0 ? 'primary' : 'secondary'} 
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        height: 24,
                      }}
                    />
                  </Box>
                ))
              ) : (
                // Fallback for old schema (if projects array doesn't exist)
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
                    {currentFounder.project_title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1.5, lineHeight: 1.6 }}>
                    {currentFounder.project_description}
                  </Typography>
                  <Chip 
                    label={currentFounder.project_stage} 
                    color="primary" 
                    size="small"
                    sx={{ 
                      textTransform: 'capitalize',
                      fontWeight: 500,
                      height: 24,
                    }}
                  />
                </Box>
              )}

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                  Looking for
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                  {currentFounder.looking_for}
                </Typography>
              </Box>

              {currentFounder.skills && currentFounder.skills.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {currentFounder.skills.map((skill, index) => (
                      <Chip 
                        key={index} 
                        label={skill} 
                        size="small" 
                        variant="outlined"
                        sx={{
                          borderColor: 'divider',
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              </Box>
              
              <Box sx={{ 
                mt: 'auto', 
                pt: 2, 
                borderTop: '1px solid', 
                borderColor: 'divider',
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexShrink: 0
              }}>
                {currentFounder.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {currentFounder.location}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {currentFounder.website_url && (
                    <IconButton 
                      size="small" 
                      href={currentFounder.website_url} 
                      target="_blank"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <Language fontSize="small" />
                    </IconButton>
                  )}
                  {currentFounder.linkedin_url && (
                    <IconButton 
                      size="small" 
                      href={currentFounder.linkedin_url} 
                      target="_blank"
                      sx={{ 
                        color: 'text.secondary',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      <LinkedIn fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Box sx={{ 
        mt: 2,
        display: 'flex',
        justifyContent: 'center',
        gap: 3,
        alignItems: 'center',
        flexShrink: 0
      }}>
        <Button
          variant="contained"
          size="large"
          onClick={() => handleSwipe('left')}
          sx={{ 
            borderRadius: '50%', 
            width: 64, 
            height: 64,
            minWidth: 64,
            boxShadow: 2,
            bgcolor: 'error.main',
            '&:hover': {
              bgcolor: 'error.dark',
              boxShadow: 4,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ThumbDown />
        </Button>
        <Button
          variant="contained"
          color="success"
          size="large"
          onClick={() => handleSwipe('right')}
          sx={{ 
            borderRadius: '50%', 
            width: 64, 
            height: 64,
            minWidth: 64,
            boxShadow: 2,
            '&:hover': {
              boxShadow: 4,
              transform: 'scale(1.05)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ThumbUp />
        </Button>
      </Box>
    </Box>
  );
};

export default SwipeInterface;

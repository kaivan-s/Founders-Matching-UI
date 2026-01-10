import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Card,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
} from '@mui/material';
import { LocationOn, Language, LinkedIn, Business, Close, CheckCircle, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const InterestedPage = () => {
  const { user } = useUser();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null);
  const [selectedLike, setSelectedLike] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchLikes();
    // Dispatch event to refresh notification counts after fetching
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('interestsViewed'));
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchLikes = async () => {
    try {
      const response = await fetch(`${API_BASE}/likes`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch likes');
      }
      const data = await response.json();
      setLikes(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRespond = async (swipeId, response) => {
    setResponding(swipeId);
    try {
      const res = await fetch(`${API_BASE}/likes/${swipeId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ response }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to respond');
      }

      // Remove the like from the list with animation
      setLikes(prev => prev.filter(like => like.swipe_id !== swipeId));
      if (selectedLike && selectedLike.swipe_id === swipeId) {
        setDialogOpen(false);
        setSelectedLike(null);
      }

      // Show success message
      if (response === 'accept') {
        setError('✅ Connection accepted! Check your Connections tab.');
        setTimeout(() => setError(null), 3000);
        // Dispatch event to refresh tab counts
        window.dispatchEvent(new Event('interestAccepted'));
      }
    } catch (err) {
      console.error('Error responding to like:', err);
      setError(err.message);
    } finally {
      setResponding(null);
    }
  };

  const handleCardClick = (like) => {
    setSelectedLike(like);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLike(null);
  };

  const getTimeSince = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (likes.length === 0) {
    return (
      <Box 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 6,
            border: '1px solid',
            borderColor: 'divider',
            maxWidth: '400px',
          }}
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
            mb: 3,
          }}>
            <Business sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700 }}>
            No interested founders yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When someone connects with your profile, they'll appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {error && (
        <Alert 
          severity={error.includes('✅') ? 'success' : 'error'}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Interested in You
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {likes.length} {likes.length === 1 ? 'founder wants' : 'founders want'} to connect with you
        </Typography>
      </Box>

      {/* List View */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(13, 148, 136, 0.2)', // Teal
          borderRadius: '10px',
        },
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {likes.map((like, index) => {
            const founder = like.founder;
            const timeSince = like.created_at ? getTimeSince(like.created_at) : 'Recently';
            
            return (
              <motion.div
                key={like.swipe_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#0d9488', // Teal
                      boxShadow: '0 4px 16px rgba(13, 148, 136, 0.1)',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => handleCardClick(like)}
                >
                  {/* Avatar */}
                  <Avatar
                    src={founder.profile_picture_url}
                    alt={founder.name}
                    sx={{ 
                      width: 64,
                      height: 64,
                      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', // Navy
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
                      flexShrink: 0,
                    }}
                  >
                    {founder.name ? founder.name.split(' ').map(n => n[0]).join('') : '?'}
                  </Avatar>

                  {/* Info Section */}
                  <Box sx={{ flex: 1, ml: 2.5, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {founder.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                        • {timeSince}
                      </Typography>
                    </Box>
                    
                    {founder.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {founder.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Show which project they're interested in */}
                    {like.is_project_based && like.project && (
                      <Box sx={{ 
                        mb: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: 'rgba(30, 58, 138, 0.05)', // Light Navy
                        border: '1px solid rgba(30, 58, 138, 0.1)',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Business sx={{ fontSize: 14, color: '#1e3a8a' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                            Interested in your project:
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', ml: 2.5 }}>
                          {like.project.title}
                        </Typography>
                        {like.project.description && (
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ 
                              ml: 2.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {like.project.description}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {founder.looking_for && !like.is_project_based && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.6,
                        }}
                      >
                        {founder.looking_for}
                      </Typography>
                    )}

                    {/* Skills */}
                    {founder.skills && founder.skills.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                        {founder.skills.slice(0, 4).map((skill, idx) => (
                          <Chip 
                            key={idx}
                            label={skill} 
                            size="small" 
                            variant="outlined"
                            sx={{
                              fontSize: '0.75rem',
                              height: 24,
                              borderColor: 'divider',
                            }}
                          />
                        ))}
                        {founder.skills.length > 4 && (
                          <Chip 
                            label={`+${founder.skills.length - 4}`}
                            size="small"
                            sx={{ fontSize: '0.75rem', height: 24, bgcolor: 'grey.100' }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 1.5,
                    ml: 2,
                    flexShrink: 0,
                  }}>
                    <Button
                      variant="contained"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespond(like.swipe_id, 'accept');
                      }}
                      disabled={responding === like.swipe_id}
                      startIcon={responding === like.swipe_id ? null : <CheckCircle />}
                      sx={{ 
                        minWidth: 110,
                        py: 1,
                        background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
                        fontWeight: 600,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                        },
                      }}
                    >
                      {responding === like.swipe_id ? (
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                      ) : (
                        'Accept'
                      )}
                    </Button>
                    <Button
                      variant="outlined"
                      size="medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRespond(like.swipe_id, 'reject');
                      }}
                      disabled={responding === like.swipe_id}
                      startIcon={<Close />}
                      sx={{ 
                        minWidth: 110,
                        py: 1,
                        borderWidth: 2,
                        borderColor: 'divider',
                        color: 'text.secondary',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'error.main',
                          color: 'error.main',
                          bgcolor: 'rgba(239, 68, 68, 0.05)',
                          borderWidth: 2,
                        },
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      {/* Detail Dialog - Kept from original */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        {selectedLike && selectedLike.founder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {selectedLike.founder.name}
              </Typography>
              <IconButton onClick={handleCloseDialog} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={selectedLike.founder.profile_picture_url}
                  alt={selectedLike.founder.name}
                  sx={{ 
                    width: 100,
                    height: 100,
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', // Navy
                    fontSize: '2.5rem',
                    fontWeight: 700,
                    margin: '0 auto',
                    mb: 2,
                    boxShadow: '0 8px 24px rgba(30, 58, 138, 0.2)',
                    border: '4px solid white',
                  }}
                >
                  {selectedLike.founder.name ? selectedLike.founder.name.split(' ').map(n => n[0]).join('') : '?'}
                </Avatar>
                {selectedLike.founder.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                    <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedLike.founder.location}
                    </Typography>
                  </Box>
                )}
                
                {/* Show which project they're interested in */}
                {selectedLike.is_project_based && selectedLike.project && (
                  <Box sx={{ 
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'rgba(30, 58, 138, 0.05)', // Light Navy
                    border: '1px solid rgba(30, 58, 138, 0.1)',
                    textAlign: 'left',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Business sx={{ fontSize: 18, color: '#1e3a8a' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e3a8a' }}>
                        Interested in your project
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                      {selectedLike.project.title}
                    </Typography>
                    {selectedLike.project.description && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedLike.project.description}
                      </Typography>
                    )}
                    {selectedLike.project.stage && (
                      <Chip 
                        label={selectedLike.project.stage} 
                        size="small" 
                        sx={{ mt: 1, textTransform: 'capitalize' }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {selectedLike.founder.looking_for && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Looking For
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedLike.founder.looking_for}
                  </Typography>
                </>
              )}

              {selectedLike.founder.skills && selectedLike.founder.skills.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {selectedLike.founder.skills.map((skill, idx) => (
                      <Chip 
                        key={idx}
                        label={skill} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </>
              )}

              {selectedLike.founder.projects && selectedLike.founder.projects.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    Projects
                  </Typography>
                  {selectedLike.founder.projects.map((project, idx) => (
                    <Box key={idx} sx={{ mb: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {project.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {project.description}
                      </Typography>
                      {project.stage && (
                        <Chip 
                          label={project.stage} 
                          size="small" 
                          sx={{ mt: 1, textTransform: 'capitalize' }}
                        />
                      )}
                    </Box>
                  ))}
                </>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {selectedLike.founder.website_url && (
                  <IconButton 
                    component="a" 
                    href={selectedLike.founder.website_url}
                    target="_blank"
                    size="small"
                  >
                    <Language />
                  </IconButton>
                )}
                {selectedLike.founder.linkedin_url && (
                  <IconButton 
                    component="a" 
                    href={selectedLike.founder.linkedin_url}
                    target="_blank"
                    size="small"
                  >
                    <LinkedIn />
                  </IconButton>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRespond(selectedLike.swipe_id, 'reject');
                  handleCloseDialog();
                }}
                disabled={responding === selectedLike.swipe_id}
                variant="outlined"
                startIcon={<Close />}
                sx={{ flex: 1 }}
              >
                Reject
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRespond(selectedLike.swipe_id, 'accept');
                  handleCloseDialog();
                }}
                disabled={responding === selectedLike.swipe_id}
                variant="contained"
                startIcon={<CheckCircle />}
                sx={{ 
                  flex: 1,
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                  }
                }}
              >
                Accept
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default InterestedPage;


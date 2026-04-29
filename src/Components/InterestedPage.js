import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
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
  alpha,
} from '@mui/material';
import { LocationOn, Language, LinkedIn, Business, Close, CheckCircle, Visibility, Psychology, Videocam, Mic, Twitter, GitHub, Work } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';
import FirstMatchCoaching from './FirstMatchCoaching';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const InterestedPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responding, setResponding] = useState(null);
  const [selectedLike, setSelectedLike] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  
  // First match coaching
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [newMatchId, setNewMatchId] = useState(null);

  useEffect(() => {
    fetchLikes();
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

      const data = await res.json();
      
      setLikes(prev => prev.filter(like => like.swipe_id !== swipeId));
      if (selectedLike && selectedLike.swipe_id === swipeId) {
        setDialogOpen(false);
        setSelectedLike(null);
      }

      if (response === 'accept') {
        setError('✅ Connection accepted! Check your Connections tab.');
        setTimeout(() => setError(null), 3000);
        window.dispatchEvent(new Event('interestAccepted'));
        
        // Show coaching modal for new matches
        if (data.match_id) {
          setNewMatchId(data.match_id);
          setCoachingOpen(true);
        }
      }
    } catch (err) {
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
    setShowFullProfile(false);
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
        <CircularProgress sx={{ color: TEAL }} />
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
            bgcolor: '#fff',
            borderRadius: 2,
            p: 6,
            border: '1px solid',
            borderColor: SLATE_200,
            maxWidth: '400px',
          }}
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 2,
            bgcolor: alpha(TEAL, 0.1),
            mb: 3,
          }}>
            <Business sx={{ fontSize: 40, color: TEAL }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700, color: SLATE_900 }}>
            No interested founders yet
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
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
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
          Interested in You
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
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
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: SLATE_200,
          borderRadius: '3px',
          '&:hover': {
            background: SLATE_400,
          },
        },
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {likes.map((like, index) => {
            const founder = like.founder;
            const timeSince = like.liked_at ? getTimeSince(like.liked_at) : 'Recently';
            
            return (
              <motion.div
                key={like.swipe_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.03 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    bgcolor: '#fff',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: SLATE_200,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: TEAL,
                      boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                      transform: 'translateY(-2px)',
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
                      bgcolor: alpha(SKY, 0.1),
                      color: SKY,
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {founder.name ? founder.name.split(' ').map(n => n[0]).join('') : '?'}
                  </Avatar>

                  {/* Info Section */}
                  <Box sx={{ flex: 1, ml: 2.5, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        {founder.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 500 }}>
                        • {timeSince}
                      </Typography>
                    </Box>
                    
                    {founder.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 16, color: SLATE_400 }} />
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          {founder.location}
                        </Typography>
                      </Box>
                    )}

                    {/* Show which project they're interested in */}
                    {like.is_project_based && like.project && (
                      <Box sx={{ 
                        mb: 1,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(SKY, 0.05),
                        border: '1px solid',
                        borderColor: alpha(SKY, 0.2),
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Business sx={{ fontSize: 14, color: SKY }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: SKY }}>
                            Interested in your project:
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, ml: 2.5 }}>
                          {like.project.title}
                        </Typography>
                        {like.project.description && (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              ml: 2.5,
                              color: SLATE_500,
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
                        sx={{ 
                          mb: 1,
                          color: SLATE_500,
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
                            sx={{
                              fontSize: '0.7rem',
                              height: 24,
                              bgcolor: alpha(SLATE_400, 0.1),
                              color: SLATE_500,
                              border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                              fontWeight: 500,
                            }}
                          />
                        ))}
                        {founder.skills.length > 4 && (
                          <Chip 
                            label={`+${founder.skills.length - 4}`}
                            size="small"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 24,
                              bgcolor: BG,
                              color: SLATE_500,
                            }}
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
                        bgcolor: TEAL,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          bgcolor: TEAL_LIGHT,
                          boxShadow: `0 4px 12px ${alpha(TEAL, 0.3)}`,
                        },
                      }}
                    >
                      {responding === like.swipe_id ? (
                        <CircularProgress size={20} sx={{ color: '#fff' }} />
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
                        borderWidth: 1.5,
                        borderColor: SLATE_200,
                        color: SLATE_500,
                        fontWeight: 600,
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          bgcolor: alpha('#ef4444', 0.05),
                          borderWidth: 1.5,
                        },
                      }}
                    >
                      Reject
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            );
          })}
        </Box>
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        {selectedLike && selectedLike.founder && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                {selectedLike.founder.name}
              </Typography>
              <IconButton onClick={handleCloseDialog} size="small" sx={{ color: SLATE_500 }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                {/* Clickable Profile Section */}
                <Box 
                  onClick={() => setShowFullProfile(!showFullProfile)}
                  sx={{ 
                    cursor: 'pointer',
                    display: 'inline-block',
                    p: 2,
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(SKY, 0.05),
                    },
                  }}
                >
                  <Avatar
                    src={selectedLike.founder.profile_picture_url}
                    alt={selectedLike.founder.name}
                    sx={{ 
                      width: 100,
                      height: 100,
                      bgcolor: alpha(SKY, 0.1),
                      color: SKY,
                      fontSize: '2.5rem',
                      fontWeight: 700,
                      margin: '0 auto',
                      mb: 2,
                      border: '3px solid',
                      borderColor: showFullProfile ? TEAL : 'transparent',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {selectedLike.founder.name ? selectedLike.founder.name.split(' ').map(n => n[0]).join('') : '?'}
                  </Avatar>
                  <Typography variant="body2" sx={{ color: TEAL, fontWeight: 600, mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    {showFullProfile ? 'Hide Profile Details' : 'View Profile Details'}
                  </Typography>
                </Box>
                {selectedLike.founder.headline && (
                  <Typography variant="body1" sx={{ color: SLATE_500, mb: 1, fontWeight: 500 }}>
                    {selectedLike.founder.headline}
                  </Typography>
                )}
                
                {selectedLike.founder.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                    <LocationOn sx={{ fontSize: 18, color: SLATE_400 }} />
                    <Typography variant="body2" sx={{ color: SLATE_500 }}>
                      {selectedLike.founder.location}
                    </Typography>
                  </Box>
                )}

                {/* Social links */}
                {(selectedLike.founder.twitter_url || selectedLike.founder.github_url || selectedLike.founder.portfolio_url) && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    {selectedLike.founder.twitter_url && (
                      <IconButton 
                        component="a" 
                        href={selectedLike.founder.twitter_url}
                        target="_blank"
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <Twitter fontSize="small" />
                      </IconButton>
                    )}
                    {selectedLike.founder.github_url && (
                      <IconButton 
                        component="a" 
                        href={selectedLike.founder.github_url}
                        target="_blank"
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <GitHub fontSize="small" />
                      </IconButton>
                    )}
                    {selectedLike.founder.portfolio_url && (
                      <IconButton 
                        component="a" 
                        href={selectedLike.founder.portfolio_url}
                        target="_blank"
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{ color: SLATE_400, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                      >
                        <Language fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                )}

                {/* Expanded Profile Details */}
                {showFullProfile && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(SLATE_200, 0.3),
                    textAlign: 'left',
                  }}>
                    {selectedLike.founder.bio && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: SLATE_900 }}>
                          About
                        </Typography>
                        <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                          {selectedLike.founder.bio}
                        </Typography>
                      </Box>
                    )}

                    {selectedLike.founder.looking_for && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: SLATE_900 }}>
                          Looking For
                        </Typography>
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          {selectedLike.founder.looking_for}
                        </Typography>
                      </Box>
                    )}

                    {selectedLike.founder.work_preferences && Object.keys(selectedLike.founder.work_preferences).length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Work fontSize="small" />
                          Work Preferences
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedLike.founder.work_preferences.commitment && (
                            <Chip 
                              label={selectedLike.founder.work_preferences.commitment.replace('_', ' ')} 
                              size="small" 
                              sx={{ textTransform: 'capitalize', bgcolor: alpha(TEAL, 0.1), color: TEAL }}
                            />
                          )}
                          {selectedLike.founder.work_preferences.location_preference && (
                            <Chip 
                              label={selectedLike.founder.work_preferences.location_preference.replace('_', ' ')} 
                              size="small" 
                              sx={{ textTransform: 'capitalize', bgcolor: alpha(SKY, 0.1), color: SKY }}
                            />
                          )}
                          {selectedLike.founder.work_preferences.timezone && (
                            <Chip 
                              label={selectedLike.founder.work_preferences.timezone} 
                              size="small" 
                              sx={{ bgcolor: alpha(SLATE_400, 0.1), color: SLATE_500 }}
                            />
                          )}
                        </Box>
                      </Box>
                    )}

                    {selectedLike.founder.interests && selectedLike.founder.interests.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                          Interests
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedLike.founder.interests.map((interest, idx) => (
                            <Chip 
                              key={idx}
                              label={interest} 
                              size="small" 
                              sx={{
                                bgcolor: alpha(NAVY, 0.08),
                                color: NAVY,
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {selectedLike.founder.skills && selectedLike.founder.skills.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                          Skills
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selectedLike.founder.skills.map((skill, idx) => (
                            <Chip 
                              key={idx}
                              label={skill} 
                              size="small" 
                              sx={{
                                bgcolor: alpha(SLATE_400, 0.1),
                                color: SLATE_500,
                                border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {selectedLike.founder.projects && selectedLike.founder.projects.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                          Their Projects
                        </Typography>
                        {selectedLike.founder.projects.map((project, idx) => (
                          <Box key={idx} sx={{ 
                            mb: 1, 
                            p: 1.5, 
                            borderRadius: 1.5, 
                            bgcolor: '#fff',
                            border: '1px solid',
                            borderColor: SLATE_200,
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
                              {project.title}
                            </Typography>
                            {project.description && (
                              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                                {project.description}
                              </Typography>
                            )}
                            {project.stage && (
                              <Chip 
                                label={project.stage} 
                                size="small" 
                                sx={{ 
                                  mt: 0.5, 
                                  textTransform: 'capitalize',
                                  bgcolor: alpha(SLATE_400, 0.1),
                                  color: SLATE_500,
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      {selectedLike.founder.website_url && (
                        <IconButton 
                          component="a" 
                          href={selectedLike.founder.website_url}
                          target="_blank"
                          size="small"
                          sx={{ color: SLATE_500, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
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
                          sx={{ color: SLATE_500, '&:hover': { bgcolor: alpha(SKY, 0.1), color: SKY } }}
                        >
                          <LinkedIn />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* Show which project they're interested in */}
                {selectedLike.is_project_based && selectedLike.project && (
                  <Box sx={{ 
                    mb: 2,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(SKY, 0.05),
                    border: '1px solid',
                    borderColor: alpha(SKY, 0.2),
                    textAlign: 'left',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Business sx={{ fontSize: 18, color: SKY }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SKY }}>
                        Interested in your project
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: SLATE_900, mb: 0.5 }}>
                      {selectedLike.project.title}
                    </Typography>
                    {selectedLike.project.description && (
                      <Typography variant="body2" sx={{ color: SLATE_500 }}>
                        {selectedLike.project.description}
                      </Typography>
                    )}
                    {selectedLike.project.stage && (
                      <Chip 
                        label={selectedLike.project.stage} 
                        size="small" 
                        sx={{ 
                          mt: 1, 
                          textTransform: 'capitalize',
                          bgcolor: alpha(SLATE_400, 0.1),
                          color: SLATE_500,
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {/* Application Questions & Answers */}
              {selectedLike.question_answers && Object.keys(selectedLike.question_answers).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Psychology sx={{ color: TEAL, fontSize: 20 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                      Application Answers
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {Object.entries(selectedLike.question_answers).map(([question, answer], idx) => (
                      <Box key={idx} sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        bgcolor: alpha(TEAL, 0.03),
                        border: '1px solid',
                        borderColor: alpha(TEAL, 0.1),
                      }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                          Q: {question}
                        </Typography>
                        <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                          {answer}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Video/Voice Introductions */}
              {(selectedLike.video_intro_url || selectedLike.voice_intro_url) && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
                    Personal Introduction
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {selectedLike.video_intro_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={selectedLike.video_intro_url}
                        target="_blank"
                        startIcon={<Videocam />}
                        sx={{
                          textTransform: 'none',
                          borderColor: alpha(SKY, 0.3),
                          color: SKY,
                          '&:hover': { borderColor: SKY, bgcolor: alpha(SKY, 0.05) },
                        }}
                      >
                        Watch Video
                      </Button>
                    )}
                    {selectedLike.voice_intro_url && (
                      <Button
                        variant="outlined"
                        size="small"
                        component="a"
                        href={selectedLike.voice_intro_url}
                        target="_blank"
                        startIcon={<Mic />}
                        sx={{
                          textTransform: 'none',
                          borderColor: alpha(TEAL, 0.3),
                          color: TEAL,
                          '&:hover': { borderColor: TEAL, bgcolor: alpha(TEAL, 0.05) },
                        }}
                      >
                        Listen to Voice Note
                      </Button>
                    )}
                  </Box>
                </Box>
              )}

              {/* Skills - Always visible at bottom */}
              {selectedLike.founder.skills && selectedLike.founder.skills.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                    Skills
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedLike.founder.skills.map((skill, idx) => (
                      <Chip 
                        key={idx}
                        label={skill} 
                        size="small" 
                        sx={{
                          bgcolor: alpha(SLATE_400, 0.1),
                          color: SLATE_500,
                          border: `1px solid ${alpha(SLATE_400, 0.3)}`,
                          fontSize: '0.75rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1, borderTop: '1px solid', borderColor: SLATE_200 }}>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRespond(selectedLike.swipe_id, 'reject');
                  handleCloseDialog();
                }}
                disabled={responding === selectedLike.swipe_id}
                variant="outlined"
                startIcon={<Close />}
                sx={{ 
                  flex: 1,
                  borderColor: SLATE_200,
                  color: SLATE_500,
                  '&:hover': {
                    borderColor: '#ef4444',
                    color: '#ef4444',
                    bgcolor: alpha('#ef4444', 0.05),
                  },
                }}
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
                  bgcolor: TEAL,
                  '&:hover': { bgcolor: TEAL_LIGHT },
                }}
              >
                Accept
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* First Match Coaching Modal */}
      <FirstMatchCoaching
        matchId={newMatchId}
        open={coachingOpen}
        onClose={() => {
          setCoachingOpen(false);
          setNewMatchId(null);
        }}
        onOpenChat={() => {
          setCoachingOpen(false);
          navigate('/connections');
        }}
        onStartFounderDate={() => {
          setCoachingOpen(false);
          navigate('/connections');
        }}
      />
    </Box>
  );
};

export default InterestedPage;

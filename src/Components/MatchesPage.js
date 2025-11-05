import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Avatar
} from '@mui/material';
import { LocationOn, Language, LinkedIn } from '@mui/icons-material';

const MatchesPage = () => {
  const { user } = useUser();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/matches', {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch matches');
      }
      const data = await response.json();
      setMatches(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
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

  if (matches.length === 0) {
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
          No matches yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Keep swiping to find your perfect collaboration partner.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: '900px', 
      mx: 'auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2, color: 'text.secondary', fontWeight: 500, flexShrink: 0 }}>
        {matches.length} {matches.length === 1 ? 'Match' : 'Matches'}
      </Typography>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 2,
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
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
        },
      }}>
        {matches.map((match) => {
          const founder = match.founder;
          return (
            <Card 
              key={match.match_id} 
              sx={{ 
                borderRadius: 3, 
                boxShadow: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', gap: 2.5 }}>
                  <Avatar
                    src={founder.profile_picture_url}
                    alt={founder.name}
                    sx={{ width: 72, height: 72, bgcolor: 'grey.100' }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 0.5 }}>
                      {founder.name}
                    </Typography>
                    
                    {/* Projects */}
                    {founder.projects && founder.projects.length > 0 ? (
                      founder.projects.map((project, index) => (
                        <Box 
                          key={project.id || index}
                          sx={{ 
                            mb: index < founder.projects.length - 1 ? 2 : 2,
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
                          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1, lineHeight: 1.6 }}>
                            {project.description}
                          </Typography>
                          {project.stage && (
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
                          )}
                        </Box>
                      ))
                    ) : (
                      // Fallback for old schema
                      founder.project_title && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" color="primary" gutterBottom sx={{ fontWeight: 500, mb: 1 }}>
                            {founder.project_title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1, lineHeight: 1.6 }}>
                            {founder.project_description}
                          </Typography>
                          {founder.project_stage && (
                            <Chip 
                              label={founder.project_stage} 
                              color="primary" 
                              size="small"
                              sx={{ 
                                textTransform: 'capitalize',
                                fontWeight: 500,
                                height: 24,
                              }}
                            />
                          )}
                        </Box>
                      )
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem', mb: 0.5, display: 'block' }}>
                        Looking for
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                        {founder.looking_for}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={founder.project_stage} 
                        color="primary" 
                        size="small"
                        sx={{ 
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          height: 24,
                          mr: 1,
                        }}
                      />
                      {founder.skills && founder.skills.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                          {founder.skills.map((skill, index) => (
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
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      {founder.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" sx={{ color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {founder.location}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {founder.website_url && (
                          <IconButton 
                            size="small" 
                            href={founder.website_url} 
                            target="_blank"
                            sx={{ 
                              color: 'text.secondary',
                              '&:hover': { color: 'primary.main' }
                            }}
                          >
                            <Language fontSize="small" />
                          </IconButton>
                        )}
                        {founder.linkedin_url && (
                          <IconButton 
                            size="small" 
                            href={founder.linkedin_url} 
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
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default MatchesPage;

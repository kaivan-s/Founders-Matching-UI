import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Search,
  Close,
  LocationOn,
  Clear,
  Star,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import { useNavigate } from 'react-router-dom';

const STAGES = ['idea', 'mvp', 'early_revenue', 'scaling', 'revenue', 'other'];
const COMMON_GENRES = ['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'EdTech', 'AI/ML', 'Blockchain', 'Social', 'Marketplace', 'B2B', 'B2C', 'Hardware'];

const AdvancedSearch = ({ open, onClose, plan }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);

  // Search filters
  const [keyword, setKeyword] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedStages, setSelectedStages] = useState([]);
  const [region, setRegion] = useState('');
  const [timezoneRange, setTimezoneRange] = useState('');

  // Check if user has Pro+ plan
  const isProPlus = plan?.id === 'PRO_PLUS';

  const performSearch = useCallback(async () => {
    if (!user || !user.id || !isProPlus) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.append('q', keyword.trim());
      selectedGenres.forEach(g => params.append('genre', g));
      selectedStages.forEach(s => params.append('stage', s));
      if (region.trim()) params.append('region', region.trim());
      if (timezoneRange.trim()) params.append('timezone_offset_range', timezoneRange.trim());
      params.append('limit', '50');

      const response = await fetch(`${API_BASE}/advanced-search?${params.toString()}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (response.status === 403) {
        setError('Advanced search is available on Pro+ only.');
        setResults([]);
        setTotal(0);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setResults(data.projects || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [user, keyword, selectedGenres, selectedStages, region, timezoneRange, isProPlus]);

  // Debounced search
  useEffect(() => {
    if (!open || !isProPlus) return;

    const timer = setTimeout(() => {
      if (keyword.trim() || selectedGenres.length > 0 || selectedStages.length > 0 || region.trim()) {
        performSearch();
      } else {
        setResults([]);
        setTotal(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [keyword, selectedGenres, selectedStages, region, timezoneRange, open, isProPlus, performSearch]);

  const handleGenreToggle = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleStageToggle = (stage) => {
    setSelectedStages(prev =>
      prev.includes(stage) ? prev.filter(s => s !== stage) : [...prev, stage]
    );
  };

  const clearFilters = () => {
    setKeyword('');
    setSelectedGenres([]);
    setSelectedStages([]);
    setRegion('');
    setTimezoneRange('');
    setResults([]);
    setTotal(0);
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  if (!open) return null;

  if (!isProPlus) {
    return (
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
            Advanced Search (Pro+)
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: '#64748b',
              '&:hover': {
                bgcolor: '#f1f5f9',
              },
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, overflow: 'auto' }}>
          <Box textAlign="center" py={4}>
            <Star sx={{ fontSize: 64, color: '#7c3aed', mb: 2, opacity: 0.9 }} />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
              Upgrade to Pro+ for Advanced Search
            </Typography>
            <Typography variant="body2" sx={{ mb: 3, color: '#64748b', lineHeight: 1.6 }}>
              Search projects by keyword, genre, stage, and region with intelligent scoring.
            </Typography>
            <Button
              variant="contained"
              onClick={handleUpgrade}
              sx={{ 
                mt: 2,
                bgcolor: '#2563eb',
                color: '#ffffff',
                borderRadius: 2,
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                py: 1.125,
                fontSize: '0.8125rem',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transform: 'translateY(-0.5px)',
                },
              }}
            >
              View Pricing Plans
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              color: '#64748b',
              fontSize: '0.8125rem',
              '&:hover': {
                bgcolor: '#f1f5f9',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          height: '90vh',
          maxHeight: '800px',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        px: 3,
        pt: 3,
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
          Advanced Search (Pro+)
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small"
          sx={{
            color: '#64748b',
            '&:hover': {
              bgcolor: '#f1f5f9',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent 
        dividers
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          px: 3,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
          {/* Search Filters - Minimalist Design */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2.5,
          }}>
            {/* Keyword Search */}
            <TextField
              fullWidth
              placeholder="Search projects, tech, problems..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e2e8f0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#cbd5e1',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2563eb',
                  },
                },
              }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1.5, color: '#64748b', fontSize: 20 }} />,
                endAdornment: keyword && (
                  <IconButton 
                    size="small" 
                    onClick={() => setKeyword('')}
                    sx={{ color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                ),
              }}
            />

            {/* Genre and Stage Filters - Side by Side */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {/* Genre Filter */}
              <Box sx={{ flex: 1, minWidth: '280px' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1.5, 
                    fontWeight: 500, 
                    color: '#0f172a',
                    fontSize: '0.8125rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Genre
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {COMMON_GENRES.map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      onClick={() => handleGenreToggle(genre)}
                      sx={{
                        bgcolor: selectedGenres.includes(genre) ? '#2563eb' : 'transparent',
                        color: selectedGenres.includes(genre) ? '#ffffff' : '#64748b',
                        border: '1px solid',
                        borderColor: selectedGenres.includes(genre) ? '#2563eb' : '#e2e8f0',
                        fontWeight: selectedGenres.includes(genre) ? 600 : 500,
                        fontSize: '0.75rem',
                        height: 28,
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: selectedGenres.includes(genre) ? '#1d4ed8' : '#f8fafc',
                          borderColor: selectedGenres.includes(genre) ? '#1d4ed8' : '#cbd5e1',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Stage Filter */}
              <Box sx={{ flex: 1, minWidth: '280px' }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 1.5, 
                    fontWeight: 500, 
                    color: '#0f172a',
                    fontSize: '0.8125rem',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Stage
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {STAGES.map((stage) => (
                    <Chip
                      key={stage}
                      label={stage.replace('_', ' ').toUpperCase()}
                      onClick={() => handleStageToggle(stage)}
                      sx={{
                        bgcolor: selectedStages.includes(stage) ? '#2563eb' : 'transparent',
                        color: selectedStages.includes(stage) ? '#ffffff' : '#64748b',
                        border: '1px solid',
                        borderColor: selectedStages.includes(stage) ? '#2563eb' : '#e2e8f0',
                        fontWeight: selectedStages.includes(stage) ? 600 : 500,
                        fontSize: '0.75rem',
                        height: 28,
                        borderRadius: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: selectedStages.includes(stage) ? '#1d4ed8' : '#f8fafc',
                          borderColor: selectedStages.includes(stage) ? '#1d4ed8' : '#cbd5e1',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Region and Timezone - Side by Side */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="e.g., US, IN, EU"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                    },
                  },
                }}
                InputProps={{
                  startAdornment: <LocationOn sx={{ mr: 1.5, color: '#64748b', fontSize: 20 }} />,
                }}
              />
              <TextField
                fullWidth
                placeholder="e.g., -3..+3"
                value={timezoneRange}
                onChange={(e) => setTimezoneRange(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#ffffff',
                    '& fieldset': {
                      borderColor: '#e2e8f0',
                    },
                    '&:hover fieldset': {
                      borderColor: '#cbd5e1',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563eb',
                    },
                  },
                }}
              />
            </Box>

            {/* Clear Filters */}
            {(keyword || selectedGenres.length > 0 || selectedStages.length > 0 || region) && (
              <Button
                startIcon={<Clear />}
                onClick={clearFilters}
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#64748b',
                  fontSize: '0.8125rem',
                  alignSelf: 'flex-start',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                  },
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Results */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  color: '#ef4444',
                },
              }}
            >
              {error}
            </Alert>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={32} sx={{ color: '#2563eb' }} />
            </Box>
          )}

          {!loading && !error && results.length > 0 && (
            <Box>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  mb: 2.5,
                  fontSize: '0.9375rem',
                  letterSpacing: '-0.01em',
                }}
              >
                Found {total} project{total !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ 
                maxHeight: 'calc(90vh - 450px)',
                overflowY: 'auto',
                pr: 1,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(148, 163, 184, 0.4)',
                  borderRadius: '3px',
                  '&:hover': {
                    background: 'rgba(148, 163, 184, 0.6)',
                  },
                },
              }}>
                <Grid container spacing={2}>
                  {results.map((project) => (
                    <Grid item xs={12} sm={6} md={4} key={project.id}>
                      <Card
                        sx={{
                          borderRadius: '12px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                          border: '1px solid #f1f5f9',
                          transition: 'all 0.2s ease',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                            borderColor: '#e2e8f0',
                            transform: 'translateY(-2px)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Project Header */}
                          <Box sx={{ mb: 1.5 }}>
                            <Typography 
                              variant="subtitle1" 
                              sx={{ 
                                fontWeight: 600, 
                                color: '#0f172a', 
                                mb: 1,
                                fontSize: '0.875rem',
                                letterSpacing: '-0.01em',
                                lineHeight: 1.3,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {project.name}
                            </Typography>
                            <Box display="flex" gap={0.5} flexWrap="wrap" alignItems="center">
                              <Chip
                                label={project.stage.replace('_', ' ').toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: '#f1f5f9',
                                  color: '#1e3a8a',
                                  border: '1px solid #e2e8f0',
                                  fontWeight: 600,
                                  fontSize: '0.625rem',
                                  height: 20,
                                  px: 0.75,
                                }}
                              />
                              {project.genre && (
                                <Chip
                                  label={project.genre}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f8fafc',
                                    color: '#64748b',
                                    border: '1px solid #e2e8f0',
                                    fontWeight: 500,
                                    fontSize: '0.625rem',
                                    height: 20,
                                    px: 0.75,
                                  }}
                                />
                              )}
                            </Box>
                          </Box>

                          {/* Description */}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#374151', 
                              mb: 1.5,
                              fontSize: '0.75rem',
                              lineHeight: 1.5,
                              fontWeight: 400,
                              flex: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {project.description_snippet}
                          </Typography>

                          <Divider sx={{ my: 1.5, borderColor: '#e2e8f0' }} />

                          {/* Founder Info */}
                          {project.founder && (
                            <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                              <Avatar
                                src={project.founder.profile_picture_url}
                                alt={project.founder.name}
                                sx={{
                                  width: 36,
                                  height: 36,
                                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                                  fontSize: '0.875rem',
                                  fontWeight: 600,
                                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
                                  border: '1.5px solid white',
                                }}
                              >
                                {project.founder.name?.charAt(0)}
                              </Avatar>
                              <Box flex={1} sx={{ minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: '#111827',
                                    fontSize: '0.75rem',
                                    letterSpacing: '-0.01em',
                                    mb: 0.25,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {project.founder.name}
                                </Typography>
                                {project.founder.location && (
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <LocationOn sx={{ fontSize: 10, color: '#64748b' }} />
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        color: '#64748b',
                                        fontSize: '0.6875rem',
                                        fontWeight: 400,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {project.founder.location}
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Score Badge */}
                          <Box display="flex" justifyContent="flex-end" mt="auto">
                            <Chip
                              label={`${(project.score * 100).toFixed(0)}% Match`}
                              size="small"
                              sx={{
                                bgcolor: project.score >= 0.8 ? '#059669' : project.score >= 0.6 ? '#2563eb' : '#6b7280',
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '0.625rem',
                                height: 20,
                                px: 0.75,
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
                              }}
                              icon={<Star sx={{ color: '#ffffff !important', fontSize: 12 }} />}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          )}

          {!loading && !error && results.length === 0 && (keyword || selectedGenres.length > 0 || selectedStages.length > 0 || region) && (
            <Box textAlign="center" py={6}>
              <Typography variant="body1" sx={{ color: '#64748b', mb: 2, fontWeight: 400 }}>
                No projects found matching your criteria.
              </Typography>
              <Button 
                onClick={clearFilters} 
                sx={{ 
                  textTransform: 'none',
                  fontWeight: 500,
                  color: '#64748b',
                  fontSize: '0.8125rem',
                  '&:hover': {
                    bgcolor: '#f1f5f9',
                  },
                }}
              >
                Clear Filters
              </Button>
            </Box>
          )}

          {!loading && !error && results.length === 0 && !keyword && selectedGenres.length === 0 && selectedStages.length === 0 && !region && (
            <Box textAlign="center" py={8}>
              <Search sx={{ fontSize: 56, color: '#cbd5e1', mb: 2, opacity: 0.6 }} />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#0f172a', 
                  mb: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                Start Your Search
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b',
                  lineHeight: 1.6,
                  maxWidth: '400px',
                  mx: 'auto',
                }}
              >
                Enter keywords, select genres or stages, and filter by region to find projects.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedSearch;

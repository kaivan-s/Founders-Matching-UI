import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  TextField,
  Grid,
  Paper,
} from '@mui/material';
import {
  Business,
  LocationOn,
  Close,
  Payment,
  Search,
  FilterList,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';
import { motion } from 'framer-motion';

const AdvisorMarketplace = ({ onPaymentRequired }) => {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [billingProfile, setBillingProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    stage: '',
    location: '',
  });

  const fetchBillingProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/advisor/profile`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setBillingProfile(data);
      }
    } catch (err) {
      console.error('Error fetching billing profile:', err);
    }
  }, [user]);

  const fetchProjects = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('discover', 'true');
      if (searchQuery) params.append('search', searchQuery);
      if (filters.stage) params.append('project_stage', filters.stage);
      if (filters.location) params.append('location', filters.location);
      params.append('limit', '50');

      const response = await fetch(`${API_BASE}/projects?${params.toString()}`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, searchQuery, filters.stage, filters.location]);

  // Fetch billing profile only once on mount
  useEffect(() => {
    if (user) {
      fetchBillingProfile();
    }
  }, [user, fetchBillingProfile]);

  // Fetch projects with debounce when filters/search change
  useEffect(() => {
    if (!user) return;
    
    const debounceTimer = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [user, searchQuery, filters.stage, filters.location, fetchProjects]);

  const handleProjectClick = (project) => {
    // Check payment before showing details
    if (!billingProfile?.onboarding_paid) {
      if (onPaymentRequired) {
        onPaymentRequired();
      } else {
        alert('Please complete payment to view project details');
      }
      return;
    }
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleRequestAdvisor = async (workspaceId) => {
    // Check payment before accepting request
    if (!billingProfile?.onboarding_paid) {
      if (onPaymentRequired) {
        onPaymentRequired();
      } else {
        alert('Please complete payment to accept advisor requests');
      }
      return;
    }
    // This would typically open a dialog or navigate to request flow
    alert('Advisor request functionality will be implemented');
  };

  const getStageColor = (stage) => {
    const colors = {
      idea: 'default',
      mvp: 'primary',
      early_revenue: 'secondary',
      scaling: 'success',
    };
    return colors[stage] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Project Marketplace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Explore projects looking for advisors
        </Typography>
      </Box>

      {/* Payment Alert */}
      {!billingProfile?.onboarding_paid && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>
              Complete payment to view project details and accept advisor requests
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Payment />}
              onClick={() => onPaymentRequired && onPaymentRequired()}
              sx={{ ml: 2 }}
            >
              Pay Now
            </Button>
          </Box>
        </Alert>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              value={filters.stage || ''}
              onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Stages</option>
              <option value="idea">Idea</option>
              <option value="mvp">MVP</option>
              <option value="early_revenue">Early Revenue</option>
              <option value="scaling">Scaling</option>
            </TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Location"
              placeholder="City, Country"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Projects Grid */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {projects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project, index) => (
            <Grid item xs={12} sm={6} md={4} key={project.id || index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => handleProjectClick(project)}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                        {project.projects?.[0]?.title || 'Untitled Project'}
                      </Typography>
                      {project.projects?.[0]?.stage && (
                        <Chip
                          label={project.projects[0].stage}
                          size="small"
                          color={getStageColor(project.projects[0].stage)}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {project.projects?.[0]?.description || 'No description available'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
                      {project.location && (
                        <Chip
                          icon={<LocationOn />}
                          label={project.location}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {project.skills?.slice(0, 2).map((skill, idx) => (
                        <Chip key={idx} label={skill} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                      By {project.name || 'Founder'}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Project Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedProject?.projects?.[0]?.title || 'Project Details'}
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  STAGE
                </Typography>
                <Chip
                  label={selectedProject.projects?.[0]?.stage || 'N/A'}
                  color={getStageColor(selectedProject.projects?.[0]?.stage)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  DESCRIPTION
                </Typography>
                <Typography variant="body1">
                  {selectedProject.projects?.[0]?.description || 'No description available'}
                </Typography>
              </Box>

              {selectedProject.location && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    LOCATION
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn fontSize="small" color="action" />
                    <Typography variant="body1">{selectedProject.location}</Typography>
                  </Box>
                </Box>
              )}

              {selectedProject.skills && selectedProject.skills.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    SKILLS
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedProject.skills.map((skill, idx) => (
                      <Chip key={idx} label={skill} size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  FOUNDER
                </Typography>
                <Typography variant="body1">{selectedProject.name || 'Unknown'}</Typography>
                {selectedProject.email && (
                  <Typography variant="body2" color="text.secondary">
                    {selectedProject.email}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              // Handle request advisor action
              handleRequestAdvisor(selectedProject?.workspace_id);
              setDialogOpen(false);
            }}
            sx={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
            }}
          >
            Request to Advise
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvisorMarketplace;

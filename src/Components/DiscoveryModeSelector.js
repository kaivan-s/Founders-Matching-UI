import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  alpha,
  Chip,
  Alert,
} from '@mui/material';
import {
  RocketLaunch,
  PersonSearch,
  ArrowForward,
  CheckCircle,
  Business,
  Inbox,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';
import NewProjectDialog from './NewProjectDialog';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const DiscoveryModeSelector = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [pendingApplications, setPendingApplications] = useState(0);
  const [myApplications, setMyApplications] = useState(0);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch user's projects
      const projectsRes = await fetch(`${API_BASE}/projects`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data || []);
      }

      // Fetch application stats (as owner)
      try {
        const statsRes = await fetch(`${API_BASE}/owner/applications/stats`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setPendingApplications(stats.pending || 0);
        }
      } catch {
        // Ignore if endpoint doesn't exist yet
      }

      // Fetch my applications (as seeker)
      try {
        const myAppsRes = await fetch(`${API_BASE}/seeker/applications`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (myAppsRes.ok) {
          const apps = await myAppsRes.json();
          const pendingCount = (apps || []).filter(a => a.status === 'pending').length;
          setMyApplications(pendingCount);
        }
      } catch {
        // Ignore if endpoint doesn't exist yet
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project) => {
    setNewProjectDialogOpen(false);
    fetchUserData();
    navigate('/applications');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'auto',
    }}>
      <Box sx={{ 
        maxWidth: 900, 
        mx: 'auto', 
        width: '100%',
        p: { xs: 2, sm: 4 },
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: SLATE_900 }}>
            What brings you here today?
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500 }}>
            Choose your path to find the right co-founder match
          </Typography>
        </Box>

        {/* Mode Cards */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
          gap: 3,
          mb: 4,
        }}>
          {/* Owner Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: SLATE_200,
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: TEAL,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(TEAL, 0.15)}`,
                },
              }}
              onClick={() => projects.length > 0 ? navigate('/applications') : setNewProjectDialogOpen(true)}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 3,
                  bgcolor: alpha(TEAL, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}>
                  <RocketLaunch sx={{ fontSize: 40, color: TEAL }} />
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: SLATE_900 }}>
                  I Have a Project
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, minHeight: 48 }}>
                  Create a project and find the perfect co-founder to join your startup
                </Typography>

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<Business sx={{ fontSize: 16 }} />}
                    label={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
                    size="small"
                    sx={{ bgcolor: alpha(SLATE_400, 0.1), color: SLATE_500 }}
                  />
                  {pendingApplications > 0 && (
                    <Chip
                      icon={<Inbox sx={{ fontSize: 16 }} />}
                      label={`${pendingApplications} pending`}
                      size="small"
                      sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 600 }}
                    />
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForward />}
                  sx={{ 
                    bgcolor: TEAL, 
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': { bgcolor: TEAL_LIGHT },
                  }}
                >
                  {projects.length > 0 ? 'View Applications' : 'Create a Project'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Seeker Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: SLATE_200,
                transition: 'all 0.2s',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: SKY,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 8px 24px ${alpha(SKY, 0.15)}`,
                },
              }}
              onClick={() => navigate('/find-project')}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: 3,
                  bgcolor: alpha(SKY, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}>
                  <PersonSearch sx={{ fontSize: 40, color: SKY }} />
                </Box>
                
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: SLATE_900 }}>
                  I Want to Join a Project
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, minHeight: 48 }}>
                  Tell us your preferences and we'll match you with the best projects
                </Typography>

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                  {myApplications > 0 && (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 16 }} />}
                      label={`${myApplications} pending application${myApplications !== 1 ? 's' : ''}`}
                      size="small"
                      sx={{ bgcolor: alpha(SKY, 0.1), color: SKY, fontWeight: 600 }}
                    />
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ArrowForward />}
                  sx={{ 
                    bgcolor: SKY, 
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': { bgcolor: alpha(SKY, 0.85) },
                  }}
                >
                  Find Projects
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Box>

        {/* Existing Projects Section */}
        {projects.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
              Your Projects
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {projects.slice(0, 3).map((project) => (
                <Card
                  key={project.id}
                  sx={{
                    border: '1px solid',
                    borderColor: SLATE_200,
                    cursor: 'pointer',
                    '&:hover': { borderColor: TEAL },
                  }}
                  onClick={() => navigate('/applications')}
                >
                  <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        {project.title}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={project.stage}
                          size="small"
                          sx={{ 
                            textTransform: 'capitalize', 
                            bgcolor: alpha(SLATE_400, 0.1), 
                            color: SLATE_500,
                            fontSize: '0.7rem',
                          }}
                        />
                        {project.genre && (
                          <Chip
                            label={project.genre}
                            size="small"
                            sx={{ 
                              bgcolor: alpha(SKY, 0.1), 
                              color: SKY,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    <ArrowForward sx={{ color: SLATE_400 }} />
                  </CardContent>
                </Card>
              ))}
              
              {projects.length > 3 && (
                <Button
                  variant="text"
                  onClick={() => navigate('/projects')}
                  sx={{ color: TEAL }}
                >
                  View all {projects.length} projects
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Quick Actions */}
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          borderRadius: 2, 
          bgcolor: alpha(NAVY, 0.03),
          border: '1px solid',
          borderColor: alpha(NAVY, 0.1),
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: SLATE_900 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setNewProjectDialogOpen(true)}
              sx={{ borderColor: SLATE_200, color: SLATE_500 }}
            >
              + Create New Project
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/my-applications')}
              sx={{ borderColor: SLATE_200, color: SLATE_500 }}
            >
              View My Applications
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate('/workspaces')}
              sx={{ borderColor: SLATE_200, color: SLATE_500 }}
            >
              Go to Workspaces
            </Button>
          </Box>
        </Box>
      </Box>

      {/* New Project Dialog */}
      <NewProjectDialog
        open={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </Box>
  );
};

export default DiscoveryModeSelector;

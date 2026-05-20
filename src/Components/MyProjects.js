import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  alpha,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { API_BASE } from '../config/api';
import { 
  Business, 
  Edit, 
  Delete, 
  Add,
  Check,
  Close,
  Psychology,
  Lock,
  AutoAwesome,
  Visibility,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PROJECT_COMPATIBILITY_QUESTIONS } from './ProjectCompatibilityQuiz';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const MyProjects = () => {
  const { user } = useUser();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [compatibilityTab, setCompatibilityTab] = useState(0);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    stage: 'idea',
    application_questions: ['', '', ''],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Insights state
  const [insightsUsage, setInsightsUsage] = useState(null);
  const [projectInsights, setProjectInsights] = useState({});
  const [generatingInsightsFor, setGeneratingInsightsFor] = useState(null);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);
  const [selectedInsights, setSelectedInsights] = useState(null);

  const projectStages = [
    { value: 'idea', label: 'Just an Idea' },
    { value: 'mvp', label: 'MVP Development' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth Stage' }
  ];

  useEffect(() => {
    fetchProjects();
    fetchInsightsUsage();
  }, [user]);

  useEffect(() => {
    // Fetch insights for all projects when projects are loaded
    if (projects.length > 0) {
      projects.forEach(project => {
        fetchProjectInsights(project.id);
      });
    }
  }, [projects]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/projects`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsightsUsage = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/insights/usage`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setInsightsUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch insights usage:', err);
    }
  };

  const fetchProjectInsights = async (projectId) => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/insights`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setProjectInsights(prev => ({ ...prev, [projectId]: data }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch project insights:', err);
    }
  };

  const handleGenerateInsights = async (projectId, e) => {
    if (e) e.stopPropagation();
    if (!user?.id || generatingInsightsFor) return;
    
    setGeneratingInsightsFor(projectId);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/insights/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.upgrade_required) {
          setError('Upgrade to Pro or Pro+ to generate AI insights.');
        } else if (data.limit_reached) {
          setError('Monthly insights limit reached. Try again next month.');
        } else {
          throw new Error(data.error || 'Failed to generate insights');
        }
        return;
      }
      
      // Update the insights for this project
      setProjectInsights(prev => ({ ...prev, [projectId]: data }));
      // Refresh usage
      fetchInsightsUsage();
      
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setGeneratingInsightsFor(null);
    }
  };

  const handleViewInsights = (projectId, e) => {
    if (e) e.stopPropagation();
    const insights = projectInsights[projectId];
    if (insights && insights.report_data) {
      setSelectedInsights(insights);
      setInsightsDialogOpen(true);
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    const questions = project.application_questions || [];
    setEditFormData({
      title: project.title || '',
      description: project.description || '',
      stage: project.stage || 'idea',
      application_questions: [
        questions[0] || '',
        questions[1] || '',
        questions[2] || '',
      ],
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editFormData.title.trim() || !editFormData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const dataToSend = {
        ...editFormData,
        application_questions: editFormData.application_questions.filter(q => q && q.trim()),
      };
      const response = await fetch(`${API_BASE}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      await fetchProjects();
      setEditDialogOpen(false);
      setEditingProject(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setViewDialogOpen(true);
    setCompatibilityTab(0);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedProject(null);
    setCompatibilityTab(0);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/projects/${projectToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      await fetchProjects();
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      idea: { bg: alpha(SLATE_400, 0.1), color: SLATE_500 },
      mvp: { bg: alpha(SKY, 0.1), color: SKY },
      'early-stage': { bg: alpha(TEAL, 0.1), color: TEAL },
      growth: { bg: alpha(TEAL, 0.1), color: TEAL },
    };
    return colors[stage] || colors.idea;
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
      overflow: 'hidden',
    }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 2, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        p: 3,
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
        <Box sx={{ mb: 2, px: 0.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 400, color: SLATE_500 }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} created
          </Typography>
        </Box>
        {projects.length === 0 ? (
          <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            textAlign: 'center',
            maxWidth: 500,
            mx: 'auto',
          }}>
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
              Create your first project
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
              Share your startup idea and find the perfect co-founder to build it with you.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => window.dispatchEvent(new Event('openNewProjectDialog'))}
              sx={{
                bgcolor: TEAL,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.3)',
                '&:hover': {
                  bgcolor: TEAL_LIGHT,
                  boxShadow: '0 6px 20px rgba(13, 148, 136, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              Create Project
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr', lg: 'repeat(2, 1fr)' } }}>
            {/* Create New Project Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Box
                onClick={() => window.dispatchEvent(new Event('openNewProjectDialog'))}
                sx={{
                  height: '100%',
                  minHeight: 180,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(TEAL, 0.04),
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: alpha(TEAL, 0.3),
                  p: 3,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(TEAL, 0.08),
                    borderColor: TEAL,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(TEAL, 0.15)}`,
                  },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: alpha(TEAL, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  <Add sx={{ fontSize: 28, color: TEAL }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: TEAL, mb: 0.5 }}>
                  Create New Project
                </Typography>
                <Typography variant="caption" sx={{ color: SLATE_500, textAlign: 'center' }}>
                  Start a new startup idea
                </Typography>
              </Box>
            </motion.div>

            {projects.map((project, index) => {
              const stageColor = getStageColor(project.stage);
              const insights = projectInsights[project.id];
              const hasInsights = insights && insights.status === 'completed' && insights.report_data;
              const isGenerating = generatingInsightsFor === project.id || (insights && insights.status === 'generating');
              
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Box
                    onClick={() => handleProjectClick(project)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: '#fff',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: SLATE_200,
                      p: 2.5,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: TEAL,
                        boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: SLATE_900 }}>
                          {project.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={projectStages.find(s => s.value === project.stage)?.label || project.stage}
                            size="small"
                            sx={{
                              bgcolor: stageColor.bg,
                              color: stageColor.color,
                              border: `1px solid ${alpha(stageColor.color, 0.3)}`,
                              textTransform: 'capitalize',
                              fontSize: '0.7rem',
                              height: 24,
                              fontWeight: 500,
                            }}
                          />
                          {hasInsights && (
                            <Chip
                              icon={<AutoAwesome sx={{ fontSize: 14 }} />}
                              label="Insights"
                              size="small"
                              sx={{
                                bgcolor: alpha('#8b5cf6', 0.1),
                                color: '#8b5cf6',
                                border: `1px solid ${alpha('#8b5cf6', 0.3)}`,
                                fontSize: '0.7rem',
                                height: 24,
                                fontWeight: 500,
                                '& .MuiChip-icon': { color: '#8b5cf6' }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(project);
                          }}
                          sx={{
                            color: TEAL,
                            '&:hover': {
                              bgcolor: alpha(TEAL, 0.1),
                            },
                          }}
                        >
                          <Edit sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                          sx={{
                            color: '#ef4444',
                            '&:hover': {
                              bgcolor: alpha('#ef4444', 0.1),
                            },
                          }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        flex: 1,
                        mb: 2,
                        color: SLATE_500,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                      }}
                    >
                      {project.description}
                    </Typography>

                    {/* Insights Actions */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1, 
                      pt: 1.5,
                      borderTop: '1px solid',
                      borderColor: SLATE_200,
                      mt: 'auto'
                    }}>
                      {isGenerating ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          <CircularProgress size={16} sx={{ color: TEAL }} />
                          <Typography variant="caption" sx={{ color: SLATE_500 }}>
                            Generating insights...
                          </Typography>
                        </Box>
                      ) : hasInsights ? (
                        <Tooltip title="View AI Insights">
                          <Button
                            size="small"
                            onClick={(e) => handleViewInsights(project.id, e)}
                            startIcon={<Visibility sx={{ fontSize: 16 }} />}
                            sx={{
                              textTransform: 'none',
                              color: '#8b5cf6',
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              '&:hover': {
                                bgcolor: alpha('#8b5cf6', 0.08),
                              },
                            }}
                          >
                            View Insights
                          </Button>
                        </Tooltip>
                      ) : insightsUsage?.can_generate ? (
                        <Tooltip title={`Generate AI insights (${insightsUsage.remaining} remaining this month)`}>
                          <Button
                            size="small"
                            onClick={(e) => handleGenerateInsights(project.id, e)}
                            startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
                            sx={{
                              textTransform: 'none',
                              color: TEAL,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                              '&:hover': {
                                bgcolor: alpha(TEAL, 0.08),
                              },
                            }}
                          >
                            Generate Insights
                          </Button>
                        </Tooltip>
                      ) : insightsUsage?.tier === 'FREE' ? (
                        <Tooltip title="Upgrade to Pro to generate AI insights">
                          <Button
                            size="small"
                            href="/pricing"
                            startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
                            sx={{
                              textTransform: 'none',
                              color: SLATE_400,
                              fontWeight: 500,
                              fontSize: '0.75rem',
                            }}
                          >
                            Upgrade for Insights
                          </Button>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" sx={{ color: SLATE_400 }}>
                          Monthly limit reached
                        </Typography>
                      )}
                      
                      <Box sx={{ flex: 1 }} />
                      
                      {project.created_at && (
                        <Typography variant="caption" sx={{ color: SLATE_400 }}>
                          {new Date(project.created_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingProject(null);
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
            Edit Project
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Project Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
              disabled={saving}
            />
            
            <TextField
              fullWidth
              label="Description"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              multiline
              rows={4}
              required
              disabled={saving}
            />
            
            <FormControl fullWidth>
              <InputLabel id="stage-label">Project Stage</InputLabel>
              <Select
                labelId="stage-label"
                value={editFormData.stage}
                label="Project Stage"
                onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                disabled={saving}
              >
                {projectStages.map(stage => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Application Questions */}
            {editingProject?.visibility === 'request_access' && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: SLATE_900, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ fontSize: 18, color: SLATE_500 }} />
                  Application Questions
                </Typography>
                <Typography variant="caption" sx={{ mb: 2, display: 'block', color: SLATE_500 }}>
                  Questions that applicants must answer when requesting to connect
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[0, 1, 2].map((index) => (
                    <TextField
                      key={index}
                      fullWidth
                      size="small"
                      label={`Question ${index + 1}`}
                      placeholder={
                        index === 0 ? "e.g., Why are you interested in this project?" :
                        index === 1 ? "e.g., What relevant experience do you have?" :
                        "e.g., What's your availability?"
                      }
                      value={editFormData.application_questions[index] || ''}
                      onChange={(e) => {
                        const newQuestions = [...editFormData.application_questions];
                        newQuestions[index] = e.target.value;
                        setEditFormData(prev => ({ ...prev, application_questions: newQuestions }));
                      }}
                      disabled={saving}
                      multiline
                      rows={2}
                      inputProps={{ maxLength: 500 }}
                      helperText={`${(editFormData.application_questions[index] || '').length}/500`}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button 
            onClick={() => {
              setEditDialogOpen(false);
              setEditingProject(null);
            }}
            disabled={saving}
            sx={{ textTransform: 'none', color: SLATE_500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving || !editFormData.title.trim() || !editFormData.description.trim()}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Check />}
            sx={{
              bgcolor: TEAL,
              '&:hover': { bgcolor: TEAL_LIGHT },
              textTransform: 'none',
              px: 3,
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setProjectToDelete(null);
        }}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
            Delete Project
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: SLATE_900 }}>
            Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setProjectToDelete(null);
            }}
            disabled={deleting}
            sx={{ textTransform: 'none', color: SLATE_500 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <Delete />}
            sx={{
              bgcolor: '#ef4444',
              '&:hover': { bgcolor: '#dc2626' },
              textTransform: 'none',
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Project Questionnaire Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={handleCloseViewDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: SLATE_200,
            height: '90vh',
            maxHeight: '800px',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        {selectedProject && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              pb: 2,
              borderBottom: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: SLATE_900 }}>
                  {selectedProject.title}
                </Typography>
                {selectedProject.stage && (
                  <Chip 
                    label={projectStages.find(s => s.value === selectedProject.stage)?.label || selectedProject.stage}
                    size="small"
                    sx={{ 
                      bgcolor: getStageColor(selectedProject.stage).bg,
                      color: getStageColor(selectedProject.stage).color,
                      border: `1px solid ${alpha(getStageColor(selectedProject.stage).color, 0.3)}`,
                      textTransform: 'capitalize',
                      fontSize: '0.7rem',
                      height: 24,
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>
              <IconButton onClick={handleCloseViewDialog} size="small" sx={{ color: SLATE_500 }}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent 
              sx={{ 
                flex: 1, 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                pt: 3,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Project Description */}
                {selectedProject.description && (
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block', color: SLATE_500 }}>
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7, color: SLATE_900 }}>
                      {selectedProject.description}
                    </Typography>
                  </Box>
                )}

                {/* Compatibility Answers */}
                {selectedProject.compatibility_answers && 
                 Object.keys(selectedProject.compatibility_answers).length > 0 && (() => {
                  const categories = [
                    'Work style',
                    'Vision & funding',
                    'Roles & equity',
                    'Culture & team setup',
                    'Conflict & communication under stress'
                  ];
                  
                  const getQuestionsByCategory = (category) => {
                    return PROJECT_COMPATIBILITY_QUESTIONS.filter(q => q.category === category);
                  };
                  
                  const activeCategory = categories[compatibilityTab];
                  const questionsInCategory = getQuestionsByCategory(activeCategory);
                  
                  return (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Psychology sx={{ color: TEAL, fontSize: 20 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', color: SLATE_500 }}>
                          Compatibility Questionnaire
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: BG,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: SLATE_200,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: '300px',
                        maxHeight: '400px',
                      }}>
                        <Tabs
                          value={compatibilityTab}
                          onChange={(e, newValue) => setCompatibilityTab(newValue)}
                          variant="scrollable"
                          scrollButtons="auto"
                          sx={{
                            borderBottom: '1px solid',
                            borderColor: SLATE_200,
                            bgcolor: '#fff',
                            flexShrink: 0,
                            '& .MuiTab-root': {
                              textTransform: 'none',
                              minHeight: 48,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: SLATE_500,
                              '&.Mui-selected': {
                                color: TEAL,
                              },
                            },
                            '& .MuiTabs-indicator': {
                              bgcolor: TEAL,
                            },
                          }}
                        >
                          {categories.map((category, index) => {
                            const questionCount = getQuestionsByCategory(category).filter(q => 
                              selectedProject.compatibility_answers[q.id]
                            ).length;
                            return (
                              <Tab 
                                key={category} 
                                label={`${category} (${questionCount})`}
                              />
                            );
                          })}
                        </Tabs>
                        
                        <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                            <Box component="tbody">
                              {questionsInCategory.map((question) => {
                                const answerValue = selectedProject.compatibility_answers[question.id];
                                if (!answerValue) return null;
                                
                                const selectedOption = question.options.find(opt => opt.value === answerValue);
                                if (!selectedOption) return null;
                                
                                const shortAnswer = selectedOption.label.replace(/^[A-D]\.\s*/, '').split('–')[0].trim();
                                
                                return (
                                  <Box 
                                    component="tr" 
                                    key={question.id}
                                    sx={{ 
                                      borderBottom: '1px solid',
                                      borderColor: SLATE_200,
                                      '&:last-child': { borderBottom: 'none' },
                                    }}
                                  >
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1.5,
                                        pr: 2,
                                        width: '45%',
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontWeight: 500, color: SLATE_500 }}>
                                        {question.question.replace(/\?$/, '')}
                                      </Typography>
                                    </Box>
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1.5,
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: SLATE_900 }}>
                                        {shortAnswer}
                                      </Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  );
                })()}

                {/* Show message if no compatibility answers */}
                {(!selectedProject.compatibility_answers || 
                  Object.keys(selectedProject.compatibility_answers).length === 0) && (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                  }}>
                    <Typography variant="body2" sx={{ color: SLATE_500 }}>
                      No compatibility questionnaire answers available for this project.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
              <Button 
                onClick={handleCloseViewDialog}
                variant="contained"
                sx={{
                  bgcolor: TEAL,
                  '&:hover': { bgcolor: TEAL_LIGHT },
                  textTransform: 'none',
                  px: 3,
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Insights View Dialog */}
      <Dialog
        open={insightsDialogOpen}
        onClose={() => {
          setInsightsDialogOpen(false);
          setSelectedInsights(null);
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: '1px solid',
            borderColor: SLATE_200,
            maxHeight: '90vh',
          }
        }}
      >
        {selectedInsights && selectedInsights.report_data && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1.5,
              borderBottom: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Box sx={{ 
                p: 1, 
                borderRadius: '8px', 
                bgcolor: alpha('#8b5cf6', 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AutoAwesome sx={{ color: '#8b5cf6', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
                  AI-Powered Insights
                </Typography>
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  Market research & competitor analysis
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={() => setInsightsDialogOpen(false)} size="small">
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Executive Summary */}
                {selectedInsights.report_data.executive_summary && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
                      Executive Summary
                    </Typography>
                    <Typography variant="body2" sx={{ color: SLATE_900, lineHeight: 1.7 }}>
                      {selectedInsights.report_data.executive_summary}
                    </Typography>
                  </Box>
                )}

                {/* Market Overview */}
                {selectedInsights.report_data.market_overview && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
                      Market Overview
                    </Typography>
                    <Box sx={{ pl: 2, borderLeft: '3px solid', borderColor: alpha(TEAL, 0.3) }}>
                      {selectedInsights.report_data.market_overview.market_size && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500 }}>Market Size</Typography>
                          <Typography variant="body2">{selectedInsights.report_data.market_overview.market_size}</Typography>
                        </Box>
                      )}
                      {selectedInsights.report_data.market_overview.growth_trends && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500 }}>Growth Trends</Typography>
                          <Typography variant="body2">{selectedInsights.report_data.market_overview.growth_trends}</Typography>
                        </Box>
                      )}
                      {selectedInsights.report_data.market_overview.key_drivers?.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: SLATE_500 }}>Key Drivers</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {selectedInsights.report_data.market_overview.key_drivers.map((driver, i) => (
                              <Chip key={i} label={driver} size="small" sx={{ fontSize: '0.7rem' }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}

                {/* Competitors */}
                {selectedInsights.report_data.competitors?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
                      Competitor Landscape
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                      {selectedInsights.report_data.competitors.map((competitor, i) => (
                        <Box key={i} sx={{ p: 2, bgcolor: BG, borderRadius: '8px', border: '1px solid', borderColor: SLATE_200 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{competitor.name}</Typography>
                          <Typography variant="caption" sx={{ color: SLATE_500 }}>{competitor.description}</Typography>
                          {competitor.funding && (
                            <Chip label={competitor.funding} size="small" sx={{ mt: 1, fontSize: '0.65rem', height: 20 }} />
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* SWOT Analysis */}
                {selectedInsights.report_data.swot && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
                      SWOT Analysis
                    </Typography>
                    <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      {['strengths', 'weaknesses', 'opportunities', 'threats'].map((key) => (
                        <Box key={key} sx={{ 
                          p: 2, 
                          borderRadius: '8px', 
                          bgcolor: key === 'strengths' ? alpha('#22c55e', 0.05) : 
                                   key === 'weaknesses' ? alpha('#ef4444', 0.05) :
                                   key === 'opportunities' ? alpha('#3b82f6', 0.05) : alpha('#f59e0b', 0.05),
                          border: '1px solid',
                          borderColor: key === 'strengths' ? alpha('#22c55e', 0.2) : 
                                       key === 'weaknesses' ? alpha('#ef4444', 0.2) :
                                       key === 'opportunities' ? alpha('#3b82f6', 0.2) : alpha('#f59e0b', 0.2),
                        }}>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            textTransform: 'uppercase',
                            color: key === 'strengths' ? '#22c55e' : 
                                   key === 'weaknesses' ? '#ef4444' :
                                   key === 'opportunities' ? '#3b82f6' : '#f59e0b',
                          }}>
                            {key}
                          </Typography>
                          <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
                            {selectedInsights.report_data.swot[key]?.map((item, i) => (
                              <Typography component="li" key={i} variant="caption" sx={{ mb: 0.5 }}>
                                {item}
                              </Typography>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Recommendations */}
                {selectedInsights.report_data.recommendations?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: TEAL, mb: 1 }}>
                      Recommendations
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedInsights.report_data.recommendations.map((rec, i) => (
                        <Box key={i} sx={{ 
                          p: 2, 
                          bgcolor: BG, 
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: SLATE_200,
                          display: 'flex',
                          gap: 2,
                          alignItems: 'flex-start'
                        }}>
                          <Box sx={{ 
                            minWidth: 24, 
                            height: 24, 
                            borderRadius: '50%', 
                            bgcolor: TEAL, 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}>
                            {rec.priority || i + 1}
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{rec.action}</Typography>
                            {rec.rationale && (
                              <Typography variant="caption" sx={{ color: SLATE_500 }}>{rec.rationale}</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Generation metadata */}
                <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
                  <Typography variant="caption" sx={{ color: SLATE_400 }}>
                    Generated on {new Date(selectedInsights.completed_at || selectedInsights.created_at).toLocaleDateString()} 
                    {selectedInsights.model_used && ` • Model: ${selectedInsights.model_used}`}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MyProjects;

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
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
  Paper,
  Tabs,
  Tab,
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PROJECT_COMPATIBILITY_QUESTIONS } from './ProjectCompatibilityQuiz';

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
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const projectStages = [
    { value: 'idea', label: 'Just an Idea' },
    { value: 'mvp', label: 'MVP Development' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth Stage' }
  ];

  useEffect(() => {
    fetchProjects();
  }, [user]);

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

  const handleEditClick = (project) => {
    setEditingProject(project);
    setEditFormData({
      title: project.title || '',
      description: project.description || '',
      stage: project.stage || 'idea',
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
      const response = await fetch(`${API_BASE}/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      await fetchProjects(); // Refresh the list
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

      await fetchProjects(); // Refresh the list
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
    switch (stage) {
      case 'idea':
        return 'default';
      case 'mvp':
        return 'primary';
      case 'early-stage':
        return 'secondary';
      case 'growth':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
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
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(13, 148, 136, 0.2)', // Teal
          borderRadius: '10px',
        },
      }}>
        <Box sx={{ mb: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }}>
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
          }}>
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
              No projects yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click "New Project" in the header to create your first project.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr', lg: 'repeat(2, 1fr)' } }}>
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  onClick={() => handleProjectClick(project)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#0d9488', // Teal
                      boxShadow: '0 8px 24px rgba(13, 148, 136, 0.1)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1e3a8a' }}> {/* Navy */}
                          {project.title}
                        </Typography>
                        <Chip
                          label={projectStages.find(s => s.value === project.stage)?.label || project.stage}
                          size="small"
                          color={getStageColor(project.stage)}
                          sx={{
                            textTransform: 'capitalize',
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(project);
                          }}
                          sx={{
                            color: '#0d9488', // Teal
                            '&:hover': {
                              bgcolor: 'rgba(13, 148, 136, 0.1)',
                            },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(project);
                          }}
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: 'rgba(239, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        flex: 1,
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                      }}
                    >
                      {project.description}
                    </Typography>

                    {project.created_at && (
                      <Typography variant="caption" color="text.secondary">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Edit Project
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label="Project Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              required
              disabled={saving}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
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
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel id="stage-label">Project Stage</InputLabel>
              <Select
                labelId="stage-label"
                value={editFormData.stage}
                label="Project Stage"
                onChange={(e) => setEditFormData({ ...editFormData, stage: e.target.value })}
                disabled={saving}
                sx={{ borderRadius: 2 }}
              >
                {projectStages.map(stage => (
                  <MenuItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button 
            onClick={() => {
              setEditDialogOpen(false);
              setEditingProject(null);
            }}
            disabled={saving}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={saving || !editFormData.title.trim() || !editFormData.description.trim()}
            startIcon={saving ? <CircularProgress size={20} /> : <Check />}
            sx={{
              background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
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
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Project
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 0 }}>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setProjectToDelete(null);
            }}
            disabled={deleting}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={deleting}
            color="error"
            startIcon={deleting ? <CircularProgress size={20} /> : <Delete />}
            sx={{
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
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
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
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {selectedProject.title}
                </Typography>
                {selectedProject.stage && (
                  <Chip 
                    label={projectStages.find(s => s.value === selectedProject.stage)?.label || selectedProject.stage}
                    size="small"
                    color={getStageColor(selectedProject.stage)}
                    sx={{ 
                      textTransform: 'capitalize',
                      fontSize: '0.7rem',
                      height: 24,
                    }}
                  />
                )}
              </Box>
              <IconButton onClick={handleCloseViewDialog} size="small">
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
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Project Description */}
                {selectedProject.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                      DESCRIPTION
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {selectedProject.description}
                    </Typography>
                  </Box>
                )}

                {/* Compatibility Answers */}
                {selectedProject.compatibility_answers && 
                 Object.keys(selectedProject.compatibility_answers).length > 0 && (() => {
                  // Group questions by category
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
                        <Psychology sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                          Compatibility Questionnaire
                        </Typography>
                      </Box>
                      <Box sx={{ 
                        bgcolor: 'rgba(30, 58, 138, 0.05)', // Light Navy
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
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
                            borderColor: 'divider',
                            bgcolor: 'white',
                            flexShrink: 0,
                            '& .MuiTab-root': {
                              textTransform: 'none',
                              minHeight: 48,
                              fontSize: '0.7rem',
                              fontWeight: 600,
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
                                
                                // Get short answer text (remove A/B/C prefix and keep it concise)
                                const shortAnswer = selectedOption.label.replace(/^[A-D]\.\s*/, '').split('–')[0].trim();
                                
                                return (
                                  <Box 
                                    component="tr" 
                                    key={question.id}
                                    sx={{ 
                                      borderBottom: '1px solid',
                                      borderColor: 'divider',
                                      '&:last-child': { borderBottom: 'none' },
                                    }}
                                  >
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1,
                                        pr: 2,
                                        width: '45%',
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        {question.question.replace(/\?$/, '')}
                                      </Typography>
                                    </Box>
                                    <Box 
                                      component="td" 
                                      sx={{ 
                                        py: 1,
                                        verticalAlign: 'top',
                                      }}
                                    >
                                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
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
                    color: 'text.secondary',
                  }}>
                    <Typography variant="body2">
                      No compatibility questionnaire answers available for this project.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button 
                onClick={handleCloseViewDialog}
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
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
    </Box>
  );
};

export default MyProjects;


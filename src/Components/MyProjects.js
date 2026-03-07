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
              No projects yet
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              Click "New Project" in the header to create your first project.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr', lg: 'repeat(2, 1fr)' } }}>
            {projects.map((project, index) => {
              const stageColor = getStageColor(project.stage);
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
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.6,
                      }}
                    >
                      {project.description}
                    </Typography>

                    {project.created_at && (
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </Typography>
                    )}
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
    </Box>
  );
};

export default MyProjects;

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Avatar,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  FormControlLabel,
  Radio,
  RadioGroup,
  Divider,
  IconButton,
  alpha,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  CheckCircle,
  Cancel,
  ArrowBack,
  PlayArrow,
  Stop,
  RateReview,
  Chat,
  Lightbulb,
  Timer,
  People,
  TrendingUp,
  Close,
  AccessTime,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';

const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';

const FounderDatePage = () => {
  const { user } = useUser();
  const { founderDateId } = useParams();
  const navigate = useNavigate();
  
  const [founderDate, setFounderDate] = useState(null);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Dialogs
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState(null);
  
  // Schedule form
  const [scheduleForm, setScheduleForm] = useState({
    scheduled_at: '',
  });
  
  // Evaluation form
  const [evaluationForm, setEvaluationForm] = useState({
    vibe_rating: 3,
    continue_decision: null,
    working_style_score: 3,
    communication_score: 3,
    alignment_score: 3,
    notes: '',
  });

  const fetchStages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/founder-dates/stages`);
      if (res.ok) {
        const data = await res.json();
        setStages(data.stages || []);
      }
    } catch (err) {
      console.error('Error fetching stages:', err);
    }
  }, []);

  const fetchFounderDate = useCallback(async () => {
    if (!user?.id || !founderDateId) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/founder-dates/${founderDateId}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load founder date');
      }
      
      const data = await res.json();
      setFounderDate(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, founderDateId]);

  useEffect(() => {
    fetchStages();
    fetchFounderDate();
  }, [fetchStages, fetchFounderDate]);

  const handleScheduleCall = async () => {
    if (!scheduleForm.scheduled_at) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates/${founderDateId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          scheduled_at: new Date(scheduleForm.scheduled_at).toISOString(),
        }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule call');
      }
      
      setScheduleDialogOpen(false);
      setScheduleForm({ scheduled_at: '' });
      fetchFounderDate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartCall = async (callId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates/calls/${callId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start call');
      }
      
      const data = await res.json();
      setActiveCall(data);
      setCallDialogOpen(true);
      fetchFounderDate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteCall = async (callId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates/calls/${callId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete call');
      }
      
      setCallDialogOpen(false);
      setActiveCall(null);
      setEvaluationDialogOpen(true);
      fetchFounderDate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitEvaluation = async (callId) => {
    if (evaluationForm.continue_decision === null) {
      setError('Please select whether you want to continue');
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates/calls/${callId}/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify(evaluationForm),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit evaluation');
      }
      
      setEvaluationDialogOpen(false);
      setEvaluationForm({
        vibe_rating: 3,
        continue_decision: null,
        working_style_score: 3,
        communication_score: 3,
        alignment_score: 3,
        notes: '',
      });
      fetchFounderDate();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Are you sure you want to end this Founder Date? This cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/founder-dates/${founderDateId}/abandon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to abandon');
      }
      
      navigate('/workspaces');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'COMPLETED': return '#6366f1';
      case 'ABANDONED': return '#ef4444';
      default: return SLATE_500;
    }
  };

  const getCallStatusChip = (status) => {
    const colors = {
      'SCHEDULED': { bg: alpha('#f59e0b', 0.15), color: '#f59e0b' },
      'IN_PROGRESS': { bg: alpha('#10b981', 0.15), color: '#10b981' },
      'COMPLETED': { bg: alpha('#6366f1', 0.15), color: '#6366f1' },
    };
    const c = colors[status] || { bg: alpha(SLATE_500, 0.15), color: SLATE_500 };
    return (
      <Chip
        size="small"
        label={status?.replace('_', ' ')}
        sx={{ bgcolor: c.bg, color: c.color, fontSize: '0.7rem' }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !founderDate) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  const currentStage = stages.find(s => s.stage === founderDate?.current_stage) || stages[0];
  const otherFounder = founderDate?.other_founder;
  const nextAction = founderDate?.next_action;
  const calls = founderDate?.calls || [];
  const currentCall = calls.find(c => c.stage === founderDate?.current_stage);

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900 }}>
              Founder Date
            </Typography>
            <Chip
              size="small"
              label={founderDate?.status}
              sx={{
                bgcolor: alpha(getStatusColor(founderDate?.status), 0.15),
                color: getStatusColor(founderDate?.status),
                fontWeight: 600,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Stage {founderDate?.current_stage} of 3: {currentStage?.name}
          </Typography>
        </Box>
        
        {founderDate?.status === 'ACTIVE' && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={handleAbandon}
            disabled={actionLoading}
          >
            End
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Other Founder Card */}
      {otherFounder && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={otherFounder.avatar_url}
              sx={{ width: 56, height: 56, bgcolor: alpha(TEAL, 0.1), color: TEAL }}
            >
              {otherFounder.name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                {otherFounder.name}
              </Typography>
              <Typography variant="body2" sx={{ color: SLATE_500 }}>
                {otherFounder.headline || otherFounder.location}
              </Typography>
            </Box>
            <Button
              size="small"
              startIcon={<Chat />}
              sx={{ textTransform: 'none', color: TEAL }}
              onClick={() => founderDate?.match_id && navigate(`/workspaces`)}
            >
              Message
            </Button>
          </Box>
        </Paper>
      )}

      {/* Progress */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff', border: '1px solid', borderColor: SLATE_200 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp sx={{ color: TEAL }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
            Progress
          </Typography>
        </Box>
        
        <Stepper activeStep={founderDate?.current_stage - 1} orientation="vertical">
          {stages.map((stage) => {
            const stageCall = calls.find(c => c.stage === stage.stage);
            const isCurrentStage = stage.stage === founderDate?.current_stage;
            const isPastStage = stage.stage < founderDate?.current_stage;
            
            return (
              <Step key={stage.stage} completed={isPastStage}>
                <StepLabel
                  optional={
                    <Typography variant="caption" color="text.secondary">
                      {stage.duration_minutes} min
                    </Typography>
                  }
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontWeight: isCurrentStage ? 600 : 400,
                    },
                  }}
                >
                  {stage.name}: {stage.goal}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {stage.description}
                  </Typography>
                  
                  {/* Prompts */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Lightbulb sx={{ fontSize: 16, color: '#fbbf24' }} />
                      <Typography variant="caption" fontWeight={600}>
                        Discussion Prompts
                      </Typography>
                    </Box>
                    {stage.prompts?.map((prompt, i) => (
                      <Typography
                        key={i}
                        variant="body2"
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          mb: 0.5,
                          bgcolor: alpha(TEAL, 0.06),
                          borderRadius: 1,
                          borderLeft: '3px solid',
                          borderColor: TEAL,
                          color: SLATE_900,
                        }}
                      >
                        {prompt}
                      </Typography>
                    ))}
                  </Box>
                  
                  {/* Call Status */}
                  {stageCall && (
                    <Box sx={{
                      p: 1.5,
                      bgcolor: alpha(TEAL, 0.1),
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: alpha(TEAL, 0.2),
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <VideoCall sx={{ fontSize: 18, color: TEAL }} />
                          <Typography variant="body2" fontWeight={500}>
                            Call
                          </Typography>
                        </Box>
                        {getCallStatusChip(stageCall.status)}
                      </Box>
                      
                      {stageCall.scheduled_at && (
                        <Typography variant="caption" color="text.secondary">
                          <AccessTime sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                          {new Date(stageCall.scheduled_at).toLocaleString()}
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                        {stageCall.status === 'SCHEDULED' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleStartCall(stageCall.id)}
                            disabled={actionLoading}
                            sx={{ textTransform: 'none', bgcolor: TEAL }}
                          >
                            Start Call
                          </Button>
                        )}
                        {stageCall.status === 'IN_PROGRESS' && (
                          <>
                            {stageCall.room_url && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<VideoCall />}
                                onClick={() => {
                                  setActiveCall(stageCall);
                                  setCallDialogOpen(true);
                                }}
                                sx={{ textTransform: 'none', bgcolor: '#10b981' }}
                              >
                                Join Call
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Stop />}
                              onClick={() => handleCompleteCall(stageCall.id)}
                              disabled={actionLoading}
                              sx={{ textTransform: 'none' }}
                            >
                              End Call
                            </Button>
                          </>
                        )}
                        {stageCall.status === 'COMPLETED' && !stageCall.my_evaluation && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<RateReview />}
                            onClick={() => {
                              setActiveCall(stageCall);
                              setEvaluationDialogOpen(true);
                            }}
                            sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
                          >
                            Submit Evaluation
                          </Button>
                        )}
                        {stageCall.my_evaluation && (
                          <Chip
                            size="small"
                            icon={<CheckCircle sx={{ fontSize: 14 }} />}
                            label="Evaluated"
                            sx={{ bgcolor: alpha('#10b981', 0.15), color: '#10b981' }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </StepContent>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Next Action */}
      {nextAction && founderDate?.status === 'ACTIVE' && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(TEAL, 0.05), border: '1px solid', borderColor: alpha(TEAL, 0.2) }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }} gutterBottom>
            Next Step
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
            {nextAction.description}
          </Typography>
          
          {nextAction.action_type === 'schedule_call' && (
            <Button
              variant="contained"
              startIcon={<Schedule />}
              onClick={() => setScheduleDialogOpen(true)}
              disabled={actionLoading}
              sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
            >
              Schedule Call
            </Button>
          )}
          
          {nextAction.action_type === 'start_call' && (
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => currentCall && handleStartCall(currentCall.id)}
              disabled={actionLoading}
              sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
            >
              Start Call
            </Button>
          )}
          
          {nextAction.action_type === 'submit_evaluation' && (
            <Button
              variant="contained"
              startIcon={<RateReview />}
              onClick={() => {
                setActiveCall(currentCall);
                setEvaluationDialogOpen(true);
              }}
              disabled={actionLoading}
              sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
            >
              Submit Evaluation
            </Button>
          )}
          
          {nextAction.action_type === 'waiting_for_other' && (
            <Chip
              icon={<Timer />}
              label="Waiting for partner's evaluation"
              sx={{ bgcolor: alpha('#f59e0b', 0.15), color: '#f59e0b' }}
            />
          )}
        </Paper>
      )}

      {/* Completed State */}
      {founderDate?.status === 'COMPLETED' && (
        <Paper sx={{ p: 3, borderRadius: 2, bgcolor: alpha(TEAL, 0.05), border: '1px solid', borderColor: alpha(TEAL, 0.2) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircle sx={{ color: TEAL }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
              Founder Date Completed!
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
            Congratulations! You've completed all 3 stages. Ready to take the next step?
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/workspaces')}
            sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Open Workspace
          </Button>
        </Paper>
      )}

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Stage {founderDate?.current_stage} Call</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentStage?.name}: {currentStage?.goal}
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Duration: {currentStage?.duration_minutes} minutes
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            label="Date & Time"
            value={scheduleForm.scheduled_at}
            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)} sx={{ color: SLATE_500 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleScheduleCall}
            disabled={!scheduleForm.scheduled_at || actionLoading}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Call Dialog (Video) */}
      <Dialog open={callDialogOpen} onClose={() => setCallDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideoCall sx={{ color: TEAL }} />
              Stage {activeCall?.stage} Call
            </Box>
            <IconButton onClick={() => setCallDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {activeCall?.room_url ? (
            <Box sx={{ height: 200, bgcolor: alpha(TEAL, 0.05), borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid', borderColor: alpha(TEAL, 0.2) }}>
              <Box sx={{ textAlign: 'center' }}>
                <VideoCall sx={{ fontSize: 48, color: TEAL, mb: 2, opacity: 0.7 }} />
                <Typography variant="body1" sx={{ color: SLATE_900, mb: 2 }}>
                  Click to join video call in new tab
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<VideoCall />}
                  onClick={() => window.open(activeCall.room_url, '_blank')}
                  sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
                >
                  Join Video Call
                </Button>
              </Box>
            </Box>
          ) : (
            <Alert severity="info">Video room is being created...</Alert>
          )}
          
          {/* Prompts during call */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900 }} gutterBottom>
              Discussion Prompts
            </Typography>
            {currentStage?.prompts?.map((prompt, i) => (
              <Typography
                key={i}
                variant="body2"
                sx={{
                  py: 1,
                  px: 1.5,
                  mb: 1,
                  bgcolor: alpha(TEAL, 0.06),
                  borderRadius: 1,
                  borderLeft: '3px solid',
                  borderColor: TEAL,
                  color: SLATE_900,
                }}
              >
                {i + 1}. {prompt}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="error"
            startIcon={<Stop />}
            onClick={() => activeCall && handleCompleteCall(activeCall.id)}
            disabled={actionLoading}
          >
            End Call & Evaluate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialogOpen} onClose={() => setEvaluationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RateReview sx={{ color: TEAL }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
              Post-Call Evaluation
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Rate your Stage {activeCall?.stage} call. Both founders must rate to proceed.
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Overall Vibe Rating *
            </Typography>
            <Rating
              value={evaluationForm.vibe_rating}
              onChange={(e, value) => setEvaluationForm({ ...evaluationForm, vibe_rating: value })}
              size="large"
            />
            <Typography variant="caption" color="text.secondary" display="block">
              Both founders need 4+ to advance to next stage
            </Typography>
          </Box>
          
          {activeCall?.stage >= 2 && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Working Style Compatibility
                </Typography>
                <Rating
                  value={evaluationForm.working_style_score}
                  onChange={(e, value) => setEvaluationForm({ ...evaluationForm, working_style_score: value })}
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Communication Quality
                </Typography>
                <Rating
                  value={evaluationForm.communication_score}
                  onChange={(e, value) => setEvaluationForm({ ...evaluationForm, communication_score: value })}
                />
              </Box>
            </>
          )}
          
          {activeCall?.stage >= 3 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Goal Alignment
              </Typography>
              <Rating
                value={evaluationForm.alignment_score}
                onChange={(e, value) => setEvaluationForm({ ...evaluationForm, alignment_score: value })}
              />
            </Box>
          )}
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Do you want to continue? *
            </Typography>
            <RadioGroup
              value={evaluationForm.continue_decision}
              onChange={(e) => setEvaluationForm({ ...evaluationForm, continue_decision: e.target.value === 'true' })}
            >
              <FormControlLabel
                value="true"
                control={<Radio color="success" />}
                label={activeCall?.stage < 3 ? 'Yes, proceed to next stage' : 'Yes, let\'s start a workspace together'}
              />
              <FormControlLabel
                value="false"
                control={<Radio color="error" />}
                label="No, this isn't a good fit"
              />
            </RadioGroup>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (private, only you can see)"
            value={evaluationForm.notes}
            onChange={(e) => setEvaluationForm({ ...evaluationForm, notes: e.target.value })}
            placeholder="Any thoughts or observations for your own reference..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEvaluationDialogOpen(false)} sx={{ color: SLATE_500 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => activeCall && handleSubmitEvaluation(activeCall.id)}
            disabled={evaluationForm.continue_decision === null || actionLoading}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
          >
            Submit Evaluation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FounderDatePage;

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  alpha,
  Collapse,
} from '@mui/material';
import {
  Close,
  Send,
  Psychology,
  Videocam,
  Mic,
  ExpandMore,
  ExpandLess,
  InfoOutlined,
} from '@mui/icons-material';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

const ConnectionRequestDialog = ({
  open,
  onClose,
  onSubmit,
  project,
  founderName,
  loading = false,
}) => {
  const [answers, setAnswers] = useState({});
  const [videoUrl, setVideoUrl] = useState('');
  const [voiceUrl, setVoiceUrl] = useState('');
  const [showMediaSection, setShowMediaSection] = useState(false);
  const [error, setError] = useState(null);

  const applicationQuestions = project?.application_questions || [];
  const hasQuestions = applicationQuestions.length > 0;

  const handleAnswerChange = (index, value) => {
    setAnswers(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleSubmit = () => {
    // Validate required answers
    if (hasQuestions) {
      const unanswered = applicationQuestions.filter((_, index) => !answers[index]?.trim());
      if (unanswered.length > 0) {
        setError('Please answer all questions before submitting');
        return;
      }
    }

    // Format answers as a map of question -> answer
    const formattedAnswers = {};
    applicationQuestions.forEach((question, index) => {
      if (answers[index]?.trim()) {
        formattedAnswers[question] = answers[index].trim();
      }
    });

    onSubmit({
      question_answers: formattedAnswers,
      video_intro_url: videoUrl.trim() || null,
      voice_intro_url: voiceUrl.trim() || null,
    });
  };

  const handleClose = () => {
    setAnswers({});
    setVideoUrl('');
    setVoiceUrl('');
    setShowMediaSection(false);
    setError(null);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid',
        borderColor: SLATE_200,
        pb: 2,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            p: 1,
            borderRadius: '10px',
            bgcolor: alpha(TEAL, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Send sx={{ color: TEAL, fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
              Send Connection Request
            </Typography>
            <Typography variant="caption" sx={{ color: SLATE_500 }}>
              to {founderName}'s project: {project?.title}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {hasQuestions ? (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Psychology sx={{ color: SLATE_500, fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                Application Questions
              </Typography>
              <Chip 
                label="Required" 
                size="small" 
                sx={{ 
                  fontSize: '0.65rem', 
                  height: 20, 
                  bgcolor: alpha(TEAL, 0.1), 
                  color: TEAL,
                  fontWeight: 600,
                }} 
              />
            </Box>
            <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
              {founderName} has set the following questions to help evaluate potential co-founders. 
              Please provide thoughtful answers.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {applicationQuestions.map((question, index) => (
                <Box key={index}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                    {index + 1}. {question}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Your answer..."
                    value={answers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    disabled={loading}
                    inputProps={{ maxLength: 1000 }}
                    helperText={`${(answers[index] || '').length}/1000`}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: TEAL,
                        },
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 3,
            px: 2,
            bgcolor: alpha(TEAL, 0.03),
            borderRadius: 2,
            border: '1px solid',
            borderColor: alpha(TEAL, 0.1),
          }}>
            <Send sx={{ fontSize: 40, color: TEAL, mb: 1 }} />
            <Typography variant="body1" sx={{ color: SLATE_900, fontWeight: 500, mb: 1 }}>
              Ready to Connect!
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              This project doesn't require any application questions. 
              Your profile will be shared with {founderName}.
            </Typography>
          </Box>
        )}

        {/* Optional Media Introductions */}
        <Box sx={{ mt: 4 }}>
          <Button
            onClick={() => setShowMediaSection(!showMediaSection)}
            endIcon={showMediaSection ? <ExpandLess /> : <ExpandMore />}
            sx={{ 
              textTransform: 'none', 
              color: SLATE_500, 
              fontWeight: 500,
              '&:hover': { bgcolor: alpha(SLATE_400, 0.1) },
            }}
          >
            Add Video or Voice Introduction (Optional)
          </Button>
          
          <Collapse in={showMediaSection}>
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              borderRadius: 2, 
              bgcolor: alpha(SLATE_400, 0.05),
              border: '1px solid',
              borderColor: SLATE_200,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <InfoOutlined sx={{ fontSize: 16, color: SLATE_400 }} />
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  Paste a link to a video (YouTube, Loom) or audio (SoundCloud, etc.) introduction
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Video Introduction URL"
                  placeholder="https://www.loom.com/share/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Videocam sx={{ color: SLATE_400, mr: 1, fontSize: 20 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Voice Note URL"
                  placeholder="https://soundcloud.com/..."
                  value={voiceUrl}
                  onChange={(e) => setVoiceUrl(e.target.value)}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <Mic sx={{ color: SLATE_400, mr: 1, fontSize: 20 }} />,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                    },
                  }}
                />
              </Box>
            </Box>
          </Collapse>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ 
            textTransform: 'none', 
            color: SLATE_500,
            fontWeight: 600,
            '&:hover': { bgcolor: alpha(SLATE_400, 0.1) },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <Send />}
          sx={{
            bgcolor: TEAL,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            borderRadius: '10px',
            '&:hover': { bgcolor: TEAL_LIGHT },
          }}
        >
          {loading ? 'Sending...' : 'Send Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionRequestDialog;

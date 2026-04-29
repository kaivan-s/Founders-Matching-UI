import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Avatar,
  Chip,
  Button,
  IconButton,
  alpha,
  Divider,
} from '@mui/material';
import {
  VideoCall,
  ArrowForward,
  Add,
  CheckCircle,
  Cancel,
  Timer,
  TrendingUp,
  Refresh,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../config/api';

const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_200 = '#e2e8f0';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';

const FounderDatesList = ({ compact = false, onStartNew }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [founderDates, setFounderDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFounderDates = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/founder-dates`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (res.ok) {
        const data = await res.json();
        setFounderDates(data.founder_dates || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFounderDates();
  }, [fetchFounderDates]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return TEAL;
      case 'COMPLETED': return TEAL;
      case 'ABANDONED': return '#ef4444';
      default: return SLATE_500;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <TrendingUp sx={{ fontSize: 16 }} />;
      case 'COMPLETED': return <CheckCircle sx={{ fontSize: 16 }} />;
      case 'ABANDONED': return <Cancel sx={{ fontSize: 16 }} />;
      default: return <Timer sx={{ fontSize: 16 }} />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (compact) {
    if (founderDates.length === 0) return null;
    
    const activeDate = founderDates.find(fd => fd.status === 'ACTIVE');
    if (!activeDate) return null;

    return (
      <Box
        onClick={() => navigate(`/founder-dates/${activeDate.id}`)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: 1.5,
          bgcolor: alpha(TEAL, 0.08),
          borderRadius: 2,
          cursor: 'pointer',
          border: '1px solid',
          borderColor: alpha(TEAL, 0.2),
          transition: 'all 0.2s',
          '&:hover': { bgcolor: alpha(TEAL, 0.12) },
        }}
      >
        <VideoCall sx={{ color: TEAL, fontSize: 20 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: SLATE_900 }}>
            Founder Date with {activeDate.other_founder?.name?.split(' ')[0]}
          </Typography>
          <Typography variant="caption" sx={{ color: SLATE_500 }}>
            Stage {activeDate.current_stage}/3
          </Typography>
        </Box>
        <ArrowForward sx={{ fontSize: 16, color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoCall sx={{ color: TEAL }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: SLATE_900 }}>
            Founder Dates
          </Typography>
          {founderDates.length > 0 && (
            <Chip
              size="small"
              label={founderDates.length}
              sx={{ bgcolor: alpha(TEAL, 0.15), color: TEAL }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={fetchFounderDates}>
            <Refresh sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {founderDates.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff', borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
          <VideoCall sx={{ fontSize: 48, color: TEAL, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1" sx={{ color: SLATE_900 }} gutterBottom>
            No Founder Dates yet
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 2 }}>
            Start a Founder Date to evaluate co-founder fit through structured calls
          </Typography>
          {onStartNew && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onStartNew}
              sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: TEAL_LIGHT } }}
            >
              Start Founder Date
            </Button>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AnimatePresence>
            {founderDates.map((fd, index) => (
              <motion.div
                key={fd.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Paper
                  onClick={() => navigate(`/founder-dates/${fd.id}`)}
                  sx={{
                    p: 2.5,
                    bgcolor: '#fff',
                    borderRadius: 2,
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: fd.status === 'ACTIVE' ? alpha(TEAL, 0.3) : SLATE_200,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(TEAL, 0.03),
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(SLATE_900, 0.1)}`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={fd.other_founder?.avatar_url}
                      sx={{ width: 48, height: 48, bgcolor: alpha(TEAL, 0.1), color: TEAL }}
                    >
                      {fd.other_founder?.name?.[0]}
                    </Avatar>
                    
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }} noWrap>
                          {fd.other_founder?.name}
                        </Typography>
                        <Chip
                          size="small"
                          icon={getStatusIcon(fd.status)}
                          label={fd.status}
                          sx={{
                            bgcolor: alpha(getStatusColor(fd.status), 0.15),
                            color: getStatusColor(fd.status),
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-icon': { color: 'inherit' },
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          Stage {fd.current_stage}/3
                        </Typography>
                        {fd.project?.name && (
                          <>
                            <Divider orientation="vertical" flexItem />
                            <Typography variant="body2" sx={{ color: SLATE_500 }} noWrap>
                              {fd.project.name}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                    
                    <ArrowForward sx={{ color: TEAL }} />
                  </Box>
                  
                  {fd.status === 'ACTIVE' && fd.next_action && (
                    <Box
                      sx={{
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: SLATE_200,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Timer sx={{ fontSize: 16, color: '#f59e0b' }} />
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          Next: {fd.next_action?.message || fd.next_action?.description}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>
      )}
    </Box>
  );
};

export default FounderDatesList;

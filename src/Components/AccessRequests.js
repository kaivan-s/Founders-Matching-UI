import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Avatar,
  Card,
  CardContent,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  Check,
  Close,
  Lock,
  AccessTime,
  LinkedIn,
  LocationOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const AccessRequests = () => {
  const { user } = useUser();
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchAccessRequests();
    }
  }, [user]);

  const fetchAccessRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/access-requests`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setAccessRequests(data);
      }
    } catch (err) {
      setError('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, action) => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`${API_BASE}/access-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to respond');
      }

      setAccessRequests(prev => prev.filter(r => r.id !== requestId));
      setError(action === 'approve' ? '✅ Access granted!' : '❌ Request declined');
      setTimeout(() => setError(null), 3000);
      
      window.dispatchEvent(new Event('accessRequestResponded'));
      
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100%"
      >
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  if (accessRequests.length === 0) {
    return (
      <Box 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            bgcolor: '#fff',
            borderRadius: 2,
            p: 6,
            border: '1px solid',
            borderColor: SLATE_200,
            maxWidth: '400px',
          }}
        >
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
            <Lock sx={{ fontSize: 40, color: TEAL }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700, color: SLATE_900 }}>
            No pending access requests
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500 }}>
            When someone requests access to your private projects, they'll appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      {error && (
        <Alert 
          severity={error.includes('✅') ? 'success' : error.includes('❌') ? 'warning' : 'error'}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: SLATE_900 }}>
          Access Requests
        </Typography>
        <Typography variant="body2" sx={{ color: SLATE_500 }}>
          {accessRequests.length} {accessRequests.length === 1 ? 'founder wants' : 'founders want'} to view your private project details
        </Typography>
      </Box>

      <Box sx={{ 
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
          background: SLATE_200,
          borderRadius: '3px',
          '&:hover': {
            background: SLATE_400,
          },
        },
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {accessRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card sx={{ 
                borderRadius: '12px', 
                border: `1px solid ${SLATE_200}`,
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: TEAL,
                  boxShadow: `0 4px 12px ${alpha(TEAL, 0.1)}`,
                  transform: 'translateY(-2px)',
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar
                      src={request.requester?.profile_picture_url}
                      sx={{ width: 56, height: 56, bgcolor: NAVY }}
                    >
                      {request.requester?.name?.charAt(0) || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                          {request.requester?.name || 'Unknown'}
                        </Typography>
                        {request.requester?.linkedin_verified && (
                          <Tooltip title="LinkedIn Verified">
                            <LinkedIn sx={{ fontSize: 16, color: '#0077b5' }} />
                          </Tooltip>
                        )}
                      </Box>
                      {request.requester?.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: SLATE_500 }}>
                          <LocationOn sx={{ fontSize: 14 }} />
                          <Typography variant="caption">{request.requester.location}</Typography>
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        icon={<Lock sx={{ fontSize: 12 }} />}
                        label={request.project_title}
                        size="small"
                        sx={{
                          bgcolor: alpha(NAVY, 0.08),
                          color: NAVY,
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: NAVY }
                        }}
                      />
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: SLATE_400 }}>
                        <AccessTime sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                        {formatTimeSince(request.created_at)}
                      </Typography>
                    </Box>
                  </Box>

                  {request.requester?.skills?.length > 0 && (
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {request.requester.skills.slice(0, 5).map((skill, idx) => (
                        <Chip 
                          key={idx}
                          label={skill}
                          size="small"
                          sx={{
                            fontSize: '0.7rem',
                            height: 24,
                            bgcolor: BG,
                            color: SLATE_500,
                            border: `1px solid ${SLATE_200}`,
                          }}
                        />
                      ))}
                      {request.requester.skills.length > 5 && (
                        <Chip 
                          label={`+${request.requester.skills.length - 5}`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 24, bgcolor: BG, color: SLATE_400 }}
                        />
                      )}
                    </Box>
                  )}

                  {request.message && (
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: BG, 
                      borderRadius: '10px', 
                      border: `1px solid ${SLATE_200}`,
                      mb: 2,
                    }}>
                      <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 600, display: 'block', mb: 0.5 }}>
                        Message:
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_900, lineHeight: 1.6, fontStyle: 'italic' }}>
                        "{request.message}"
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    {request.requester?.linkedin_url && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<LinkedIn />}
                        href={request.requester.linkedin_url}
                        target="_blank"
                        sx={{
                          color: '#0077b5',
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        View Profile
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={actionLoading === request.id ? <CircularProgress size={14} /> : <Close />}
                      onClick={() => handleRespond(request.id, 'decline')}
                      disabled={actionLoading === request.id}
                      sx={{
                        borderColor: SLATE_200,
                        color: SLATE_500,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 2,
                        '&:hover': {
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          bgcolor: alpha('#ef4444', 0.04),
                        }
                      }}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={actionLoading === request.id ? <CircularProgress size={14} color="inherit" /> : <Check />}
                      onClick={() => handleRespond(request.id, 'approve')}
                      disabled={actionLoading === request.id}
                      sx={{
                        bgcolor: TEAL,
                        color: 'white',
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: '8px',
                        px: 2.5,
                        '&:hover': { bgcolor: TEAL_LIGHT },
                      }}
                    >
                      Approve
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default AccessRequests;

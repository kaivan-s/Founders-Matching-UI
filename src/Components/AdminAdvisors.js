import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  People,
  CheckCircle,
  Cancel,
  Visibility,
  Close,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';

const NAVY = '#1e3a8a';
const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SKY = '#0ea5e9';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const BG = '#f8fafc';

const AdminAdvisors = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProfile, setDetailProfile] = useState(null);

  const fetchPending = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/advisors/pending`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.status === 403) {
        setError('Admin access required');
        setAdvisors([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setAdvisors(data.advisors || []);
    } catch (err) {
      setError(err.message || 'Failed to load pending advisors');
      setAdvisors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [user?.id]);

  const openDetail = async (advisor) => {
    setSelected(advisor);
    setDetailOpen(true);
    setDetailProfile(null);
    try {
      const res = await fetch(`${API_BASE}/admin/advisors/${advisor.id}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.ok) setDetailProfile(await res.json());
    } catch {}
  };

  const handleApprove = async (advisorId) => {
    setActioning(advisorId);
    try {
      const res = await fetch(`${API_BASE}/admin/advisors/${advisorId}/approve`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setAdvisors((prev) => prev.filter((a) => a.id !== advisorId));
      setDetailOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (advisorId) => {
    setActioning(advisorId);
    try {
      const res = await fetch(`${API_BASE}/admin/advisors/${advisorId}/reject`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setAdvisors((prev) => prev.filter((a) => a.id !== advisorId));
      setDetailOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setActioning(null);
    }
  };

  const profile = detailProfile || selected;

  return (
    <Box sx={{ minHeight: '100%', bgcolor: BG, py: 4, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{
            mb: 3,
            color: SLATE_500,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { color: TEAL, bgcolor: 'transparent' },
          }}
        >
          Back
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(NAVY, 0.08), color: NAVY }}>
            <People sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900 }}>
              Pending Advisor Applications
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              Review and approve advisors to make them discoverable in the marketplace
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: TEAL }} />
          </Box>
        ) : advisors.length === 0 ? (
          <Box
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px solid',
              borderColor: SLATE_200,
              bgcolor: '#fff',
            }}
          >
            <People sx={{ fontSize: 48, color: SLATE_200, mb: 2 }} />
            <Typography variant="body1" sx={{ color: SLATE_500, fontWeight: 500 }}>
              No pending advisor applications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {advisors.map((advisor) => (
              <Box
                key={advisor.id}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: SLATE_200,
                  bgcolor: '#fff',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    borderColor: alpha(TEAL, 0.3),
                    boxShadow: `0 8px 24px ${alpha(TEAL, 0.06)}`,
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5 }}>
                      {advisor.headline || 'No headline'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: SLATE_500, mb: 1.5, lineHeight: 1.6 }}>
                      {advisor.user?.name} · {advisor.user?.email}
                    </Typography>
                    {advisor.bio && (
                      <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.6, mb: 1.5 }} noWrap>
                        {advisor.bio.length > 120 ? `${advisor.bio.slice(0, 120)}...` : advisor.bio}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(advisor.expertise_stages || []).map((s, i) => (
                        <Chip key={i} label={s} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(SKY, 0.1), color: SKY, border: 'none' }} />
                      ))}
                      {(advisor.domains || []).map((d, i) => (
                        <Chip key={i} label={d} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(TEAL, 0.1), color: TEAL, border: 'none' }} />
                      ))}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Button
                      size="small"
                      startIcon={<Visibility sx={{ fontSize: 18 }} />}
                      onClick={() => openDetail(advisor)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: SLATE_500,
                        '&:hover': { color: TEAL, bgcolor: alpha(TEAL, 0.04) },
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={actioning === advisor.id ? <CircularProgress size={14} color="inherit" /> : <Cancel sx={{ fontSize: 18 }} />}
                      onClick={() => handleReject(advisor.id)}
                      disabled={!!actioning}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: SLATE_200,
                        color: SLATE_500,
                        '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: alpha('#ef4444', 0.04) },
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={actioning === advisor.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircle sx={{ fontSize: 18 }} />}
                      onClick={() => handleApprove(advisor.id)}
                      disabled={!!actioning}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: TEAL,
                        '&:hover': { bgcolor: TEAL_LIGHT },
                      }}
                    >
                      Approve
                    </Button>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: SLATE_200 } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900 }}>
            Advisor Profile
          </Typography>
          <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: SLATE_400 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {profile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Headline</Typography>
                <Typography variant="body1" sx={{ color: SLATE_900, mt: 0.5 }}>{profile.headline || 'Not set'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name & Email</Typography>
                <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.5 }}>{profile.user?.name}</Typography>
                <Typography variant="body2" sx={{ color: SLATE_500 }}>{profile.user?.email}</Typography>
              </Box>
              {profile.bio && (
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bio</Typography>
                  <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.5, lineHeight: 1.7 }}>{profile.bio}</Typography>
                </Box>
              )}
              {(profile.expertise_stages?.length > 0 || profile.domains?.length > 0) && (
                <Box>
                  <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Expertise</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {(profile.expertise_stages || []).map((s, i) => (
                      <Chip key={i} label={s} size="small" sx={{ fontSize: '0.75rem', bgcolor: alpha(SKY, 0.1), color: SKY }} />
                    ))}
                    {(profile.domains || []).map((d, i) => (
                      <Chip key={i} label={d} size="small" sx={{ fontSize: '0.75rem', bgcolor: alpha(TEAL, 0.1), color: TEAL }} />
                    ))}
                  </Box>
                </Box>
              )}
              {(profile.contact_email || profile.meeting_link) && (
                <>
                  <Divider sx={{ borderColor: SLATE_200 }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</Typography>
                    {profile.contact_email && <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.5 }}>{profile.contact_email}</Typography>}
                    {profile.meeting_link && <Typography variant="body2" sx={{ color: SKY, mt: 0.5 }}>{profile.meeting_link}</Typography>}
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: TEAL }} size={32} />
            </Box>
          )}
        </DialogContent>
        {profile && (
          <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: SLATE_200, gap: 1 }}>
            <Button
              onClick={() => handleReject(profile.id)}
              disabled={!!actioning}
              startIcon={actioning === profile.id ? <CircularProgress size={14} /> : <Cancel />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                color: '#ef4444',
                '&:hover': { bgcolor: alpha('#ef4444', 0.04) },
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              onClick={() => handleApprove(profile.id)}
              disabled={!!actioning}
              startIcon={actioning === profile.id ? <CircularProgress size={14} color="inherit" /> : <CheckCircle />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: TEAL,
                '&:hover': { bgcolor: TEAL_LIGHT },
              }}
            >
              Approve
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default AdminAdvisors;

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
  Avatar,
  Link,
  LinearProgress,
  Tooltip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import {
  People,
  CheckCircle,
  Cancel,
  Visibility,
  Close,
  ArrowBack,
  LinkedIn,
  Twitter,
  Language,
  Work,
  WorkHistory,
  EmojiEvents,
  Link as LinkIcon,
  VerifiedUser,
  PhotoCamera,
  Star,
  OpenInNew,
  Email,
  Schedule,
  AttachMoney,
  Feedback,
  BugReport,
  Lightbulb,
  DesignServices,
  PriceChange,
  MoreHoriz,
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
  const [activeTab, setActiveTab] = useState(0);
  
  // Advisor states
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProfile, setDetailProfile] = useState(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  // Feedback states
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackFilter, setFeedbackFilter] = useState({ status: '', category: '' });
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [updatingFeedback, setUpdatingFeedback] = useState(false);

  const fetchFeedback = async () => {
    if (!user?.id) return;
    setFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const params = new URLSearchParams();
      if (feedbackFilter.status) params.append('status', feedbackFilter.status);
      if (feedbackFilter.category) params.append('category', feedbackFilter.category);
      
      const res = await fetch(`${API_BASE}/admin/feedback?${params.toString()}`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (res.status === 403) {
        setFeedbackError('Admin access required');
        setFeedbackList([]);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch feedback');
      const data = await res.json();
      setFeedbackList(data || []);
    } catch (err) {
      setFeedbackError(err.message || 'Failed to load feedback');
      setFeedbackList([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const updateFeedback = async (feedbackId, updates) => {
    setUpdatingFeedback(true);
    try {
      const res = await fetch(`${API_BASE}/admin/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: { 
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      const updated = await res.json();
      setFeedbackList(prev => prev.map(f => f.id === feedbackId ? { ...f, ...updated } : f));
      setSelectedFeedback(null);
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setUpdatingFeedback(false);
    }
  };

  useEffect(() => {
    if (activeTab === 1) {
      fetchFeedback();
    }
  }, [activeTab, feedbackFilter, user?.id]);

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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(NAVY, 0.08), color: NAVY }}>
            <People sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900 }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              Manage advisor applications and view product feedback
            </Typography>
          </Box>
        </Box>

        {/* Tabs */}
        <Tabs 
          value={activeTab} 
          onChange={(e, v) => setActiveTab(v)}
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
            },
            '& .Mui-selected': {
              color: NAVY,
            },
            '& .MuiTabs-indicator': {
              bgcolor: NAVY,
            },
          }}
        >
          <Tab icon={<People sx={{ fontSize: 20 }} />} iconPosition="start" label={`Advisors (${advisors.length})`} />
          <Tab icon={<Feedback sx={{ fontSize: 20 }} />} iconPosition="start" label="Product Feedback" />
        </Tabs>

        {/* Advisors Tab */}
        {activeTab === 0 && (
          <>
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
          </>
        )}

        {/* Feedback Tab */}
        {activeTab === 1 && (
          <FeedbackPanel
            feedbackList={feedbackList}
            loading={feedbackLoading}
            error={feedbackError}
            filter={feedbackFilter}
            setFilter={setFeedbackFilter}
            selectedFeedback={selectedFeedback}
            setSelectedFeedback={setSelectedFeedback}
            updateFeedback={updateFeedback}
            updatingFeedback={updatingFeedback}
            setError={setFeedbackError}
          />
        )}
      </Box>

      {/* Detail Dialog - Enhanced */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: SLATE_200, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200, display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900 }}>
            Advisor Application Review
          </Typography>
          <IconButton size="small" onClick={() => setDetailOpen(false)} sx={{ color: SLATE_400 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {profile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header with Avatar and Basic Info */}
              <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid', borderColor: SLATE_200 }}>
                <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                  <Avatar
                    src={profile.profile_image_url}
                    onClick={() => profile.profile_image_url && setImagePreviewOpen(true)}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: NAVY, 
                      fontSize: '2rem', 
                      border: '3px solid white', 
                      boxShadow: 1,
                      cursor: profile.profile_image_url ? 'pointer' : 'default',
                      transition: 'transform 0.2s',
                      '&:hover': profile.profile_image_url ? { transform: 'scale(1.05)' } : {},
                    }}
                  >
                    {profile.user?.name?.[0]?.toUpperCase() || 'A'}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 0.5 }}>
                      {profile.user?.name || 'Unknown'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: SLATE_500, mb: 1 }}>
                      {profile.headline || 'No headline'}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                      <Chip
                        icon={<Email sx={{ fontSize: 14 }} />}
                        label={profile.user?.email || profile.contact_email}
                        size="small"
                        sx={{ bgcolor: 'white', border: '1px solid', borderColor: SLATE_200 }}
                      />
                      {profile.timezone && (
                        <Chip
                          icon={<Schedule sx={{ fontSize: 14 }} />}
                          label={profile.timezone}
                          size="small"
                          sx={{ bgcolor: 'white', border: '1px solid', borderColor: SLATE_200 }}
                        />
                      )}
                    </Box>
                    
                    {/* Verification Status */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.linkedin_verified ? (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label="LinkedIn Verified"
                          size="small"
                          sx={{ bgcolor: '#ecfdf5', color: '#10b981', fontWeight: 600, '& .MuiChip-icon': { color: '#10b981' } }}
                        />
                      ) : (
                        <Chip
                          icon={<Cancel sx={{ fontSize: 14 }} />}
                          label="LinkedIn Not Verified"
                          size="small"
                          sx={{ bgcolor: '#fef2f2', color: '#ef4444', fontWeight: 600, '& .MuiChip-icon': { color: '#ef4444' } }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
                
                {/* Verification Badges */}
                {profile.verification_badges?.length > 0 && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: SLATE_200 }}>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Badges Earned
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profile.verification_badges.map((badge) => {
                        const badgeConfig = {
                          linkedin: { label: 'LinkedIn', icon: <LinkedIn sx={{ fontSize: 14 }} />, color: '#0077b5' },
                          veteran: { label: 'Veteran (10+ yrs)', icon: <EmojiEvents sx={{ fontSize: 14 }} />, color: '#f59e0b' },
                          experienced: { label: 'Experienced', icon: <WorkHistory sx={{ fontSize: 14 }} />, color: '#8b5cf6' },
                          portfolio: { label: 'Portfolio', icon: <LinkIcon sx={{ fontSize: 14 }} />, color: '#10b981' },
                          profile_complete: { label: 'Complete Profile', icon: <CheckCircle sx={{ fontSize: 14 }} />, color: '#3b82f6' },
                          photo: { label: 'Photo', icon: <PhotoCamera sx={{ fontSize: 14 }} />, color: '#6366f1' },
                        };
                        const config = badgeConfig[badge];
                        if (!config) return null;
                        return (
                          <Chip
                            key={badge}
                            icon={config.icon}
                            label={config.label}
                            size="small"
                            sx={{ bgcolor: alpha(config.color, 0.1), color: config.color, fontWeight: 500, '& .MuiChip-icon': { color: config.color } }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Main Content Grid */}
              <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Left Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Bio */}
                  {profile.bio && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bio</Typography>
                      <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.5, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{profile.bio}</Typography>
                    </Box>
                  )}

                  {/* Professional Background */}
                  {profile.professional_background && Object.keys(profile.professional_background).length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Professional Background
                      </Typography>
                      <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
                        {profile.professional_background.years_experience && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <WorkHistory sx={{ fontSize: 16, color: TEAL }} />
                            <Typography variant="body2" sx={{ color: SLATE_900 }}>
                              <strong>{profile.professional_background.years_experience}</strong> years experience
                            </Typography>
                          </Box>
                        )}
                        {profile.professional_background.startups_advised_count && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                            <Typography variant="body2" sx={{ color: SLATE_900 }}>
                              <strong>{profile.professional_background.startups_advised_count}</strong> startups advised
                            </Typography>
                          </Box>
                        )}
                        {profile.professional_background.current_role?.title && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: SLATE_200 }}>
                            <Typography variant="caption" sx={{ color: SLATE_500 }}>Current Role</Typography>
                            <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 600 }}>
                              {profile.professional_background.current_role.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: SLATE_500 }}>
                              @ {profile.professional_background.current_role.company}
                              {profile.professional_background.current_role.start_year && ` (${profile.professional_background.current_role.start_year} - Present)`}
                            </Typography>
                          </Box>
                        )}
                        {profile.professional_background.previous_roles?.length > 0 && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: SLATE_200 }}>
                            <Typography variant="caption" sx={{ color: SLATE_500 }}>Previous Roles</Typography>
                            {profile.professional_background.previous_roles.map((role, i) => (
                              <Box key={i} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: SLATE_900 }}>
                                  {role.title} @ {role.company}
                                  {role.start_year && ` (${role.start_year}${role.end_year ? ` - ${role.end_year}` : ''})`}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        )}
                        {profile.professional_background.notable_achievements && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: SLATE_200 }}>
                            <Typography variant="caption" sx={{ color: SLATE_500 }}>Notable Achievements</Typography>
                            <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.5 }}>
                              {profile.professional_background.notable_achievements}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Questionnaire Answers */}
                  {profile.questionnaire_data && Object.keys(profile.questionnaire_data).length > 0 && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Questionnaire Answers
                      </Typography>
                      <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
                        {Object.entries(profile.questionnaire_data).map(([key, value]) => {
                          if (!value) return null;
                          const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                          return (
                            <Box key={key} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
                              <Typography variant="caption" sx={{ color: SLATE_500 }}>{label}</Typography>
                              <Typography variant="body2" sx={{ color: SLATE_900, mt: 0.25 }}>{value}</Typography>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}
                </Box>

                {/* Right Column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Expertise & Domains */}
                  {(profile.advisory_types?.length > 0 || profile.preferred_stages?.length > 0 || profile.domains?.length > 0) && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Expertise
                      </Typography>
                      {profile.advisory_types?.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: SLATE_500 }}>Advisory Types</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {profile.advisory_types.map((t, i) => (
                              <Chip key={i} label={t} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(NAVY, 0.1), color: NAVY }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {profile.preferred_stages?.length > 0 && (
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: SLATE_500 }}>Preferred Stages</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {profile.preferred_stages.map((s, i) => (
                              <Chip key={i} label={s} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(SKY, 0.1), color: SKY }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                      {profile.domains?.length > 0 && (
                        <Box>
                          <Typography variant="caption" sx={{ color: SLATE_500 }}>Domains</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {profile.domains.map((d, i) => (
                              <Chip key={i} label={d} size="small" sx={{ fontSize: '0.7rem', bgcolor: alpha(TEAL, 0.1), color: TEAL }} />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* Social Links */}
                  <Box>
                    <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                      Social & Links
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profile.linkedin_url && (
                        <Link href={profile.linkedin_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0077b5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                          <LinkedIn sx={{ fontSize: 18 }} />
                          <Typography variant="body2">LinkedIn</Typography>
                          <OpenInNew sx={{ fontSize: 14 }} />
                          {profile.linkedin_verified && <Chip label="Verified" size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ecfdf5', color: '#10b981' }} />}
                        </Link>
                      )}
                      {profile.twitter_url && (
                        <Link href={profile.twitter_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#1da1f2', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                          <Twitter sx={{ fontSize: 18 }} />
                          <Typography variant="body2">Twitter/X</Typography>
                          <OpenInNew sx={{ fontSize: 14 }} />
                        </Link>
                      )}
                      {!profile.linkedin_url && !profile.twitter_url && (
                        <Typography variant="body2" sx={{ color: SLATE_400, fontStyle: 'italic' }}>No social links provided</Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Portfolio Links */}
                  {profile.portfolio && Object.keys(profile.portfolio).some(k => profile.portfolio[k] && (typeof profile.portfolio[k] === 'string' ? profile.portfolio[k].trim() : profile.portfolio[k].length > 0)) && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Portfolio
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {profile.portfolio.personal_website && (
                          <Link href={profile.portfolio.personal_website} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: TEAL, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            <Language sx={{ fontSize: 18 }} />
                            <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.portfolio.personal_website}</Typography>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </Link>
                        )}
                        {profile.portfolio.crunchbase_url && (
                          <Link href={profile.portfolio.crunchbase_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0288d1', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            <Work sx={{ fontSize: 18 }} />
                            <Typography variant="body2">Crunchbase</Typography>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </Link>
                        )}
                        {profile.portfolio.angellist_url && (
                          <Link href={profile.portfolio.angellist_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: SLATE_900, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            <Work sx={{ fontSize: 18 }} />
                            <Typography variant="body2">AngelList</Typography>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </Link>
                        )}
                        {profile.portfolio.medium_url && (
                          <Link href={profile.portfolio.medium_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: SLATE_900, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            <LinkIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2">Medium/Blog</Typography>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </Link>
                        )}
                        {profile.portfolio.youtube_url && (
                          <Link href={profile.portfolio.youtube_url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#ff0000', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            <LinkIcon sx={{ fontSize: 18 }} />
                            <Typography variant="body2">YouTube</Typography>
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </Link>
                        )}
                        {profile.portfolio.other_links?.length > 0 && profile.portfolio.other_links.map((link, i) => (
                          link.url && (
                            <Link key={i} href={link.url} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: SLATE_500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                              <LinkIcon sx={{ fontSize: 18 }} />
                              <Typography variant="body2">{link.label || 'Link'}</Typography>
                              <OpenInNew sx={{ fontSize: 14 }} />
                            </Link>
                          )
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Consultation Rates */}
                  {(profile.consultation_rate_30min_usd || profile.consultation_rate_60min_usd) && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Consultation Rates
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {profile.consultation_rate_30min_usd && (
                          <Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={`$${profile.consultation_rate_30min_usd} / 30 min`} sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 600 }} />
                        )}
                        {profile.consultation_rate_60min_usd && (
                          <Chip icon={<AttachMoney sx={{ fontSize: 14 }} />} label={`$${profile.consultation_rate_60min_usd} / 60 min`} sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 600 }} />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Availability */}
                  {profile.availability_hours_per_week && (
                    <Box>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                        Availability
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_900 }}>
                        {profile.availability_hours_per_week} hours/week
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: TEAL }} size={32} />
            </Box>
          )}
        </DialogContent>
        {profile && (
          <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: SLATE_200, gap: 1, bgcolor: '#f8fafc' }}>
            <Button
              onClick={() => handleReject(profile.id)}
              disabled={!!actioning}
              startIcon={actioning === profile.id ? <CircularProgress size={14} /> : <Cancel />}
              variant="outlined"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: '#ef4444',
                color: '#ef4444',
                '&:hover': { bgcolor: alpha('#ef4444', 0.04), borderColor: '#dc2626' },
              }}
            >
              Reject Application
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
                px: 4,
                '&:hover': { bgcolor: TEAL_LIGHT },
              }}
            >
              Approve Advisor
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="md"
        PaperProps={{ 
          sx: { 
            borderRadius: 2, 
            bgcolor: 'transparent', 
            boxShadow: 'none',
            overflow: 'visible',
          } 
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setImagePreviewOpen(false)}
            sx={{
              position: 'absolute',
              top: -40,
              right: 0,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <Close />
          </IconButton>
          {detailProfile?.profile_image_url && (
            <Box
              component="img"
              src={detailProfile.profile_image_url}
              alt={detailProfile?.user?.name || 'Profile'}
              sx={{
                maxWidth: '80vw',
                maxHeight: '80vh',
                borderRadius: 2,
                objectFit: 'contain',
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

// Feedback Panel Component
const FeedbackPanel = ({ 
  feedbackList, 
  loading, 
  error, 
  filter, 
  setFilter, 
  selectedFeedback, 
  setSelectedFeedback, 
  updateFeedback,
  updatingFeedback,
  setError
}) => {
  const CATEGORY_ICONS = {
    Bug: <BugReport sx={{ fontSize: 16 }} />,
    Feature: <Lightbulb sx={{ fontSize: 16 }} />,
    UX: <DesignServices sx={{ fontSize: 16 }} />,
    Pricing: <PriceChange sx={{ fontSize: 16 }} />,
    Other: <MoreHoriz sx={{ fontSize: 16 }} />,
  };

  const STATUS_COLORS = {
    'New': { bg: '#fef3c7', color: '#92400e' },
    'Under review': { bg: '#dbeafe', color: '#1e40af' },
    'Planned': { bg: '#e0e7ff', color: '#3730a3' },
    'In progress': { bg: '#d1fae5', color: '#065f46' },
    'Implemented': { bg: '#d1fae5', color: '#047857' },
    'Rejected': { bg: '#fee2e2', color: '#991b1b' },
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filter.status}
            label="Status"
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Under review">Under review</MenuItem>
            <MenuItem value="Planned">Planned</MenuItem>
            <MenuItem value="In progress">In progress</MenuItem>
            <MenuItem value="Implemented">Implemented</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filter.category}
            label="Category"
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Bug">Bug</MenuItem>
            <MenuItem value="Feature">Feature</MenuItem>
            <MenuItem value="UX">UX</MenuItem>
            <MenuItem value="Pricing">Pricing</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <Chip 
          label={`${feedbackList.length} items`} 
          sx={{ alignSelf: 'center', bgcolor: SLATE_200 }} 
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: TEAL }} />
        </Box>
      ) : feedbackList.length === 0 ? (
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
          <Feedback sx={{ fontSize: 48, color: SLATE_200, mb: 2 }} />
          <Typography variant="body1" sx={{ color: SLATE_500, fontWeight: 500 }}>
            No feedback found
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {feedbackList.map((fb) => (
            <Box
              key={fb.id}
              onClick={() => setSelectedFeedback(fb)}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '1px solid',
                borderColor: SLATE_200,
                bgcolor: '#fff',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                '&:hover': {
                  borderColor: alpha(TEAL, 0.3),
                  boxShadow: `0 8px 24px ${alpha(TEAL, 0.06)}`,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      icon={CATEGORY_ICONS[fb.category] || CATEGORY_ICONS.Other}
                      label={fb.category}
                      size="small"
                      sx={{ 
                        bgcolor: alpha(NAVY, 0.08), 
                        color: NAVY,
                        fontWeight: 500,
                        '& .MuiChip-icon': { color: NAVY },
                      }}
                    />
                    <Chip
                      label={fb.status}
                      size="small"
                      sx={{ 
                        bgcolor: STATUS_COLORS[fb.status]?.bg || SLATE_200,
                        color: STATUS_COLORS[fb.status]?.color || SLATE_500,
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    {fb.title}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: SLATE_400, whiteSpace: 'nowrap' }}>
                  {formatDate(fb.created_at)}
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 1.5, lineHeight: 1.6 }} noWrap>
                {fb.description}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ color: SLATE_400 }}>
                  From: {fb.founders?.name || fb.founders?.email || 'Unknown'}
                </Typography>
                {fb.usefulness_score != null && (
                  <Chip 
                    label={`Score: ${fb.usefulness_score}`} 
                    size="small" 
                    sx={{ bgcolor: '#ecfdf5', color: '#10b981', fontWeight: 600 }}
                  />
                )}
                {fb.reward_amount_cents > 0 && (
                  <Chip 
                    label={`$${(fb.reward_amount_cents / 100).toFixed(2)} ${fb.reward_paid ? '(Paid)' : '(Pending)'}`} 
                    size="small" 
                    sx={{ 
                      bgcolor: fb.reward_paid ? '#d1fae5' : '#fef3c7',
                      color: fb.reward_paid ? '#047857' : '#92400e',
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Feedback Detail Dialog */}
      <Dialog
        open={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedFeedback && (
          <>
            <DialogTitle sx={{ borderBottom: '1px solid', borderColor: SLATE_200, pb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Feedback Details</Typography>
                <IconButton size="small" onClick={() => setSelectedFeedback(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip
                    icon={CATEGORY_ICONS[selectedFeedback.category]}
                    label={selectedFeedback.category}
                    size="small"
                    sx={{ bgcolor: alpha(NAVY, 0.08), color: NAVY }}
                  />
                  <Chip
                    label={selectedFeedback.status}
                    size="small"
                    sx={{ 
                      bgcolor: STATUS_COLORS[selectedFeedback.status]?.bg,
                      color: STATUS_COLORS[selectedFeedback.status]?.color,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  {selectedFeedback.title}
                </Typography>
                <Typography variant="body2" sx={{ color: SLATE_500, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {selectedFeedback.description}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: SLATE_400 }}>
                  Submitted by: {selectedFeedback.founders?.name || selectedFeedback.founders?.email}
                </Typography>
                <br />
                <Typography variant="caption" sx={{ color: SLATE_400 }}>
                  Date: {formatDate(selectedFeedback.created_at)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Admin Actions */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Admin Actions
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Update Status</InputLabel>
                  <Select
                    value={selectedFeedback.status}
                    label="Update Status"
                    onChange={(e) => updateFeedback(selectedFeedback.id, { status: e.target.value })}
                    disabled={updatingFeedback}
                  >
                    <MenuItem value="New">New</MenuItem>
                    <MenuItem value="Under review">Under review</MenuItem>
                    <MenuItem value="Planned">Planned</MenuItem>
                    <MenuItem value="In progress">In progress</MenuItem>
                    <MenuItem value="Implemented">Implemented</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Usefulness Score (0-100)"
                  type="number"
                  size="small"
                  defaultValue={selectedFeedback.usefulness_score || ''}
                  inputProps={{ min: 0, max: 100 }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      updateFeedback(selectedFeedback.id, { usefulness_score: val });
                    }
                  }}
                  disabled={updatingFeedback}
                />

                <TextField
                  label="Reward Amount (cents)"
                  type="number"
                  size="small"
                  defaultValue={selectedFeedback.reward_amount_cents || ''}
                  inputProps={{ min: 0 }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0) {
                      updateFeedback(selectedFeedback.id, { reward_amount_cents: val });
                    }
                  }}
                  disabled={updatingFeedback}
                />

                {selectedFeedback.reward_amount_cents > 0 && !selectedFeedback.reward_paid && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => updateFeedback(selectedFeedback.id, { reward_paid: true })}
                    disabled={updatingFeedback}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Mark Reward as Paid
                  </Button>
                )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AdminAdvisors;

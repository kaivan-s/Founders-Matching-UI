import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Person,
  Schedule,
  Language,
  Business,
  CheckCircle,
  Close,
  Work,
  LinkedIn,
  AttachMoney,
  CalendarMonth,
  Star,
  StarHalf,
  VerifiedUser,
  WorkHistory,
  EmojiEvents,
  Link as LinkIcon,
  PhotoCamera,
} from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';
import BookingDialog from './BookingDialog';

const AdvisorBrowseMarketplace = ({ open, onClose, workspaceId, onBookingCreated }) => {
  const { user } = useUser();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingAdvisor, setBookingAdvisor] = useState(null);  // selected advisor for booking dialog
  const [reviewsAdvisor, setReviewsAdvisor] = useState(null);  // selected advisor to view reviews
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);  // selected advisor for detail view

  const fetchPartners = async () => {
    if (!workspaceId || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/advisors/marketplace`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch advisors');
      }

      const data = await response.json();
      setPartners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && workspaceId && user?.id) {
      fetchPartners();
    }
  }, [open, workspaceId, user?.id]);

  const handleBookingSuccess = (consultation) => {
    setBookingAdvisor(null);
    if (onBookingCreated) onBookingCreated(consultation);
    // Refresh marketplace so any rate / capacity changes show up
    fetchPartners();
  };

  const filteredPartners = partners.filter((partner) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      partner.name?.toLowerCase().includes(query) ||
      partner.headline?.toLowerCase().includes(query) ||
      partner.bio?.toLowerCase().includes(query) ||
      partner.domains?.some((d) => d.toLowerCase().includes(query))
    );
  });

  const showBroadenedListNote = partners.some(
    (p) => p.marketplace_broadened && p.marketplace_stage_match === false
  );

  const formatRate = (rate) => {
    if (rate == null || rate === '') return null;
    const n = Number(rate);
    if (!isFinite(n)) return null;
    return `$${n.toFixed(0)}`;
  };

  const advisorBookable = (partner) => {
    return formatRate(partner.consultation_rate_30min_usd) || formatRate(partner.consultation_rate_60min_usd);
  };

  const BADGE_CONFIG = {
    linkedin: { label: 'LinkedIn', icon: LinkedIn, color: '#0A66C2' },
    veteran: { label: 'Veteran', icon: EmojiEvents, color: '#f59e0b' },
    experienced: { label: 'Experienced', icon: WorkHistory, color: '#8b5cf6' },
    portfolio: { label: 'Portfolio', icon: LinkIcon, color: '#10b981' },
    profile_complete: { label: 'Complete Profile', icon: CheckCircle, color: '#3b82f6' },
    identity_verified: { label: 'ID Verified', icon: VerifiedUser, color: '#10b981' },
    top_rated: { label: 'Top Rated', icon: Star, color: '#f59e0b' },
    photo: { label: 'Photo', icon: PhotoCamera, color: '#6366f1' },
  };

  const renderBadges = (badges) => {
    if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
        {badges.slice(0, 4).map((badgeId) => {
          const config = BADGE_CONFIG[badgeId];
          if (!config) return null;
          const IconComponent = config.icon;
          return (
            <Chip
              key={badgeId}
              icon={<IconComponent sx={{ fontSize: 12 }} />}
              label={config.label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                fontWeight: 500,
                bgcolor: alpha(config.color, 0.1),
                color: config.color,
                '& .MuiChip-icon': { color: config.color },
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          );
        })}
      </Box>
    );
  };

  const getExperienceLabel = (yearsExp) => {
    if (!yearsExp) return null;
    const mapping = {
      '1-3': '1-3 yrs exp',
      '3-5': '3-5 yrs exp',
      '5-10': '5-10 yrs exp',
      '10-15': '10-15 yrs exp',
      '15-20': '15-20 yrs exp',
      '20+': '20+ yrs exp',
    };
    return mapping[yearsExp] || yearsExp;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: '85vh',
          mx: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: '80vh', sm: '85vh' } }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: { xs: 2, sm: 3 }, 
            bgcolor: 'background.paper',
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Find an Advisor
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover',
                color: 'primary.main',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search by name, expertise, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'grey.50',
                '&:hover': {
                  bgcolor: 'background.paper',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, sm: 3 }, bgcolor: 'grey.50' }}>
          {!loading && !error && showBroadenedListNote && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
              We expanded the list so you still see options when few advisors match your workspace
              stage. Advisors that fit your stage appear first.
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              {error}
            </Alert>
          ) : filteredPartners.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 6 }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {searchQuery ? 'No advisors match your search' : 'No available advisors found'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search or check back later
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredPartners.map((partner) => {
                const rate30 = formatRate(partner.consultation_rate_30min_usd);
                const rate60 = formatRate(partner.consultation_rate_60min_usd);
                const isBookable = !!(rate30 || rate60);
                
                return (
                  <Card 
                    key={partner.user_id} 
                    variant="outlined"
                    onClick={() => setSelectedAdvisor(partner)}
                    sx={{
                      borderRadius: 2,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        borderColor: 'primary.light',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Avatar 
                          src={partner.profile_image_url}
                          sx={{ 
                            width: { xs: 56, sm: 64 }, 
                            height: { xs: 56, sm: 64 },
                            bgcolor: 'primary.main',
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            alignSelf: { xs: 'center', sm: 'flex-start' },
                          }}
                        >
                          {partner.name?.[0]?.toUpperCase() || 'P'}
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-start' }, mb: 1.5, gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: 'text.primary',
                                    letterSpacing: '-0.01em',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}
                                >
                                  {partner.name || 'Unknown'}
                                </Typography>
                                {partner.marketplace_broadened && partner.marketplace_stage_match && (
                                  <Chip label="Stage fit" size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                                )}
                                {partner.marketplace_broadened && partner.marketplace_stage_match === false && (
                                  <Chip
                                    label="Also available"
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.7rem', color: 'text.secondary' }}
                                  />
                                )}
                                {partner.linkedin_verified && (
                                  <Chip
                                    icon={<LinkedIn sx={{ fontSize: 14 }} />}
                                    label="Verified"
                                    size="small"
                                    sx={{
                                      height: 22,
                                      fontSize: '0.7rem',
                                      fontWeight: 500,
                                      bgcolor: alpha('#0A66C2', 0.1),
                                      color: '#0A66C2',
                                      '& .MuiChip-icon': {
                                        color: '#0A66C2',
                                      },
                                    }}
                                  />
                                )}
                              </Box>
                              {partner.headline && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <Work fontSize="inherit" sx={{ fontSize: 14 }} />
                                  {partner.headline}
                                </Typography>
                              )}
                              
                              {/* Professional credentials */}
                              {(partner.professional_background?.years_experience || 
                                partner.professional_background?.startups_advised_count ||
                                partner.professional_background?.current_role?.company) && (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
                                  {partner.professional_background?.years_experience && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <WorkHistory sx={{ fontSize: 12 }} />
                                      {getExperienceLabel(partner.professional_background.years_experience)}
                                    </Typography>
                                  )}
                                  {partner.professional_background?.startups_advised_count && 
                                   partner.professional_background.startups_advised_count !== '0' && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Business sx={{ fontSize: 12 }} />
                                      {partner.professional_background.startups_advised_count} startups advised
                                    </Typography>
                                  )}
                                  {partner.professional_background?.current_role?.company && (
                                    <Typography variant="caption" color="text.secondary">
                                      @ {partner.professional_background.current_role.company}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              
                              {/* Verification badges */}
                              {renderBadges(partner.verification_badges)}
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: { xs: 'center', sm: 'flex-end' }, justifyContent: { xs: 'space-between', sm: 'flex-start' }, gap: { xs: 1, sm: 0.5 }, flexWrap: 'wrap', mt: { xs: 1, sm: 0 } }}>
                              {/* Rating display - clickable to view reviews */}
                              {partner.rating_stats?.avg_rating != null && (
                                <Box
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReviewsAdvisor(partner);
                                  }}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    cursor: 'pointer',
                                    borderRadius: 1,
                                    px: 0.5,
                                    py: 0.25,
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' },
                                  }}
                                >
                                  <Rating
                                    value={partner.rating_stats.avg_rating}
                                    readOnly
                                    precision={0.5}
                                    size="small"
                                    sx={{
                                      '& .MuiRating-iconFilled': { color: '#FFD700' },
                                      '& .MuiRating-iconEmpty': { color: 'grey.300' },
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 500, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                                  >
                                    ({partner.rating_stats.total_reviews})
                                  </Typography>
                                </Box>
                              )}
                              {/* Rate display */}
                              {isBookable && (
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                  <AttachMoney sx={{ fontSize: 14, color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                    {rate30 ? `${rate30}/30m` : rate60 ? `${rate60}/60m` : ''}
                                  </Typography>
                                  {rate30 && rate60 && (
                                    <Typography variant="caption" color="text.secondary">
                                      · {rate60}/60m
                                    </Typography>
                                  )}
                                </Box>
                              )}
                              <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBookingAdvisor(partner);
                                }}
                                disabled={!isBookable}
                                startIcon={<CalendarMonth fontSize="small" />}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  px: { xs: 1.5, sm: 2 },
                                  minWidth: { xs: 'auto', sm: 160 },
                                  width: { xs: '100%', sm: 'auto' },
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                }}
                              >
                                {isBookable ? 'Book Consultation' : 'Rates not set'}
                              </Button>
                            </Box>
                          </Box>
                          
                          {partner.bio && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2,
                                lineHeight: 1.6,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {partner.bio}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {partner.expertise_stages?.map((stage) => (
                              <Chip
                                key={stage}
                                label={stage}
                                size="small"
                                icon={<Business sx={{ fontSize: 14 }} />}
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    color: 'text.secondary',
                                  },
                                }}
                              />
                            ))}
                            {partner.domains?.slice(0, 5).map((domain) => (
                              <Chip
                                key={domain}
                                label={domain}
                                size="small"
                                icon={<Business sx={{ fontSize: 14 }} />}
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    color: 'text.secondary',
                                  },
                                }}
                              />
                            ))}
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Schedule 
                                fontSize="small" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: 16,
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {partner.preferred_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'}
                              </Typography>
                            </Box>
                            
                            {partner.languages?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Language 
                                  fontSize="small" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontSize: 16,
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {partner.languages.join(', ')}
                                </Typography>
                              </Box>
                            )}
                            
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* Booking dialog */}
      <BookingDialog
        open={!!bookingAdvisor}
        advisor={bookingAdvisor}
        onClose={() => setBookingAdvisor(null)}
        onSuccess={handleBookingSuccess}
      />

      {/* Reviews dialog */}
      <AdvisorReviewsDialog
        advisor={reviewsAdvisor}
        onClose={() => setReviewsAdvisor(null)}
      />

      {/* Advisor Detail Dialog */}
      <AdvisorDetailDialog
        advisor={selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
        onBookConsultation={(advisor) => {
          setSelectedAdvisor(null);
          setBookingAdvisor(advisor);
        }}
        onViewReviews={(advisor) => {
          setSelectedAdvisor(null);
          setReviewsAdvisor(advisor);
        }}
        formatRate={formatRate}
        renderBadges={renderBadges}
        getExperienceLabel={getExperienceLabel}
        BADGE_CONFIG={BADGE_CONFIG}
      />
    </Dialog>
  );
};

const AdvisorReviewsDialog = ({ advisor, onClose }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!advisor?.user_id) return;
    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/advisors/${advisor.user_id}/reviews?limit=50`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((data) => {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [advisor?.user_id]);

  if (!advisor) return null;

  const advisorName = advisor.name || 'Advisor';
  const ratingBreakdown = stats?.rating_breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = stats?.total_reviews || 0;

  const formatDate = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <Dialog
      open={!!advisor}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ 
        sx: { 
          borderRadius: { xs: 2, sm: 3 },
          mx: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
        } 
      }}
    >
      <DialogTitle sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0 }}>
            <Avatar
              sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, bgcolor: 'primary.main', fontWeight: 600, flexShrink: 0 }}
            >
              {advisorName[0]?.toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' }, wordBreak: 'break-word' }}>
                Reviews for {advisorName}
              </Typography>
              {stats?.avg_rating != null && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating
                    value={stats.avg_rating}
                    readOnly
                    precision={0.1}
                    size="small"
                    sx={{ '& .MuiRating-iconFilled': { color: '#FFD700' } }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {stats.avg_rating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, sm: 6 } }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: { xs: 1.5, sm: 2 }, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 6 }, px: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              No reviews yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Be the first to book a consultation and leave a review!
            </Typography>
          </Box>
        ) : (
          <>
            {/* Rating breakdown */}
            <Paper
              variant="outlined"
              sx={{ m: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, borderRadius: 2, bgcolor: 'background.default' }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Rating breakdown
              </Typography>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = ratingBreakdown[star] || 0;
                const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <Box
                    key={star}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}
                  >
                    <Typography variant="caption" sx={{ width: 16, textAlign: 'right' }}>
                      {star}
                    </Typography>
                    <Star sx={{ fontSize: 14, color: '#FFD700' }} />
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#FFD700',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ width: 24 }}>
                      {count}
                    </Typography>
                  </Box>
                );
              })}
            </Paper>

            {/* Reviews list */}
            <Box sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 } }}>
              {reviews.map((review, idx) => {
                const reviewer = review.reviewer || {};
                return (
                  <Paper
                    key={review.id || idx}
                    variant="outlined"
                    sx={{ p: { xs: 1.5, sm: 2 }, mb: 1.5, borderRadius: 2, '&:last-child': { mb: 0 } }}
                  >
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Avatar
                        src={reviewer.profile_picture_url}
                        sx={{ width: 36, height: 36, bgcolor: 'grey.300' }}
                      >
                        {reviewer.name?.[0]?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {reviewer.name || 'Anonymous'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(review.created_at)}
                          </Typography>
                        </Box>
                        <Rating
                          value={review.rating}
                          readOnly
                          size="small"
                          sx={{ '& .MuiRating-iconFilled': { color: '#FFD700' } }}
                        />
                        {review.review_text && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                          >
                            {review.review_text}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const AdvisorDetailDialog = ({ 
  advisor, 
  onClose, 
  onBookConsultation, 
  onViewReviews,
  formatRate,
  renderBadges,
  getExperienceLabel,
  BADGE_CONFIG
}) => {
  if (!advisor) return null;

  const rate30 = formatRate(advisor.consultation_rate_30min_usd);
  const rate60 = formatRate(advisor.consultation_rate_60min_usd);
  const isBookable = !!(rate30 || rate60);
  const profBg = advisor.professional_background || {};

  return (
    <Dialog
      open={!!advisor}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2, sm: 3 },
          maxHeight: '90vh',
          mx: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: '100%' },
        },
      }}
    >
      {/* Header with close button */}
      <Box sx={{ position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: { xs: 8, sm: 12 },
            right: { xs: 8, sm: 12 },
            bgcolor: 'rgba(255,255,255,0.9)',
            zIndex: 1,
            '&:hover': { bgcolor: 'white' },
          }}
          size="small"
        >
          <Close />
        </IconButton>

        {/* Profile header */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            bgcolor: 'primary.main',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Avatar
            src={advisor.profile_image_url}
            sx={{
              width: { xs: 80, sm: 100 },
              height: { xs: 80, sm: 100 },
              mx: 'auto',
              mb: 2,
              border: '4px solid white',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              fontSize: { xs: '2rem', sm: '2.5rem' },
              bgcolor: 'primary.dark',
            }}
          >
            {advisor.name?.[0]?.toUpperCase() || 'A'}
          </Avatar>
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' }, wordBreak: 'break-word' }}>
            {advisor.name || 'Advisor'}
          </Typography>
          
          {advisor.headline && (
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {advisor.headline}
            </Typography>
          )}
          
          {/* Badges row */}
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {advisor.linkedin_verified && (
              <Chip
                icon={<LinkedIn sx={{ fontSize: 16 }} />}
                label="LinkedIn Verified"
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  '& .MuiChip-icon': { color: 'white' },
                }}
              />
            )}
            {advisor.rating_stats?.avg_rating != null && (
              <Chip
                icon={<Star sx={{ fontSize: 16 }} />}
                label={`${advisor.rating_stats.avg_rating.toFixed(1)} (${advisor.rating_stats.total_reviews} reviews)`}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewReviews(advisor);
                }}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 500,
                  cursor: 'pointer',
                  '& .MuiChip-icon': { color: '#FFD700' },
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Pricing section */}
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Consultation Rates
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 2 } }}>
            {rate30 && (
              <Paper variant="outlined" sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {rate30}
                </Typography>
                <Typography variant="caption" color="text.secondary">30 min session</Typography>
              </Paper>
            )}
            {rate60 && (
              <Paper variant="outlined" sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, textAlign: 'center', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {rate60}
                </Typography>
                <Typography variant="caption" color="text.secondary">60 min session</Typography>
              </Paper>
            )}
            {!isBookable && (
              <Paper variant="outlined" sx={{ flex: 1, p: { xs: 1.5, sm: 2 }, textAlign: 'center', borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" color="text.secondary">Rates not set</Typography>
              </Paper>
            )}
          </Box>
        </Box>

        {/* About section */}
        {advisor.bio && (
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              About
            </Typography>
            <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.7 }}>
              {advisor.bio}
            </Typography>
          </Box>
        )}

        {/* Experience & Credentials */}
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Experience
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
            {profBg.years_experience && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WorkHistory sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">{getExperienceLabel(profBg.years_experience)}</Typography>
              </Box>
            )}
            {profBg.startups_advised_count && profBg.startups_advised_count !== '0' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">{profBg.startups_advised_count} startups advised</Typography>
              </Box>
            )}
            {profBg.current_role?.company && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">@ {profBg.current_role.company}</Typography>
              </Box>
            )}
          </Box>
          
          {/* Verification badges */}
          {advisor.verification_badges?.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {renderBadges(advisor.verification_badges)}
            </Box>
          )}
        </Box>

        {/* Expertise */}
        {(advisor.domains?.length > 0 || advisor.expertise_stages?.length > 0) && (
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              Expertise
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {advisor.expertise_stages?.map((stage) => (
                <Chip
                  key={stage}
                  label={stage}
                  size="small"
                  color="primary"
                  sx={{
                    fontWeight: 500,
                  }}
                />
              ))}
              {advisor.domains?.map((domain) => (
                <Chip
                  key={domain}
                  label={domain}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'divider' }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Availability */}
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
            Availability
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 } }}>
            {advisor.availability_frequency && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {advisor.availability_frequency}
                </Typography>
              </Box>
            )}
            {advisor.preferred_language && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Language sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">{advisor.preferred_language}</Typography>
              </Box>
            )}
            {advisor.max_active_connections && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2">
                  {advisor.active_connections_count || 0}/{advisor.max_active_connections} slots
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      {/* Action button */}
      <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!isBookable}
          onClick={() => onBookConsultation(advisor)}
          startIcon={<CalendarMonth />}
          sx={{
            borderRadius: 2,
            py: { xs: 1.25, sm: 1.5 },
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          {isBookable ? 'Book a Consultation' : 'Rates Not Available'}
        </Button>
      </Box>
    </Dialog>
  );
};

export default AdvisorBrowseMarketplace;

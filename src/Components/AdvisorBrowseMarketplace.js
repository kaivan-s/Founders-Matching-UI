import React, { useState, useEffect } from 'react';
import {
  Drawer,
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

  useEffect(() => {
    if (open && workspaceId) {
      fetchPartners();
    }
  }, [open, workspaceId]);

  const fetchPartners = async () => {
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

  const handleBookingSuccess = (consultation) => {
    setBookingAdvisor(null);
    if (onBookingCreated) onBookingCreated(consultation);
    // Refresh marketplace so any rate / capacity changes show up
    fetchPartners();
  };

  const filteredPartners = partners.filter((partner) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const partnerUser = partner.user || {};
    return (
      partnerUser.name?.toLowerCase().includes(query) ||
      partner.headline?.toLowerCase().includes(query) ||
      partner.bio?.toLowerCase().includes(query) ||
      partner.domains?.some((d) => d.toLowerCase().includes(query))
    );
  });

  const formatRate = (rate) => {
    if (rate == null || rate === '') return null;
    const n = Number(rate);
    if (!isFinite(n)) return null;
    return `$${n.toFixed(0)}`;
  };

  const advisorBookable = (partner) => {
    return formatRate(partner.consultation_rate_30min_usd) || formatRate(partner.consultation_rate_60min_usd);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520, md: 600 },
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: '-0.01em' }}>
            Find an Advisor
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#0ea5e9', 0.08),
                color: 'primary.main',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search by name, expertise, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.default',
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5, bgcolor: 'background.default' }}>
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
                const partnerUser = partner.user || {};
                const rate30 = formatRate(partner.consultation_rate_30min_usd);
                const rate60 = formatRate(partner.consultation_rate_60min_usd);
                const isBookable = !!(rate30 || rate60);
                
                return (
                  <Card 
                    key={partner.user_id} 
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        borderColor: alpha('#0ea5e9', 0.3),
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 64, 
                            height: 64,
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {partnerUser.name?.[0]?.toUpperCase() || 'P'}
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
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
                                  {partnerUser.name || 'Unknown'}
                                </Typography>
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
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                              {/* Rating display - clickable to view reviews */}
                              {partner.rating_stats?.avg_rating != null && (
                                <Box
                                  onClick={() => setReviewsAdvisor(partner)}
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
                                onClick={() => setBookingAdvisor(partner)}
                                disabled={!isBookable}
                                startIcon={<CalendarMonth fontSize="small" />}
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 500,
                                  px: 2,
                                  minWidth: 160,
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
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Person 
                                fontSize="small" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: 16,
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {partner.current_active_workspaces || 0}/{partner.max_active_workspaces} slots
                              </Typography>
                            </Box>
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

      {/* Booking dialog (mounted on top of the drawer) */}
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
    </Drawer>
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

  const advisorName = advisor.user?.name || 'Advisor';
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
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontWeight: 600 }}
            >
              {advisorName[0]?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
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
              sx={{ m: 2, p: 2, borderRadius: 2, bgcolor: 'background.default' }}
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
            <Box sx={{ px: 2, pb: 2 }}>
              {reviews.map((review, idx) => {
                const reviewer = review.reviewer || {};
                return (
                  <Paper
                    key={review.id || idx}
                    variant="outlined"
                    sx={{ p: 2, mb: 1.5, borderRadius: 2, '&:last-child': { mb: 0 } }}
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

export default AdvisorBrowseMarketplace;

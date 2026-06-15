import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  VerifiedUser,
  WorkHistory,
  EmojiEvents,
  Link as LinkIcon,
  FilterList,
  AutoAwesome,
} from '@mui/icons-material';
import Rating from '@mui/material/Rating';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config/api';
import BookingDialog from './BookingDialog';

const TEAL = '#0d9488';
const TEAL_LIGHT = '#14b8a6';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'FinTech', label: 'FinTech' },
  { value: 'HealthTech', label: 'HealthTech' },
  { value: 'EdTech', label: 'EdTech' },
  { value: 'AI/ML', label: 'AI/ML' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'Consumer', label: 'Consumer' },
  { value: 'B2B', label: 'B2B' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Other', label: 'Other' },
];

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'idea', label: 'Idea' },
  { value: 'pre-seed', label: 'Pre-seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b-plus', label: 'Series B+' },
];

const AdvisorMarketplacePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  
  // Dialogs
  const [bookingAdvisor, setBookingAdvisor] = useState(null);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);

  const fetchAdvisors = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setUpgradeRequired(false);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (domainFilter) params.append('domain', domainFilter);
      if (stageFilter) params.append('expertise_stage', stageFilter);
      
      const response = await fetch(
        `${API_BASE}/advisors/browse?${params.toString()}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.status === 403) {
        const data = await response.json();
        if (data.upgrade_required) {
          setUpgradeRequired(true);
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch advisors');
      }

      const data = await response.json();
      setAdvisors(data);
    } catch (err) {
      console.error('Error fetching advisors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, searchQuery, domainFilter, stageFilter]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchAdvisors();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchAdvisors]);

  const handleBookingCreated = () => {
    setBookingAdvisor(null);
  };

  // Upgrade Required View - Show blurred preview with overlay
  if (upgradeRequired) {
    // Mock advisor data for blurred preview
    const mockAdvisors = [
      { id: 1, name: 'Sarah Chen', headline: 'Ex-Sequoia Partner | 50+ startups advised', domains: ['FinTech', 'SaaS'] },
      { id: 2, name: 'Michael Roberts', headline: 'Serial Entrepreneur | YC Alum', domains: ['AI/ML', 'B2B'] },
      { id: 3, name: 'Priya Sharma', headline: 'Legal Expert | Startup Counsel', domains: ['HealthTech', 'Consumer'] },
      { id: 4, name: 'David Kim', headline: 'Growth Lead @ Stripe', domains: ['FinTech', 'Marketplace'] },
      { id: 5, name: 'Emma Wilson', headline: 'Product Director | Ex-Google', domains: ['SaaS', 'EdTech'] },
      { id: 6, name: 'James Liu', headline: 'Angel Investor | 100+ deals', domains: ['AI/ML', 'Hardware'] },
    ];

    return (
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto', position: 'relative' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: SLATE_900 }}>
              Advisor Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: SLATE_500 }}>
              44+ advisors available
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/advisor/dashboard')}
            sx={{
              borderColor: TEAL,
              color: TEAL,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { bgcolor: alpha(TEAL, 0.08), borderColor: TEAL_LIGHT },
            }}
          >
            Become an Advisor
          </Button>
        </Box>

        {/* Blurred Preview Grid */}
        <Box sx={{ position: 'relative' }}>
          <Grid container spacing={3} sx={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' }}>
            {mockAdvisors.map((advisor) => (
              <Grid item xs={12} sm={6} lg={4} key={advisor.id}>
                <Card sx={{ height: '100%', borderRadius: 2, border: `1px solid ${SLATE_200}` }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 56, height: 56, bgcolor: alpha(TEAL, 0.1) }}>
                        {advisor.name[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                          {advisor.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          {advisor.headline}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {advisor.domains.map((domain, idx) => (
                        <Chip key={idx} label={domain} size="small" sx={{ height: 24, fontSize: '0.7rem', bgcolor: alpha(TEAL, 0.1), color: TEAL }} />
                      ))}
                    </Box>
                    <Button fullWidth variant="contained" sx={{ bgcolor: TEAL }}>
                      Book Consultation
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Overlay with Upgrade CTA */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha('#fff', 0.3),
          }}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 4, 
                maxWidth: 420, 
                textAlign: 'center', 
                borderRadius: 3,
                border: `1px solid ${alpha(TEAL, 0.2)}`,
              }}
            >
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: alpha(TEAL, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
              }}>
                <AutoAwesome sx={{ fontSize: 32, color: TEAL }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900, mb: 1 }}>
                Unlock Advisor Access
              </Typography>
              <Typography variant="body2" sx={{ color: SLATE_500, mb: 3 }}>
                Connect with 44+ experienced advisors for fundraising, product strategy, and legal guidance.
              </Typography>
              
              <Box sx={{ textAlign: 'left', mb: 3 }}>
                {[
                  'Browse & book verified advisors',
                  'Direct 1-on-1 consultations',
                  'Expert guidance on any topic',
                ].map((benefit, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <CheckCircle sx={{ fontSize: 16, color: TEAL }} />
                    <Typography variant="body2" sx={{ color: SLATE_900 }}>{benefit}</Typography>
                  </Box>
                ))}
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<AutoAwesome />}
                onClick={() => navigate('/pricing')}
                sx={{
                  bgcolor: TEAL,
                  color: '#fff',
                  fontWeight: 600,
                  py: 1.5,
                  textTransform: 'none',
                  '&:hover': { bgcolor: TEAL_LIGHT },
                }}
              >
                Upgrade to Pro — $15/mo
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  }

  // Loading View
  if (loading && advisors.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      {/* Header with Filters */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: { xs: 2, md: 3 },
        mb: 3,
      }}>
        {/* Title */}
        <Typography variant="h4" sx={{ fontWeight: 700, color: SLATE_900, flexShrink: 0 }}>
          Advisor Marketplace
        </Typography>

        {/* Filters + Button */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
          width: { xs: '100%', md: 'auto' },
        }}>
          <TextField
            size="small"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: SLATE_400, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              minWidth: { sm: 160 },
              '& .MuiOutlinedInput-root': { borderRadius: 2 },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Domain</InputLabel>
            <Select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              label="Domain"
              sx={{ borderRadius: 2 }}
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel>Stage</InputLabel>
            <Select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              label="Stage"
              sx={{ borderRadius: 2 }}
            >
              {STAGE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 0.5 }} />
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/advisor/dashboard')}
            sx={{
              borderColor: TEAL,
              color: TEAL,
              textTransform: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: alpha(TEAL, 0.08), borderColor: TEAL_LIGHT },
            }}
          >
            Become an Advisor
          </Button>
        </Box>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Advisors Grid */}
      {advisors.length === 0 && !loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Person sx={{ fontSize: 64, color: SLATE_200, mb: 2 }} />
          <Typography variant="h6" sx={{ color: SLATE_500, mb: 1 }}>
            No advisors found
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_400 }}>
            Try adjusting your filters or search query
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {advisors.map((advisor) => (
            <Grid item xs={12} sm={6} lg={4} key={advisor.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: `1px solid ${SLATE_200}`,
                  '&:hover': {
                    boxShadow: `0 8px 24px ${alpha(SLATE_900, 0.1)}`,
                    borderColor: alpha(TEAL, 0.3),
                  },
                }}
                onClick={() => setSelectedAdvisor(advisor)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar
                      src={advisor.profile_image_url}
                      sx={{ width: 56, height: 56, bgcolor: alpha(TEAL, 0.1) }}
                    >
                      {(advisor.name || 'A')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: SLATE_900 }} noWrap>
                          {advisor.name || 'Advisor'}
                        </Typography>
                        {advisor.linkedin_url && (
                          <IconButton
                            size="small"
                            href={advisor.linkedin_url}
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                            sx={{ p: 0.25 }}
                          >
                            <LinkedIn sx={{ fontSize: 18, color: '#0077b5' }} />
                          </IconButton>
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: SLATE_500 }} noWrap>
                        {advisor.headline || 'Startup Advisor'}
                      </Typography>
                      {advisor.rating_stats?.total_reviews > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Rating 
                            value={advisor.rating_stats.avg_rating} 
                            precision={0.5} 
                            size="small" 
                            readOnly 
                          />
                          <Typography variant="caption" sx={{ color: SLATE_400 }}>
                            ({advisor.rating_stats.total_reviews})
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Domains */}
                  {advisor.domains?.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                      {advisor.domains.slice(0, 3).map((domain, idx) => (
                        <Chip
                          key={idx}
                          label={domain}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            bgcolor: alpha(TEAL, 0.1),
                            color: TEAL,
                          }}
                        />
                      ))}
                      {advisor.domains.length > 3 && (
                        <Chip
                          label={`+${advisor.domains.length - 3}`}
                          size="small"
                          sx={{ height: 24, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Advisory Types */}
                  {advisor.advisory_types?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" sx={{ color: SLATE_400, fontWeight: 600 }}>
                        Expertise:
                      </Typography>
                      <Typography variant="body2" sx={{ color: SLATE_500 }} noWrap>
                        {advisor.advisory_types.slice(0, 3).join(', ')}
                      </Typography>
                    </Box>
                  )}

                  {/* Rates */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {advisor.consultation_rate_30min_usd && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AttachMoney sx={{ fontSize: 16, color: SLATE_400 }} />
                        <Typography variant="body2" sx={{ color: SLATE_900, fontWeight: 500 }}>
                          ${advisor.consultation_rate_30min_usd}/30min
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Book Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBookingAdvisor(advisor);
                    }}
                    sx={{
                      bgcolor: TEAL,
                      color: '#fff',
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { bgcolor: TEAL_LIGHT },
                    }}
                  >
                    Book Consultation
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Advisor Detail Dialog */}
      <Dialog
        open={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedAdvisor && (
          <>
            <DialogTitle sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              pb: 1,
            }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Avatar
                  src={selectedAdvisor.profile_image_url}
                  sx={{ width: 72, height: 72, bgcolor: alpha(TEAL, 0.1) }}
                >
                  {(selectedAdvisor.name || 'A')[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: SLATE_900 }}>
                    {selectedAdvisor.name || 'Advisor'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: SLATE_500 }}>
                    {selectedAdvisor.headline || 'Startup Advisor'}
                  </Typography>
                  {selectedAdvisor.linkedin_url && (
                    <IconButton 
                      size="small" 
                      href={selectedAdvisor.linkedin_url} 
                      target="_blank"
                      sx={{ ml: -1, mt: 0.5 }}
                    >
                      <LinkedIn sx={{ color: '#0077b5' }} />
                    </IconButton>
                  )}
                </Box>
              </Box>
              <IconButton onClick={() => setSelectedAdvisor(null)}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {/* Bio */}
              {selectedAdvisor.bio && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                    About
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_500, whiteSpace: 'pre-wrap' }}>
                    {selectedAdvisor.bio}
                  </Typography>
                </Box>
              )}

              {/* Expertise */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                    Domains
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selectedAdvisor.domains || []).map((domain, idx) => (
                      <Chip
                        key={idx}
                        label={domain}
                        size="small"
                        sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL }}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_900, mb: 1 }}>
                    Advisory Types
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selectedAdvisor.advisory_types || []).map((type, idx) => (
                      <Chip
                        key={idx}
                        label={type}
                        size="small"
                        sx={{ bgcolor: alpha(SLATE_400, 0.15), color: SLATE_500 }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>

              {/* Rates & Availability */}
              <Box sx={{ 
                p: 2, bgcolor: alpha(TEAL, 0.05), borderRadius: 2, 
                border: `1px solid ${alpha(TEAL, 0.15)}`, mb: 3 
              }}>
                <Grid container spacing={2}>
                  {selectedAdvisor.consultation_rate_30min_usd && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>30 min</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900 }}>
                        ${selectedAdvisor.consultation_rate_30min_usd}
                      </Typography>
                    </Grid>
                  )}
                  {selectedAdvisor.consultation_rate_60min_usd && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>60 min</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: SLATE_900 }}>
                        ${selectedAdvisor.consultation_rate_60min_usd}
                      </Typography>
                    </Grid>
                  )}
                  {selectedAdvisor.availability_hours_per_week && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>Availability</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                        {selectedAdvisor.availability_hours_per_week} hrs/week
                      </Typography>
                    </Grid>
                  )}
                  {selectedAdvisor.rating_stats?.total_reviews > 0 && (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" sx={{ color: SLATE_400 }}>Rating</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Star sx={{ color: '#f59e0b', fontSize: 20 }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: SLATE_900 }}>
                          {selectedAdvisor.rating_stats.avg_rating}
                        </Typography>
                        <Typography variant="caption" sx={{ color: SLATE_400 }}>
                          ({selectedAdvisor.rating_stats.total_reviews})
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Book Button */}
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<CalendarMonth />}
                onClick={() => {
                  setSelectedAdvisor(null);
                  setBookingAdvisor(selectedAdvisor);
                }}
                sx={{
                  bgcolor: TEAL,
                  color: '#fff',
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { bgcolor: TEAL_LIGHT },
                }}
              >
                Book a Consultation
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Booking Dialog */}
      {bookingAdvisor && (
        <BookingDialog
          open={!!bookingAdvisor}
          onClose={() => setBookingAdvisor(null)}
          advisor={bookingAdvisor}
          onBookingCreated={handleBookingCreated}
        />
      )}
    </Box>
  );
};

export default AdvisorMarketplacePage;

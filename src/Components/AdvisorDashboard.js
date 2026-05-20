import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Badge,
  alpha,
  LinearProgress,
  TextField,
  InputAdornment,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  OutlinedInput,
} from '@mui/material';
import { API_BASE } from '../config/api';
import {
  Business,
  People,
  CheckCircle,
  Schedule,
  TrendingUp,
  Message,
  Assignment,
  Visibility,
  Close,
  Notifications,
  CheckCircleOutline,
  Circle,
  Edit,
  Pending,
  Cancel,
  Link as LinkIcon,
  Payment,
  ArrowForward,
  WorkspacesOutlined,
  GroupsOutlined,
  TaskAlt,
  AccessTime,
  LinkedIn,
  AttachMoney,
  Settings,
  Save,
  PhotoCamera,
  OpenInNew,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../config/supabase';

// Constants for advisor profile fields
const ADVISORY_TYPES = [
  { value: 'strategic', label: 'Strategy & Business' },
  { value: 'technical', label: 'Technical / Engineering' },
  { value: 'fundraising', label: 'Fundraising & Investors' },
  { value: 'gtm', label: 'Sales & Go-to-Market' },
  { value: 'operations', label: 'Operations & Scaling' },
  { value: 'product', label: 'Product & Design' },
];

const STAGES = [
  { value: 'idea', label: 'Idea Stage' },
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b-plus', label: 'Series B+' },
];

const DOMAINS = [
  'SaaS', 'E-commerce', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML',
  'Marketplace', 'Consumer', 'B2B', 'Hardware', 'Other'
];

const AVAILABILITY_OPTIONS = [
  { value: '1-2', label: '1-2 hours/week' },
  { value: '2-5', label: '2-5 hours/week' },
  { value: '5-10', label: '5-10 hours/week' },
  { value: '10+', label: '10+ hours/week' },
];

// Stat card component
const StatCard = ({ icon: Icon, value, label, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ 
        p: 1.5, 
        borderRadius: 2, 
        bgcolor: alpha(color, 0.1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon sx={{ color, fontSize: 24 }} />
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  </Paper>
);

// =============================================================================
// SubscriptionCard
// Renders the advisor's Pro Advisor billing state: free / trial / past_due /
// active / cancelled. Has CTAs for monthly + yearly subscription via Dodo.
// =============================================================================
const SubscriptionCard = ({ billingProfile, userId, onChange }) => {
  const [subscribing, setSubscribing] = useState(null); // 'monthly' | 'yearly' | null
  const [cancelling, setCancelling] = useState(false);

  if (!billingProfile) return null;

  const status = billingProfile.effective_status || billingProfile.subscription_status || 'free';
  const pricing = billingProfile.subscription_pricing || {};
  const trialEndsAt = billingProfile.trial_ends_at;
  const periodEnd = billingProfile.subscription_current_period_end;

  const formatDate = (iso) => {
    if (!iso) return '';
    try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return iso; }
  };

  const daysUntil = (iso) => {
    if (!iso) return null;
    try {
      const ms = new Date(iso).getTime() - Date.now();
      return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
    } catch { return null; }
  };

  const subscribe = async (cycle) => {
    setSubscribing(cycle);
    try {
      const res = await fetch(`${API_BASE}/billing/advisor/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Clerk-User-Id': userId },
        body: JSON.stringify({ billing_cycle: cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to start checkout');
      window.location.href = data.checkout_url;
    } catch (err) {
      alert(`Error: ${err.message}`);
      setSubscribing(null);
    }
  };

  const cancel = async () => {
    if (!window.confirm('Cancel your Pro Advisor subscription? You will keep access until the end of your current billing period, then lose the ability to accept new bookings until you resubscribe.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(`${API_BASE}/billing/advisor/cancel-subscription`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': userId },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to cancel');
      onChange?.();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const SubscribeButtons = () => (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
      <Button
        variant="contained"
        size="small"
        startIcon={subscribing === 'monthly' ? <CircularProgress size={14} color="inherit" /> : null}
        disabled={!!subscribing}
        onClick={() => subscribe('monthly')}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Subscribe — ${pricing.monthly_usd}/mo
      </Button>
      <Button
        variant="outlined"
        size="small"
        startIcon={subscribing === 'yearly' ? <CircularProgress size={14} color="inherit" /> : null}
        disabled={!!subscribing}
        onClick={() => subscribe('yearly')}
        sx={{ textTransform: 'none', fontWeight: 600 }}
      >
        Yearly — ${pricing.yearly_usd}/yr (save ${(pricing.monthly_usd * 12) - pricing.yearly_usd})
      </Button>
    </Box>
  );

  // FREE: no first booking yet
  if (status === 'free') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#0d9488', 0.08), borderRadius: 1.5, color: '#0d9488' }}>
              <Payment fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Free until your first booking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can list, accept requests, and run consultations <strong>for free</strong>.
                Your {pricing.trial_days}-day Pro Advisor trial begins after your first confirmed booking.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // TRIAL: in active trial period
  if (status === 'trial') {
    const days = daysUntil(trialEndsAt);
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#0ea5e9', 0.3), bgcolor: alpha('#0ea5e9', 0.04) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#0ea5e9', 0.12), borderRadius: 1.5, color: '#0ea5e9' }}>
              <AccessTime fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor trial · {days != null ? `${days} day${days === 1 ? '' : 's'} left` : 'active'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Trial ends {formatDate(trialEndsAt)}. Subscribe now to keep accepting new bookings after that.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // PAST_DUE: trial expired or active subscription lapsed
  if (status === 'past_due') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#f59e0b', 0.5), bgcolor: alpha('#f59e0b', 0.06) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#f59e0b', 0.15), borderRadius: 1.5, color: '#f59e0b' }}>
              <Cancel fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Subscription required to accept new bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {billingProfile.subscription_status === 'trial'
                  ? 'Your Pro Advisor trial has ended. Subscribe to keep accepting new bookings.'
                  : 'Your subscription is past due or has lapsed. Resubscribe to start accepting new bookings again.'}
                You remain listed in the marketplace, but new bookings are paused.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // ACTIVE: subscribed
  if (status === 'active') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: alpha('#10b981', 0.4), bgcolor: alpha('#10b981', 0.04) }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#10b981', 0.15), borderRadius: 1.5, color: '#10b981' }}>
              <CheckCircle fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Active
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {periodEnd
                  ? `Your subscription renews on ${formatDate(periodEnd)}.`
                  : 'Your subscription is active.'}
              </Typography>
              <Box sx={{ mt: 1.5 }}>
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  disabled={cancelling}
                  onClick={cancel}
                  sx={{ textTransform: 'none' }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // CANCELLED: previously paid, now cancelled
  if (status === 'cancelled') {
    return (
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3, borderColor: 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ p: 1.25, bgcolor: alpha('#64748b', 0.1), borderRadius: 1.5, color: '#64748b' }}>
              <Cancel fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Pro Advisor — Cancelled
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You've cancelled your Pro Advisor subscription. New bookings are paused until you resubscribe.
              </Typography>
              <SubscribeButtons />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return null;
};

const AdvisorDashboard = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [founderId, setFounderId] = useState(null);
  const [billingProfile, setBillingProfile] = useState(null);
  
  // LinkedIn verification
  const [linkedinStatus, setLinkedinStatus] = useState({
    linkedin_verified: false,
    linkedin_configured: false,
    linkedin_name: null,
  });
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  // Cal.com — paste booking link (no OAuth required)
  const [calBookingDraft, setCalBookingDraft] = useState('');
  const [calLinkSaving, setCalLinkSaving] = useState(false);
  const [calcomBanner, setCalcomBanner] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editTabIndex, setEditTabIndex] = useState(0);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editProfileImage, setEditProfileImage] = useState(null); // { preview: dataURL, file: File }
  const [autoSaveStatus, setAutoSaveStatus] = useState(null); // 'saving', 'saved', 'error'
  const autoSaveTimerRef = useRef(null);

  const fetchLinkedinStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/status`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedinStatus(data);
      }
    } catch (err) {
      // Verification is optional
    }
  }, [user?.id]);

  const saveCalBookingLinkToServer = async (urlRaw) => {
    if (!user?.id) return false;
    const trimmed = (urlRaw || '').trim();
    setCalLinkSaving(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/advisors/cal-booking-link`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          calcom_booking_url: trimmed || null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Could not save scheduling link');
      }
      setProfile(data);
      setCalBookingDraft((data.calcom_booking_url || '').trim());
      return true;
    } catch (err) {
      setError(err.message || 'Failed to save scheduling link');
      return false;
    } finally {
      setCalLinkSaving(false);
    }
  };

  const handleSaveCalBookingLink = async () => {
    const ok = await saveCalBookingLinkToServer(calBookingDraft);
    if (ok) {
      setCalcomBanner({
        severity: 'success',
        text: 'Scheduling link saved. Founders will see it when they book consultations.',
      });
    }
  };

  const handleClearCalBookingLink = async () => {
    const ok = await saveCalBookingLinkToServer('');
    if (ok) {
      setCalBookingDraft('');
      setCalcomBanner({ severity: 'info', text: 'Scheduling link removed.' });
    }
  };

  const handleLinkedInConnect = async () => {
    if (!user?.id) return;
    setLinkedinLoading(true);
    try {
      const response = await fetch(`${API_BASE}/advisors/linkedin/connect`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      }
    } catch (err) {
      setError('Failed to connect to LinkedIn');
    } finally {
      setLinkedinLoading(false);
    }
  };

  // Edit profile handlers
  const handleOpenEditDialog = (initialTab = 0) => {
    if (!profile) return;
    setEditFormData({
      headline: profile.headline || '',
      bio: profile.bio || '',
      linkedin_url: profile.linkedin_url || '',
      advisory_types: profile.advisory_types || [],
      preferred_stages: profile.preferred_stages || [],
      domains: profile.domains || [],
      availability_hours_per_week: profile.availability_hours_per_week || '',
      calcom_booking_url: profile.calcom_booking_url || '',
      consultation_rate_30min_usd: profile.consultation_rate_30min_usd ?? '',
      consultation_rate_60min_usd: profile.consultation_rate_60min_usd ?? '',
      // Preserve contact_email from profile or use user's email
      contact_email: profile.contact_email || user?.emailAddresses?.[0]?.emailAddress || '',
      payment_methods: {
        upi_id: profile.payment_methods?.upi_id || '',
        paypal_url: profile.payment_methods?.paypal_url || '',
        razorpay_link: profile.payment_methods?.razorpay_link || '',
        bank_details: profile.payment_methods?.bank_details || '',
      },
    });
    setEditError(null);
    setEditProfileImage(null);
    setEditTabIndex(initialTab);
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    let newFormData;
    if (field.startsWith('payment_methods.')) {
      const paymentField = field.split('.')[1];
      setEditFormData(prev => {
        newFormData = {
          ...prev,
          payment_methods: {
            ...prev.payment_methods,
            [paymentField]: value,
          },
        };
        return newFormData;
      });
    } else {
      setEditFormData(prev => {
        newFormData = { ...prev, [field]: value };
        return newFormData;
      });
    }
    
    // Debounced auto-save (1.5 seconds after last change)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setAutoSaveStatus('saving');
    
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(`${API_BASE}/advisors/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
            'X-User-Name': user?.fullName || user?.firstName || '',
            'X-User-Email': user?.emailAddresses?.[0]?.emailAddress || '',
          },
          body: JSON.stringify(newFormData),
        });
        
        if (response.ok) {
          const updatedProfile = await response.json();
          setProfile(prev => ({ ...prev, ...updatedProfile }));
          setAutoSaveStatus('saved');
          // Clear "saved" status after 2 seconds
          setTimeout(() => setAutoSaveStatus(null), 2000);
        } else {
          setAutoSaveStatus('error');
        }
      } catch (err) {
        setAutoSaveStatus('error');
      }
    }, 1500);
  };

  const handleEditImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setEditError('Please select a valid image (JPEG, PNG, WebP, or GIF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be less than 5MB');
      return;
    }
    
    // Compress image before upload to reduce payload size
    const compressImage = (imgFile, maxWidth = 400, quality = 0.8) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Scale down if larger than maxWidth
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG for better compression
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(imgFile);
      });
    };

    compressImage(file).then(async (compressedDataUrl) => {
      setEditProfileImage({
        preview: compressedDataUrl,
        file: file,
        contentType: 'image/jpeg',
      });
      setEditError(null);
      
      // Auto-upload image immediately
      if (!user?.id) return;
      setAutoSaveStatus('saving');
      
      try {
        const imageResponse = await fetch(`${API_BASE}/advisors/profile/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({
            image: compressedDataUrl,
            content_type: 'image/jpeg',
          }),
        });
        
        if (imageResponse.ok) {
          const imgData = await imageResponse.json();
          setProfile(prev => ({ ...prev, profile_image_url: imgData.public_url }));
          setAutoSaveStatus('saved');
          setTimeout(() => setAutoSaveStatus(null), 2000);
        } else {
          const errData = await imageResponse.json().catch(() => ({}));
          setEditError(`Image upload failed: ${errData.error || `Server error (${imageResponse.status})`}. Try a smaller image.`);
          setAutoSaveStatus('error');
          setEditProfileImage(null); // Clear failed image
        }
      } catch (imgErr) {
        setEditError(`Image upload failed: ${imgErr.message || 'Network error'}. Try a smaller image (under 1MB).`);
        setAutoSaveStatus('error');
        setEditProfileImage(null); // Clear failed image
      }
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !editFormData) return;
    setEditSaving(true);
    setEditError(null);

    try {
      // Save profile data
      const response = await fetch(`${API_BASE}/advisors/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
          'X-User-Name': user?.fullName || user?.firstName || '',
          'X-User-Email': user?.emailAddresses?.[0]?.emailAddress || '',
        },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      const updatedProfile = await response.json();

      // Image is auto-uploaded when selected, no need to upload here
      setProfile(prev => ({ ...prev, ...updatedProfile }));
      setEditDialogOpen(false);
      setEditProfileImage(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const fetchBillingProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/advisor/profile`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setBillingProfile(data);
      }
    } catch (err) {
      // Error fetching billing profile
    }
  }, [user?.id]);

  const fetchDashboardData = useCallback(async (abortSignal = null) => {
    if (!user?.id) return;
    if (abortSignal?.aborted) return;
    
    setLoading(true);
    try {
      const profileResponse = await fetch(`${API_BASE}/advisors/profile`, {
        headers: { 'X-Clerk-User-Id': user.id },
        ...(abortSignal && { signal: abortSignal }),
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        const isValidProfile = profileData !== null && 
                              profileData !== undefined && 
                              typeof profileData === 'object' && 
                              !Array.isArray(profileData) &&
                              Object.keys(profileData).length > 0;
        
        if (isValidProfile) {
          hasFetchedOnceRef.current = true;
          setProfile(profileData);
          setLoading(false);
          
          // Fetch consultations in background
          Promise.all([
            fetch(`${API_BASE}/consultations?role=advisor&limit=50`, {
              headers: { 'X-Clerk-User-Id': user.id },
            }).then(r => r.ok ? r.json() : { consultations: [] })
              .then(data => setConsultations(data.consultations || []))
              .catch(() => {}),
            
            fetch(`${API_BASE}/advisors/notifications`, {
              headers: { 'X-Clerk-User-Id': user.id },
            }).then(r => r.ok ? r.json() : []).then(setNotifications).catch(() => {}),
          ]);
        } else {
          hasFetchedOnceRef.current = true;
          setProfile(null);
          setLoading(false);
        }
      } else if (profileResponse.status === 404) {
        hasFetchedOnceRef.current = true;
        setProfile(null);
        setLoading(false);
      } else {
        hasFetchedOnceRef.current = true;
        setError('Failed to load advisor profile');
        setLoading(false);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      hasFetchedOnceRef.current = true;
      setError('Failed to load dashboard data');
      setLoading(false);
    }
  }, [user?.id]);

  const hasFetchedRef = useRef(false);
  const hasFetchedOnceRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (user?.id && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      hasFetchedOnceRef.current = false;
      fetchDashboardData();
      fetchBillingProfile();
      fetchLinkedinStatus();
    } else if (!user?.id) {
      hasFetchedRef.current = false;
      hasFetchedOnceRef.current = false;
    }
  }, [user?.id, fetchDashboardData, fetchBillingProfile, fetchLinkedinStatus]);

  // Handle LinkedIn OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    if (!code || !user?.id) return;

    const completeCallback = async () => {
      setLinkedinLoading(true);
      try {
        const response = await fetch(`${API_BASE}/advisors/linkedin/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({ code, state }),
        });
        if (response.ok) {
          const data = await response.json();
          setLinkedinStatus({
            linkedin_verified: true,
            linkedin_configured: true,
            linkedin_name: data.linkedin_name,
          });
          window.history.replaceState({}, '', window.location.pathname);
        }
      } catch (err) {
        setError('Failed to complete LinkedIn verification');
      } finally {
        setLinkedinLoading(false);
      }
    };
    completeCallback();
  }, [searchParams, user?.id]);

  // Handle "?advisor_subscription=success" return from Dodo checkout
  useEffect(() => {
    const flag = searchParams.get('advisor_subscription');
    if (flag !== 'success' || !user?.id) return;
    // Webhook usually arrives within 1-3s; refetch a couple of times
    const refetchTimes = [500, 2500, 5000];
    const timers = refetchTimes.map((delay) =>
      setTimeout(() => fetchBillingProfile(), delay)
    );
    // Clear the URL params
    window.history.replaceState({}, '', window.location.pathname);
    return () => timers.forEach(clearTimeout);
  }, [searchParams, user?.id, fetchBillingProfile]);

  useEffect(() => {
    const url = profile?.calcom_booking_url;
    if (url !== undefined && url !== null) {
      setCalBookingDraft(String(url).trim());
    }
  }, [profile?.calcom_booking_url]);

  // Cleanup auto-save timer when dialog closes
  useEffect(() => {
    if (!editDialogOpen && autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      setAutoSaveStatus(null);
    }
  }, [editDialogOpen]);

  // Redirect to onboarding if no profile
  useEffect(() => {
    if (hasFetchedOnceRef.current && !loading && !profile && !error && !hasRedirectedRef.current && location.pathname !== '/advisor/onboarding') {
      const timeout = setTimeout(() => {
        if (!profile && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          navigate('/advisor/onboarding', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
    if (profile) hasRedirectedRef.current = false;
  }, [loading, profile, error, navigate, location.pathname]);

  // Fetch founder ID for realtime
  useEffect(() => {
    const fetchFounderId = async () => {
      if (!user?.id) return;
      try {
        const r = await fetch(`${API_BASE}/profile/check`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (r.ok) {
          const data = await r.json();
          if (data.has_profile && data.profile) setFounderId(data.profile.id);
        }
      } catch {}
    };
    fetchFounderId();
  }, [user?.id]);

  // Realtime notifications
  useEffect(() => {
    if (!founderId || !user?.id) return;

    const fetchNotifications = async () => {
      try {
        const r = await fetch(`${API_BASE}/advisors/notifications`, {
          headers: { 'X-Clerk-User-Id': user.id },
        });
        if (r.ok) setNotifications(await r.json() || []);
      } catch {}
    };

    fetchNotifications();

    const channel = supabase
      .channel(`advisor_notifications_${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${founderId}`,
      }, fetchNotifications)
      .subscribe();

    const handleVisibility = () => { if (!document.hidden) fetchNotifications(); };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [founderId, user?.id]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      const r = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (r.ok) setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch {}
  };

  // Loading state
  if (loading && !hasFetchedOnceRef.current) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0ea5e9' }} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 500, mx: 'auto', textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ bgcolor: '#0ea5e9' }}>
          Retry
        </Button>
      </Box>
    );
  }

  // No profile - redirect will handle
  if (!profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#0ea5e9' }} />
      </Box>
    );
  }

  const status = profile?.status || 'PENDING';

  // Theme constants (match app design)
  const NAVY = '#1e3a8a';
  const TEAL = '#0d9488';
  const TEAL_LIGHT = '#14b8a6';
  const SKY = '#0ea5e9';
  const SLATE_900 = '#0f172a';
  const SLATE_500 = '#64748b';
  const SLATE_400 = '#94a3b8';
  const SLATE_200 = '#e2e8f0';
  const BG = '#f8fafc';

  // Calculate profile completion for PENDING status banner
  const getProfileCompletion = () => {
    const checklistItems = [
      { id: 'headline', label: 'Headline', done: !!profile?.headline?.trim() },
      { id: 'bio', label: 'Bio', done: (profile?.bio?.length || 0) >= 100 },
      { id: 'photo', label: 'Photo', done: !!profile?.profile_image_url },
      { id: 'linkedin', label: 'LinkedIn', done: !!profile?.linkedin_url },
      { id: 'expertise', label: 'Expertise', done: (profile?.advisory_types?.length || 0) > 0 },
      { id: 'stages', label: 'Stages', done: (profile?.preferred_stages?.length || 0) > 0 },
      { id: 'domains', label: 'Industries', done: (profile?.domains?.length || 0) > 0 },
      { id: 'availability', label: 'Availability', done: !!profile?.availability_hours_per_week },
    ];
    const completedCount = checklistItems.filter(item => item.done).length;
    const percent = Math.round((completedCount / checklistItems.length) * 100);
    const missing = checklistItems.filter(item => !item.done).map(i => i.label);
    return { percent, isComplete: percent === 100, missing, items: checklistItems };
  };

  const profileCompletion = status === 'PENDING' ? getProfileCompletion() : null;

  // Rejected status
  if (status === 'REJECTED') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 6 }}>
        <Box sx={{ maxWidth: 600, mx: 'auto', px: 3 }}>
          <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
            <Box sx={{ 
              width: 80, 
              height: 80, 
              borderRadius: '50%', 
              bgcolor: alpha('#ef4444', 0.1), 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}>
              <Cancel sx={{ fontSize: 40, color: '#ef4444' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a', mb: 1 }}>
              Application Not Approved
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              You can update your details and submit again for review.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={() => navigate('/advisor/onboarding')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
            >
              Update & Resubmit
            </Button>
          </Paper>
        </Box>
      </Box>
    );
  }

  // Approved - Full Dashboard
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
        {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
                    Welcome back, {profile?.name?.split(' ')[0] || 'Advisor'}
                  </Typography>
                  {profile?.is_discoverable && (
                    <Chip 
                      label="Discoverable" 
                      size="small"
                      sx={{ 
                        bgcolor: alpha('#10b981', 0.1), 
                        color: '#10b981',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {profile?.headline || 'Advisor Dashboard'}
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Settings />}
                onClick={handleOpenEditDialog}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': { borderColor: '#0d9488', color: '#0d9488', bgcolor: alpha('#0d9488', 0.04) },
                }}
              >
                Edit Profile
              </Button>
            </Box>

            {/* Profile Completion Banner for PENDING users */}
            {status === 'PENDING' && profileCompletion && (
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: profileCompletion.isComplete ? alpha('#3b82f6', 0.3) : alpha('#f59e0b', 0.3),
                  bgcolor: profileCompletion.isComplete ? alpha('#3b82f6', 0.04) : alpha('#f59e0b', 0.04),
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      {profileCompletion.isComplete ? (
                        <Schedule sx={{ color: '#3b82f6', fontSize: 22 }} />
                      ) : (
                        <Pending sx={{ color: '#f59e0b', fontSize: 22 }} />
                      )}
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600, 
                        color: profileCompletion.isComplete ? '#1d4ed8' : '#b45309'
                      }}>
                        {profileCompletion.isComplete ? 'Profile Under Review' : 'Complete Your Profile'}
                      </Typography>
                      {!profileCompletion.isComplete && (
                        <Chip 
                          label={`${profileCompletion.percent}%`}
                          size="small"
                          sx={{ 
                            bgcolor: '#f59e0b',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            height: 24,
                          }}
                        />
                      )}
                    </Box>
                    {!profileCompletion.isComplete && (
                      <LinearProgress
                        variant="determinate"
                        value={profileCompletion.percent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: alpha('#f59e0b', 0.2),
                          mb: 1,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#f59e0b',
                            borderRadius: 3,
                          },
                        }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {profileCompletion.isComplete 
                        ? "Your profile is complete. We'll review and approve it within 24-48 hours."
                        : `Missing: ${profileCompletion.missing.join(', ')}`}
                    </Typography>
                  </Box>
                  <Button
                    variant={profileCompletion.isComplete ? "outlined" : "contained"}
                    startIcon={<Edit />}
                    onClick={() => handleOpenEditDialog(0)}
                    sx={profileCompletion.isComplete ? {
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      '&:hover': { borderColor: '#1d4ed8', bgcolor: alpha('#3b82f6', 0.04) },
                    } : {
                      bgcolor: '#f59e0b',
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      '&:hover': { bgcolor: '#d97706' },
                    }}
                  >
                    {profileCompletion.isComplete ? 'Edit Profile' : 'Complete Profile'}
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Blurred overlay for PENDING users - dashboard content below is locked */}
            <Box sx={{ 
              position: 'relative',
              ...(status === 'PENDING' && {
                filter: 'blur(4px)',
                pointerEvents: 'none',
                userSelect: 'none',
                opacity: 0.6,
              }),
            }}>

            {/* Cal.com reminder banner when not set up */}
            {(!profile?.calcom_booking_url || !String(profile.calcom_booking_url).trim()) && (
              <Alert
                severity="warning"
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-message': { width: '100%' },
                }}
                icon={
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 0.5, 
                    bgcolor: '#292929', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                  }}>
                    cal
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                      Add your scheduling link to get more bookings
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Founders can book directly into your calendar when you connect Cal.com
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ 
                      textTransform: 'none', 
                      fontWeight: 600,
                      bgcolor: '#292929',
                      '&:hover': { bgcolor: '#000' },
                    }}
                    onClick={() => {
                      document.getElementById('calcom-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Set up now
                  </Button>
                </Box>
              </Alert>
            )}

            {calcomBanner && (
              <Alert
                severity={calcomBanner.severity}
                sx={{ mb: 2, borderRadius: 2 }}
                onClose={() => setCalcomBanner(null)}
              >
                {calcomBanner.text}
              </Alert>
            )}

            {/* Cal.com scheduling — paste booking link */}
            <Paper
              id="calcom-section"
              elevation={0}
              sx={{
                p: 2,
                mb: 4,
                borderRadius: 2,
                border: '1px solid',
                borderColor:
                  profile?.calcom_booking_url && String(profile.calcom_booking_url).trim()
                    ? 'success.main'
                    : 'divider',
                bgcolor:
                  profile?.calcom_booking_url && String(profile.calcom_booking_url).trim()
                    ? alpha('#10b981', 0.04)
                    : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    bgcolor: '#292929',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  cal
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Cal.com scheduling link
                    {profile?.calcom_booking_url && String(profile.calcom_booking_url).trim() ? (
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: 14 }} />}
                        label="Saved"
                        size="small"
                        color="success"
                        sx={{ ml: 1, height: 22, fontSize: '0.7rem' }}
                      />
                    ) : null}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Paste your public booking URL (for example https://cal.com/you/intro). Founders see this link for
                    consultations—no OAuth required.
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    value={calBookingDraft}
                    onChange={(e) => setCalBookingDraft(e.target.value)}
                    placeholder="https://cal.com/your-handle/..."
                    disabled={calLinkSaving}
                    sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LinkIcon sx={{ color: '#64748b', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveCalBookingLink}
                      disabled={calLinkSaving}
                      startIcon={calLinkSaving ? <CircularProgress size={14} color="inherit" /> : <Save />}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Save link
                    </Button>
                    {profile?.calcom_booking_url && String(profile.calcom_booking_url).trim() ? (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          component="a"
                          href={profile.calcom_booking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          startIcon={<OpenInNew />}
                          sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                          Preview
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          color="error"
                          onClick={handleClearCalBookingLink}
                          disabled={calLinkSaving}
                          sx={{ textTransform: 'none', fontWeight: 500 }}
                        >
                          Remove
                        </Button>
                      </>
                    ) : null}
                  </Box>
                </Box>
              </Box>
            </Paper>

            {/* Pro Advisor subscription card */}
            <SubscriptionCard
              billingProfile={billingProfile}
              userId={user?.id}
              onChange={fetchBillingProfile}
            />

            {/* Consultation Stats Grid */}
            {(() => {
              const pendingConfirmations = consultations.filter(c => c.status === 'pending_advisor_confirmation');
              const upcomingConsultations = consultations.filter(c => 
                ['confirmed', 'payment_sent', 'payment_confirmed'].includes(c.status) &&
                new Date(c.scheduled_at) > new Date()
              );
              const completedConsultations = consultations.filter(c => c.status === 'completed');
              const totalEarnings = completedConsultations.reduce((sum, c) => sum + (c.amount_usd || 0), 0);
              
              return (
                <>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={6} md={3}>
                      <StatCard 
                        icon={Schedule}
                        value={upcomingConsultations.length}
                        label="Upcoming"
                        color="#0ea5e9"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard 
                        icon={Message}
                        value={pendingConfirmations.length}
                        label="Pending Confirmation"
                        color="#8b5cf6"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard 
                        icon={TaskAlt}
                        value={completedConsultations.length}
                        label="Completed"
                        color="#10b981"
                      />
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <StatCard 
                        icon={AttachMoney}
                        value={`$${totalEarnings}`}
                        label="Total Earnings"
                        color="#f59e0b"
                      />
                    </Grid>
                  </Grid>

                  {/* Pending Confirmations - Need Action */}
                  {pendingConfirmations.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Badge badgeContent={pendingConfirmations.length} color="primary" sx={{ '& .MuiBadge-badge': { bgcolor: '#8b5cf6' } }}>
                          <Message sx={{ color: '#8b5cf6' }} />
                        </Badge>
                        <span style={{ marginLeft: 8 }}>Booking Requests</span>
                      </Typography>
                      {pendingConfirmations.slice(0, 3).map((consultation) => (
                        <Paper
                          key={consultation.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            mb: 1.5,
                            border: '1px solid',
                            borderColor: alpha('#8b5cf6', 0.3),
                            borderRadius: 2,
                            bgcolor: alpha('#8b5cf6', 0.02),
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
                                {consultation.founder?.name || 'Founder'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {consultation.duration_min} min · ${consultation.amount_usd} · {consultation.topic || 'General consultation'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Proposed: {new Date(consultation.scheduled_at).toLocaleString()}
                              </Typography>
                            </Box>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => navigate('/consultations')}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                bgcolor: '#8b5cf6',
                                '&:hover': { bgcolor: '#7c3aed' },
                              }}
                            >
                              Review
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                      {pendingConfirmations.length > 3 && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => navigate('/consultations')}
                          sx={{ textTransform: 'none', color: '#8b5cf6' }}
                        >
                          View all {pendingConfirmations.length} requests →
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Upcoming Consultations */}
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Schedule sx={{ color: '#0ea5e9' }} />
                        Upcoming Consultations
                      </Typography>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/consultations')}
                        sx={{ textTransform: 'none', color: '#0ea5e9' }}
                      >
                        View All
                      </Button>
                    </Box>
                    
                    {upcomingConsultations.length === 0 ? (
                      <Paper elevation={0} sx={{ 
                        p: 5, 
                        border: '1px dashed', 
                        borderColor: 'divider',
                        borderRadius: 2,
                        textAlign: 'center',
                      }}>
                        <Schedule sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                          No upcoming consultations
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Founders can book consultations with you from the advisor marketplace
                        </Typography>
                      </Paper>
                    ) : (
                      <Grid container spacing={2}>
                        {upcomingConsultations.slice(0, 4).map((consultation) => (
                          <Grid item xs={12} md={6} key={consultation.id}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 2.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  borderColor: '#0ea5e9',
                                  boxShadow: `0 4px 12px ${alpha('#0ea5e9', 0.1)}`,
                                },
                              }}
                              onClick={() => navigate('/consultations')}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                <Avatar sx={{ 
                                  bgcolor: alpha('#0ea5e9', 0.1), 
                                  color: '#0ea5e9',
                                  fontWeight: 600,
                                }}>
                                  {consultation.founder?.name?.[0] || 'F'}
                                </Avatar>
                                
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
                                    {consultation.founder?.name || 'Founder'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                    {consultation.duration_min} min · ${consultation.amount_usd}
                                  </Typography>
                                  <Chip
                                    icon={<Schedule sx={{ fontSize: 14 }} />}
                                    label={new Date(consultation.scheduled_at).toLocaleString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                    size="small"
                                    sx={{ fontSize: '0.7rem', height: 24, bgcolor: alpha('#0ea5e9', 0.1), color: '#0ea5e9' }}
                                  />
                                </Box>
                                
                                <ArrowForward sx={{ color: 'text.disabled', fontSize: 18 }} />
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </>
              );
            })()}

            </Box>
            {/* End of blurred content wrapper for PENDING users */}

            {/* Locked content message for PENDING users */}
            {status === 'PENDING' && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  mt: -4,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: alpha('#64748b', 0.2),
                  bgcolor: 'white',
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Complete your profile above to unlock your full advisor dashboard
                </Typography>
              </Paper>
            )}
      </Box>

      {/* Edit Profile Dialog - Tabbed View */}
      <Dialog
        open={editDialogOpen}
        onClose={editSaving ? undefined : () => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ pb: 0, pt: 2, px: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Settings sx={{ color: '#0d9488' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Edit Profile</Typography>
              {/* Auto-save status indicator */}
              {autoSaveStatus && (
                <Chip
                  size="small"
                  label={
                    autoSaveStatus === 'saving' ? 'Saving...' :
                    autoSaveStatus === 'saved' ? 'Saved' :
                    'Save failed'
                  }
                  sx={{
                    ml: 1,
                    height: 22,
                    fontSize: '0.7rem',
                    bgcolor: 
                      autoSaveStatus === 'saving' ? alpha('#f59e0b', 0.1) :
                      autoSaveStatus === 'saved' ? alpha('#10b981', 0.1) :
                      alpha('#ef4444', 0.1),
                    color: 
                      autoSaveStatus === 'saving' ? '#f59e0b' :
                      autoSaveStatus === 'saved' ? '#10b981' :
                      '#ef4444',
                  }}
                />
              )}
            </Box>
            <IconButton size="small" onClick={() => setEditDialogOpen(false)} disabled={editSaving}>
              <Close />
            </IconButton>
          </Box>
          <Tabs
            value={editTabIndex}
            onChange={(_, v) => setEditTabIndex(v)}
            sx={{
              mt: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 500,
                minWidth: 100,
                '&.Mui-selected': { color: '#0d9488', fontWeight: 600 },
              },
              '& .MuiTabs-indicator': { bgcolor: '#0d9488' },
            }}
          >
            <Tab label="Profile" />
            <Tab label="Expertise" />
            <Tab label="Booking Setup" />
          </Tabs>
        </DialogTitle>
        <DialogContent sx={{ p: 0, minHeight: 420, maxHeight: 420, overflow: 'auto' }}>
          {editFormData && (
            <Box sx={{ p: 3, minHeight: 380 }}>
              {editError && (
                <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>{editError}</Alert>
              )}

              {/* Tab 0: Profile */}
              {editTabIndex === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Profile Picture */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar
                        src={editProfileImage?.preview || profile?.profile_image_url}
                        sx={{ width: 80, height: 80, border: '3px solid white', boxShadow: 1 }}
                      >
                        {profile?.name?.[0]?.toUpperCase() || 'A'}
                      </Avatar>
                      <input
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        style={{ display: 'none' }}
                        id="edit-profile-image-upload"
                        type="file"
                        onChange={handleEditImageSelect}
                      />
                      <label htmlFor="edit-profile-image-upload">
                        <IconButton
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: -4,
                            right: -4,
                            bgcolor: '#0d9488',
                            color: 'white',
                            '&:hover': { bgcolor: '#0f766e' },
                            width: 28,
                            height: 28,
                          }}
                        >
                          <PhotoCamera sx={{ fontSize: 16 }} />
                        </IconButton>
                      </label>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#334155' }}>
                        Profile Picture <Typography component="span" color="error">*</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Click the camera icon to upload a photo
                      </Typography>
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    required
                    label="Headline"
                    value={editFormData.headline}
                    onChange={(e) => handleEditFormChange('headline', e.target.value)}
                    placeholder="e.g., Serial Entrepreneur & Startup Advisor"
                    helperText="A short tagline that describes your expertise"
                  />

                  <TextField
                    fullWidth
                    required
                    label="Bio"
                    value={editFormData.bio}
                    onChange={(e) => handleEditFormChange('bio', e.target.value)}
                    multiline
                    rows={4}
                    placeholder="Tell founders about your experience, background, and what you can help with..."
                    helperText={`${editFormData.bio?.length || 0}/100 characters (minimum 100 required)`}
                    error={editFormData.bio && editFormData.bio.length > 0 && editFormData.bio.length < 100}
                  />

                  <TextField
                    fullWidth
                    required
                    label="LinkedIn Profile URL"
                    value={editFormData.linkedin_url}
                    onChange={(e) => handleEditFormChange('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LinkedIn sx={{ color: '#0A66C2' }} /></InputAdornment>,
                    }}
                  />

                  {/* LinkedIn Verification */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: linkedinStatus.linkedin_verified ? 'success.main' : 'divider',
                      bgcolor: linkedinStatus.linkedin_verified ? alpha('#10b981', 0.04) : alpha('#f8fafc', 0.5),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <LinkedIn sx={{ color: '#0A66C2', fontSize: 24 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                            LinkedIn Verification
                            {linkedinStatus.linkedin_verified && (
                              <Chip
                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                label="Verified"
                                size="small"
                                color="success"
                                sx={{ height: 22, fontSize: '0.7rem' }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {linkedinStatus.linkedin_verified
                              ? `Verified as ${linkedinStatus.linkedin_name || 'LinkedIn User'}`
                              : 'Build trust with founders by verifying your identity'}
                          </Typography>
                        </Box>
                      </Box>
                      {!linkedinStatus.linkedin_verified && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleLinkedInConnect}
                          disabled={linkedinLoading || !linkedinStatus.linkedin_configured}
                          startIcon={linkedinLoading ? <CircularProgress size={14} /> : <LinkedIn />}
                          sx={{
                            borderColor: '#0A66C2',
                            color: '#0A66C2',
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            '&:hover': { borderColor: '#004182', bgcolor: alpha('#0A66C2', 0.04) },
                          }}
                        >
                          {linkedinLoading ? 'Connecting...' : 'Verify'}
                        </Button>
                      )}
                    </Box>
                    {!linkedinStatus.linkedin_configured && !linkedinStatus.linkedin_verified && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        LinkedIn verification coming soon
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Tab 1: Expertise */}
              {editTabIndex === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: -1 }}>
                    Select all that apply - this helps founders find you based on their needs
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Areas of Expertise *</InputLabel>
                    <Select
                      multiple
                      value={editFormData.advisory_types || []}
                      onChange={(e) => handleEditFormChange('advisory_types', e.target.value)}
                      input={<OutlinedInput label="Areas of Expertise *" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={ADVISORY_TYPES.find(t => t.value === value)?.label || value}
                              size="small"
                              sx={{ bgcolor: alpha('#0d9488', 0.1), color: '#0d9488' }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {ADVISORY_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          <Checkbox checked={(editFormData.advisory_types || []).includes(type.value)} />
                          <ListItemText primary={type.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Preferred Startup Stages *</InputLabel>
                    <Select
                      multiple
                      value={editFormData.preferred_stages || []}
                      onChange={(e) => handleEditFormChange('preferred_stages', e.target.value)}
                      input={<OutlinedInput label="Preferred Startup Stages *" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={STAGES.find(s => s.value === value)?.label || value}
                              size="small"
                              sx={{ bgcolor: alpha('#0ea5e9', 0.1), color: '#0ea5e9' }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {STAGES.map((stage) => (
                        <MenuItem key={stage.value} value={stage.value}>
                          <Checkbox checked={(editFormData.preferred_stages || []).includes(stage.value)} />
                          <ListItemText primary={stage.label} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth required>
                    <InputLabel>Industries / Domains *</InputLabel>
                    <Select
                      multiple
                      value={editFormData.domains || []}
                      onChange={(e) => handleEditFormChange('domains', e.target.value)}
                      input={<OutlinedInput label="Industries / Domains *" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip 
                              key={value} 
                              label={value}
                              size="small"
                              sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}
                            />
                          ))}
                        </Box>
                      )}
                    >
                      {DOMAINS.map((domain) => (
                        <MenuItem key={domain} value={domain}>
                          <Checkbox checked={(editFormData.domains || []).includes(domain)} />
                          <ListItemText primary={domain} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}

              {/* Tab 2: Booking Setup */}
              {editTabIndex === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: -1 }}>
                    Set your availability and rates - founders will see this before booking
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel shrink>Availability *</InputLabel>
                    <Select
                      value={editFormData.availability_hours_per_week || ''}
                      onChange={(e) => handleEditFormChange('availability_hours_per_week', e.target.value)}
                      label="Availability *"
                      displayEmpty
                      renderValue={(selected) => {
                        if (!selected) {
                          return <Typography sx={{ color: 'text.secondary' }}>Select your availability</Typography>;
                        }
                        return AVAILABILITY_OPTIONS.find(opt => opt.value === selected)?.label || selected;
                      }}
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    fullWidth
                    label="Cal.com Booking Link"
                    value={editFormData.calcom_booking_url}
                    onChange={(e) => handleEditFormChange('calcom_booking_url', e.target.value)}
                    placeholder="https://cal.com/yourname"
                    helperText="Founders will use this to book consultations directly"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box sx={{ 
                            width: 20, height: 20, borderRadius: 0.5, bgcolor: '#292929', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.5rem', fontWeight: 700,
                          }}>cal</Box>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
                    Consultation Rates
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="30-min rate"
                        type="number"
                        value={editFormData.consultation_rate_30min_usd}
                        onChange={(e) => handleEditFormChange('consultation_rate_30min_usd', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        placeholder="e.g., 50"
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="60-min rate"
                        type="number"
                        value={editFormData.consultation_rate_60min_usd}
                        onChange={(e) => handleEditFormChange('consultation_rate_60min_usd', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                        placeholder="e.g., 90"
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
                    Payment Link (Optional)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: -1, display: 'block', mb: 1 }}>
                    You can discuss payment details directly with founders during the consultation
                  </Typography>

                  <TextField
                    fullWidth
                    label="PayPal Link"
                    value={editFormData.payment_methods.paypal_url}
                    onChange={(e) => handleEditFormChange('payment_methods.paypal_url', e.target.value)}
                    placeholder="https://paypal.me/yourname"
                    size="small"
                    helperText="Optional - founders can pay via this link if you add it"
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            disabled={editSaving}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={editSaving}
            startIcon={editSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#0d9488',
              '&:hover': { bgcolor: '#0f766e' },
            }}
          >
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdvisorDashboard;

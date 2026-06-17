import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
  alpha,
} from '@mui/material';
import { Add, Star } from '@mui/icons-material';
import { API_BASE } from '../../config/api';
import { useUser } from '@clerk/clerk-react';
import AdvisorBrowseMarketplace from '../AdvisorBrowseMarketplace';

const TEAL = '#0d9488';

const WorkspaceAdvisors = ({ workspaceId }) => {
  const { user } = useUser();
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlan = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/my-plan`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const canAccessAdvisors = plan && (plan.id === 'PRO' || plan.id === 'PRO_PLUS' || plan.id === 'PRO_TRIAL');

  return (
    <Box sx={{ p: { xs: 0, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            Advisors
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Connect with experienced advisors for 1-on-1 consultations
          </Typography>
        </Box>
      </Box>

      {/* Subscription gate message for Free users */}
      {!loading && !canAccessAdvisors && (
        <Alert 
          severity="info" 
          icon={<Star />}
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            bgcolor: alpha(TEAL, 0.05),
            border: `1px solid ${alpha(TEAL, 0.2)}`,
            '& .MuiAlert-icon': { color: TEAL },
            borderRadius: { xs: 2, sm: 2 },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            Advisor marketplace is a Pro feature
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Upgrade to Pro to browse our advisor marketplace and book 1-on-1 consultations.
            Pay advisors directly — no platform fees.
          </Typography>
          <Button 
            size="small" 
            variant="contained"
            onClick={() => window.location.href = '/pricing'}
            sx={{ textTransform: 'none', bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' } }}
          >
            Upgrade to Pro
          </Button>
        </Alert>
      )}

      {/* Advisor marketplace info for Pro/Pro+ */}
      {!loading && canAccessAdvisors && (
        <Alert 
          severity="success" 
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            bgcolor: alpha(TEAL, 0.05),
            border: `1px solid ${alpha(TEAL, 0.2)}`,
            '& .MuiAlert-icon': { color: TEAL },
            borderRadius: { xs: 2, sm: 2 },
          }}
        >
          <Typography variant="body2">
            <strong>Book advisors directly</strong> — Browse the marketplace, find advisors who match your needs, 
            and pay them directly via UPI, PayPal, or their preferred payment method. No platform fees.
          </Typography>
        </Alert>
      )}

      {/* Only show button for Pro/Pro+ users */}
      {!loading && canAccessAdvisors && (
        <Box sx={{ display: 'flex', gap: 2, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setMarketplaceOpen(true)}
            sx={{ bgcolor: TEAL, '&:hover': { bgcolor: '#0f766e' }, width: { xs: '100%', sm: 'auto' } }}
          >
            Browse Advisor Marketplace
          </Button>
        </Box>
      )}

      <Card variant="outlined" sx={{ mb: { xs: 3, sm: 4 }, borderRadius: { xs: 2, sm: 2 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 4 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Book 1-on-1 Consultations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: { xs: '100%', sm: 500 }, mx: 'auto', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Browse our marketplace of experienced advisors and book consultation sessions 
              that fit your schedule. Get personalized guidance on strategy, technical decisions, 
              fundraising, and more.
            </Typography>
            {canAccessAdvisors && (
              <Button
                variant="outlined"
                onClick={() => setMarketplaceOpen(true)}
              >
                Find an Advisor
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: { xs: 3, sm: 4 } }} />

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          About Advisors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Advisors provide 1-on-1 consultation sessions with founders. They can help with strategy, 
          technical guidance, industry insights, and mentorship based on their expertise.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          Book sessions through the marketplace above to connect with advisors who match your needs.
        </Typography>
      </Box>

      {/* Marketplace Dialog */}
      <AdvisorBrowseMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        workspaceId={workspaceId}
        onBookingCreated={() => {
          setMarketplaceOpen(false);
        }}
      />
    </Box>
  );
};

export default WorkspaceAdvisors;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { API_BASE } from '../../config/api';
import { useUser } from '@clerk/clerk-react';
import AdvisorBrowseMarketplace from '../AdvisorBrowseMarketplace';

const WorkspaceAccountability = ({ workspaceId }) => {
  const { user } = useUser();
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [workspacePlan, setWorkspacePlan] = useState(null);
  const [canBookAdvisor, setCanBookAdvisor] = useState(false);

  useEffect(() => {
    if (workspaceId && user?.id) {
      fetchWorkspacePlan();
    }
  }, [workspaceId, user?.id]);

  const fetchWorkspacePlan = async () => {
    if (!user?.id || !workspaceId) return;
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/check-feature?feature=accountability.canBookAdvisor`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setWorkspacePlan(data.workspace_plan || 'FREE');
        setCanBookAdvisor(data.has_access || false);
      }
    } catch (err) {
      // Error fetching workspace plan
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Advisors
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect with experienced advisors for 1-on-1 consultations
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setMarketplaceOpen(true)}
        >
          Browse Advisor Marketplace
        </Button>
      </Box>

      {!canBookAdvisor && workspacePlan && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2">
            <strong>You can browse advisors freely.</strong> Booking a consultation requires a Pro+ subscription.
            <Button 
              size="small" 
              onClick={() => window.location.href = '/pricing'}
              sx={{ ml: 1, textTransform: 'none' }}
            >
              Upgrade to Pro+
            </Button>
          </Typography>
        </Alert>
      )}

      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Book 1-on-1 Consultations
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              Browse our marketplace of experienced advisors and book consultation sessions 
              that fit your schedule. Get personalized guidance on strategy, technical decisions, 
              fundraising, and more.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setMarketplaceOpen(true)}
            >
              Find an Advisor
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          About Advisors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Advisors provide 1-on-1 consultation sessions with founders. They can help with strategy, 
          technical guidance, industry insights, and mentorship based on their expertise.
        </Typography>
        <Typography variant="body2" color="text.secondary">
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

export default WorkspaceAccountability;

import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Chip, Skeleton, Tooltip, alpha } from '@mui/material';
import { useFounderPlan, planIdToLabel } from '../hooks/useFounderPlan';
import { useAdvisorBillingProfile, advisorBillingChipLabel } from '../hooks/useAdvisorBillingProfile';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';

/**
 * Header billing chip: founder plan on main app routes, Pro Advisor status on /advisor/*.
 */
const FounderPlanNavTag = () => {
  const { user } = useUser();
  const location = useLocation();
  const isAdvisorHub = location.pathname.startsWith('/advisor/');

  const { planId, loading: founderLoading } = useFounderPlan(user?.id, !isAdvisorHub);
  const { profile, loading: advisorLoading } = useAdvisorBillingProfile(user?.id, isAdvisorHub);

  if (!user) {
    return null;
  }

  if (isAdvisorHub) {
    if (advisorLoading) {
      return <Skeleton variant="rounded" width={140} height={28} sx={{ borderRadius: 1 }} />;
    }

    const label = advisorBillingChipLabel(profile);
    const status = profile?.effective_status || profile?.subscription_status || 'free';
    const softStyle = status === 'free' || status === 'cancelled';

    return (
      <Tooltip title="Advisor subscription & consultations — open dashboard">
        <Chip
          label={label}
          component={RouterLink}
          to="/advisor/dashboard"
          clickable
          size="small"
          sx={{
            fontWeight: 600,
            textDecoration: 'none',
            maxWidth: { xs: 200, sm: 280 },
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            },
            bgcolor: softStyle ? '#f1f5f9' : alpha(TEAL, 0.12),
            color: softStyle ? NAVY : '#0f766e',
            border: '1px solid',
            borderColor: softStyle ? '#e2e8f0' : alpha(TEAL, 0.35),
            '&:hover': {
              bgcolor: softStyle ? '#e2e8f0' : alpha(TEAL, 0.2),
            },
          }}
        />
      </Tooltip>
    );
  }

  if (founderLoading) {
    return <Skeleton variant="rounded" width={88} height={28} sx={{ borderRadius: 1 }} />;
  }

  const founderLabel = `${planIdToLabel(planId)} plan`;

  return (
    <Tooltip title="Founder plans & pricing">
      <Chip
        label={founderLabel}
        component={RouterLink}
        to="/pricing"
        clickable
        size="small"
        sx={{
          fontWeight: 600,
          textDecoration: 'none',
          bgcolor: planId === 'FREE' ? '#f1f5f9' : alpha(TEAL, 0.12),
          color: planId === 'FREE' ? NAVY : '#0f766e',
          border: '1px solid',
          borderColor: planId === 'FREE' ? '#e2e8f0' : alpha(TEAL, 0.35),
          '&:hover': {
            bgcolor: planId === 'FREE' ? '#e2e8f0' : alpha(TEAL, 0.2),
          },
        }}
      />
    </Tooltip>
  );
};

export default FounderPlanNavTag;

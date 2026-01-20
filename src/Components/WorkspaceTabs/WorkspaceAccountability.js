import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add,
  Person,
  Close,
  CheckCircle,
  Email,
  CalendarToday,
  TrendingUp,
  Assignment,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';
import { useUser } from '@clerk/clerk-react';
import AdvisorBrowseMarketplace from '../AdvisorBrowseMarketplace';

const WorkspaceAccountability = ({ workspaceId }) => {
  const { user } = useUser();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [advisorToRemove, setAdvisorToRemove] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [scorecardLoading, setScorecardLoading] = useState(false);
  const [quarterlyReviewOpen, setQuarterlyReviewOpen] = useState(false);
  const [quarterlyReview, setQuarterlyReview] = useState({ quarter: 1, value_rating: 0, continue_next_quarter: true });
  const [savingReview, setSavingReview] = useState(false);
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (workspaceId) {
      fetchPartners();
      fetchScorecard();
      fetchPlan();
    }
  }, [workspaceId]);

  const fetchPlan = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_BASE}/billing/my-plan`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });
      if (response.ok) {
        const planData = await response.json();
        setPlan(planData);
      }
    } catch (err) {
      // Error fetching plan
    }
  };

  const fetchScorecard = async () => {
    if (!partners.length) return; // Wait for partners to load
    
    setScorecardLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/advisor-impact-scorecard`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.has_advisor) {
          setScorecard(data);
        }
      }
    } catch (err) {
      // Error fetching scorecard
    } finally {
      setScorecardLoading(false);
    }
  };

  useEffect(() => {
    if (partners.length > 0) {
      fetchScorecard();
    }
  }, [partners.length]);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/participants`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter for advisors
        const advisors = data.filter(
          (p) => p.role === 'ADVISOR'
        );
        setPartners(advisors);
      }
    } catch (err) {
      // Error fetching partners
    } finally {
      setLoading(false);
    }
  };


  const handleRemoveAdvisorClick = (advisorUserId) => {
    setAdvisorToRemove(advisorUserId);
    setConfirmRemoveOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!advisorToRemove) return;

    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/advisors/${advisorToRemove}`,
        {
          method: 'DELETE',
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove partner');
      }

      setConfirmRemoveOpen(false);
      setAdvisorToRemove(null);
      fetchPartners();
      fetchScorecard();
    } catch (err) {
      alert(`Error: ${err.message}`);
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
            Add advisors to help track progress and provide feedback on your startup
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            if (plan && !plan.accountability?.canUseMarketplace) {
              alert('Marketplace access requires Pro or Pro+ plan. Upgrade to access advisors.');
              return;
            }
            setMarketplaceOpen(true);
          }}
          disabled={plan && !plan.accountability?.canUseMarketplace}
        >
          Find Advisor in Marketplace
        </Button>
      </Box>

      {plan && !plan.accountability?.canUseMarketplace && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="body2">
            <strong>Marketplace access requires Pro or Pro+ plan.</strong> Upgrade to browse and connect with advisors from our marketplace. 
            <Button 
              size="small" 
              onClick={() => window.location.href = '/pricing'}
              sx={{ ml: 1, textTransform: 'none' }}
            >
              View Pricing Plans
            </Button>
          </Typography>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : partners.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                No advisors yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse the marketplace to find available advisors
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {partners.map((partner) => {
            const partnerUser = partner.user || {};
            return (
              <Card key={partner.user_id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Avatar>
                        {partnerUser.name?.[0] || 'P'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {partnerUser.name || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {partnerUser.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveAdvisorClick(partner.user_id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Advisor Impact Scorecard */}
      {scorecard && scorecard.has_advisor && (
        <>
          <Divider sx={{ my: 4 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Advisor Impact This Quarter
            </Typography>
            
            {/* Contact Panel */}
            {scorecard.contact_info && (
              <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Contact Your Advisor
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {scorecard.advisor.name} · {scorecard.contact_info.timezone}
                    </Typography>
                    {scorecard.contact_info.contact_note && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {scorecard.contact_info.contact_note}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      {scorecard.contact_info.email && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Email />}
                          href={`mailto:${scorecard.contact_info.email}`}
                        >
                          Email {scorecard.advisor.name.split(' ')[0]}
                        </Button>
                      )}
                      {scorecard.contact_info.meeting_link && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CalendarToday />}
                          href={scorecard.contact_info.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Book a Call
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}
            
            {/* Metrics Card */}
            <Card sx={{ mb: 3, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* On-time Check-ins */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      On-time Check-ins
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Baseline {scorecard.metrics.on_time_checkins.baseline_rate}% → Current {scorecard.metrics.on_time_checkins.current_rate}%
                      {scorecard.metrics.on_time_checkins.delta > 0 && (
                        <Chip 
                          label={`+${scorecard.metrics.on_time_checkins.delta.toFixed(1)}%`} 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20 }}
                        />
                      )}
                    </Typography>
                  </Box>
                  
                  {/* Important Tasks */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Important Tasks Done Per Week
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Baseline {scorecard.metrics.important_tasks.per_week_baseline.toFixed(1)} → Current {scorecard.metrics.important_tasks.per_week_current.toFixed(1)}
                      {scorecard.metrics.important_tasks.delta > 0 && (
                        <Chip 
                          label={`+${scorecard.metrics.important_tasks.delta.toFixed(1)}`} 
                          size="small" 
                          color="success" 
                          sx={{ ml: 1, height: 20 }}
                        />
                      )}
                    </Typography>
                  </Box>
                  
                  {/* KPI Progress */}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      KPI Progress Toward Targets
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {scorecard.metrics.kpi_progress.average_progress_pct.toFixed(1)}% of distance covered since advisor joined
                      {scorecard.metrics.kpi_progress.kpis_tracked > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Tracking {scorecard.metrics.kpi_progress.kpis_tracked} of {scorecard.metrics.kpi_progress.primary_kpis_count} primary KPIs
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Quarterly Review */}
            <Card sx={{ border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Quarterly Review
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      How valuable has your advisor been this quarter?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          size="small"
                          onClick={() => setQuarterlyReview({ ...quarterlyReview, value_rating: rating })}
                          sx={{ minWidth: 40, p: 0 }}
                        >
                          {rating <= quarterlyReview.value_rating ? (
                            <Star sx={{ color: '#fbbf24' }} />
                          ) : (
                            <StarBorder sx={{ color: '#94a3b8' }} />
                          )}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Do you want to continue with this advisor next quarter?
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant={quarterlyReview.continue_next_quarter ? 'contained' : 'outlined'}
                        onClick={() => setQuarterlyReview({ ...quarterlyReview, continue_next_quarter: true })}
                      >
                        Yes
                      </Button>
                      <Button
                        size="small"
                        variant={!quarterlyReview.continue_next_quarter ? 'contained' : 'outlined'}
                        color="error"
                        onClick={() => setQuarterlyReview({ ...quarterlyReview, continue_next_quarter: false })}
                      >
                        No
                      </Button>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      if (!quarterlyReview.value_rating) {
                        alert('Please rate the advisor value');
                        return;
                      }
                      setSavingReview(true);
                      try {
                        const response = await fetch(
                          `${API_BASE}/workspaces/${workspaceId}/quarterly-review`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-Clerk-User-Id': user.id,
                            },
                            body: JSON.stringify({
                              advisor_user_id: scorecard.advisor.id,
                              quarter: quarterlyReview.quarter,
                              value_rating: quarterlyReview.value_rating,
                              continue_next_quarter: quarterlyReview.continue_next_quarter,
                            }),
                          }
                        );
                        if (response.ok) {
                          alert('Quarterly review saved successfully!');
                        } else {
                          throw new Error('Failed to save review');
                        }
                      } catch (err) {
                        alert('Failed to save review');
                      } finally {
                        setSavingReview(false);
                      }
                    }}
                    disabled={!quarterlyReview.value_rating || savingReview}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {savingReview ? 'Saving...' : 'Save Review'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </>
      )}

      <Divider sx={{ my: 4 }} />

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          About Advisors
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Advisors can:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              View KPIs, commitments, decisions, tasks, check-ins, and equity summary
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Comment on KPIs, decisions, and weekly check-ins
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Set review verdicts (On track / At risk / Off track) for check-ins
            </Typography>
          </li>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Advisors cannot:
        </Typography>
        <Box component="ul" sx={{ pl: 3 }}>
          <li>
            <Typography variant="body2" color="text.secondary">
              Edit equity, roles, KPIs, tasks, or decisions
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="text.secondary">
              Invite/remove users or change workspace settings
            </Typography>
          </li>
        </Box>
      </Box>

      {/* Marketplace Dialog */}
      <AdvisorBrowseMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        workspaceId={workspaceId}
        onRequestAdvisor={() => {
          setMarketplaceOpen(false);
          fetchPartners();
        }}
      />

      {/* Confirm Remove Dialog */}
      <Dialog
        open={confirmRemoveOpen}
        onClose={() => {
          setConfirmRemoveOpen(false);
          setAdvisorToRemove(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remove Advisor</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this advisor from the workspace? They will lose access to all workspace data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setConfirmRemoveOpen(false);
            setAdvisorToRemove(null);
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRemove}
            variant="contained"
            color="error"
          >
            Remove Advisor
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkspaceAccountability;

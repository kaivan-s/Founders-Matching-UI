import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  Alert,
  Button,
  alpha,
  Paper,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  TrendingUp,
  Groups,
  Warning,
  Lightbulb,
  CheckCircle,
  Business,
  Refresh,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';

const TEAL = '#0d9488';
const SLATE_900 = '#0f172a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const PURPLE_500 = '#8b5cf6';
const GREEN_500 = '#22c55e';
const RED_500 = '#ef4444';
const BLUE_500 = '#3b82f6';
const AMBER_500 = '#f59e0b';

const WorkspaceInsights = ({ workspaceId }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsUsage, setInsightsUsage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [projectId, setProjectId] = useState(null);

  useEffect(() => {
    if (user?.id && workspaceId) {
      fetchWorkspaceInsights();
      fetchInsightsUsage();
    }
  }, [user, workspaceId]);

  const fetchWorkspaceInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/insights`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setInsights(data);
          setProjectId(data.project_id);
        } else if (data.project_id) {
          setProjectId(data.project_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspace insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsightsUsage = async () => {
    try {
      const response = await fetch(`${API_BASE}/insights/usage`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      if (response.ok) {
        const data = await response.json();
        setInsightsUsage(data);
      }
    } catch (err) {
      console.error('Failed to fetch insights usage:', err);
    }
  };

  const handleGenerateInsights = async () => {
    if (!projectId || generating) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/projects/${projectId}/insights/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.upgrade_required) {
          setError('Upgrade to Pro or Pro+ to generate AI insights.');
        } else if (data.limit_reached) {
          setError('Monthly insights limit reached. Try again next month.');
        } else {
          throw new Error(data.error || 'Failed to generate insights');
        }
        return;
      }
      
      setInsights(data);
      fetchInsightsUsage();
      
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  const hasInsights = insights && insights.status === 'completed' && insights.report_data;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: { xs: '100%', md: 900 }, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: { xs: 2, sm: 3 }, flexWrap: 'wrap' }}>
        <Box sx={{ 
          p: { xs: 1, sm: 1.5 }, 
          borderRadius: { xs: '10px', sm: '12px' }, 
          bgcolor: alpha(PURPLE_500, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <AutoAwesome sx={{ fontSize: { xs: 24, sm: 28 }, color: PURPLE_500 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: SLATE_900, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            AI-Powered Insights
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Market research, competitor analysis, and recommendations
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {!hasInsights ? (
        // No insights yet - show generation prompt
        <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, textAlign: 'center', border: '1px solid', borderColor: SLATE_200 }}>
          <Box sx={{ 
            width: { xs: 60, sm: 80 }, 
            height: { xs: 60, sm: 80 }, 
            borderRadius: '50%', 
            bgcolor: alpha(PURPLE_500, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: { xs: 2, sm: 3 }
          }}>
            <AutoAwesome sx={{ fontSize: { xs: 30, sm: 40 }, color: PURPLE_500 }} />
          </Box>
          
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            No Insights Generated Yet
          </Typography>
          <Typography variant="body2" sx={{ color: SLATE_500, mb: 3, maxWidth: { xs: '100%', sm: 400 }, mx: 'auto', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Generate AI-powered market research, competitor analysis, SWOT analysis, and actionable recommendations for your project.
          </Typography>

          {insightsUsage?.tier === 'FREE' ? (
            <Box>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Upgrade to Pro or Pro+ to unlock AI Insights
                </Typography>
                <Typography variant="caption" sx={{ color: SLATE_500 }}>
                  Pro users get 3 reports/month, Pro+ users get 10 reports/month.
                </Typography>
              </Alert>
              <Button 
                variant="contained" 
                href="/pricing"
                sx={{ 
                  bgcolor: TEAL, 
                  '&:hover': { bgcolor: '#14b8a6' },
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                View Plans
              </Button>
            </Box>
          ) : insightsUsage?.can_generate ? (
            <Box>
              <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mb: 2 }}>
                {insightsUsage.remaining} of {insightsUsage.max_allowed} reports remaining this month
              </Typography>
              <Button
                variant="contained"
                onClick={handleGenerateInsights}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                sx={{ 
                  bgcolor: PURPLE_500, 
                  '&:hover': { bgcolor: '#7c3aed' },
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                }}
              >
                {generating ? 'Generating...' : 'Generate Insights'}
              </Button>
            </Box>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Monthly limit reached ({insightsUsage?.current_usage}/{insightsUsage?.max_allowed})
              </Typography>
              <Typography variant="caption" sx={{ color: SLATE_500 }}>
                Your limit resets at the beginning of next month.
              </Typography>
            </Alert>
          )}
        </Paper>
      ) : (
        // Show insights report
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
          {/* Executive Summary */}
          {insights.report_data.executive_summary && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lightbulb sx={{ color: AMBER_500 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Executive Summary
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ color: SLATE_900, lineHeight: 1.8 }}>
                {insights.report_data.executive_summary}
              </Typography>
            </Paper>
          )}

          {/* Market Overview */}
          {insights.report_data.market_overview && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingUp sx={{ color: GREEN_500 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Market Overview
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insights.report_data.market_overview.market_size && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, mb: 0.5 }}>
                      Market Size
                    </Typography>
                    <Typography variant="body2">
                      {insights.report_data.market_overview.market_size}
                    </Typography>
                  </Box>
                )}
                {insights.report_data.market_overview.growth_trends && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, mb: 0.5 }}>
                      Growth Trends
                    </Typography>
                    <Typography variant="body2">
                      {insights.report_data.market_overview.growth_trends}
                    </Typography>
                  </Box>
                )}
                {insights.report_data.market_overview.key_drivers?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, mb: 1 }}>
                      Key Market Drivers
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {insights.report_data.market_overview.key_drivers.map((driver, i) => (
                        <Chip 
                          key={i} 
                          label={driver} 
                          size="small" 
                          sx={{ 
                            bgcolor: alpha(GREEN_500, 0.1), 
                            color: GREEN_500,
                            fontWeight: 500,
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* Competitor Landscape */}
          {insights.report_data.competitors?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Groups sx={{ color: BLUE_500, fontSize: { xs: 20, sm: 24 } }} />
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Competitor Landscape
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
                {insights.report_data.competitors.map((competitor, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      p: 2, 
                      bgcolor: SLATE_100, 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: SLATE_200,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {competitor.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: SLATE_500, display: 'block', mb: 1 }}>
                      {competitor.description}
                    </Typography>
                    {competitor.funding && (
                      <Chip 
                        label={competitor.funding} 
                        size="small" 
                        sx={{ fontSize: '0.65rem', height: 20 }} 
                      />
                    )}
                    {competitor.strengths?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: SLATE_500, fontWeight: 600 }}>
                          Strengths:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                          {competitor.strengths.slice(0, 2).map((strength, j) => (
                            <Typography component="li" key={j} variant="caption">
                              {strength}
                            </Typography>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Competitive Positioning */}
          {insights.report_data.positioning && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business sx={{ color: PURPLE_500 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Competitive Positioning
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insights.report_data.positioning.market_fit && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, mb: 0.5 }}>
                      Market Fit
                    </Typography>
                    <Typography variant="body2">
                      {insights.report_data.positioning.market_fit}
                    </Typography>
                  </Box>
                )}
                {insights.report_data.positioning.differentiation?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: SLATE_500, mb: 1 }}>
                      Differentiation Opportunities
                    </Typography>
                    <Box component="ul" sx={{ m: 0, pl: 3 }}>
                      {insights.report_data.positioning.differentiation.map((item, i) => (
                        <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Paper>
          )}

          {/* SWOT Analysis */}
          {insights.report_data.swot && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                SWOT Analysis
              </Typography>
              <Box sx={{ display: 'grid', gap: { xs: 1.5, sm: 2 }, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                {[
                  { key: 'strengths', label: 'Strengths', color: GREEN_500, icon: <CheckCircle /> },
                  { key: 'weaknesses', label: 'Weaknesses', color: RED_500, icon: <Warning /> },
                  { key: 'opportunities', label: 'Opportunities', color: BLUE_500, icon: <TrendingUp /> },
                  { key: 'threats', label: 'Threats', color: AMBER_500, icon: <Warning /> },
                ].map(({ key, label, color, icon }) => (
                  <Box 
                    key={key} 
                    sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      bgcolor: alpha(color, 0.05),
                      border: '1px solid',
                      borderColor: alpha(color, 0.2),
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Box sx={{ color }}>{icon}</Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color, textTransform: 'uppercase' }}>
                        {label}
                      </Typography>
                    </Box>
                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                      {insights.report_data.swot[key]?.map((item, i) => (
                        <Typography component="li" key={i} variant="body2" sx={{ mb: 0.5 }}>
                          {item}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Key Risks */}
          {insights.report_data.risks?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '1px solid', borderColor: SLATE_200 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Warning sx={{ color: AMBER_500 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Key Risks & Challenges
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insights.report_data.risks.map((risk, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      p: 2, 
                      bgcolor: SLATE_100, 
                      borderRadius: 2,
                      borderLeft: '4px solid',
                      borderLeftColor: risk.type === 'market' ? BLUE_500 : 
                                       risk.type === 'technical' ? PURPLE_500 : AMBER_500,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip 
                        label={risk.type || 'Risk'} 
                        size="small" 
                        sx={{ 
                          textTransform: 'capitalize',
                          bgcolor: risk.type === 'market' ? alpha(BLUE_500, 0.1) : 
                                   risk.type === 'technical' ? alpha(PURPLE_500, 0.1) : alpha(AMBER_500, 0.1),
                          color: risk.type === 'market' ? BLUE_500 : 
                                 risk.type === 'technical' ? PURPLE_500 : AMBER_500,
                          fontWeight: 600,
                          fontSize: '0.65rem',
                        }} 
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                      {risk.description}
                    </Typography>
                    {risk.mitigation && (
                      <Typography variant="caption" sx={{ color: SLATE_500 }}>
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Recommendations */}
          {insights.report_data.recommendations?.length > 0 && (
            <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: '2px solid', borderColor: TEAL }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lightbulb sx={{ color: TEAL }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recommendations
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {insights.report_data.recommendations.map((rec, i) => (
                  <Box 
                    key={i} 
                    sx={{ 
                      p: 2, 
                      bgcolor: alpha(TEAL, 0.05), 
                      borderRadius: 2,
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start'
                    }}
                  >
                    <Box sx={{ 
                      minWidth: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      bgcolor: TEAL, 
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {rec.priority || i + 1}
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {rec.action}
                      </Typography>
                      {rec.rationale && (
                        <Typography variant="body2" sx={{ color: SLATE_500 }}>
                          {rec.rationale}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Generation metadata */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            pt: 2, 
            borderTop: '1px solid', 
            borderColor: SLATE_200 
          }}>
            <Typography variant="caption" sx={{ color: SLATE_400 }}>
              Generated on {new Date(insights.completed_at || insights.created_at).toLocaleDateString()} 
              {insights.model_used && ` • Model: ${insights.model_used}`}
            </Typography>
            {insightsUsage?.can_generate && (
              <Button
                size="small"
                onClick={handleGenerateInsights}
                disabled={generating}
                startIcon={generating ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 16 }} />}
                sx={{ 
                  textTransform: 'none', 
                  color: SLATE_500,
                  '&:hover': { bgcolor: alpha(SLATE_500, 0.08) }
                }}
              >
                Regenerate
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default WorkspaceInsights;

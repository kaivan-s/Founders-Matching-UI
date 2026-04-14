import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Divider,
  Stack,
  alpha,
  Collapse,
  TextField,
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Balance,
  Code,
  BusinessCenter,
  Edit,
  ExpandMore,
  ExpandLess,
  Download,
  Description,
  Gavel,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';

// Equity Split Templates
const EQUITY_TEMPLATES = [
  {
    id: 'equal',
    label: 'Equal Split',
    icon: <Balance />,
    split: { a: 50, b: 50 },
    description: 'Both co-founders contributing equally in time, effort, and resources.',
    bestFor: 'Most common for co-founders starting together at the same stage.',
    color: '#0d9488',
  },
  {
    id: 'tech_heavy',
    label: 'Technical Lead',
    icon: <Code />,
    split: { a: 60, b: 40 },
    description: 'Technical co-founder building the core product, business co-founder handles ops/sales.',
    bestFor: 'When the technical co-founder has the original idea and is building the MVP.',
    color: '#3b82f6',
  },
  {
    id: 'business_heavy',
    label: 'Business Lead',
    icon: <BusinessCenter />,
    split: { a: 40, b: 60 },
    description: 'Business co-founder leading sales, fundraising, and operations.',
    bestFor: 'When the business co-founder has domain expertise, customers, or funding.',
    color: '#8b5cf6',
  },
  {
    id: 'custom',
    label: 'Custom Split',
    icon: <Edit />,
    split: null,
    description: 'Define your own equity split based on your unique situation.',
    bestFor: 'When contributions are significantly different or negotiated differently.',
    color: '#64748b',
  },
];

const VESTING_OPTIONS = [
  { value: 'standard', label: '4 years with 1-year cliff (Recommended)', years: 4, cliff: 12 },
  { value: 'three_year', label: '3 years with 1-year cliff', years: 3, cliff: 12 },
  { value: 'no_vesting', label: 'No vesting (Not recommended)', years: 0, cliff: 0 },
];

const STAGES = [
  { value: 'idea', label: 'Idea Stage', description: 'Just an idea, no product yet' },
  { value: 'pre_seed', label: 'Pre-seed', description: 'Building MVP' },
  { value: 'mvp', label: 'MVP', description: 'Product exists, validating' },
  { value: 'launched', label: 'Launched', description: 'Live with users/revenue' },
];

const SimpleEquityWizard = ({ workspaceId, participants, onComplete, onSwitchToAdvanced }) => {
  const { user } = useUser();
  const [step, setStep] = useState(1); // 1: Context, 2: Split, 3: Confirm & Sign
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Step 1: Context
  const [stage, setStage] = useState('');
  const [ideaOrigin, setIdeaOrigin] = useState('');
  
  // Step 2: Split
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customSplit, setCustomSplit] = useState({ a: 50, b: 50 });
  const [vestingOption, setVestingOption] = useState('standard');
  
  // Step 3: Approval
  const [approvalStatus, setApprovalStatus] = useState({ a: false, b: false });
  const [createdScenario, setCreatedScenario] = useState(null);
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [generatingDoc, setGeneratingDoc] = useState(false);
  
  // Show advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Founders
  const foundersFromParticipants = (participants || []).filter(p => p.role !== 'ADVISOR');
  const founderA = foundersFromParticipants?.[0];
  const founderB = foundersFromParticipants?.[1];
  const currentUserId = user?.id;
  const isFounderA = founderA?.user?.clerk_user_id === currentUserId;
  const isFounderB = founderB?.user?.clerk_user_id === currentUserId;
  
  // Load existing data
  const loadExistingData = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    setLoading(true);
    try {
      // Check if there's already an approved scenario
      const scenariosRes = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/scenarios`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (scenariosRes.ok) {
        const scenarios = await scenariosRes.json();
        const approvedScenario = scenarios.find(s => 
          s.approved_by_founder_a_at && s.approved_by_founder_b_at
        );
        
        if (approvedScenario) {
          setCreatedScenario(approvedScenario);
          setStep(3);
          
          // Check for existing document
          const docsRes = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/documents`, {
            headers: { 'X-Clerk-User-Id': user.id },
          });
          if (docsRes.ok) {
            const docs = await docsRes.json();
            const approvedDoc = docs.find(d => d.scenario_id === approvedScenario.id);
            if (approvedDoc) {
              setGeneratedDocument(approvedDoc);
            }
          }
        } else if (scenarios.length > 0) {
          // There's a pending scenario
          const pendingScenario = scenarios[0];
          setCreatedScenario(pendingScenario);
          setApprovalStatus({
            a: !!pendingScenario.approved_by_founder_a_at,
            b: !!pendingScenario.approved_by_founder_b_at,
          });
          setStep(3);
        }
      }
      
      // Load startup context
      const contextRes = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/startup-context`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (contextRes.ok) {
        const contextData = await contextRes.json();
        if (contextData.startup_context) {
          setStage(contextData.startup_context.stage || '');
          setIdeaOrigin(contextData.startup_context.idea_origin || '');
        }
      }
    } catch (err) {
      console.error('Error loading existing data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId]);
  
  useEffect(() => {
    loadExistingData();
  }, [loadExistingData]);
  
  const handleNextStep = async () => {
    if (step === 1) {
      // Save context
      setSaving(true);
      try {
        await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/startup-context`, {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            startup_context: { stage, idea_origin: ideaOrigin } 
          }),
        });
        setStep(2);
      } catch (err) {
        setError('Failed to save context');
      } finally {
        setSaving(false);
      }
    } else if (step === 2) {
      // Create scenario
      if (!selectedTemplate) {
        setError('Please select an equity split template');
        return;
      }
      
      setSaving(true);
      setError(null);
      
      try {
        const split = selectedTemplate === 'custom' ? customSplit : 
          EQUITY_TEMPLATES.find(t => t.id === selectedTemplate)?.split;
        
        const vestingConfig = VESTING_OPTIONS.find(v => v.value === vestingOption);
        
        // Map template to scenario_type expected by backend
        const scenarioTypeMap = {
          'equal': 'equal',
          'tech_heavy': 'custom',
          'business_heavy': 'custom',
          'custom': 'custom',
        };
        
        const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/scenarios`, {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scenario_type: scenarioTypeMap[selectedTemplate] || 'custom',
            founder_a_percent: split.a,
            founder_b_percent: split.b,
            vesting_terms: {
              has_vesting: vestingConfig.years > 0,
              years: vestingConfig.years,
              cliff_months: vestingConfig.cliff,
              acceleration: 'none',
              jurisdiction: 'other',
            },
            calculation_breakdown: {
              template_used: selectedTemplate,
              template_label: EQUITY_TEMPLATES.find(t => t.id === selectedTemplate)?.label || 'Custom',
            },
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create scenario');
        }
        
        const data = await response.json();
        const scenario = data.scenario || data;
        setCreatedScenario(scenario);
        setStep(3);
      } catch (err) {
        setError(err.message);
      } finally {
        setSaving(false);
      }
    }
  };
  
  const handleApprove = async () => {
    if (!createdScenario) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/equity/scenarios/${createdScenario.id}/approve`,
        {
          method: 'PATCH',
          headers: { 'X-Clerk-User-Id': user.id },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve');
      }
      
      const data = await response.json();
      const updated = data.scenario || data;
      setCreatedScenario(updated);
      setApprovalStatus({
        a: !!updated.approved_by_founder_a_at,
        b: !!updated.approved_by_founder_b_at,
      });
      
      if (updated.approved_by_founder_a_at && updated.approved_by_founder_b_at) {
        setSuccess('Both founders approved! You can now generate your agreement.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleGenerateDocument = async () => {
    if (!createdScenario) return;
    
    setGeneratingDoc(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/equity/generate-document`,
        {
          method: 'POST',
          headers: { 
            'X-Clerk-User-Id': user.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scenario_id: createdScenario.id }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate agreement');
      }
      
      const document = await response.json();
      setGeneratedDocument(document);
      setSuccess('Agreement generated successfully!');
      
      if (onComplete) onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingDoc(false);
    }
  };
  
  const handleDownload = async (fileType) => {
    if (!generatedDocument) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/equity/documents/${generatedDocument.id}/download/${fileType}`,
        {
          headers: { 'X-Clerk-User-Id': user.id },
        }
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `co-founder-agreement.${fileType}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError(`Failed to download ${fileType.toUpperCase()}`);
    }
  };
  
  const getSplit = () => {
    if (selectedTemplate === 'custom') return customSplit;
    return EQUITY_TEMPLATES.find(t => t.id === selectedTemplate)?.split || { a: 50, b: 50 };
  };
  
  const bothApproved = approvalStatus.a && approvalStatus.b;
  const currentUserApproved = (isFounderA && approvalStatus.a) || (isFounderB && approvalStatus.b);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Equity Agreement
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Set up your co-founder equity split in 3 simple steps
        </Typography>
      </Box>
      
      {/* Progress Steps */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        {[
          { num: 1, label: 'Context' },
          { num: 2, label: 'Split' },
          { num: 3, label: 'Sign' },
        ].map((s) => (
          <Box 
            key={s.num}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              opacity: step >= s.num ? 1 : 0.5,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: step > s.num ? 'success.main' : step === s.num ? 'primary.main' : 'grey.300',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {step > s.num ? <CheckCircle sx={{ fontSize: 18 }} /> : s.num}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: step === s.num ? 600 : 400 }}>
              {s.label}
            </Typography>
            {s.num < 3 && (
              <Box sx={{ width: 40, height: 2, bgcolor: step > s.num ? 'success.main' : 'grey.300', mx: 1 }} />
            )}
          </Box>
        ))}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Step 1: Context */}
      {step === 1 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            Quick Context
          </Typography>
          
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>What stage is your startup?</InputLabel>
              <Select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                label="What stage is your startup?"
              >
                {STAGES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{s.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Who had the original idea?</InputLabel>
              <Select
                value={ideaOrigin}
                onChange={(e) => setIdeaOrigin(e.target.value)}
                label="Who had the original idea?"
              >
                <MenuItem value="founder_a">{founderA?.user?.name || 'Founder A'}</MenuItem>
                <MenuItem value="founder_b">{founderB?.user?.name || 'Founder B'}</MenuItem>
                <MenuItem value="both">Both of us together</MenuItem>
                <MenuItem value="neither">Neither (pivoted idea)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleNextStep}
              disabled={!stage || saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={20} /> : 'Next'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Step 2: Split */}
      {step === 2 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Choose Your Equity Split
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select a template that best matches your situation
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {EQUITY_TEMPLATES.map((template) => (
              <Grid item xs={12} sm={6} key={template.id}>
                <Paper
                  elevation={0}
                  onClick={() => setSelectedTemplate(template.id)}
                  sx={{
                    p: 2.5,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedTemplate === template.id ? template.color : 'divider',
                    borderRadius: 2,
                    bgcolor: selectedTemplate === template.id ? alpha(template.color, 0.05) : 'background.paper',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: template.color,
                      bgcolor: alpha(template.color, 0.03),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Box sx={{ 
                      p: 1, 
                      borderRadius: 1.5, 
                      bgcolor: alpha(template.color, 0.1),
                      color: template.color,
                    }}>
                      {template.icon}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {template.label}
                      </Typography>
                      {template.split && (
                        <Typography variant="caption" sx={{ color: template.color, fontWeight: 600 }}>
                          {template.split.a}% / {template.split.b}%
                        </Typography>
                      )}
                    </Box>
                    {selectedTemplate === template.id && (
                      <CheckCircle sx={{ color: template.color }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {template.description}
                  </Typography>
                  <Chip 
                    label={template.bestFor} 
                    size="small" 
                    sx={{ 
                      fontSize: '0.65rem', 
                      height: 20,
                      bgcolor: alpha(template.color, 0.1),
                      color: template.color,
                    }} 
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
          
          {/* Custom Split Slider */}
          <Collapse in={selectedTemplate === 'custom'}>
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Custom Split
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {founderA?.user?.name || 'Founder A'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {customSplit.a}%
                  </Typography>
                </Box>
                <Box sx={{ flex: 2 }}>
                  <Slider
                    value={customSplit.a}
                    onChange={(_, value) => setCustomSplit({ a: value, b: 100 - value })}
                    min={10}
                    max={90}
                    valueLabelDisplay="auto"
                  />
                </Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {founderB?.user?.name || 'Founder B'}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {customSplit.b}%
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Collapse>
          
          {/* Vesting */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Vesting Schedule</InputLabel>
            <Select
              value={vestingOption}
              onChange={(e) => setVestingOption(e.target.value)}
              label="Vesting Schedule"
            >
              {VESTING_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Advanced Mode Link */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowAdvanced(!showAdvanced)}
              endIcon={showAdvanced ? <ExpandLess /> : <ExpandMore />}
              sx={{ color: 'text.secondary' }}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Box>
          
          <Collapse in={showAdvanced}>
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Need more detailed analysis? Use our advanced questionnaire to calculate equity based on 
                time commitment, capital contribution, expertise, and more.
              </Typography>
              <Button
                variant="outlined"
                onClick={onSwitchToAdvanced}
                size="small"
              >
                Use Advanced Questionnaire
              </Button>
            </Paper>
          </Collapse>
          
          {/* Summary */}
          {selectedTemplate && (
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha('#0d9488', 0.05), borderRadius: 2, mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={founderA?.user?.profile_image_url} sx={{ width: 36, height: 36 }}>
                      {founderA?.user?.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {founderA?.user?.name || 'Founder A'}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {getSplit().a}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {founderB?.user?.name || 'Founder B'}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        {getSplit().b}%
                      </Typography>
                    </Box>
                    <Avatar src={founderB?.user?.profile_image_url} sx={{ width: 36, height: 36 }}>
                      {founderB?.user?.name?.[0]}
                    </Avatar>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Vesting: {VESTING_OPTIONS.find(v => v.value === vestingOption)?.label}
              </Typography>
            </Paper>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button variant="outlined" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNextStep}
              disabled={!selectedTemplate || saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={20} /> : 'Create Agreement'}
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Step 3: Approval & Document */}
      {step === 3 && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
            {bothApproved ? 'Agreement Ready' : 'Approve & Sign'}
          </Typography>
          
          {/* Scenario Summary */}
          {createdScenario && (
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={founderA?.user?.profile_image_url} sx={{ width: 40, height: 40 }}>
                      {founderA?.user?.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {founderA?.user?.name || 'Founder A'}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {createdScenario.founder_a_percent}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {founderB?.user?.name || 'Founder B'}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                        {createdScenario.founder_b_percent}%
                      </Typography>
                    </Box>
                    <Avatar src={founderB?.user?.profile_image_url} sx={{ width: 40, height: 40 }}>
                      {founderB?.user?.name?.[0]}
                    </Avatar>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {/* Approval Status */}
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Approval Status
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: approvalStatus.a ? 'success.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: approvalStatus.a ? alpha('#10b981', 0.05) : 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {approvalStatus.a ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <HourglassEmpty sx={{ color: 'text.secondary' }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {founderA?.user?.name || 'Founder A'}
                  </Typography>
                </Box>
                <Typography variant="caption" color={approvalStatus.a ? 'success.main' : 'text.secondary'}>
                  {approvalStatus.a ? 'Approved' : 'Pending approval'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: approvalStatus.b ? 'success.main' : 'divider',
                  borderRadius: 2,
                  bgcolor: approvalStatus.b ? alpha('#10b981', 0.05) : 'background.paper',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {approvalStatus.b ? (
                    <CheckCircle sx={{ color: 'success.main' }} />
                  ) : (
                    <HourglassEmpty sx={{ color: 'text.secondary' }} />
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {founderB?.user?.name || 'Founder B'}
                  </Typography>
                </Box>
                <Typography variant="caption" color={approvalStatus.b ? 'success.main' : 'text.secondary'}>
                  {approvalStatus.b ? 'Approved' : 'Pending approval'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Approve Button */}
          {!currentUserApproved && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleApprove}
              disabled={saving}
              startIcon={<Gavel />}
              sx={{ mb: 3 }}
            >
              {saving ? <CircularProgress size={20} /> : 'I Approve This Split'}
            </Button>
          )}
          
          {/* Generate Document */}
          {bothApproved && !generatedDocument && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleGenerateDocument}
              disabled={generatingDoc}
              startIcon={<Description />}
              color="success"
              sx={{ mb: 3 }}
            >
              {generatingDoc ? <CircularProgress size={20} /> : 'Generate Co-Founder Agreement'}
            </Button>
          )}
          
          {/* Download Document */}
          {generatedDocument && (
            <Paper elevation={0} sx={{ p: 3, bgcolor: alpha('#10b981', 0.05), borderRadius: 2, border: '1px solid', borderColor: 'success.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Description sx={{ color: 'success.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Agreement Ready
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your co-founder agreement has been generated. Download it below.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownload('pdf')}
                >
                  Download PDF
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownload('docx')}
                >
                  Download DOCX
                </Button>
              </Box>
            </Paper>
          )}
          
          {/* Waiting for other founder */}
          {currentUserApproved && !bothApproved && (
            <Alert severity="info">
              Waiting for {isFounderA ? founderB?.user?.name : founderA?.user?.name} to approve.
              They will receive an email notification.
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SimpleEquityWizard;

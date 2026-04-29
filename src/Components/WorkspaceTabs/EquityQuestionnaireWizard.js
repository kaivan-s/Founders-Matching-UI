import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
  Checkbox,
  Slider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Avatar,
  Stack,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Download,
  Refresh,
  Person,
  Business,
  Gavel,
  Calculate,
  Description,
  ThumbUp,
  LockClock,
  Info,
} from '@mui/icons-material';
import { API_BASE } from '../../config/api';

// Constants
const STAGES = [
  { value: 'idea', label: 'Idea Stage', description: 'Concept only, no product yet' },
  { value: 'pre_seed', label: 'Pre-seed', description: 'Building MVP, early validation' },
  { value: 'mvp', label: 'MVP', description: 'Product exists, seeking product-market fit' },
  { value: 'launched', label: 'Launched', description: 'Live product with users/revenue' },
];

const TIME_COMMITMENTS = [
  { value: 'full_time_now', label: 'Full-time now', score: 10 },
  { value: 'full_time_soon', label: 'Full-time soon (within 3 months)', score: 8 },
  { value: 'part_time_20plus', label: 'Part-time (20+ hours/week)', score: 5 },
  { value: 'part_time_under_20', label: 'Part-time (<20 hours/week)', score: 3 },
  { value: 'advisor', label: 'Advisor role only', score: 1 },
];

const CAPITAL_RANGES = [
  { value: '0', label: '$0' },
  { value: '10k', label: '$10,000' },
  { value: '25k', label: '$25,000' },
  { value: '50k', label: '$50,000' },
  { value: '100k', label: '$100,000' },
  { value: '250k_plus', label: '$250,000+' },
];

const EXPERTISE_AREAS = [
  { value: 'product', label: 'Product Management' },
  { value: 'engineering', label: 'Engineering/Tech' },
  { value: 'design', label: 'Design/UX' },
  { value: 'sales', label: 'Sales/BD' },
  { value: 'finance', label: 'Finance/Operations' },
  { value: 'domain', label: 'Domain Expertise' },
];

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: '0-2 years experience', score: 3 },
  { value: 'intermediate', label: 'Intermediate', description: '2-5 years experience', score: 6 },
  { value: 'expert', label: 'Expert', description: '5-10 years experience', score: 9 },
  { value: 'leader', label: 'Industry Leader', description: '10+ years, recognized expert', score: 10 },
];

const NETWORK_LEVELS = [
  { value: 'none', label: 'None', description: 'No relevant connections' },
  { value: 'some', label: 'Some', description: 'A few relevant contacts' },
  { value: 'strong', label: 'Strong', description: 'Good network in the industry' },
  { value: 'exceptional', label: 'Exceptional', description: 'Can open doors anywhere' },
];

const ROLES = [
  { value: 'CEO', label: 'CEO' },
  { value: 'CTO', label: 'CTO' },
  { value: 'CPO', label: 'CPO' },
  { value: 'COO', label: 'COO' },
  { value: 'CFO', label: 'CFO' },
  { value: 'other', label: 'Other' },
];

const VESTING_PRESETS = [
  { value: 'standard', label: '4 years, 1-year cliff (Standard)', years: 4, cliff: 12 },
  { value: 'three_year', label: '3 years, 1-year cliff', years: 3, cliff: 12 },
  { value: 'no_vesting', label: 'No vesting', years: 0, cliff: 0 },
  { value: 'custom', label: 'Custom', years: null, cliff: null },
];

const ACCELERATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No acceleration on exit' },
  { value: 'single_trigger', label: 'Single-trigger', description: 'Full acceleration on acquisition' },
  { value: 'double_trigger', label: 'Double-trigger', description: 'Acceleration only if terminated after acquisition' },
];

const JURISDICTIONS = [
  { value: 'india', label: 'India' },
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'other', label: 'Other' },
];

// Section tabs
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: <Business /> },
  { id: 'startup', label: 'Startup Context', icon: <Business /> },
  { id: 'my-details', label: 'My Details', icon: <Person /> },
  { id: 'vesting', label: 'Vesting Terms', icon: <LockClock /> },
  { id: 'calculate', label: 'Calculate Split', icon: <Calculate /> },
  { id: 'approval', label: 'Approval', icon: <ThumbUp /> },
  { id: 'document', label: 'Document', icon: <Description /> },
];

const EquityQuestionnaireWizard = ({ workspaceId, participants, onComplete }) => {
  const { user } = useUser();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Completion status tracking
  const [founderAComplete, setFounderAComplete] = useState(false);
  const [founderBComplete, setFounderBComplete] = useState(false);
  const [startupContextComplete, setStartupContextComplete] = useState(false);
  const [vestingComplete, setVestingComplete] = useState(false);
  
  // Store API's founder IDs to correctly map participants to founder_a/founder_b
  const [founderAId, setFounderAId] = useState(null);
  const [founderBId, setFounderBId] = useState(null);
  
  // Questionnaire state
  const [startupContext, setStartupContext] = useState({
    stage: '',
    idea_origin: '',
    has_ip: false,
    ip_owner: '',
  });
  
  // Current user's responses
  const [myResponses, setMyResponses] = useState({
    time_commitment: '',
    risk: { leaving_job: false, personal_guarantee: false },
    capital_contribution: { range: '', exact_amount: '' },
    expertise: { primary_area: '', skill_level: '' },
    network: '',
    role: { title: '', handles_fundraising: '' },
    responsibilities: '',
  });
  
  // Other founder's responses (read-only display)
  const [otherFounderResponses, setOtherFounderResponses] = useState(null);
  
  const [vestingTerms, setVestingTerms] = useState({
    preset: 'standard',
    has_vesting: true,
    years: 4,
    cliff_months: 12,
    acceleration: 'none',
    // Advisor equity allocation (optional - set to 0 by default)
    advisor_equity_percent: 0,  // Default 0% - founders choose to reserve
    advisor_vesting_years: 2,   // Shorter vesting for advisors
    advisor_cliff_months: 3,    // 3-month cliff for advisors
    jurisdiction: 'india',
  });
  
  const [calculatedScenarios, setCalculatedScenarios] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [customSplit, setCustomSplit] = useState({ a: 50, b: 50 });
  
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [createdScenario, setCreatedScenario] = useState(null);
  const [allScenarios, setAllScenarios] = useState([]);  // All scenarios from any co-founder
  const [selectedScenarioForApproval, setSelectedScenarioForApproval] = useState(null);
  
  const [generatedDocument, setGeneratedDocument] = useState(null);
  const [allDocuments, setAllDocuments] = useState([]); // All documents for approved scenarios
  const [generatingDoc, setGeneratingDoc] = useState(false);
  
  // Determine which founder the current user is
  const currentUserId = user?.id;
  
  // Separate founders (role !== 'ADVISOR') from advisors (role === 'ADVISOR')
  const foundersFromParticipants = (participants || []).filter(p => p.role !== 'ADVISOR');
  const advisor = (participants || []).find(p => p.role === 'ADVISOR');
  
  // Match participants to API's founder_a and founder_b using stored IDs
  // This ensures UI displays the same founder as "A" that the API considers "A"
  const founderA = founderAId 
    ? foundersFromParticipants.find(p => p.user_id === founderAId || p.user?.id === founderAId) || foundersFromParticipants?.[0]
    : foundersFromParticipants?.[0];
  const founderB = founderBId 
    ? foundersFromParticipants.find(p => p.user_id === founderBId || p.user?.id === founderBId) || foundersFromParticipants?.[1]
    : foundersFromParticipants?.[1];
  
  // Properly identify which founder the current user is by checking clerk_user_id
  const isFounderA = founderA?.user?.clerk_user_id === currentUserId;
  const isFounderB = founderB?.user?.clerk_user_id === currentUserId;
  
  const currentFounder = isFounderA ? founderA : (isFounderB ? founderB : null);
  const otherFounder = isFounderA ? founderB : (isFounderB ? founderA : null);
  
  const bothFoundersComplete = founderAComplete && founderBComplete;
  
  // Advisor info for display
  const advisorName = advisor?.user?.name || 'Project Advisor';

  // Load startup context separately (shared data)
  const loadStartupContext = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/startup-context`, {
        headers: { 'X-Clerk-User-Id': user?.id || '' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.startup_context) {
          setStartupContext(data.startup_context);
          setStartupContextComplete(!!data.startup_context.stage);
        }
      }
    } catch (err) {
      // Error loading startup context
    }
  }, [workspaceId, user?.id]);

  // Save startup context separately (shared data)
  const saveStartupContext = useCallback(async () => {
    if (!workspaceId) return;
    
    try {
      await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/startup-context`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user?.id || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startup_context: startupContext }),
      });
    } catch (err) {
      // Error saving startup context
      setError('Failed to save startup context');
    }
  }, [workspaceId, startupContext, user?.id]);

  const loadExistingResponses = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    setLoading(true);
    try {
      // Note: startup_context is now loaded from the main questionnaire response
      
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/questionnaire`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Track completion status - check by clerk_user_id to ensure correct mapping
        const currentUserIdForCheck = user?.id;
        const founderAIsCurrentUser = data.founder_a?.clerk_user_id === currentUserIdForCheck;
        const founderBIsCurrentUser = data.founder_b?.clerk_user_id === currentUserIdForCheck;
        
        
        // Store the API's founder IDs for correct mapping
        setFounderAId(data.founder_a_id || data.founder_a?.founder_id);
        setFounderBId(data.founder_b_id || data.founder_b?.founder_id);
        
        setFounderAComplete(data.founder_a?.is_complete || false);
        setFounderBComplete(data.founder_b?.is_complete || false);
        
        // Load current user's responses - use clerk_user_id to identify correctly
        const myData = founderAIsCurrentUser ? data.founder_a : (founderBIsCurrentUser ? data.founder_b : null);
        const otherData = founderAIsCurrentUser ? data.founder_b : (founderBIsCurrentUser ? data.founder_a : null);
        
        if (myData?.responses) {
          const resp = myData.responses;
          const loadedResponses = {
            time_commitment: resp.time_commitment || '',
            risk: resp.risk || { leaving_job: false, personal_guarantee: false },
            capital_contribution: resp.capital_contribution || { range: '', exact_amount: '' },
            expertise: resp.expertise || { primary_area: '', skill_level: '' },
            network: resp.network || '',
            role: resp.role || { title: '', handles_fundraising: '' },
            responsibilities: resp.responsibilities || '',
          };
          setMyResponses(loadedResponses);
          if (resp.vesting_terms) {
            setVestingTerms(resp.vesting_terms);
            setVestingComplete(true);
          }
        } else {
        }
        
        // Also update completion status based on the API response
        if (founderAIsCurrentUser) {
          setFounderAComplete(data.founder_a?.is_complete || false);
        } else if (founderBIsCurrentUser) {
          setFounderBComplete(data.founder_b?.is_complete || false);
        }
        
        // Store other founder's responses for display
        if (otherData?.responses) {
          setOtherFounderResponses(otherData.responses);
        }
        
        // Update startup context from main response if available
        if (data.startup_context) {
          setStartupContext(data.startup_context);
          setStartupContextComplete(!!data.startup_context.stage);
        }
        
        // Note: Don't auto-calculate here - user should click the calculate button
        // Auto-calculating on load can cause infinite loops if it changes state
      }
    } catch (err) {
      // Error loading responses
    } finally {
      setLoading(false);
    }
  }, [user?.id, workspaceId]);

  // Load existing responses on mount and when user/workspace changes
  useEffect(() => {
    if (user?.id && workspaceId) {
      loadExistingResponses();
    }
  }, [workspaceId, user?.id, loadExistingResponses]);

  // Helper function to filter unique scenarios
  const getUniqueScenarios = useCallback((scenarios) => {
    if (!scenarios || scenarios.length === 0) return [];
    
    // Create a map to track unique scenarios by their configuration
    const uniqueMap = new Map();
    
    scenarios.forEach(scenario => {
      // Create a unique key based on scenario configuration (include advisor percent)
      const advisorPct = scenario.advisor_percent || 0;
      const key = `${scenario.scenario_type}_${scenario.founder_a_percent.toFixed(2)}_${scenario.founder_b_percent.toFixed(2)}_${advisorPct.toFixed(2)}`;
      
      // If we haven't seen this configuration, or this one is more recent, keep it
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, scenario);
      } else {
        const existing = uniqueMap.get(key);
        // Keep the most recent one (or the one that is_current)
        const existingDate = new Date(existing.created_at);
        const currentDate = new Date(scenario.created_at);
        
        if (scenario.is_current || (!existing.is_current && currentDate > existingDate)) {
          uniqueMap.set(key, scenario);
        }
      }
    });
    
    return Array.from(uniqueMap.values());
  }, []);

  // Load existing scenarios on mount
  const loadExistingScenarios = useCallback(async () => {
    if (!user?.id || !workspaceId) return;
    
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/scenarios`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store all scenarios
        if (data.scenarios && data.scenarios.length > 0) {
          
          // Filter to unique scenarios only
          const uniqueScenarios = getUniqueScenarios(data.scenarios);
          
          setAllScenarios(uniqueScenarios);
          
          // Prefer current scenario, otherwise use the most recent
          const currentScenario = uniqueScenarios.find(s => s.is_current) || uniqueScenarios[0];
          setCreatedScenario(currentScenario);
          setApprovalStatus(currentScenario?.status);
          setSelectedScenarioForApproval(currentScenario);
          
          // If there's a selected scenario, also set the selected scenario type
          if (currentScenario) {
            if (currentScenario.scenario_type === 'recommended') {
              setSelectedScenario('recommended');
            } else if (currentScenario.scenario_type === 'equal') {
              setSelectedScenario('equal');
            } else {
              setSelectedScenario('custom');
              setCustomSplit({
                a: currentScenario.founder_a_percent,
                b: currentScenario.founder_b_percent,
              });
            }
          }
        } else {
          setAllScenarios([]);
        }
      } else {
        const errorData = await response.json();
        // Error loading scenarios
      }
    } catch (err) {
      // Error loading scenarios
    }
  }, [user?.id, workspaceId, getUniqueScenarios]);

  // Load scenarios on mount
  useEffect(() => {
    if (user?.id && workspaceId) {
      loadExistingScenarios();
    }
  }, [workspaceId, user?.id, loadExistingScenarios]);

  // Load existing documents on mount - only for approved scenarios
  const loadExistingDocuments = useCallback(async (scenarios = []) => {
    if (!user?.id || !workspaceId) return;
    
    try {
      // Get the list of documents
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/documents`, {
        headers: { 'X-Clerk-User-Id': user.id },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
          // Filter documents for approved scenarios only
          const approvedScenarioIds = scenarios
            .filter(s => s && s.approved_by_founder_a_at && s.approved_by_founder_b_at)
            .map(s => s.id)
            .filter(id => id); // Remove any undefined/null IDs
          
          const approvedDocs = data.documents.filter(doc => 
            doc && doc.id && doc.scenario_id && approvedScenarioIds.includes(doc.scenario_id)
          );
          
          // Fetch full details with signed URLs for each approved document
          const documentsWithUrls = await Promise.all(
            approvedDocs.map(async (doc) => {
              if (!doc || !doc.id) return null;
              try {
                const docResponse = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/documents/${doc.id}`, {
                  headers: { 'X-Clerk-User-Id': user.id },
                });
                
                if (docResponse.ok) {
                  const docData = await docResponse.json();
                  return docData || null;
                }
                return null;
              } catch (err) {
                // Error fetching document
                return null;
              }
            })
          );
          
          const validDocuments = documentsWithUrls.filter(doc => doc !== null && doc !== undefined);
          
          // Filter to unique documents (one per scenario_id, keep most recent)
          const uniqueDocumentsMap = new Map();
          validDocuments.forEach(doc => {
            if (doc && doc.scenario_id) {
              const existing = uniqueDocumentsMap.get(doc.scenario_id);
              if (!existing) {
                uniqueDocumentsMap.set(doc.scenario_id, doc);
              } else {
                // Keep the most recent one
                const existingDate = new Date(existing.generated_at || existing.created_at);
                const currentDate = new Date(doc.generated_at || doc.created_at);
                if (currentDate > existingDate) {
                  uniqueDocumentsMap.set(doc.scenario_id, doc);
                }
              }
            }
          });
          
          const uniqueDocuments = Array.from(uniqueDocumentsMap.values());
          setAllDocuments(uniqueDocuments);
          
          // Set the most recent as the default selected document
          if (uniqueDocuments.length > 0 && uniqueDocuments[0]) {
            setGeneratedDocument(uniqueDocuments[0]);
          }
        } else {
          // No documents found, reset state
          setAllDocuments([]);
          setGeneratedDocument(null);
        }
      }
    } catch (err) {
      // Error loading documents
    }
  }, [user?.id, workspaceId]);

  // Load documents on mount and when scenarios change
  useEffect(() => {
    if (user?.id && workspaceId && allScenarios.length > 0) {
      loadExistingDocuments(allScenarios);
    }
  }, [workspaceId, user?.id, allScenarios, loadExistingDocuments]);

  const saveResponses = useCallback(async (isComplete = false) => {
    if (!user?.id || !workspaceId) return;
    
    setSaving(true);
    try {
      // Save founder-specific responses including vesting_terms
      const responses = {
        time_commitment: myResponses.time_commitment,
        risk: myResponses.risk,
        capital_contribution: myResponses.capital_contribution,
        expertise: myResponses.expertise,
        network: myResponses.network,
        role: myResponses.role,
        responsibilities: myResponses.responsibilities,
        vesting_terms: vestingTerms,
      };
      
      
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/questionnaire`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ responses, is_complete: isComplete }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || 'Failed to save responses');
        return;
      }
      
      if (isComplete) {
        // Update local status immediately for better UX
        if (isFounderA) {
          setFounderAComplete(true);
        } else if (isFounderB) {
          setFounderBComplete(true);
        }
        
        // Reload responses to get updated status from server and sync with other founder
        await loadExistingResponses();
      }
    } catch (err) {
      // Error saving responses
      setError('Failed to save responses');
    } finally {
      setSaving(false);
    }
  }, [user?.id, workspaceId, myResponses, vestingTerms, isFounderA, isFounderB, loadExistingResponses]);

  // No auto-save - all saves are triggered by explicit button clicks

  const calculateEquity = async () => {
    if (!user?.id || !workspaceId) return;
    
    setLoading(true);
    setError(null);
    try {
      // Send current advisor percent from UI state so backend uses the latest value
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/calculate`, {
        method: 'POST',
        headers: { 
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisor_percent: vestingTerms.advisor_equity_percent || 0,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCalculatedScenarios(data);
        setActiveSection('calculate');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to calculate equity');
      }
    } catch (err) {
      setError('Failed to calculate equity');
    } finally {
      setLoading(false);
    }
  };

  const createScenario = async () => {
    if (!user?.id || !workspaceId || !selectedScenario) return;
    
    setLoading(true);
    try {
      let scenarioData;
      // Advisor equity can be reserved even without an assigned advisor
      const advisorPercent = vestingTerms.advisor_equity_percent || 0;
      
      if (selectedScenario === 'recommended') {
        scenarioData = {
          scenario_type: 'recommended',
          founder_a_percent: calculatedScenarios.recommended.founder_a_percent,
          founder_b_percent: calculatedScenarios.recommended.founder_b_percent,
          calculation_breakdown: calculatedScenarios.recommended.breakdown,
          vesting_terms: vestingTerms,
          advisor_percent: advisorPercent,
        };
      } else if (selectedScenario === 'equal') {
        // For equal split, calculate after deducting advisor equity
        const availablePool = 100 - advisorPercent;
        const equalSplit = availablePool / 2;
        scenarioData = {
          scenario_type: 'equal',
          founder_a_percent: equalSplit,
          founder_b_percent: equalSplit,
          vesting_terms: vestingTerms,
          advisor_percent: advisorPercent,
        };
      } else {
        scenarioData = {
          scenario_type: 'custom',
          founder_a_percent: customSplit.a,
          founder_b_percent: customSplit.b,
          vesting_terms: vestingTerms,
          advisor_percent: advisorPercent,
        };
      }
      
      
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/scenarios`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scenarioData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCreatedScenario(data.scenario);
        setSelectedScenarioForApproval(data.scenario);
        // Add new scenario to the list and filter for uniqueness
        setAllScenarios(prev => {
          const updated = [data.scenario, ...prev];
          return getUniqueScenarios(updated);
        });
        setActiveSection('approval');
      } else {
        setError(data.error || 'Failed to create scenario');
      }
    } catch (err) {
      setError('Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  const approveScenario = async (scenarioToApprove = null) => {
    const scenario = scenarioToApprove || selectedScenarioForApproval || createdScenario;
    if (!user?.id || !workspaceId || !scenario?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/equity/scenarios/${scenario.id}/approve`,
        {
          method: 'PATCH',
          headers: { 'X-Clerk-User-Id': user.id },
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        // Update the scenario in allScenarios
        setAllScenarios(prev => prev.map(s => s.id === data.scenario.id ? data.scenario : s));
        setSelectedScenarioForApproval(data.scenario);
        
        // Also update createdScenario if it's the same
        if (createdScenario?.id === data.scenario.id) {
          setCreatedScenario(data.scenario);
        }
        setApprovalStatus(data.scenario.status);
        
        if (data.scenario.status === 'approved') {
          setActiveSection('document');
        }
      } else {
        setError(data.error || 'Failed to approve scenario');
      }
    } catch (err) {
      // Error approving scenario
      setError('Failed to approve scenario');
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async (scenarioId = null) => {
    if (!user?.id || !workspaceId) return;
    
    // Use provided scenarioId or fall back to createdScenario
    const targetScenarioId = scenarioId || createdScenario?.id;
    if (!targetScenarioId) {
      setError('No scenario selected for document generation');
      return;
    }
    
    setGeneratingDoc(true);
    try {
      const response = await fetch(`${API_BASE}/workspaces/${workspaceId}/equity/generate-document`, {
        method: 'POST',
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scenario_id: targetScenarioId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newDoc = data.document;
        setGeneratedDocument(newDoc);
        // Add to allDocuments list and filter for uniqueness
        setAllDocuments(prev => {
          const updated = [newDoc, ...prev];
          // Filter to unique documents (one per scenario_id, keep most recent)
          const uniqueMap = new Map();
          updated.forEach(doc => {
            if (doc && doc.scenario_id) {
              const existing = uniqueMap.get(doc.scenario_id);
              if (!existing) {
                uniqueMap.set(doc.scenario_id, doc);
              } else {
                const existingDate = new Date(existing.generated_at || existing.created_at);
                const currentDate = new Date(doc.generated_at || doc.created_at);
                if (currentDate > existingDate) {
                  uniqueMap.set(doc.scenario_id, doc);
                }
              }
            }
          });
          return Array.from(uniqueMap.values());
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate document');
      }
    } catch (err) {
      setError('Failed to generate document');
    } finally {
      setGeneratingDoc(false);
    }
  };

  const markMyDetailsComplete = async () => {
    await saveResponses(true);
    setActiveSection('overview');
  };

  // Download document via proxy endpoint (hides Supabase URLs from client)
  const handleDownload = async (documentId, fileType) => {
    if (!user?.id || !workspaceId || !documentId) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/equity/documents/${documentId}/download/${fileType}`,
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to download ${fileType.toUpperCase()}`);
      }
    } catch (err) {
      setError(`Failed to download ${fileType.toUpperCase()}`);
    }
  };

  const isMyDetailsComplete = () => {
    const complete = myResponses.time_commitment && 
           myResponses.expertise.primary_area && 
           myResponses.expertise.skill_level &&
           myResponses.role.title;
    return complete;
  };

  // ============== RENDER SECTIONS ==============

  const renderOverview = () => {
    // Calculate overall progress
    const completedSteps = [
      startupContextComplete,
      bothFoundersComplete,
      vestingComplete,
      (calculatedScenarios || allScenarios.length > 0),
      allScenarios.some(s => s.approved_by_founder_a_at && s.approved_by_founder_b_at)
    ].filter(Boolean).length;
    const progressPercent = (completedSteps / 5) * 100;

    return (
      <Box>
        {/* Header */}
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              Equity Agreement Setup
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete all steps to generate your founders' agreement template
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {completedSteps}/5
            </Typography>
            <Typography variant="caption" color="text.secondary">Complete</Typography>
          </Box>
        </Box>
        
        {/* Progress bar */}
        <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100', mb: 3, overflow: 'hidden' }}>
          <Box sx={{ height: '100%', width: `${progressPercent}%`, borderRadius: 3, bgcolor: 'success.main', transition: 'width 0.4s ease' }} />
        </Box>

        {/* Founder Status Cards */}
        <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
          Co-Founder Status
        </Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Founder A Card */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: founderAComplete ? 'success.main' : 'divider',
                borderRadius: 1.5,
                bgcolor: founderAComplete ? alpha('#10b981', 0.04) : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={founderA?.user?.profile_image_url} sx={{ width: 40, height: 40, border: '2px solid', borderColor: founderAComplete ? 'success.main' : 'grey.200' }}>
                  {founderA?.user?.name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{founderA?.user?.name || 'Founder A'}</Typography>
                  <Typography variant="caption" color="text.secondary">{founderA?.user?.email}</Typography>
                </Box>
                <Chip
                  label={founderAComplete ? 'Complete' : 'Pending'}
                  size="small"
                  color={founderAComplete ? 'success' : 'default'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
              
              {founderA?.user?.clerk_user_id === currentUserId && !founderAComplete && (
                <Button variant="contained" fullWidth size="small" onClick={() => setActiveSection('my-details')} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}>
                  Fill My Details
                </Button>
              )}
              
              {founderA?.user?.clerk_user_id !== currentUserId && !founderAComplete && (
                <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: alpha('#3b82f6', 0.08), display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HourglassEmpty sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" color="primary.main">Waiting for {founderA?.user?.name?.split(' ')[0] || 'co-founder'}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Founder B Card */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: founderBComplete ? 'success.main' : 'divider',
                borderRadius: 1.5,
                bgcolor: founderBComplete ? alpha('#10b981', 0.04) : 'background.paper',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={founderB?.user?.profile_image_url} sx={{ width: 40, height: 40, border: '2px solid', borderColor: founderBComplete ? 'success.main' : 'grey.200' }}>
                  {founderB?.user?.name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{founderB?.user?.name || 'Founder B'}</Typography>
                  <Typography variant="caption" color="text.secondary">{founderB?.user?.email}</Typography>
                </Box>
                <Chip
                  label={founderBComplete ? 'Complete' : 'Pending'}
                  size="small"
                  color={founderBComplete ? 'success' : 'default'}
                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                />
              </Box>
              
              {founderB?.user?.clerk_user_id === currentUserId && !founderBComplete && (
                <Button variant="contained" fullWidth size="small" onClick={() => setActiveSection('my-details')} sx={{ mt: 1.5, textTransform: 'none', fontWeight: 600 }}>
                  Fill My Details
                </Button>
              )}
              
              {founderB?.user?.clerk_user_id !== currentUserId && !founderBComplete && (
                <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, bgcolor: alpha('#3b82f6', 0.08), display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HourglassEmpty sx={{ fontSize: 16, color: 'primary.main' }} />
                  <Typography variant="caption" color="primary.main">Waiting for {founderB?.user?.name?.split(' ')[0] || 'co-founder'}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Progress Steps */}
        <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary', fontWeight: 600 }}>
          Setup Progress
        </Typography>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={0}>
            {/* Step 1 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: startupContextComplete ? 'success.main' : 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {startupContextComplete ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>1</Typography>}
                </Box>
                <Box sx={{ width: 2, height: 32, bgcolor: startupContextComplete ? 'success.main' : 'grey.200', mt: 0.5 }} />
              </Box>
              <Box sx={{ flex: 1, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Startup Context</Typography>
                    <Typography variant="caption" color="text.secondary">Stage and basic info</Typography>
                  </Box>
                  <Button size="small" variant={startupContextComplete ? 'text' : 'contained'} onClick={() => setActiveSection('startup')} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 60 }}>
                    {startupContextComplete ? 'Edit' : 'Start'}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Step 2 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: bothFoundersComplete ? 'success.main' : 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {bothFoundersComplete ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>2</Typography>}
                </Box>
                <Box sx={{ width: 2, height: 32, bgcolor: bothFoundersComplete ? 'success.main' : 'grey.200', mt: 0.5 }} />
              </Box>
              <Box sx={{ flex: 1, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Founder Questionnaires</Typography>
                    <Typography variant="caption" color="text.secondary">{`${(founderAComplete ? 1 : 0) + (founderBComplete ? 1 : 0)} of 2 completed`}</Typography>
                  </Box>
                  <Chip label={`${(founderAComplete ? 1 : 0) + (founderBComplete ? 1 : 0)}/2`} size="small" color={bothFoundersComplete ? 'success' : 'default'} sx={{ fontWeight: 600 }} />
                </Box>
              </Box>
            </Box>

            {/* Step 3 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: vestingComplete ? 'success.main' : 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vestingComplete ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>3</Typography>}
                </Box>
                <Box sx={{ width: 2, height: 32, bgcolor: vestingComplete ? 'success.main' : 'grey.200', mt: 0.5 }} />
              </Box>
              <Box sx={{ flex: 1, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Vesting Terms</Typography>
                    <Typography variant="caption" color="text.secondary">Equity vesting schedule</Typography>
                  </Box>
                  <Button size="small" variant={vestingComplete ? 'text' : 'contained'} onClick={() => setActiveSection('vesting')} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 60 }}>
                    {vestingComplete ? 'Edit' : 'Set'}
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Step 4 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: (calculatedScenarios || allScenarios.length > 0) ? 'success.main' : 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(calculatedScenarios || allScenarios.length > 0) ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>4</Typography>}
                </Box>
                <Box sx={{ width: 2, height: 32, bgcolor: (calculatedScenarios || allScenarios.length > 0) ? 'success.main' : 'grey.200', mt: 0.5 }} />
              </Box>
              <Box sx={{ flex: 1, pb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Calculate Split</Typography>
                    <Typography variant="caption" color="text.secondary">{bothFoundersComplete ? 'Ready to calculate' : 'Requires both founders'}</Typography>
                  </Box>
                  <Button size="small" variant="contained" disabled={!bothFoundersComplete} onClick={calculateEquity} startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <Calculate sx={{ fontSize: 16 }} />} sx={{ textTransform: 'none', fontWeight: 600 }}>
                    Calculate
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Step 5 */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: allScenarios.some(s => s.approved_by_founder_a_at && s.approved_by_founder_b_at) ? 'success.main' : 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {allScenarios.some(s => s.approved_by_founder_a_at && s.approved_by_founder_b_at) ? <CheckCircle sx={{ color: 'white', fontSize: 16 }} /> : <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>5</Typography>}
                </Box>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Approval & Document</Typography>
                    <Typography variant="caption" color="text.secondary">Both approve and generate agreement</Typography>
                  </Box>
                  {allScenarios.some(s => s.approved_by_founder_a_at && s.approved_by_founder_b_at) && (
                    <Chip icon={<Description sx={{ fontSize: 14 }} />} label="Ready" size="small" color="success" sx={{ fontWeight: 600 }} />
                  )}
                </Box>
              </Box>
            </Box>
          </Stack>
        </Paper>
      </Box>
    );
  };

  const renderStartupContext = () => {
    // Only show to founders
    if (!isFounderA && !isFounderB) {
      return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
          <Alert severity="warning">
            <Typography variant="body2">You are not a founder in this workspace. Only founders can fill the startup context.</Typography>
          </Alert>
        </Box>
      );
    }

    return (
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: 'primary.main' }}>
          Startup Context
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tell us about your startup. This information helps calculate fair equity splits.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2, py: 0.5 }} icon={<Info sx={{ fontSize: 18 }} />}>
          <Typography variant="body2">This is shared information visible to both founders.</Typography>
        </Alert>
      
      <Paper elevation={0} sx={{ p: 2, mb: 2, overflow: 'hidden', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>What stage is your startup at?</FormLabel>
          <RadioGroup
            value={startupContext.stage}
            onChange={(e) => {
              setStartupContext({ ...startupContext, stage: e.target.value });
              setStartupContextComplete(true);
            }}
          >
            {STAGES.map((stage) => (
              <Paper
                key={stage.value}
                sx={{
                  p: 1.5,
                  mb: 0.75,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: startupContext.stage === stage.value ? 'primary.main' : 'divider',
                  bgcolor: startupContext.stage === stage.value ? alpha('#3b82f6', 0.05) : 'background.paper',
                  '&:hover': { borderColor: 'primary.main' },
                  overflow: 'hidden',
                }}
                onClick={() => {
                  setStartupContext({ ...startupContext, stage: stage.value });
                  setStartupContextComplete(true);
                }}
              >
                <FormControlLabel
                  value={stage.value}
                  control={<Radio size="small" />}
                  sx={{ 
                    m: 0,
                    width: '100%',
                    '& .MuiFormControlLabel-label': {
                      width: '100%',
                      overflow: 'hidden',
                    }
                  }}
                  label={
                    <Box sx={{ width: '100%', overflow: 'hidden' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.85rem', wordBreak: 'break-word' }}>{stage.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', wordBreak: 'break-word', display: 'block' }}>{stage.description}</Typography>
                    </Box>
                  }
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>Who originated the idea?</FormLabel>
          <RadioGroup
            value={startupContext.idea_origin}
            onChange={(e) => setStartupContext({ ...startupContext, idea_origin: e.target.value })}
          >
            <FormControlLabel value="founder_a" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{founderA?.user?.name || 'Founder A'}</Typography>} />
            <FormControlLabel value="founder_b" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{founderB?.user?.name || 'Founder B'}</Typography>} />
            <FormControlLabel value="joint" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Joint - We came up with it together</Typography>} />
            <FormControlLabel value="other" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Other / External source</Typography>} />
          </RadioGroup>
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={startupContext.has_ip}
                onChange={(e) => setStartupContext({ ...startupContext, has_ip: e.target.checked })}
              />
            }
            label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>There is existing intellectual property (IP) being contributed</Typography>}
          />
        </FormControl>
        
        {startupContext.has_ip && (
          <FormControl fullWidth sx={{ mb: 2 }}>
            <FormLabel sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>Who owns the existing IP?</FormLabel>
            <RadioGroup
              value={startupContext.ip_owner}
              onChange={(e) => setStartupContext({ ...startupContext, ip_owner: e.target.value })}
            >
              <FormControlLabel value="founder_a" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{founderA?.user?.name || 'Founder A'}</Typography>} />
              <FormControlLabel value="founder_b" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{founderB?.user?.name || 'Founder B'}</Typography>} />
              <FormControlLabel value="joint" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Joint ownership</Typography>} />
            </RadioGroup>
          </FormControl>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setActiveSection('overview')} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Back
        </Button>
        <Button variant="contained" size="small" onClick={async () => { await saveStartupContext(); await loadExistingResponses(); setActiveSection('my-details'); }} disabled={!startupContext.stage} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Save & Continue
        </Button>
      </Box>
    </Box>
    );
  };

  const renderMyDetails = () => (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>My Contribution Details</Typography>
          <Typography variant="body2" color="text.secondary">Fill in your details to calculate fair equity split</Typography>
        </Box>
        <Chip
          label={(isFounderA ? founderAComplete : founderBComplete) ? 'Completed' : 'In Progress'}
          size="small"
          color={(isFounderA ? founderAComplete : founderBComplete) ? 'success' : 'warning'}
          sx={{ fontWeight: 600 }}
        />
      </Box>

      {/* Time Commitment */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Time Commitment
        </Typography>
        <RadioGroup
          value={myResponses.time_commitment}
          onChange={(e) => setMyResponses({ ...myResponses, time_commitment: e.target.value })}
        >
          {TIME_COMMITMENTS.map((option) => (
            <Paper
              key={option.value}
              sx={{
                p: 1.5,
                mb: 0.75,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: myResponses.time_commitment === option.value ? 'primary.main' : 'divider',
                bgcolor: myResponses.time_commitment === option.value ? alpha('#3b82f6', 0.05) : 'background.paper',
                '&:hover': { borderColor: 'primary.main' },
                overflow: 'hidden',
              }}
              onClick={() => setMyResponses({ ...myResponses, time_commitment: option.value })}
            >
              <FormControlLabel
                value={option.value}
                control={<Radio size="small" />}
                sx={{ 
                  m: 0,
                  width: '100%',
                  '& .MuiFormControlLabel-label': {
                    width: '100%',
                    overflow: 'hidden',
                  }
                }}
                label={<Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{option.label}</Typography>}
              />
            </Paper>
          ))}
        </RadioGroup>
      </Paper>

      {/* Risk */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Risk Taken
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={myResponses.risk.leaving_job}
              onChange={(e) => setMyResponses({
                ...myResponses,
                risk: { ...myResponses.risk, leaving_job: e.target.checked }
              })}
            />
          }
          sx={{ 
            m: 0,
            mb: 0.5,
            width: '100%',
            '& .MuiFormControlLabel-label': {
              width: '100%',
              overflow: 'hidden',
            }
          }}
          label={<Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>Leaving a job to work on this full-time</Typography>}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={myResponses.risk.personal_guarantee}
              onChange={(e) => setMyResponses({
                ...myResponses,
                risk: { ...myResponses.risk, personal_guarantee: e.target.checked }
              })}
            />
          }
          sx={{ 
            m: 0,
            width: '100%',
            '& .MuiFormControlLabel-label': {
              width: '100%',
              overflow: 'hidden',
            }
          }}
          label={<Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>Providing personal financial guarantee or significant sacrifice</Typography>}
        />
      </Paper>

      {/* Capital */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Capital Contribution
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Range</InputLabel>
              <Select
                value={myResponses.capital_contribution.range}
                label="Range"
                onChange={(e) => setMyResponses({
                  ...myResponses,
                  capital_contribution: { ...myResponses.capital_contribution, range: e.target.value }
                })}
              >
                {CAPITAL_RANGES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Exact Amount (USD)"
              type="number"
              value={myResponses.capital_contribution.exact_amount}
              onChange={(e) => setMyResponses({
                ...myResponses,
                capital_contribution: { ...myResponses.capital_contribution, exact_amount: e.target.value }
              })}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Expertise */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Expertise
        </Typography>
        <Grid container spacing={1.5}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Primary Area</InputLabel>
              <Select
                value={myResponses.expertise.primary_area}
                label="Primary Area"
                onChange={(e) => setMyResponses({
                  ...myResponses,
                  expertise: { ...myResponses.expertise, primary_area: e.target.value }
                })}
              >
                {EXPERTISE_AREAS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Skill Level</InputLabel>
              <Select
                value={myResponses.expertise.skill_level}
                label="Skill Level"
                onChange={(e) => setMyResponses({
                  ...myResponses,
                  expertise: { ...myResponses.expertise, skill_level: e.target.value }
                })}
              >
                {SKILL_LEVELS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Network */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Network & Connections
        </Typography>
        <FormControl fullWidth>
          <RadioGroup
            value={myResponses.network}
            onChange={(e) => setMyResponses({ ...myResponses, network: e.target.value })}
          >
            {NETWORK_LEVELS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                sx={{ 
                  m: 0,
                  mb: 0.5,
                  width: '100%',
                  '& .MuiFormControlLabel-label': {
                    width: '100%',
                    overflow: 'hidden',
                  }
                }}
                label={
                  <Box sx={{ width: '100%', overflow: 'hidden' }}>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', wordBreak: 'break-word', display: 'block' }}>{option.description}</Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Paper>

      {/* Role */}
      <Paper sx={{ p: 2, mb: 2, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600 }}>
          Role & Responsibilities
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Role/Title</InputLabel>
              <Select
                value={myResponses.role.title}
                label="Role/Title"
                onChange={(e) => setMyResponses({
                  ...myResponses,
                  role: { ...myResponses.role, title: e.target.value }
                })}
              >
                {ROLES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Handles Fundraising?</InputLabel>
              <Select
                value={myResponses.role.handles_fundraising}
                label="Handles Fundraising?"
                onChange={(e) => setMyResponses({
                  ...myResponses,
                  role: { ...myResponses.role, handles_fundraising: e.target.value }
                })}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
                <MenuItem value="shared">Shared responsibility</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        <TextField
          fullWidth
          multiline
          rows={2}
          size="small"
          label="Key Responsibilities (optional)"
          placeholder="Describe your main responsibilities..."
          value={myResponses.responsibilities}
          onChange={(e) => setMyResponses({ ...myResponses, responsibilities: e.target.value })}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setActiveSection('overview')} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Back
        </Button>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={markMyDetailsComplete}
          disabled={!isMyDetailsComplete() || saving}
          startIcon={saving ? <CircularProgress size={14} /> : <CheckCircle sx={{ fontSize: 16 }} />}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {(isFounderA ? founderAComplete : founderBComplete) ? 'Update & Save' : 'Mark as Complete'}
        </Button>
      </Box>
    </Box>
  );

  const renderVestingTerms = () => (
    <Box>
      {/* Header */}
      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: 'primary.main' }}>
        Vesting Terms
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Configure how equity vests over time. Standard is 4 years with a 1-year cliff.
      </Typography>

      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>Vesting Schedule</FormLabel>
          <RadioGroup
            value={vestingTerms.preset}
            onChange={(e) => {
              const preset = VESTING_PRESETS.find(p => p.value === e.target.value);
              if (preset && preset.years !== null) {
                setVestingTerms({
                  ...vestingTerms,
                  preset: preset.value,
                  has_vesting: preset.years > 0,
                  years: preset.years,
                  cliff_months: preset.cliff,
                });
              } else {
                setVestingTerms({
                  ...vestingTerms,
                  preset: e.target.value,
                });
              }
              setVestingComplete(true);
            }}
          >
            {VESTING_PRESETS.map((option) => (
              <Paper
                key={option.value}
                sx={{
                  p: 1.5,
                  mb: 0.75,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: vestingTerms.preset === option.value ? 'primary.main' : 'divider',
                  bgcolor: vestingTerms.preset === option.value ? alpha('#3b82f6', 0.05) : 'background.paper',
                  '&:hover': { borderColor: 'primary.main' },
                }}
                onClick={() => {
                  const preset = option;
                  if (preset.years !== null) {
                    setVestingTerms({
                      ...vestingTerms,
                      preset: preset.value,
                      has_vesting: preset.years > 0,
                      years: preset.years,
                      cliff_months: preset.cliff,
                    });
                  } else {
                    setVestingTerms({ ...vestingTerms, preset: preset.value });
                  }
                  setVestingComplete(true);
                }}
              >
                <FormControlLabel
                  value={option.value}
                  control={<Radio size="small" />}
                  label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{option.label}</Typography>}
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>

        {vestingTerms.preset === 'custom' && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Vesting Period (years)"
                value={vestingTerms.years}
                onChange={(e) => setVestingTerms({ ...vestingTerms, years: parseInt(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Cliff (months)"
                value={vestingTerms.cliff_months}
                onChange={(e) => setVestingTerms({ ...vestingTerms, cliff_months: parseInt(e.target.value) || 0 })}
              />
            </Grid>
          </Grid>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel sx={{ mb: 0.5, fontWeight: 500, fontSize: '0.85rem' }}>Acceleration on Exit</FormLabel>
          <RadioGroup
            value={vestingTerms.acceleration}
            onChange={(e) => setVestingTerms({ ...vestingTerms, acceleration: e.target.value })}
          >
            {ACCELERATION_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{option.description}</Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Jurisdiction</InputLabel>
          <Select
            value={vestingTerms.jurisdiction}
            label="Jurisdiction"
            onChange={(e) => setVestingTerms({ ...vestingTerms, jurisdiction: e.target.value })}
          >
            {JURISDICTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Advisor Equity Section - Always visible to reserve equity for advisor */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person fontSize="small" /> Advisor Equity {advisor ? `(${advisorName})` : '(Reserved)'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
          {advisor 
            ? 'Advisor equity is deducted from the total pool before calculating co-founder splits.'
            : 'Reserve equity for a future advisor. This will be deducted from the total pool before calculating co-founder splits. Set to 0% if no advisor equity is needed.'
          }
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Equity %"
              value={vestingTerms.advisor_equity_percent}
              onChange={(e) => {
                const val = Math.min(Math.max(0, parseFloat(e.target.value) || 0), 10);
                setVestingTerms({ ...vestingTerms, advisor_equity_percent: val });
              }}
              inputProps={{ min: 0, max: 10, step: 0.25 }}
              helperText="Typically 0.5% - 2% (0 for none)"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Vesting (years)"
              value={vestingTerms.advisor_vesting_years}
              onChange={(e) => setVestingTerms({ ...vestingTerms, advisor_vesting_years: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 4 }}
              helperText="Usually 1-2 years"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Cliff (months)"
              value={vestingTerms.advisor_cliff_months}
              onChange={(e) => setVestingTerms({ ...vestingTerms, advisor_cliff_months: parseInt(e.target.value) || 0 })}
              inputProps={{ min: 0, max: 12 }}
              helperText="Typically 0-3 months"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" size="small" onClick={() => setActiveSection('overview')} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Back
        </Button>
        <Button variant="contained" size="small" onClick={async () => { await saveResponses(false); await loadExistingResponses(); setActiveSection('overview'); }} sx={{ textTransform: 'none', fontWeight: 600 }}>
          Save Vesting Terms
        </Button>
      </Box>
    </Box>
  );

  const renderCalculateSplit = () => (
    <Box>
      {/* Header */}
      <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: 'primary.main' }}>
        Select Equity Split
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose from the recommended split, equal split, or define a custom allocation
      </Typography>

      {!calculatedScenarios ? (
        <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ mb: 1 }} />
              <Typography variant="body2">Calculating recommended split...</Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {bothFoundersComplete 
                  ? 'Click below to calculate the recommended equity split based on your responses.'
                  : 'Both founders must complete their questionnaires before calculating.'}
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={calculateEquity}
                disabled={!bothFoundersComplete || loading}
                startIcon={<Calculate sx={{ fontSize: 16 }} />}
              >
                Calculate Equity Split
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {/* Recommended */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: selectedScenario === 'recommended' ? 'primary.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: selectedScenario === 'recommended' ? alpha('#3b82f6', 0.04) : 'background.paper',
                '&:hover': { borderColor: 'primary.main' },
              }}
              onClick={() => setSelectedScenario('recommended')}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Recommended</Typography>
                  <Chip label="AI" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 0.5, color: 'primary.main', fontWeight: 700 }}>
                  {calculatedScenarios.recommended.founder_a_percent.toFixed(1)}% / {calculatedScenarios.recommended.founder_b_percent.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {calculatedScenarios.founder_a_name} / {calculatedScenarios.founder_b_name}
                </Typography>
                <Typography variant="caption" color={calculatedScenarios.advisor_percent > 0 ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mb: 1, fontWeight: calculatedScenarios.advisor_percent > 0 ? 500 : 400 }}>
                  + {(calculatedScenarios.advisor_percent || 0).toFixed(1)}% for {advisor ? advisorName : 'Advisor'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                  Calculation Breakdown
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Factor</TableCell>
                        <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                          {calculatedScenarios.founder_a_name?.split(' ')[0]}
                        </TableCell>
                        <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                          {calculatedScenarios.founder_b_name?.split(' ')[0]}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {calculatedScenarios.recommended.breakdown && (
                        <>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Time (30%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.time}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.time}/10
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Capital (25%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.capital}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.capital}/10
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Expertise (20%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.expertise}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.expertise}/10
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Risk (10%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.risk}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.risk}/10
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Network (10%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.network}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.network}/10
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ p: 0.5, fontSize: '0.7rem' }}>Idea (5%)</TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_a?.idea}/10
                            </TableCell>
                            <TableCell align="right" sx={{ p: 0.5, fontSize: '0.7rem' }}>
                              {calculatedScenarios.recommended.breakdown.founder_b?.idea}/10
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Equal */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: selectedScenario === 'equal' ? 'success.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: selectedScenario === 'equal' ? alpha('#10b981', 0.04) : 'background.paper',
                '&:hover': { borderColor: 'success.main' },
              }}
              onClick={() => setSelectedScenario('equal')}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Equal Split</Typography>
                  <Chip label="Simple" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 0.5, color: 'success.main', fontWeight: 700 }}>
                  {calculatedScenarios.equal?.founder_a_percent?.toFixed(1) || '50'}% / {calculatedScenarios.equal?.founder_b_percent?.toFixed(1) || '50'}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {calculatedScenarios.founder_a_name} / {calculatedScenarios.founder_b_name}
                </Typography>
                <Typography variant="caption" color={calculatedScenarios.advisor_percent > 0 ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mb: 1, fontWeight: calculatedScenarios.advisor_percent > 0 ? 500 : 400 }}>
                  + {(calculatedScenarios.advisor_percent || 0).toFixed(1)}% for {advisor ? advisorName : 'Advisor'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  Best when both founders contribute equally.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Custom */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                height: '100%',
                border: '2px solid',
                borderColor: selectedScenario === 'custom' ? 'warning.main' : 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: selectedScenario === 'custom' ? alpha('#f59e0b', 0.04) : 'background.paper',
                '&:hover': { borderColor: 'warning.main' },
              }}
              onClick={() => setSelectedScenario('custom')}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Custom</Typography>
                  <Chip label="Manual" size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>
                <Typography variant="h5" sx={{ mb: 0.5, color: 'warning.main', fontWeight: 700 }}>
                  {customSplit.a.toFixed(1)}% / {customSplit.b.toFixed(1)}%
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  {calculatedScenarios.founder_a_name} / {calculatedScenarios.founder_b_name}
                </Typography>
                <Typography variant="caption" color={vestingTerms.advisor_equity_percent > 0 ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mb: 1, fontWeight: vestingTerms.advisor_equity_percent > 0 ? 500 : 400 }}>
                  + {(vestingTerms.advisor_equity_percent || 0).toFixed(1)}% for {advisor ? advisorName : 'Advisor'}
                </Typography>
                
                {selectedScenario === 'custom' && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" gutterBottom>
                      {calculatedScenarios.founder_a_name}: {customSplit.a.toFixed(1)}%
                    </Typography>
                    <Slider 
                      value={customSplit.a} 
                      onChange={(e, value) => {
                        const advisorPct = vestingTerms.advisor_equity_percent || 0;
                        const maxForFounders = 100 - advisorPct;
                        const adjustedValue = Math.min(value, maxForFounders);
                        setCustomSplit({ a: adjustedValue, b: maxForFounders - adjustedValue });
                      }} 
                      min={0} 
                      max={100 - (vestingTerms.advisor_equity_percent || 0)} 
                      valueLabelDisplay="auto" 
                      size="small" 
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {calculatedScenarios && (
        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveSection('overview')} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
          <Button variant="contained" size="small" onClick={createScenario} disabled={!selectedScenario || loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {loading ? <CircularProgress size={14} /> : 'Create Scenario & Proceed'}
          </Button>
        </Box>
      )}
    </Box>
  );

  const renderApproval = () => {
    // Helper to check if user has already approved a scenario
    const hasUserApproved = (scenario) => {
      if (isFounderA) return !!scenario.approved_by_founder_a_at;
      if (isFounderB) return !!scenario.approved_by_founder_b_at;
      return false;
    };
    
    // Helper to check if both founders have approved
    const isBothApproved = (scenario) => {
      return !!scenario.approved_by_founder_a_at && !!scenario.approved_by_founder_b_at;
    };
    
    return (
      <Box>
        {/* Header */}
        <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: 'primary.main' }}>
          Approval
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Both founders must approve an equity split before generating the agreement
        </Typography>

        {allScenarios.length > 0 ? (
          <Grid container spacing={1.5}>
            {allScenarios.slice(0, 3).map((scenario) => {
              const bothApproved = isBothApproved(scenario);
              const userApproved = hasUserApproved(scenario);
              const founderAName = founderA?.user?.name || 'Founder A';
              const founderBName = founderB?.user?.name || 'Founder B';
              
              return (
                <Grid item xs={12} sm={4} key={scenario.id}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 1.5,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: bothApproved ? '2px solid' : '1px solid',
                      borderColor: bothApproved ? 'success.main' : 'divider',
                      borderRadius: 1.5,
                      bgcolor: bothApproved ? alpha('#10b981', 0.04) : 'background.paper',
                    }}
                  >
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {scenario.scenario_type === 'recommended' ? 'Recommended' : 
                         scenario.scenario_type === 'equal' ? 'Equal' : 'Custom'}
                      </Typography>
                      {scenario.is_current && <Chip label="Active" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />}
                    </Box>
                    
                    {/* Equity Split - Always show all 3 allocations */}
                    <Box sx={{ textAlign: 'center', mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {scenario.founder_a_percent}% / {scenario.founder_b_percent}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {founderAName.split(' ')[0]} / {founderBName.split(' ')[0]}
                      </Typography>
                      <Typography variant="caption" color={scenario.advisor_percent > 0 ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.5, fontWeight: scenario.advisor_percent > 0 ? 500 : 400 }}>
                        + {scenario.advisor_percent || 0}% for {advisor ? advisorName : 'Advisor'}
                      </Typography>
                    </Box>

                    {/* Approval Status */}
                    <Grid container spacing={0.5} sx={{ mb: 1.5 }}>
                      <Grid item xs={6}>
                        <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: scenario.approved_by_founder_a_at ? alpha('#10b981', 0.1) : 'grey.100', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>{founderAName.split(' ')[0]}</Typography>
                          {scenario.approved_by_founder_a_at ? <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} /> : <HourglassEmpty sx={{ color: 'warning.main', fontSize: 16 }} />}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ p: 0.75, borderRadius: 1, bgcolor: scenario.approved_by_founder_b_at ? alpha('#10b981', 0.1) : 'grey.100', textAlign: 'center' }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.25 }}>{founderBName.split(' ')[0]}</Typography>
                          {scenario.approved_by_founder_b_at ? <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} /> : <HourglassEmpty sx={{ color: 'warning.main', fontSize: 16 }} />}
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Action Button */}
                    <Box sx={{ mt: 'auto' }}>
                      {!bothApproved ? (
                        <Button
                          variant={userApproved ? "outlined" : "contained"}
                          fullWidth
                          size="small"
                          color="success"
                          onClick={(e) => { e.stopPropagation(); approveScenario(scenario); }}
                          disabled={loading || userApproved}
                          startIcon={userApproved ? <CheckCircle sx={{ fontSize: 14 }} /> : <ThumbUp sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          {userApproved ? 'Approved' : 'Approve'}
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          size="small"
                          onClick={(e) => { e.stopPropagation(); setCreatedScenario(scenario); setActiveSection('document'); }}
                          startIcon={<Description sx={{ fontSize: 14 }} />}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Generate Doc
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', borderRadius: 1.5, border: '1px dashed', borderColor: 'divider' }}>
            <Calculate sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No scenarios created yet. Calculate an equity split first.
            </Typography>
            <Button variant="contained" size="small" onClick={() => setActiveSection('calculate')} startIcon={<Calculate />} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Calculate Split
            </Button>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveSection('calculate')} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
        </Box>
      </Box>
    );
  };

  const renderDocument = () => {
    // Helper to get scenario info for a document
    const getScenarioForDocument = (doc) => {
      if (!doc || !doc.scenario_id) return null;
      return allScenarios.find(s => s.id === doc.scenario_id);
    };
    
    // Get approved scenarios (for generating new documents)
    const approvedScenarios = allScenarios.filter(
      s => s.approved_by_founder_a_at && s.approved_by_founder_b_at
    );
    
    const founderAName = founderA?.user?.name || 'Founder A';
    const founderBName = founderB?.user?.name || 'Founder B';
    
    return (
      <Box>
        {/* Header */}
        <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 700, color: 'primary.main' }}>
          Founders' Agreement (Draft Template)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Generate a starting-point template for your approved equity scenario.
        </Typography>
        <Typography variant="caption" color="warning.main" sx={{ mb: 2, display: 'block', fontStyle: 'italic' }}>
          ⚠️ This is a draft template — it must be reviewed by a qualified lawyer in your jurisdiction before signing.
        </Typography>

        {/* Approved scenarios - generate or download documents */}
        {approvedScenarios.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <Typography variant="overline" sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
              Approved Scenarios ({approvedScenarios.length})
            </Typography>
            <Grid container spacing={1.5}>
              {approvedScenarios.map((scenario) => {
                // Check if document already exists for this scenario
                const existingDoc = allDocuments.find(d => d.scenario_id === scenario.id);
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={scenario.id}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'success.light',
                        borderRadius: 1.5,
                        bgcolor: alpha('#10b981', 0.04),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Chip 
                          label={scenario.scenario_type === 'recommended' ? 'Recommended' : scenario.scenario_type === 'equal' ? 'Equal' : 'Custom'} 
                          size="small" 
                          color="success" 
                          sx={{ fontSize: '0.65rem', height: 20 }} 
                        />
                        <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                      </Box>
                      
                      {/* All 3 allocations - always show */}
                      <Box sx={{ textAlign: 'center', mb: 1.5, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {scenario.founder_a_percent}% / {scenario.founder_b_percent}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {founderAName.split(' ')[0]} / {founderBName.split(' ')[0]}
                        </Typography>
                        <Typography variant="caption" color={scenario.advisor_percent > 0 ? 'success.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.5, fontWeight: scenario.advisor_percent > 0 ? 500 : 400 }}>
                          + {scenario.advisor_percent || 0}% for {advisor ? advisorName : 'Advisor'}
                        </Typography>
                      </Box>
                      
                      {existingDoc ? (
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Button variant="outlined" size="small" startIcon={<Download sx={{ fontSize: 12 }} />} onClick={() => handleDownload(existingDoc.id, 'pdf')} sx={{ flex: 1, textTransform: 'none', fontSize: '0.7rem' }}>
                            PDF
                          </Button>
                          <Button variant="outlined" size="small" startIcon={<Download sx={{ fontSize: 12 }} />} onClick={() => handleDownload(existingDoc.id, 'docx')} sx={{ flex: 1, textTransform: 'none', fontSize: '0.7rem' }}>
                            DOCX
                          </Button>
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          fullWidth
                          onClick={() => generateDocument(scenario.id)}
                          startIcon={generatingDoc ? <CircularProgress size={12} /> : <Description sx={{ fontSize: 14 }} />}
                          disabled={generatingDoc}
                          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                        >
                          {generatingDoc ? 'Generating...' : 'Generate Draft Template'}
                        </Button>
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ p: 3, textAlign: 'center', mb: 2, borderRadius: 1.5, border: '1px dashed', borderColor: 'divider' }}>
            <Description sx={{ fontSize: 40, color: 'grey.400', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No approved scenarios yet. Approve a scenario first to generate documents.
            </Typography>
          </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
          <Button variant="outlined" size="small" onClick={() => setActiveSection('approval')} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Back
          </Button>
        </Box>
      </Box>
    );
  };

  // Main render
  if (loading && !calculatedScenarios && !myResponses.time_commitment) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: '20%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Paper
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Tabs
            value={activeSection}
            onChange={(e, v) => setActiveSection(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 44,
              '& .MuiTab-root': {
                minHeight: 44,
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                px: 1.5,
              },
              '& .MuiTab-root .MuiSvgIcon-root': {
                fontSize: 18,
              },
            }}
          >
            {SECTIONS.map((section) => (
              <Tab
                key={section.id}
                value={section.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {section.icon}
                    <span>{section.label}</span>
                  </Box>
                }
                disabled={
                  (section.id === 'calculate' && !bothFoundersComplete) ||
                  (section.id === 'approval' && allScenarios.length === 0 && !createdScenario) ||
                  (section.id === 'document' && !allScenarios.some(s => s.approved_by_founder_a_at && s.approved_by_founder_b_at))
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', minHeight: 0, width: '100%', boxSizing: 'border-box' }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)} sx={{ m: 1.5, mb: 0, py: 0.5 }} icon={<Info sx={{ fontSize: 16 }} />}>
              <Typography variant="body2">{error}</Typography>
            </Alert>
          )}

          {/* Section Content */}
          <Box sx={{ p: 2, width: '100%', boxSizing: 'border-box', pb: 3 }}>
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'startup' && renderStartupContext()}
            {activeSection === 'my-details' && renderMyDetails()}
            {activeSection === 'vesting' && renderVestingTerms()}
            {activeSection === 'calculate' && renderCalculateSplit()}
            {activeSection === 'approval' && renderApproval()}
            {activeSection === 'document' && renderDocument()}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EquityQuestionnaireWizard;

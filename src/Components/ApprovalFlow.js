import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Check,
  Close,
  ExpandMore,
  ExpandLess,
  HourglassEmpty,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

import { API_BASE } from '../config/api';

const ApprovalFlow = ({ 
  approval, 
  entityType, 
  entityData, 
  clerkUserId,
  onApprovalComplete,
  showDetails = true 
}) => {
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  if (!approval) return null;

  const isApprover = approval.approver_user_id === clerkUserId;
  const isPending = approval.status === 'PENDING';
  
  const handleAction = async (action) => {
    setProcessing(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE}/approvals/${approval.id}/${action}`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment })
        }
      );

      if (response.ok) {
        if (onApprovalComplete) {
          onApprovalComplete(approval.id, action);
        }
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} approval`);
      }
    } catch (error) {
      setError(`Error ${action}ing: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (approval.status) {
      case 'PENDING':
        return <HourglassEmpty color="warning" />;
      case 'APPROVED':
        return <CheckCircle color="success" />;
      case 'REJECTED':
        return <Cancel color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (approval.status) {
      case 'PENDING':
        return 'warning';
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const renderProposedChanges = () => {
    if (!approval.proposed_data || !showDetails) return null;

    const changes = approval.proposed_data;
    const original = approval.original_data || {};

    if (entityType === 'EQUITY_SCENARIO') {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Proposed Equity Changes:
          </Typography>
          {Object.entries(changes).map(([key, value]) => {
            if (key === 'allocations' && Array.isArray(value)) {
              return (
                <Box key={key} sx={{ ml: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Equity Allocations:
                  </Typography>
                  {value.map((alloc, idx) => (
                    <Typography key={idx} variant="body2" sx={{ ml: 2 }}>
                      • {alloc.founder_name}: {alloc.percentage}%
                      {alloc.vesting_years && ` (${alloc.vesting_years} year vesting)`}
                    </Typography>
                  ))}
                </Box>
              );
            }
            
            if (original[key] !== value) {
              return (
                <Typography key={key} variant="body2" sx={{ ml: 2 }}>
                  • {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: 
                  {original[key] && <span style={{ textDecoration: 'line-through', marginLeft: 4 }}>{original[key]}</span>}
                  <span style={{ marginLeft: 4, color: 'green' }}>{value}</span>
                </Typography>
              );
            }
            return null;
          })}
        </Box>
      );
    }

    if (entityType === 'FOUNDER_TITLE') {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Title Change:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            {original.title && <span style={{ textDecoration: 'line-through' }}>{original.title}</span>}
            <span style={{ marginLeft: 8, color: 'green' }}>{changes.title}</span>
          </Typography>
        </Box>
      );
    }

    if (entityType === 'DECISION') {
      return (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Decision Details:
          </Typography>
          <Typography variant="body2" sx={{ ml: 2 }}>
            Tag: <Chip label={changes.tag} size="small" sx={{ ml: 1 }} />
          </Typography>
          <Typography variant="body2" sx={{ ml: 2, mt: 1 }}>
            {changes.content}
          </Typography>
        </Box>
      );
    }

    return null;
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Stack direction="row" alignItems="center" spacing={2}>
          {getStatusIcon()}
          <Box>
            <Typography variant="subtitle1">
              Approval Required
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Proposed by {approval.proposer?.name || 'Partner'}
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip 
            label={approval.status} 
            color={getStatusColor()}
            size="small"
          />
          {showDetails && (
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Collapse in={expanded || (isPending && isApprover)}>
        {renderProposedChanges()}

        {isPending && isApprover && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={processing}
              sx={{ mb: 2 }}
            />
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<Check />}
                onClick={() => handleAction('approve')}
                disabled={processing}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Close />}
                onClick={() => handleAction('reject')}
                disabled={processing}
              >
                Reject
              </Button>
              {processing && <CircularProgress size={24} />}
            </Stack>
          </Box>
        )}

        {!isPending && approval.decision_comment && (
          <Alert severity={approval.status === 'APPROVED' ? 'success' : 'error'} sx={{ mt: 2 }}>
            <Typography variant="body2">
              {approval.status === 'APPROVED' ? 'Approved' : 'Rejected'} by {approval.approver?.name}
              {approval.decision_comment && `: ${approval.decision_comment}`}
            </Typography>
          </Alert>
        )}

        {isPending && !isApprover && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Waiting for {approval.approver?.name || 'partner'} to review
          </Alert>
        )}
      </Collapse>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default ApprovalFlow;

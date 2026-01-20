import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';

const PartnerOnboardingWizard = ({ open, onClose, onComplete }) => {
  const handleComplete = () => {
    if (onComplete) {
      onComplete({});
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Partner Onboarding</Typography>
          <Button
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography>
          Partner onboarding wizard - coming soon
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleComplete} variant="contained">
          Complete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PartnerOnboardingWizard;

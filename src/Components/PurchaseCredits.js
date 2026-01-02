import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const CREDIT_PACKAGE = {
  id: 'credits',
  name: 'Credit Pack',
    credits: 50,
    price: '$19.99',
  product_id: process.env.REACT_APP_POLAR_PRODUCT_ID || '', // Set in .env
};

const PurchaseCredits = ({ open, onClose, onPurchaseSuccess }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePurchase = async () => {
    if (!CREDIT_PACKAGE.product_id) {
      setError('Payment gateway not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/payments/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({
          product_id: CREDIT_PACKAGE.product_id,
          credits_amount: CREDIT_PACKAGE.credits,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Polar checkout
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceWallet color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Purchase Credits
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Purchase credits to continue connecting with founders. Credits are used for swiping right (2 credits) and creating projects (5 credits).
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
            style={{ width: '100%', maxWidth: '400px' }}
              >
                <Card
                  sx={{
                border: '2px solid',
                      borderColor: 'primary.main',
                boxShadow: 3,
                      }}
                    >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {CREDIT_PACKAGE.name}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                  <Typography variant="h2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {CREDIT_PACKAGE.credits}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Credits
                      </Typography>
                    </Box>

                <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
                  {CREDIT_PACKAGE.price}
                    </Typography>

                    <Button
                  variant="contained"
                      fullWidth
                      disabled={loading}
                  onClick={handlePurchase}
                      sx={{
                        textTransform: 'none',
                        borderRadius: 2,
                    py: 1.5,
                    fontSize: '1.1rem',
                      }}
                    >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                    'Purchase Credits'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
            How credits work:
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              Swipe right (Connect): 2 credits
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Create a project: 5 credits
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Credits never expire
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PurchaseCredits;


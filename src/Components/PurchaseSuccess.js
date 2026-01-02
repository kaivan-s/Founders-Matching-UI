import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CheckCircle, AccountBalanceWallet } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const PurchaseSuccess = ({ onContinue }) => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    // Fetch updated credits after purchase
    if (user) {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    try {
      const response = await fetch(`${API_BASE}/profile/credits`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredits(data.credits);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Dispatch event to refresh credits in header
    window.dispatchEvent(new Event('creditsUpdated'));
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            borderRadius: 3,
            boxShadow: 4,
            textAlign: 'center',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {loading ? (
              <Box sx={{ py: 4 }}>
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Processing your purchase...
                </Typography>
              </Box>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'success.light',
                      mb: 3,
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 48, color: 'white' }} />
                  </Box>
                </motion.div>

                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  Payment Successful!
                </Typography>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Thank you for your purchase. Your credits have been added to your account.
                </Typography>

                {credits !== null && (
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'primary.light',
                      color: 'white',
                      px: 3,
                      py: 1.5,
                      borderRadius: 2,
                      mb: 3,
                    }}
                  >
                    <AccountBalanceWallet />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {credits} Credits
                    </Typography>
                  </Box>
                )}

                <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                  Your purchase has been processed successfully. You can now use your credits to connect with founders and create projects.
                </Alert>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleContinue}
                  sx={{ textTransform: 'none', mt: 2 }}
                >
                  Continue
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default PurchaseSuccess;


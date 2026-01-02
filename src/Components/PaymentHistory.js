import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { AccountBalanceWallet, CheckCircle, Schedule, Cancel } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const PaymentHistory = () => {
  const { user } = useUser();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchPaymentHistory();
    }
  }, [user]);

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/payments/history`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
      case 'pending':
        return <Schedule sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'failed':
        return <Cancel sx={{ color: 'error.main', fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" px={2}>
        <Alert severity="error" sx={{ borderRadius: 2, maxWidth: '500px' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      py: 3,
      px: { xs: 2, sm: 3, md: 4 },
    }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
          Payment History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View all your credit purchase transactions
        </Typography>
      </Box>

      {payments.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 3,
              p: 6,
              border: '1px solid',
              borderColor: 'divider',
              maxWidth: '400px',
            }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#1e3a8a', // Navy
              mb: 3,
            }}>
              <AccountBalanceWallet sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
              No payments yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your payment history will appear here after you make a purchase.
            </Typography>
          </Box>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Credits</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment, index) => (
                <motion.tr
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TableRow
                    component={motion.tr}
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(payment.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccountBalanceWallet sx={{ fontSize: 16, color: '#0d9488' }} /> {/* Teal */}
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {payment.credits_amount}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {payment.amount_paid 
                          ? `$${payment.amount_paid.toFixed(2)} ${payment.currency || 'USD'}`
                          : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(payment.status)}
                        label={payment.status?.toUpperCase() || 'UNKNOWN'}
                        color={getStatusColor(payment.status)}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: 'monospace',
                          color: 'text.secondary',
                        }}
                      >
                        {payment.polar_order_id?.slice(0, 16) || payment.polar_checkout_id?.slice(0, 16) || 'N/A'}...
                      </Typography>
                    </TableCell>
                  </TableRow>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PaymentHistory;


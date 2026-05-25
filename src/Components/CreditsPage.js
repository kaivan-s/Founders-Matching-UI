import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  ShoppingCart,
  Rocket,
  Send,
  Groups,
  CalendarMonth,
  Calculate,
  Description,
  Support,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { API_BASE } from '../config/api';

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_500 = '#64748b';
const SLATE_100 = '#f1f5f9';

const CreditsPage = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [serviceCosts, setServiceCosts] = useState([]);
  const [creditPacks, setCreditPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);

  const fetchCreditsData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [balanceRes, transactionsRes, costsRes, packsRes] = await Promise.all([
        fetch(`${API_BASE}/credits`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/credits/transactions`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/credits/service-costs`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/credits/packs`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
      ]);

      if (balanceRes.ok) {
        const data = await balanceRes.json();
        setBalance(data.balance);
      }

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (costsRes.ok) {
        const data = await costsRes.json();
        setServiceCosts(data.services || []);
      }

      if (packsRes.ok) {
        const data = await packsRes.json();
        setCreditPacks(data.packs || []);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCreditsData();
  }, [fetchCreditsData]);

  // Handle return from checkout
  useEffect(() => {
    const purchaseStatus = searchParams.get('purchase');
    const packName = searchParams.get('pack');
    
    if (purchaseStatus === 'success') {
      setSuccess(`Payment successful! Your ${packName || ''} credits have been added.`);
      // Clear the URL params
      setSearchParams({});
      // Refresh credits data
      fetchCreditsData();
      // Notify sidebar
      window.dispatchEvent(new CustomEvent('creditsUpdated'));
      
      setTimeout(() => setSuccess(null), 5000);
    }
  }, [searchParams, setSearchParams, fetchCreditsData]);

  const handlePurchasePack = async (packKey) => {
    setPurchasing(packKey);
    try {
      const response = await fetch(`${API_BASE}/credits/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Clerk-User-Id': user.id,
        },
        body: JSON.stringify({ pack_key: packKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate purchase');
      }

      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      setError(err.message);
      setPurchasing(null);
    }
  };

  const getServiceIcon = (serviceKey) => {
    switch (serviceKey) {
      case 'create_project':
        return <Rocket sx={{ color: TEAL, fontSize: 20 }} />;
      case 'apply_to_project':
        return <Send sx={{ color: TEAL, fontSize: 20 }} />;
      case 'advisor_session_30':
      case 'advisor_session_60':
        return <CalendarMonth sx={{ color: TEAL, fontSize: 20 }} />;
      case 'equity_calculator':
        return <Calculate sx={{ color: TEAL, fontSize: 20 }} />;
      case 'equity_agreement':
        return <Description sx={{ color: TEAL, fontSize: 20 }} />;
      case 'post_match_support_30':
        return <Support sx={{ color: TEAL, fontSize: 20 }} />;
      default:
        return <Groups sx={{ color: TEAL, fontSize: 20 }} />;
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
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress sx={{ color: TEAL }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: { xs: '100%', sm: 900, md: 1200 }, mx: 'auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: NAVY,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            }}
          >
            <AccountBalanceWallet sx={{ color: TEAL, fontSize: { xs: 24, sm: 28 } }} />
            Credits
          </Typography>
          <Typography variant="body1" sx={{ color: SLATE_500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Manage your credits and purchase more to use premium services
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Balance Card */}
        <Card
          sx={{
            mb: { xs: 2, sm: 3, md: 4 },
            bgcolor: alpha(TEAL, 0.05),
            border: `1px solid ${alpha(TEAL, 0.2)}`,
          }}
        >
          <CardContent sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Available Balance
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 700, color: TEAL, fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' } }}>
                  {balance} <Typography component="span" variant="h6" sx={{ color: SLATE_500, fontWeight: 500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>credits</Typography>
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: SLATE_500, mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  New users get 20 free credits to start
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Credit Packs */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: NAVY, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Buy Credits
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          {creditPacks.map((pack) => (
            <Grid item xs={6} sm={6} md={3} key={pack.id}>
              <Card
                sx={{
                  height: '100%',
                  border: pack.popular ? `2px solid ${TEAL}` : '1px solid #e2e8f0',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 4,
                    borderColor: TEAL,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                {pack.popular && (
                  <Chip
                    label="Popular"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: { xs: 8, sm: 16 },
                      bgcolor: TEAL,
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                    }}
                  />
                )}
                <CardContent sx={{ textAlign: 'center', py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: NAVY, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                    {pack.credits}
                  </Typography>
                  <Typography variant="body2" sx={{ color: SLATE_500, mb: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                    credits
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: TEAL, mb: { xs: 1, sm: 2 }, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {pack.price_display || `$${(pack.price_cents / 100).toFixed(0)}`}
                  </Typography>
                  {pack.bonus_credits > 0 && (
                    <Chip
                      label={`+${pack.bonus_credits} bonus`}
                      size="small"
                      sx={{ mb: 2, bgcolor: alpha(TEAL, 0.1), color: TEAL }}
                    />
                  )}
                  <Button
                    fullWidth
                    variant={pack.popular ? 'contained' : 'outlined'}
                    startIcon={purchasing === pack.id ? <CircularProgress size={16} color="inherit" /> : <ShoppingCart />}
                    disabled={purchasing !== null}
                    onClick={() => handlePurchasePack(pack.id)}
                    sx={{
                      bgcolor: pack.popular ? TEAL : 'transparent',
                      borderColor: TEAL,
                      color: pack.popular ? '#fff' : TEAL,
                      '&:hover': {
                        bgcolor: pack.popular ? '#0f766e' : alpha(TEAL, 0.08),
                        borderColor: TEAL,
                      },
                    }}
                  >
                    {purchasing === pack.id ? 'Processing...' : 'Buy'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Service Costs */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: NAVY, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          What Costs Credits?
        </Typography>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          {serviceCosts.map((service) => (
            <Grid item xs={12} sm={6} md={4} key={service.key}>
              <Card sx={{ height: '100%', border: '1px solid #e2e8f0' }}>
                <CardContent sx={{ p: { xs: 2, sm: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    {getServiceIcon(service.key)}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: NAVY }}>
                      {service.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: SLATE_500, mb: 1.5 }}>
                    {service.description}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={`${service.credits} credits`}
                      size="small"
                      sx={{ bgcolor: alpha(TEAL, 0.1), color: TEAL, fontWeight: 600 }}
                    />
                    {service.workspace_level && (
                      <Chip
                        label="Workspace"
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: SLATE_500, color: SLATE_500 }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Transaction History */}
        <Typography variant="h6" sx={{ fontWeight: 600, color: NAVY, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Transaction History
        </Typography>
        {transactions.length === 0 ? (
          <Card sx={{ border: '1px solid #e2e8f0' }}>
            <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
              <AccountBalanceWallet sx={{ fontSize: { xs: 36, sm: 48 }, color: SLATE_500, mb: 2, opacity: 0.5 }} />
              <Typography variant="body1" sx={{ color: SLATE_500, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                No transactions yet. Your credit activity will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', boxShadow: 'none', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: SLATE_100 }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ color: SLATE_500, fontSize: '0.85rem' }}>
                      {formatDate(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tx.type}
                        sx={{
                          bgcolor: tx.type === 'credit' ? alpha('#10b981', 0.1) : alpha('#ef4444', 0.1),
                          color: tx.type === 'credit' ? '#10b981' : '#ef4444',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: NAVY }}>{tx.description}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {tx.type === 'credit' ? (
                          <Add sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : (
                          <Remove sx={{ fontSize: 16, color: '#ef4444' }} />
                        )}
                        <Typography
                          sx={{
                            fontWeight: 600,
                            color: tx.type === 'credit' ? '#10b981' : '#ef4444',
                          }}
                        >
                          {tx.amount}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500, color: NAVY }}>
                      {tx.balance_after}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </motion.div>
    </Box>
  );
};

export default CreditsPage;

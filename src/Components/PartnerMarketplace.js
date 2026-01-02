import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Divider,
  alpha,
} from '@mui/material';
import {
  Search,
  Person,
  Schedule,
  Language,
  Business,
  CheckCircle,
  Close,
  Work,
} from '@mui/icons-material';
import { useUser } from '@clerk/clerk-react';
import { API_BASE } from '../config/api';

const PartnerMarketplace = ({ open, onClose, workspaceId, onRequestPartner }) => {
  const { user } = useUser();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestingPartnerId, setRequestingPartnerId] = useState(null);

  useEffect(() => {
    if (open && workspaceId) {
      fetchPartners();
    }
  }, [open, workspaceId]);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/accountability-partners/marketplace`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch partners');
      }

      const data = await response.json();
      setPartners(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPartner = async (partnerUserId) => {
    setRequestingPartnerId(partnerUserId);
    try {
      const response = await fetch(
        `${API_BASE}/workspaces/${workspaceId}/accountability-partners/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Clerk-User-Id': user.id,
          },
          body: JSON.stringify({ partner_user_id: partnerUserId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send request');
      }

      if (onRequestPartner) {
        onRequestPartner(partnerUserId);
      }
      
      // Refresh partners list to update request status
      fetchPartners();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setRequestingPartnerId(null);
    }
  };

  const filteredPartners = partners.filter((partner) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const partnerUser = partner.user || {};
    return (
      partnerUser.name?.toLowerCase().includes(query) ||
      partner.headline?.toLowerCase().includes(query) ||
      partner.bio?.toLowerCase().includes(query) ||
      partner.domains?.some((d) => d.toLowerCase().includes(query))
    );
  });

  const getRequestButtonText = (partner) => {
    if (partner.request_status === 'PENDING') {
      return 'Requested';
    }
    if (partner.request_status === 'ACCEPTED') {
      return 'Accepted';
    }
    if (partner.request_status === 'DECLINED') {
      return 'Declined';
    }
    return 'Request Partnership';
  };

  const isRequestDisabled = (partner) => {
    return partner.request_status === 'PENDING' || partner.request_status === 'ACCEPTED';
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 520, md: 600 },
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box 
          sx={{ 
            p: 3, 
            bgcolor: 'background.paper',
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', letterSpacing: '-0.01em' }}>
            Find an Accountability Partner
          </Typography>
          <IconButton 
            onClick={onClose} 
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#0ea5e9', 0.08),
                color: 'primary.main',
              },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2.5, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            placeholder="Search by name, expertise, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.default',
                '&:hover': {
                  bgcolor: 'background.paper',
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2.5, bgcolor: 'background.default' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
              <CircularProgress size={32} sx={{ color: 'primary.main' }} />
            </Box>
          ) : error ? (
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 2,
                bgcolor: 'background.paper',
              }}
            >
              {error}
            </Alert>
          ) : filteredPartners.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 6 }}>
              <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                {searchQuery ? 'No partners match your search' : 'No available partners found'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your search or check back later
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredPartners.map((partner) => {
                const partnerUser = partner.user || {};
                const isRequesting = requestingPartnerId === partner.user_id;
                const isRequested = partner.request_status === 'PENDING';
                const isAccepted = partner.request_status === 'ACCEPTED';
                const isDeclined = partner.request_status === 'DECLINED';
                
                return (
                  <Card 
                    key={partner.user_id} 
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        borderColor: alpha('#0ea5e9', 0.3),
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 64, 
                            height: 64,
                            bgcolor: 'primary.main',
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {partnerUser.name?.[0]?.toUpperCase() || 'P'}
                        </Avatar>
                        
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, gap: 1 }}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: 'text.primary',
                                  letterSpacing: '-0.01em',
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {partnerUser.name || 'Unknown'}
                              </Typography>
                              {partner.headline && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  <Work fontSize="inherit" sx={{ fontSize: 14 }} />
                                  {partner.headline}
                                </Typography>
                              )}
                            </Box>
                            
                            <Button
                              variant={isRequested || isAccepted ? "outlined" : "contained"}
                              size="small"
                              onClick={() => handleRequestPartner(partner.user_id)}
                              disabled={isRequesting || isRequestDisabled(partner)}
                              startIcon={isRequested ? <CheckCircle fontSize="small" /> : null}
                              color={isAccepted ? "success" : isDeclined ? "error" : "primary"}
                              sx={{
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 500,
                                px: 2,
                                minWidth: 140,
                                ...(isRequested && {
                                  borderColor: 'primary.main',
                                  color: 'primary.main',
                                  '&:hover': {
                                    bgcolor: alpha('#0ea5e9', 0.08),
                                    borderColor: 'primary.main',
                                  },
                                }),
                                ...(isAccepted && {
                                  borderColor: 'success.main',
                                  color: 'success.main',
                                }),
                                ...(isDeclined && {
                                  borderColor: 'error.main',
                                  color: 'error.main',
                                }),
                              }}
                            >
                              {isRequesting ? 'Requesting...' : getRequestButtonText(partner)}
                            </Button>
                          </Box>
                          
                          {partner.bio && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                mb: 2,
                                lineHeight: 1.6,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {partner.bio}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {partner.expertise_stages?.map((stage) => (
                              <Chip
                                key={stage}
                                label={stage}
                                size="small"
                                icon={<Business sx={{ fontSize: 14 }} />}
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    color: 'text.secondary',
                                  },
                                }}
                              />
                            ))}
                            {partner.domains?.slice(0, 5).map((domain) => (
                              <Chip
                                key={domain}
                                label={domain}
                                size="small"
                                icon={<Business sx={{ fontSize: 14 }} />}
                                variant="outlined"
                                sx={{
                                  borderRadius: 1.5,
                                  borderColor: 'divider',
                                  color: 'text.secondary',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  '& .MuiChip-icon': {
                                    color: 'text.secondary',
                                  },
                                }}
                              />
                            ))}
                          </Box>
                          
                          <Divider sx={{ my: 1.5 }} />
                          
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Schedule 
                                fontSize="small" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: 16,
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {partner.preferred_cadence === 'weekly' ? 'Weekly' : 'Bi-weekly'}
                              </Typography>
                            </Box>
                            
                            {partner.languages?.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <Language 
                                  fontSize="small" 
                                  sx={{ 
                                    color: 'text.secondary',
                                    fontSize: 16,
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  {partner.languages.join(', ')}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Person 
                                fontSize="small" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: 16,
                                }} 
                              />
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {partner.current_active_workspaces || 0}/{partner.max_active_workspaces} slots
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default PartnerMarketplace;

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  Paper,
  Avatar,
  Button,
  IconButton,
} from '@mui/material';
import { Business, Work, ArrowForward, Notifications } from '@mui/icons-material';
import { motion } from 'framer-motion';
import WorkspaceNotificationsDialog from './WorkspaceNotificationsDialog';
import { supabase } from '../config/supabase';
import { API_BASE } from '../config/api';

const WorkspacesList = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationSummaries, setNotificationSummaries] = useState({});
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [selectedWorkspaceForNotifications, setSelectedWorkspaceForNotifications] = useState(null);
  const [founderId, setFounderId] = useState(null);

  useEffect(() => {
    fetchWorkspaces();
  }, [user]);

  // Fetch founder ID once
  useEffect(() => {
    const fetchFounderId = async () => {
      if (!user?.id) return;
      
      try {
        const response = await fetch(`${API_BASE}/profile/check`, {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('👤 Profile check response:', data);
          
          if (data.has_profile && data.profile) {
            const founderId = data.profile.id;
            console.log('👤 Founder ID fetched:', founderId);
            setFounderId(founderId);
          } else {
            console.warn('⚠️ No profile found for user');
          }
        } else {
          const errorData = await response.json();
          console.error('❌ Error response from profile check:', errorData);
        }
      } catch (err) {
        console.error('❌ Error fetching founder ID:', err);
      }
    };
    
    fetchFounderId();
  }, [user]);

  // Define fetchNotificationSummaries with useCallback
  const fetchNotificationSummaries = useCallback(async () => {
    try {
      const workspaceIds = workspaces.map(w => w.id);
      if (workspaceIds.length === 0 || !user?.id) {
        console.log('⏭️ Skipping fetchNotificationSummaries - no workspaces or user');
        return;
      }
      
      console.log('📊 Fetching notification summaries for workspaces:', workspaceIds);
      const params = new URLSearchParams();
      workspaceIds.forEach(id => params.append('workspace_ids[]', id));
      
      const response = await fetch(
        `${API_BASE}/notifications/summary?${params.toString()}`,
        {
          headers: {
            'X-Clerk-User-Id': user.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Notification summaries received:', data);
        setNotificationSummaries(data);
      } else {
        const errorData = await response.json();
        console.error('❌ Error response from API:', errorData);
      }
    } catch (err) {
      console.error('❌ Error fetching notification summaries:', err);
    }
  }, [workspaces, user]);

  // Set up realtime subscriptions and fetch initial summaries
  useEffect(() => {
    if (workspaces.length === 0 || !founderId || !user?.id) return;
    
    console.log('🔔 Setting up notification subscriptions for founder:', founderId);
    
    // Initial fetch
    fetchNotificationSummaries();
    
    // Set up Supabase Realtime subscription for notifications
    const notificationsChannel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${founderId}`,
        },
        (payload) => {
          console.log('🔔 Realtime notification event received:', payload);
          // When notification changes, refresh summaries
          fetchNotificationSummaries();
        }
      )
      .subscribe((status) => {
        console.log('🔔 Notifications subscription status:', status);
      });
    
    // Set up Supabase Realtime subscription for approvals
    const approvalsChannel = supabase
      .channel(`approvals_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'approvals',
          filter: `approver_user_id=eq.${founderId}`,
        },
        (payload) => {
          console.log('✅ Realtime approval event received (as approver):', payload);
          // When approval changes, refresh summaries
          fetchNotificationSummaries();
        }
      )
      .subscribe((status) => {
        console.log('✅ Approvals subscription status (as approver):', status);
      });
    
    // Also subscribe to approvals where user is proposer (to update when approved/rejected)
    const proposerApprovalsChannel = supabase
      .channel(`proposer_approvals_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `proposed_by_user_id=eq.${founderId}`,
        },
        (payload) => {
          console.log('📝 Realtime approval event received (as proposer):', payload);
          fetchNotificationSummaries();
        }
      )
      .subscribe((status) => {
        console.log('📝 Approvals subscription status (as proposer):', status);
      });
    
    // Fallback: Refresh when user returns to the page (in case realtime missed something)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page visible - refreshing notification summaries');
        fetchNotificationSummaries();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup subscriptions
    return () => {
      console.log('🧹 Cleaning up notification subscriptions');
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(approvalsChannel);
      supabase.removeChannel(proposerApprovalsChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [workspaces, founderId, user, fetchNotificationSummaries]);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch(`${API_BASE}/workspaces`, {
        headers: {
          'X-Clerk-User-Id': user.id,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch workspaces');
      }

      const data = await response.json();
      setWorkspaces(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'idea':
        return 'default';
      case 'mvp':
        return 'primary';
      case 'early-stage':
        return 'secondary';
      case 'growth':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
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

  if (workspaces.length === 0) {
    return (
      <Box 
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 2,
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
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', // Teal
            mb: 3,
          }}>
            <Work sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 1, fontWeight: 700 }}>
            No workspaces yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When you match with someone and start a collaboration, it will appear here.
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        p: 2,
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(13, 148, 136, 0.2)', // Teal
          borderRadius: '10px',
        },
      }}>
        <Box sx={{ mb: 2, px: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 400 }}>
            {workspaces.length} {workspaces.length === 1 ? 'workspace' : 'workspaces'}
          </Typography>
        </Box>
        <List sx={{ p: 0 }}>
          {workspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#0d9488', // Teal
                    boxShadow: '0 4px 16px rgba(13, 148, 136, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <ListItemButton
                  onClick={() => navigate(`/workspaces/${workspace.id}`)}
                  sx={{
                    py: 2,
                    px: 2.5,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Project Title as Main Heading */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Business sx={{ color: '#1e3a8a', fontSize: 20 }} /> {/* Navy */}
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                          color: '#1e3a8a', // Navy
                        }}
                      >
                        {workspace.project_title}
                      </Typography>
                      <ArrowForward sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </Box>

                    {/* Founder Names as Subheading */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {workspace.founder_names.join(', ')}
                    </Typography>

                    {/* Stage Chip and Notifications */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={workspace.stage || 'idea'}
                        size="small"
                        color={getStageColor(workspace.stage)}
                        sx={{
                          textTransform: 'capitalize',
                          fontSize: '0.75rem',
                          height: 24,
                        }}
                      />
                      
                      {/* Notification Summary */}
                      {/* 
                        Badge visibility logic:
                        - "X approvals pending": Shows only when pending_approvals > 0
                        - "X updates": Shows only when unread_updates > 0 (unread notifications)
                        - Both badges automatically disappear when count reaches 0
                        - Backend filters notifications where read_at IS NULL to determine unread status
                      */}
                      {notificationSummaries[workspace.id] && (
                        <>
                          {/* Pending Approvals - Shows when user needs to approve something */}
                          {notificationSummaries[workspace.id].pending_approvals > 0 && (
                            <Chip
                              label={`${notificationSummaries[workspace.id].pending_approvals} approval${notificationSummaries[workspace.id].pending_approvals > 1 ? 's' : ''} pending`}
                              size="small"
                              color="warning"
                              sx={{
                                fontSize: '0.75rem',
                                height: 24,
                                fontWeight: 600,
                              }}
                            />
                          )}
                          {/* Unread Updates - Shows only when there are unread notifications (read_at IS NULL) */}
                          {notificationSummaries[workspace.id].unread_updates > 0 && (
                            <Chip
                              label={`${notificationSummaries[workspace.id].unread_updates} update${notificationSummaries[workspace.id].unread_updates > 1 ? 's' : ''}`}
                              size="small"
                              variant="outlined"
                              color="info"
                              sx={{
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                          )}
                        </>
                      )}
                      
                      {/* View Notifications Button */}
                      {(notificationSummaries[workspace.id]?.pending_approvals > 0 || 
                        notificationSummaries[workspace.id]?.unread_updates > 0) && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Notifications />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWorkspaceForNotifications(workspace);
                            setNotificationsDialogOpen(true);
                          }}
                          sx={{
                            fontSize: '0.75rem',
                            height: 24,
                            minWidth: 'auto',
                            px: 1,
                          }}
                        >
                          View
                        </Button>
                      )}
                      
                      {workspace.created_at && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                          {new Date(workspace.created_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </ListItemButton>
              </Paper>
            </motion.div>
          ))}
        </List>
      </Box>

      {/* Notifications Dialog */}
      {selectedWorkspaceForNotifications && (
        <WorkspaceNotificationsDialog
          open={notificationsDialogOpen}
          onClose={() => {
            setNotificationsDialogOpen(false);
            setSelectedWorkspaceForNotifications(null);
            // Refresh summaries after closing dialog (in case notifications were marked as read)
            setTimeout(() => fetchNotificationSummaries(), 500);
          }}
          workspaceId={selectedWorkspaceForNotifications.id}
          workspaceName={selectedWorkspaceForNotifications.project_title || 'Workspace'}
          clerkUserId={user?.id}
        />
      )}
    </Box>
  );
};

export default WorkspacesList;


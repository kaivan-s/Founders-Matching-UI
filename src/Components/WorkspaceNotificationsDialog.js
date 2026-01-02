import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Divider,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
} from '@mui/material';
import {
  Close,
  Check,
  Close as CloseIcon,
  Notifications,
  Warning,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Message,
} from '@mui/icons-material';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { supabase } from '../config/supabase';

import { API_BASE } from '../config/api';

const WorkspaceNotificationsDialog = ({ open, onClose, workspaceId, workspaceName, clerkUserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [processingApproval, setProcessingApproval] = useState(null);
  const [markingRead, setMarkingRead] = useState(false);
  const [founderId, setFounderId] = useState(null);

  // Define fetch functions with useCallback
  const fetchNotifications = useCallback(async () => {
    if (!workspaceId || !clerkUserId) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/notifications?workspace_id=${workspaceId}`,
        {
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, clerkUserId]);

  const fetchPendingApprovals = useCallback(async () => {
    if (!workspaceId || !clerkUserId) return;
    
    try {
      const response = await fetch(
        `${API_BASE}/approvals/pending?workspace_id=${workspaceId}`,
        {
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  }, [workspaceId, clerkUserId]);

  // Fetch founder ID
  useEffect(() => {
    const fetchFounderId = async () => {
      if (!clerkUserId) return;
      
      try {
        const response = await fetch(`${API_BASE}/profile/check`, {
          headers: {
            'X-Clerk-User-Id': clerkUserId,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.has_profile && data.profile) {
            setFounderId(data.profile.id);
          }
        }
      } catch (err) {
        console.error('Error fetching founder ID:', err);
      }
    };
    
    if (open) {
      fetchFounderId();
    }
  }, [open, clerkUserId]);

  // Initial fetch and set up realtime subscriptions
  useEffect(() => {
    if (!open || !workspaceId || !founderId) return;
    
    // Initial fetch
    fetchNotifications();
    fetchPendingApprovals();
    
    // Set up Supabase Realtime subscription for notifications
    const notificationsChannel = supabase
      .channel(`notifications_dialog_${workspaceId}_${clerkUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `workspace_id=eq.${workspaceId} AND user_id=eq.${founderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Add new notification
            fetchNotifications();
          } else if (payload.eventType === 'UPDATE') {
            // Update existing notification (e.g., marked as read)
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
          }
        }
      )
      .subscribe();
    
    // Set up Supabase Realtime subscription for approvals
    const approvalsChannel = supabase
      .channel(`approvals_dialog_${workspaceId}_${clerkUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'approvals',
          filter: `workspace_id=eq.${workspaceId} AND approver_user_id=eq.${founderId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New approval request
            fetchPendingApprovals();
          } else if (payload.eventType === 'UPDATE') {
            // Approval was processed
            setPendingApprovals(prev => 
              prev.filter(a => a.id !== payload.new.id)
            );
          }
        }
      )
      .subscribe();
    
    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(approvalsChannel);
    };
  }, [open, workspaceId, founderId, clerkUserId, fetchNotifications, fetchPendingApprovals]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setMarkingRead(true);
    try {
      const response = await fetch(
        `${API_BASE}/notifications/mark-all-read`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ workspace_id: workspaceId })
        }
      );

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleApproval = async (approvalId, action) => {
    setProcessingApproval(approvalId);
    
    try {
      const response = await fetch(
        `${API_BASE}/approvals/${approvalId}/${action}`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ comment: '' })
        }
      );

      if (response.ok) {
        // Remove from pending approvals
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
        // Refresh notifications
        await fetchNotifications();
      }
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error);
    } finally {
      setProcessingApproval(null);
    }
  };

  const formatTime = (dateString) => {
    const date = parseISO(dateString);
    
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  const getNotificationIcon = (type) => {
    if (type === 'MESSAGE_RECEIVED') return <Message color="primary" />;
    if (type.includes('APPROVAL_REQUESTED')) return <Warning color="warning" />;
    if (type === 'APPROVAL_COMPLETED') return <CheckCircle color="success" />;
    if (type.includes('REJECTED')) return <Cancel color="error" />;
    return <Notifications color="primary" />;
  };

  const unreadCount = notifications.filter(n => !n.read_at).length;
  const hasUnread = unreadCount > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      <DialogTitle sx={{ flexShrink: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications - {workspaceName}
            </Typography>
            {hasUnread && (
              <Typography variant="caption" color="text.secondary">
                {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent 
        dividers
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          p: 0,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, px: 2 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Updates
                  {hasUnread && (
                    <Chip 
                      label={unreadCount} 
                      size="small" 
                      color="primary"
                      sx={{ height: 20, minWidth: 20 }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Approvals
                  {pendingApprovals.length > 0 && (
                    <Chip 
                      label={pendingApprovals.length} 
                      size="small" 
                      color="warning"
                      sx={{ height: 20, minWidth: 20 }}
                    />
                  )}
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Scrollable Content Area */}
        <Box 
          sx={{ 
            flex: 1,
            overflowY: 'auto',
            px: 2,
            py: 2,
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(14, 165, 233, 0.2)',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(14, 165, 233, 0.4)',
            },
          }}
        >
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && activeTab === 0 && (
            <Box>
            {hasUnread && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  onClick={markAllAsRead}
                  disabled={markingRead}
                  startIcon={markingRead ? <CircularProgress size={16} /> : <CheckCircle />}
                >
                  Mark All as Read
                </Button>
              </Box>
            )}

            {notifications.length === 0 ? (
              <Alert severity="info">No notifications yet</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {notifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem
                      sx={{
                        bgcolor: notification.read_at ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': { bgcolor: 'action.selected' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'transparent' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: notification.read_at ? 400 : 600 }}>
                              {notification.title}
                            </Typography>
                            {!notification.read_at && (
                              <Chip label="New" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Stack>
                        }
                        secondary={
                          <>
                            {notification.message && (
                              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                {notification.message}
                              </Typography>
                            )}
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatTime(notification.created_at)}
                            </Typography>
                            {!notification.read_at && (
                              <Button
                                size="small"
                                onClick={() => markAsRead(notification.id)}
                                sx={{ mt: 1, fontSize: '0.75rem' }}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                    {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}

        {!loading && activeTab === 1 && (
          <Box>
            {pendingApprovals.length === 0 ? (
              <Alert severity="success">No pending approvals</Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {pendingApprovals.map((approval, index) => (
                  <React.Fragment key={approval.id}>
                    <ListItem
                      sx={{
                        bgcolor: 'warning.light',
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'warning.main',
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main' }}>
                          <HourglassEmpty />
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {approval.proposer?.name || 'Partner'} requested approval
                          </Typography>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                              {approval.entity_type === 'EQUITY_SCENARIO' && 'Equity scenario changes'}
                              {approval.entity_type === 'FOUNDER_TITLE' && 'Founder title change'}
                              {approval.entity_type === 'DECISION' && 'Decision approval'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                              {formatTime(approval.created_at)}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<Check />}
                                onClick={() => handleApproval(approval.id, 'approve')}
                                disabled={processingApproval === approval.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<CloseIcon />}
                                onClick={() => handleApproval(approval.id, 'reject')}
                                disabled={processingApproval === approval.id}
                              >
                                Reject
                              </Button>
                              {processingApproval === approval.id && (
                                <CircularProgress size={20} />
                              )}
                            </Stack>
                          </>
                        }
                      />
                    </ListItem>
                    {index < pendingApprovals.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ flexShrink: 0 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkspaceNotificationsDialog;


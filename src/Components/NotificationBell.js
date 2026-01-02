import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Check,
  Close,
  Info,
  Warning,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

import { API_BASE } from '../config/api';

const NotificationBell = ({ workspaceId, clerkUserId }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [processingApproval, setProcessingApproval] = useState(null);

  const fetchNotifications = async () => {
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
        setUnreadCount(data.filter(n => !n.read_at).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [workspaceId, clerkUserId]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Mark all as read when opening
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(
        `${API_BASE}/notifications/${notificationId}/read`,
        {
          method: 'POST',
          headers: {
            'X-Clerk-User-Id': clerkUserId,
            'Content-Type': 'application/json',
          }
        }
      );
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(
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
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
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
    if (type.includes('APPROVAL')) return <Warning color="warning" />;
    if (type.includes('COMPLETED')) return <CheckCircle color="success" />;
    if (type.includes('REJECTED')) return <Cancel color="error" />;
    return <Info color="primary" />;
  };

  const getNotificationColor = (type) => {
    if (type.includes('APPROVAL_REQUESTED')) return 'warning';
    if (type === 'APPROVAL_COMPLETED') return 'success';
    if (type.includes('REJECTED')) return 'error';
    return 'default';
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ width: 400, maxHeight: 600 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && notifications.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No notifications yet
              </Typography>
            </Box>
          )}

          {!loading && notifications.length > 0 && (
            <List sx={{ maxHeight: 500, overflow: 'auto' }}>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.read_at ? 'transparent' : 'action.hover',
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
                          {notification.type.includes('APPROVAL_REQUESTED') && (
                            <Chip
                              label="Action Required"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                      secondary={
                        <>
                          {notification.message && (
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {notification.message}
                            </Typography>
                          )}
                          
                          <Typography variant="caption" color="textSecondary">
                            {formatTime(notification.created_at)}
                          </Typography>

                          {notification.approval_id && notification.type === 'APPROVAL_REQUESTED' && (
                            <Box sx={{ mt: 1 }}>
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<Check />}
                                  onClick={() => handleApproval(notification.approval_id, 'approve')}
                                  disabled={processingApproval === notification.approval_id}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  startIcon={<Close />}
                                  onClick={() => handleApproval(notification.approval_id, 'reject')}
                                  disabled={processingApproval === notification.approval_id}
                                >
                                  Reject
                                </Button>
                              </Stack>
                              {processingApproval === notification.approval_id && (
                                <CircularProgress size={20} sx={{ ml: 2 }} />
                              )}
                            </Box>
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

          {notifications.length > 5 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
              <Button size="small" onClick={handleClose}>
                View All in Workspace
              </Button>
            </Box>
          )}
        </Paper>
      </Popover>
    </>
  );
};

export default NotificationBell;

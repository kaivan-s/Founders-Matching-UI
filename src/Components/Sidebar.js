import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Badge,
  Collapse,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Explore,
  Inbox,
  FolderOpen,
  Groups,
  People,
  CalendarMonth,
  Payment,
  Feedback,
  ChevronLeft,
  ChevronRight,
  ExpandLess,
  ExpandMore,
  Send,
  CallReceived,
} from '@mui/icons-material';
import { API_BASE } from '../config/api';

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 68;

const TEAL = '#0d9488';
const NAVY = '#1e3a8a';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';

const Sidebar = ({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [inboxOpen, setInboxOpen] = useState(true);
  const [notificationCounts, setNotificationCounts] = useState({
    received: 0,
    sent: 0,
    workspaces: 0,
  });

  // Fetch notification counts
  const fetchNotificationCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const [notifResponse, accessResponse] = await Promise.all([
        fetch(`${API_BASE}/notifications/counts`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }),
        fetch(`${API_BASE}/access-requests/count`, {
          headers: { 'X-Clerk-User-Id': user.id },
        }).catch(() => null),
      ]);
      
      let received = 0, workspaces = 0;
      
      if (notifResponse.ok) {
        const data = await notifResponse.json();
        received = data.interests || 0;
        workspaces = data.workspaces || 0;
      }
      
      if (accessResponse?.ok) {
        const data = await accessResponse.json();
        received += data.count || 0;
      }
      
      setNotificationCounts({ received, sent: 0, workspaces });
    } catch (err) {
      // Silent fail
    }
  }, [user]);

  useEffect(() => {
    fetchNotificationCounts();
  }, [fetchNotificationCounts]);

  // Refresh counts on navigation
  useEffect(() => {
    const timer = setTimeout(fetchNotificationCounts, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname, fetchNotificationCounts]);

  // Listen for events
  useEffect(() => {
    const handleRefresh = () => setTimeout(fetchNotificationCounts, 500);
    
    window.addEventListener('interestAccepted', handleRefresh);
    window.addEventListener('projectCreated', handleRefresh);
    window.addEventListener('interestsViewed', handleRefresh);
    window.addEventListener('accessRequestResponded', handleRefresh);

    return () => {
      window.removeEventListener('interestAccepted', handleRefresh);
      window.removeEventListener('projectCreated', handleRefresh);
      window.removeEventListener('interestsViewed', handleRefresh);
      window.removeEventListener('accessRequestResponded', handleRefresh);
    };
  }, [fetchNotificationCounts]);

  const isActive = (path) => {
    if (path === '/discover') {
      return location.pathname === '/discover' || location.pathname.startsWith('/find-project');
    }
    if (path === '/advisor/dashboard') {
      const p = location.pathname;
      return (
        p.startsWith('/advisor/dashboard') ||
        (p.startsWith('/advisor/') &&
          !p.startsWith('/advisor/onboarding') &&
          p !== '/advisor/landing')
      );
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      onMobileClose?.();
    }
  };

  const primaryNavItems = [
    {
      id: 'discover',
      label: 'Discover',
      icon: <Explore />,
      path: '/discover',
    },
  ];

  const inboxItems = [
    {
      id: 'received',
      label: 'Received',
      icon: <CallReceived />,
      path: '/applications',
      badge: notificationCounts.received,
    },
    {
      id: 'sent',
      label: 'Sent',
      icon: <Send />,
      path: '/my-applications',
      badge: notificationCounts.sent,
    },
  ];

  const workNavItems = [
    {
      id: 'projects',
      label: 'My Projects',
      icon: <FolderOpen />,
      path: '/projects',
    },
    {
      id: 'workspaces',
      label: 'Workspaces',
      icon: <Groups />,
      path: '/workspaces',
      badge: notificationCounts.workspaces,
    },
  ];

  const secondaryNavItems = [
    {
      id: 'advisors',
      label: 'Advisor hub',
      icon: <People />,
      path: '/advisor/dashboard',
    },
    {
      id: 'consultations',
      label: 'Consultations',
      icon: <CalendarMonth />,
      path: '/consultations',
    },
  ];

  const bottomNavItems = [
    {
      id: 'payments',
      label: 'Payments',
      icon: <Payment />,
      path: '/payments',
    },
    {
      id: 'feedback',
      label: 'Feedback',
      icon: <Feedback />,
      path: '/my-feedback',
    },
  ];

  const NavItem = ({ item, nested = false }) => {
    const active = isActive(item.path);
    
    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        <ListItemButton
          onClick={() => handleNavigate(item.path)}
          sx={{
            minHeight: 44,
            px: collapsed && !isMobile ? 2 : nested ? 4 : 2.5,
            py: 1,
            mx: 1,
            borderRadius: 2,
            bgcolor: active ? alpha(TEAL, 0.1) : 'transparent',
            color: active ? TEAL : SLATE_500,
            '&:hover': {
              bgcolor: active ? alpha(TEAL, 0.15) : SLATE_100,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: collapsed && !isMobile ? 0 : 36,
              color: active ? TEAL : SLATE_400,
              justifyContent: 'center',
            }}
          >
            {item.badge > 0 ? (
              <Badge 
                badgeContent={item.badge} 
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: TEAL,
                    color: '#fff',
                    fontSize: '0.65rem',
                    minWidth: 18,
                    height: 18,
                  },
                }}
              >
                {item.icon}
              </Badge>
            ) : (
              item.icon
            )}
          </ListItemIcon>
          {(!collapsed || isMobile) && (
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: active ? 600 : 500,
              }}
            />
          )}
          {(!collapsed || isMobile) && item.badge > 0 && (
            <Box
              sx={{
                bgcolor: TEAL,
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 600,
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ml: 1,
              }}
            >
              {item.badge}
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  };

  const sidebarContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#fff',
        borderRight: '1px solid',
        borderColor: SLATE_200,
      }}
    >
      {/* Logo area */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          px: collapsed && !isMobile ? 1 : 2.5,
          borderBottom: '1px solid',
          borderColor: SLATE_200,
        }}
      >
        {(!collapsed || isMobile) && (
          <Typography
            variant="h6"
            onClick={() => handleNavigate('/home')}
            sx={{
              fontWeight: 700,
              color: NAVY,
              cursor: 'pointer',
              letterSpacing: '-0.02em',
              '&:hover': { color: TEAL },
            }}
          >
            Guild Space
          </Typography>
        )}
        {!isMobile && (
          <IconButton
            onClick={onToggleCollapse}
            size="small"
            sx={{
              color: SLATE_400,
              '&:hover': { color: TEAL, bgcolor: alpha(TEAL, 0.08) },
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1.5 }}>
        {/* Primary nav */}
        <List disablePadding>
          {primaryNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </List>

        {/* Inbox section with sub-items */}
        <List disablePadding>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              onClick={() => !collapsed || isMobile ? setInboxOpen(!inboxOpen) : handleNavigate('/applications')}
              sx={{
                minHeight: 44,
                px: collapsed && !isMobile ? 2 : 2.5,
                py: 1,
                mx: 1,
                borderRadius: 2,
                color: isActive('/applications') || isActive('/my-applications') ? TEAL : SLATE_500,
                '&:hover': { bgcolor: SLATE_100 },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: collapsed && !isMobile ? 0 : 36,
                  color: isActive('/applications') || isActive('/my-applications') ? TEAL : SLATE_400,
                  justifyContent: 'center',
                }}
              >
                <Badge 
                  badgeContent={notificationCounts.received} 
                  color="primary"
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: TEAL,
                      color: '#fff',
                      fontSize: '0.65rem',
                      minWidth: 18,
                      height: 18,
                    },
                  }}
                >
                  <Inbox />
                </Badge>
              </ListItemIcon>
              {(!collapsed || isMobile) && (
                <>
                  <ListItemText 
                    primary="Inbox" 
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                  {inboxOpen ? <ExpandLess sx={{ color: SLATE_400 }} /> : <ExpandMore sx={{ color: SLATE_400 }} />}
                </>
              )}
            </ListItemButton>
          </ListItem>
          {(!collapsed || isMobile) && (
            <Collapse in={inboxOpen} timeout="auto" unmountOnExit>
              <List disablePadding>
                {inboxItems.map((item) => (
                  <NavItem key={item.id} item={item} nested />
                ))}
              </List>
            </Collapse>
          )}
        </List>

        <Divider sx={{ my: 1.5, mx: 2 }} />

        {/* My Work section */}
        {(!collapsed || isMobile) && (
          <Typography
            variant="caption"
            sx={{
              px: 3,
              py: 1,
              display: 'block',
              color: SLATE_400,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            My Work
          </Typography>
        )}
        <List disablePadding>
          {workNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </List>

        <Divider sx={{ my: 1.5, mx: 2 }} />

        {/* Secondary nav */}
        {(!collapsed || isMobile) && (
          <Typography
            variant="caption"
            sx={{
              px: 3,
              py: 1,
              display: 'block',
              color: SLATE_400,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
            }}
          >
            Resources
          </Typography>
        )}
        <List disablePadding>
          {secondaryNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </List>
      </Box>

      {/* Bottom section */}
      <Box sx={{ borderTop: '1px solid', borderColor: SLATE_200, py: 1 }}>
        <List disablePadding>
          {bottomNavItems.map((item) => (
            <NavItem key={item.id} item={item} />
          ))}
        </List>
      </Box>
    </Box>
  );

  // Mobile drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  // Desktop sidebar
  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        flexShrink: 0,
        transition: 'width 0.2s ease',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
          height: '100vh',
          transition: 'width 0.2s ease',
        }}
      >
        {sidebarContent}
      </Box>
    </Box>
  );
};

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
export default Sidebar;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, UserButton, SignedIn } from '@clerk/clerk-react';
import {
  Box,
  IconButton,
  Button,
  Badge,
  useMediaQuery,
  useTheme,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  alpha,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import {
  Menu as MenuIcon,
  Add,
  Notifications,
  Person,
  Settings,
  AdminPanelSettings,
} from '@mui/icons-material';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import NewProjectDialog from './NewProjectDialog';
import FounderPlanNavTag from './FounderPlanNavTag';
import { useFounderPlan } from '../hooks/useFounderPlan';

const TEAL = '#0d9488';
const SLATE_200 = '#e2e8f0';
const SLATE_400 = '#94a3b8';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { planId } = useFounderPlan(user?.id);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const [promoBannerDismissed, setPromoBannerDismissed] = useState(false);

  // Update banner dismissed state when plan changes
  useEffect(() => {
    if (planId) {
      const isDismissed = sessionStorage.getItem(`promoBannerDismissed_${planId}`) === 'true';
      setPromoBannerDismissed(isDismissed);
    }
  }, [planId]);

  const handleDismissPromoBanner = () => {
    setPromoBannerDismissed(true);
    if (planId) {
      sessionStorage.setItem(`promoBannerDismissed_${planId}`, 'true');
    }
  };

  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    user?.primaryEmailAddress?.emailAddress === 'kaivansattar@gmail.com';

  // Listen for event to open new project dialog from other components
  useEffect(() => {
    const handleOpenNewProject = () => setNewProjectDialogOpen(true);
    window.addEventListener('openNewProjectDialog', handleOpenNewProject);
    return () => window.removeEventListener('openNewProjectDialog', handleOpenNewProject);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMoreMenuOpen = (event) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const sidebarWidth = isMobile ? 0 : sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: { md: `calc(100% - ${sidebarWidth}px)` },
          transition: 'width 0.2s ease',
        }}
      >
        {/* Promo Banner with Marquee - Tier-specific content */}
        {!promoBannerDismissed && (
          <Box
            sx={{
              bgcolor: planId === 'PRO_PLUS' ? '#1e3a8a' : '#0d9488',
              color: '#fff',
              py: 0.75,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                animation: planId === 'PRO_PLUS' ? 'none' : 'marquee 45s linear infinite',
                whiteSpace: 'nowrap',
                justifyContent: planId === 'PRO_PLUS' ? 'center' : 'flex-start',
                '@keyframes marquee': {
                  '0%': { transform: 'translateX(100%)' },
                  '100%': { transform: 'translateX(-100%)' },
                },
              }}
            >
              {planId === 'PRO_PLUS' ? (
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Investor Marketplace — Coming soon for Pro+ members
                </Typography>
              ) : planId === 'PRO' ? (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Unlock Pro+
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    2x more curated opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Dedicated support
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    First access to new features
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Unlock Pro+
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    2x more curated opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Dedicated support
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    First access to new features
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    25+ opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Unlimited applications
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Match & pre-apply insights
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Skill market analysis
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Browse advisors
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    AI project insights
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Revisit passed opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Pro at <span style={{ fontWeight: 800 }}>$15/mo</span>
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    25+ opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Unlimited applications
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Match & pre-apply insights
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Skill market analysis
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Browse advisors
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    AI project insights
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Revisit passed opportunities
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.875rem' }, opacity: 0.9 }}>
                    •
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    AI project insights on creation
                  </Typography>
                </>
              )}
            </Box>
            {planId !== 'PRO_PLUS' && (
              <Button
                size="small"
                onClick={() => navigate('/pricing')}
                sx={{
                  bgcolor: '#fff',
                  color: planId === 'PRO' ? '#1e3a8a' : '#0d9488',
                  fontWeight: 700,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                  px: { xs: 1, sm: 1.5 },
                  py: 0.25,
                  minHeight: 0,
                  position: 'absolute',
                  right: { xs: 32, sm: 40 },
                  zIndex: 1,
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: '#f0fdfa' },
                }}
              >
                Upgrade
              </Button>
            )}
            <IconButton
              size="small"
              onClick={handleDismissPromoBanner}
              sx={{
                position: 'absolute',
                right: { xs: 4, sm: 8 },
                color: '#fff',
                opacity: 0.7,
                p: { xs: 0.15, sm: 0.25 },
                zIndex: 1,
                '&:hover': { opacity: 1 },
              }}
            >
              <Close sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </IconButton>
          </Box>
        )}

        <SignedIn>
          <Box
            sx={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: { xs: 2, md: 3 },
              bgcolor: '#fff',
              borderBottom: '1px solid',
              borderColor: SLATE_200,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton onClick={handleDrawerToggle} sx={{ color: SLATE_400 }}>
                  <MenuIcon />
                </IconButton>
              )}
              <FounderPlanNavTag />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 } }}>
              <Tooltip title="Notifications">
                <IconButton
                  sx={{
                    color: SLATE_400,
                    '&:hover': { color: TEAL, bgcolor: alpha(TEAL, 0.08) },
                  }}
                >
                  <Badge badgeContent={0} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Tooltip title="Account">
                <IconButton
                  onClick={handleMoreMenuOpen}
                  sx={{
                    color: SLATE_400,
                    '&:hover': { color: TEAL, bgcolor: alpha(TEAL, 0.08) },
                  }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={moreMenuAnchor}
                open={Boolean(moreMenuAnchor)}
                onClose={handleMoreMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    minWidth: 200,
                    mt: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    navigate('/profile');
                    handleMoreMenuClose();
                  }}
                >
                  <ListItemIcon>
                    <Person fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                {isAdmin && (
                  <MenuItem
                    onClick={() => {
                      navigate('/admin');
                      handleMoreMenuClose();
                    }}
                  >
                    <ListItemIcon>
                      <AdminPanelSettings fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Admin Panel</ListItemText>
                  </MenuItem>
                )}
              </Menu>

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: {
                      width: 36,
                      height: 36,
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </SignedIn>

        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>

      <NewProjectDialog
        open={newProjectDialogOpen}
        onClose={() => setNewProjectDialogOpen(false)}
        onProjectCreated={() => {
          setNewProjectDialogOpen(false);
          navigate('/projects', { state: { refreshProjects: Date.now() } });
          // Defer until after navigation so MyProjects is mounted and listening
          setTimeout(() => {
            window.dispatchEvent(new Event('projectCreated'));
          }, 0);
        }}
      />
    </Box>
  );
};

export default AppLayout;

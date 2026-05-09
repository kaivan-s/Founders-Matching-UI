import React, { useState } from 'react';
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
  alpha,
} from '@mui/material';
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

const TEAL = '#0d9488';
const SLATE_200 = '#e2e8f0';
const SLATE_400 = '#94a3b8';

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);

  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    user?.primaryEmailAddress?.emailAddress === 'kaivansattar@gmail.com';

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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setNewProjectDialogOpen(true)}
                sx={{
                  bgcolor: TEAL,
                  px: { xs: 1.5, sm: 2.5 },
                  py: 0.875,
                  fontSize: '0.8125rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#14b8a6',
                    boxShadow: '0 4px 6px -1px rgba(13, 148, 136, 0.2)',
                  },
                }}
              >
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>New Project</Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}>New</Box>
              </Button>

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
          window.dispatchEvent(new Event('projectCreated'));
        }}
      />
    </Box>
  );
};

export default AppLayout;

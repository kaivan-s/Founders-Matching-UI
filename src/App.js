import React from 'react';
// import { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
// import { SignedIn, SignedOut, SignIn, UserButton, useUser } from '@clerk/clerk-react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
// import { Typography, CircularProgress, Tabs, Tab, Button } from '@mui/material';
// import SwipeInterface from './Components/SwipeInterface';
// import ProfileSetup from './Components/ProfileSetup';
// import MatchesPage from './Components/MatchesPage';
import LandingPage from './Components/LandingPage';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8b5cf6', // Purple-violet
      light: '#a78bfa',
      dark: '#7c3aed',
    },
    secondary: {
      main: '#06b6d4', // Cyan
      light: '#22d3ee',
      dark: '#0891b2',
    },
    success: {
      main: '#10b981', // Emerald
    },
    error: {
      main: '#f59e0b', // Amber
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
    '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.06)',
    '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
    '0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)',
  ],
});

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY || "pk_test_Y2hlZXJmdWwtd2hpcHBldC03My5jbGVyay5hY2NvdW50cy5kZXYk";

// function AppContent() {
//   const { user } = useUser();
//   const [hasProfile, setHasProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState(0);

//   useEffect(() => {
//     if (user) {
//       checkProfile();
//     }
//   }, [user]);

//   const checkProfile = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/api/profile/check', {
//         headers: {
//           'X-Clerk-User-Id': user.id,
//         },
//       });
//       const data = await response.json();
//       setHasProfile(data.has_profile);
//     } catch (error) {
//       console.error('Error checking profile:', error);
//       setHasProfile(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleProfileComplete = () => {
//     setHasProfile(true);
//   };

//   const handleTabChange = (event, newValue) => {
//     setActiveTab(newValue);
//   };

//   if (loading) {
//     return (
//       <Box display="flex" justifyContent="center" alignItems="center" height="100%">
//         <CircularProgress />
//       </Box>
//     );
//   }

//   if (!hasProfile) {
//     return <ProfileSetup onProfileComplete={handleProfileComplete} />;
//   }

//   return (
//     <Box sx={{ 
//       height: '100%',
//       display: 'flex',
//       flexDirection: 'column',
//       overflow: 'hidden'
//     }}>
//       <Box sx={{ mb: 2, flexShrink: 0 }}>
//         <Tabs 
//           value={activeTab} 
//           onChange={handleTabChange} 
//           aria-label="navigation tabs"
//           sx={{
//             '& .MuiTab-root': {
//               textTransform: 'none',
//               fontSize: '1rem',
//               fontWeight: 500,
//               minHeight: 48,
//             },
//             '& .Mui-selected': {
//               color: 'primary.main',
//             },
//             '& .MuiTabs-indicator': {
//               height: 3,
//               borderRadius: '3px 3px 0 0',
//             },
//           }}
//         >
//           <Tab label="Discover" />
//           <Tab label="Matches" />
//         </Tabs>
//       </Box>
//       <Box sx={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
//         {activeTab === 0 ? <SwipeInterface /> : <MatchesPage />}
//       </Box>
//     </Box>
//   );
// }

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ 
          height: '100vh', 
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            px: { xs: 2, sm: 4, md: 6 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexShrink: 0
          }}>
            <Typography variant="h4" component="h1" sx={{ color: 'primary.main' }}>
              Founders
            </Typography>
            <SignedIn>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <SignIn mode="modal">
                <Button 
                  variant="outlined" 
                  sx={{ 
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 3,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    '&:hover': {
                      borderColor: 'primary.dark',
                      bgcolor: 'primary.main',
                      color: 'white',
                    },
                  }}
                >
                  Sign In
                </Button>
              </SignIn>
            </SignedOut>
          </Box> */}
          
          <Box sx={{ 
            flex: 1, 
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* <SignedIn>
              <AppContent />
            </SignedIn>
            
            <SignedOut>
              <LandingPage />
            </SignedOut> */}
            <LandingPage />
          </Box>
        </Box>
      </ThemeProvider>
    </ClerkProvider>
  );
}

export default App;

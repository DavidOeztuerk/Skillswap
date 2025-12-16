import React, { useState, memo, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, useMediaQuery, type Theme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileTabbar from './Tabbar';
import NavigationProgress from '../ui/NavigationProgress';

interface MainLayoutProps {
  children: React.ReactNode;
  onToggleTheme: () => void;
  darkMode: boolean;
}

const DRAWER_WIDTH = 240;

// Routes die ohne Sidebar/Header gerendert werden (Fullscreen)
const FULLSCREEN_ROUTES = ['/videocall'];

const MainLayout: React.FC<MainLayoutProps> = ({ children, onToggleTheme, darkMode }) => {
  const location = useLocation();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [mobileOpenState, setMobileOpenState] = useState(false);

  // Derived state: mobileOpen is only true when on mobile AND state is true
  // This avoids useEffect setState when switching between mobile/desktop
  const mobileOpen = useMemo(() => isMobile && mobileOpenState, [isMobile, mobileOpenState]);

  // Prüfe ob aktuelle Route Fullscreen sein soll (ohne Sidebar/Header)
  const isFullscreenRoute = FULLSCREEN_ROUTES.some((route) => location.pathname.startsWith(route));

  const handleDrawerToggle = useCallback(() => {
    setMobileOpenState((prev) => !prev);
  }, []);

  // Fullscreen-Modus für VideoCall: Nur Content, kein Layout-Chrome
  if (isFullscreenRoute) {
    return (
      <Box
        component="main"
        role="main"
        id="main-content"
        sx={{
          minHeight: '100vh',
          width: '100vw',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1300, // Über anderen UI-Elementen
          bgcolor: 'black',
        }}
      >
        {children}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      {/* Navigation Progress Indicator */}
      <NavigationProgress />

      {/* Header with banner landmark */}
      <Box component="header" role="banner">
        <Header
          drawerWidth={DRAWER_WIDTH}
          onDrawerToggle={handleDrawerToggle}
          darkMode={darkMode}
          onToggleTheme={onToggleTheme}
        />
      </Box>

      {/* Navigation landmark */}
      <Box
        component="nav"
        role="navigation"
        aria-label="Primary navigation"
        id="primary-navigation"
      >
        <Sidebar
          drawerWidth={DRAWER_WIDTH}
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle}
        />
      </Box>

      {/* Mobile navigation */}
      {isMobile && (
        <Box component="nav" role="navigation" aria-label="Mobile navigation">
          <MobileTabbar />
        </Box>
      )}

      {/* Main content landmark */}
      <Box
        component="main"
        role="main"
        id="main-content"
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${String(DRAWER_WIDTH)}px)` },
          p: { xs: 2, sm: 3 },
          mt: { xs: '56px', sm: '64px' },
          pb: { xs: '72px', sm: 3 },
          height: { xs: 'calc(100vh - 56px - 72px)', sm: 'calc(100vh - 64px)' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              duration: theme.transitions.duration.standard,
            }),
          // Focus management for skip links
          '&:focus': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
        tabIndex={-1}
      >
        {children}
      </Box>
    </Box>
  );
};

export default memo(MainLayout);

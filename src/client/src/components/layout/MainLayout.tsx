// src/components/layout/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileTabbar from './Tabbar';

interface MainLayoutProps {
  children: React.ReactNode;
  onToggleTheme: () => void;
  darkMode: boolean;
}

const DRAWER_WIDTH = 240;

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  onToggleTheme,
  darkMode,
}) => {
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <Header
        drawerWidth={DRAWER_WIDTH}
        onDrawerToggle={handleDrawerToggle}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      />

      {/* Desktop Sidebar / Mobile Drawer */}
      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
      />

      {/* Mobile Tabbar - nur auf kleinen Bildschirmen anzeigen */}
      {isMobile && <MobileTabbar />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          p: { xs: 2, sm: 3 },
          mt: { xs: '56px', sm: '64px' },
          pb: { xs: '72px', sm: 3 },
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              duration: theme.transitions.duration.standard,
            }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;

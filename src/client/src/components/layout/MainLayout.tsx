// src/components/layout/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, Theme } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { useTheme } from '../../hooks/useTheme';

interface MainLayoutProps {
  children: React.ReactNode;
}

const DRAWER_WIDTH = 240;

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { mode, toggleTheme } = useTheme();
  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('md')
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Schließe mobile Sidebar automatisch, wenn Fenster vergrößert wird
  useEffect(() => {
    if (!isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isMobile, mobileOpen]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Header
        drawerWidth={DRAWER_WIDTH}
        onDrawerToggle={handleDrawerToggle}
        darkMode={mode === 'dark'}
        onToggleTheme={toggleTheme}
      />

      <Sidebar
        drawerWidth={DRAWER_WIDTH}
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          bgcolor: 'background.default',
          p: { xs: 2, sm: 3 },
          mt: { xs: '56px', sm: '64px' },
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;

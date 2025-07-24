import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import { getProfile } from './features/auth/authSlice';
import { useAppDispatch, useAppSelector } from './store/store.hooks';
import SkipLinks from './components/accessibility/SkipLinks';
import NetworkStatusIndicator from './components/error/NetworkStatusIndicator';
// import { useAnnouncements } from './hooks/useAnnouncements';
import { useRouteAnnouncements } from './hooks/useRouteAnnouncements';
import './utils/debugHelpers'; // Enable debug helpers

const App = () => {
  const { mode, theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  // const { announceNavigation } = useAnnouncements();
  
  // Enable route announcements for accessibility
  useRouteAnnouncements();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getProfile());
    }
  }, [dispatch, isAuthenticated]);

  // Initialize accessibility features
  useEffect(() => {
    // Set document language
    document.documentElement.lang = 'de';
    
    // Add page title prefix
    const originalTitle = document.title;
    if (!originalTitle.includes('SkillSwap')) {
      document.title = `SkillSwap - ${originalTitle}`;
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SkipLinks />
      <NetworkStatusIndicator position="top" compact />
      <MainLayout onToggleTheme={toggleTheme} darkMode={mode === 'dark'}>
        <Outlet />
      </MainLayout>
    </ThemeProvider>
  );
};

export default App;

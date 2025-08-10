import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import { clearError } from './features/auth/authSlice';
import { useAppDispatch } from './store/store.hooks';
import SkipLinks from './components/accessibility/SkipLinks';
import NetworkStatusIndicator from './components/error/NetworkStatusIndicator';
import { useRouteAnnouncements } from './hooks/useRouteAnnouncements';
import './utils/debugHelpers'; // Enable debug helpers
import AuthProvider from './features/auth/AuthProvider';
import { TwoFactorDialogProvider } from './components/auth/TwoFactorDialog';
import { PermissionProvider } from './contexts/PermissionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { withDefault } from './utils/safeAccess';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary';
import GlobalLoadingIndicator from './components/common/GlobalLoadingIndicator';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const { mode, theme, toggleTheme } = useTheme();
  const dispatch = useAppDispatch();
  
  // Enable route announcements for accessibility
  useRouteAnnouncements();

  // Clear any stale errors on app startup
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);
  
  // Initialize accessibility features
  useEffect(() => {
    // Set document language
    document.documentElement.lang = 'de';
    
    // Add page title prefix with null safety
    const originalTitle = withDefault(document.title, '');
    if (originalTitle && !originalTitle?.includes('SkillSwap')) {
      document.title = `SkillSwap - ${originalTitle}`;
    }
  }, []);

  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <LoadingProvider>
          <PermissionProvider>
            <ThemeProvider theme={theme}>
              <TwoFactorDialogProvider>
                <CssBaseline />
                <SkipLinks />
                <GlobalLoadingIndicator position="top" />
                <NetworkStatusIndicator position="top" compact />
                <MainLayout onToggleTheme={toggleTheme} darkMode={mode === 'dark'}>
                  <Outlet />
                </MainLayout>
                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme={mode === 'dark' ? 'dark' : 'light'}
                />
              </TwoFactorDialogProvider>
            </ThemeProvider>
          </PermissionProvider>
        </LoadingProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
};

export default App;

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import SkipLinks from './components/accessibility/SkipLinks';
import NetworkStatusIndicator from './components/error/NetworkStatusIndicator';
import AuthProvider from './features/auth/AuthProvider';
import { TwoFactorDialogProvider } from './components/auth/TwoFactorDialog';
import { PermissionProvider } from './contexts/PermissionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { EmailVerificationProvider } from './contexts/EmailVerificationContext';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary';
import GlobalLoadingIndicator from './components/common/GlobalLoadingIndicator';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { withDefault } from './utils/safeAccess';
import PerformanceDashboard from './components/dev/PerformanceDashboard';
import { usePerformance } from './hooks/usePerformance';

if (import.meta.env.DEV) {
  void import('./utils/debugHelpers');
}

const App = memo(() => {
  const themeData = useTheme();
  const { mode, theme, toggleTheme } = themeData;
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(process.env.NODE_ENV === 'development');

  // ✅ DISABLED - Performance tracking to prevent infinite loops
  const stablePerformanceProps = useMemo(() => ({ mode, themeMode: mode }), [mode]);
  usePerformance('App', stablePerformanceProps);
  
  const togglePerformanceDashboard = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      setShowPerformanceDashboard(prev => !prev);
    }
  }, []);
  
  // ✅ FIXED - PREVENTING INFINITE LOOPS! Removed dispatch(clearError()) call
  useEffect(() => {
    let frameCount = 0;
    const scheduleWork = () => {
      requestAnimationFrame(() => {
        frameCount++;
        
        if (frameCount === 1) {
          document.documentElement.lang = 'de';
        } else if (frameCount === 2) {
          const originalTitle = withDefault(document.title, '');
          if (originalTitle && !originalTitle?.includes('SkillSwap')) {
            document.title = `SkillSwap - ${originalTitle}`;
          }
        }
        // ✅ REMOVED: dispatch(clearError()) - was causing infinite loops
        
        if (frameCount < 2) { // Changed from 3 to 2
          scheduleWork(); // Continue to next frame
        }
      });
    };
    
    scheduleWork();
  }, []);
  
  // TEMPORARY DISABLE - PREVENTING INFINITE LOOPS!
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P to toggle performance dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceDashboard();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePerformanceDashboard]);

  return (
    <GlobalErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <LoadingProvider>
            <PermissionProvider>
              <EmailVerificationProvider>
                <TwoFactorDialogProvider>
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
              </EmailVerificationProvider>
            </PermissionProvider>
          </LoadingProvider>
        </AuthProvider>
        
        {/* ✅ DISABLED - Performance Dashboard - Development Only (causing infinite loops) */}
        {process.env.NODE_ENV === 'development' && (
          <PerformanceDashboard visible={showPerformanceDashboard} />
        )}
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = 'App';

export default App;

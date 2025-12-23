import { memo, useCallback, useEffect, lazy, Suspense, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { authEvents } from './core/api/apiClient';
import { EmailVerificationProvider } from './core/contexts/EmailVerificationContext';
import { LoadingProvider } from './core/contexts/LoadingContext';
import { PermissionProvider } from './core/contexts/PermissionContext';
import { StreamProvider } from './core/contexts/StreamContext';
import { ToastProvider } from './core/contexts/ToastContext';
import AuthProvider from './features/auth/AuthProvider';
import { TwoFactorDialogProvider } from './features/auth/components/TwoFactorDialog';
import SkipLinks from './shared/components/accessibility/SkipLinks';
import GlobalLoadingIndicator from './shared/components/common/GlobalLoadingIndicator';
import GlobalErrorBoundary from './shared/components/error/GlobalErrorBoundary';
import NetworkStatusIndicator from './shared/components/error/NetworkStatusIndicator';
import MainLayout from './shared/components/layout/MainLayout';
import { useThemeMode } from './shared/hooks/useTheme';
import 'react-toastify/dist/ReactToastify.css';

const PerformanceDashboard = lazy(() => import('./shared/components/dev/PerformanceDashboard'));

const App = memo(() => {
  const { mode, theme, toggleTheme } = useThemeMode();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    authEvents.onAuthFailure = () => {
      void navigate('/auth/login');
    };
    return () => {
      authEvents.onAuthFailure = null;
    };
  }, [navigate]);

  useEffect(() => {
    // Set language attribute for accessibility
    document.documentElement.lang = 'de';

    // Set document title if not already set
    if (!document.title.includes('SkillSwap')) {
      document.title = document.title ? `SkillSwap - ${document.title}` : 'SkillSwap';
    }
  }, []);

  const togglePerformanceDashboard = useCallback(() => {
    setShowPerformanceDashboard((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Ctrl+Shift+P to toggle performance dashboard
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePerformanceDashboard]);

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <GlobalErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <LoadingProvider>
            <PermissionProvider>
              <StreamProvider>
                <EmailVerificationProvider>
                  <ToastProvider>
                    <TwoFactorDialogProvider>
                      {/* Accessibility */}
                      <SkipLinks />

                      {/* Global UI Indicators */}
                      <GlobalLoadingIndicator position="top" />
                      <NetworkStatusIndicator position="top" compact />

                      {/* Main Application Layout */}
                      <MainLayout onToggleTheme={toggleTheme} darkMode={mode === 'dark'}>
                        <Outlet />
                      </MainLayout>

                      {/* Toast Notifications */}
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
                        limit={5}
                      />
                    </TwoFactorDialogProvider>
                  </ToastProvider>
                </EmailVerificationProvider>
              </StreamProvider>
            </PermissionProvider>
          </LoadingProvider>
        </AuthProvider>
        {/* Development-only Performance Dashboard */}
        // Optimierung: Suspense Boundary für Performance Dashboard
        {import.meta.env.DEV && showPerformanceDashboard ? (
          <Suspense
            fallback={
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.8)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Loading Performance Dashboard...
              </div>
            }
          >
            <PerformanceDashboard visible={showPerformanceDashboard} />
          </Suspense>
        ) : null}
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = 'App';

export default App;

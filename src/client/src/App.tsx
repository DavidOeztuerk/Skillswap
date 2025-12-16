import { memo, useCallback, useEffect, lazy, Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useThemeMode } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import SkipLinks from './components/accessibility/SkipLinks';
import NetworkStatusIndicator from './components/error/NetworkStatusIndicator';
import GlobalErrorBoundary from './components/error/GlobalErrorBoundary';
import GlobalLoadingIndicator from './components/common/GlobalLoadingIndicator';
import AuthProvider from './features/auth/AuthProvider';
import { TwoFactorDialogProvider } from './components/auth/TwoFactorDialog';
import { PermissionProvider } from './contexts/PermissionContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { EmailVerificationProvider } from './contexts/EmailVerificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { StreamProvider } from './contexts/StreamContext';

// ============================================================================
// Lazy-loaded Development Tools
// ============================================================================

const PerformanceDashboard = lazy(() => import('./components/dev/PerformanceDashboard'));

// ============================================================================
// App Component
// ============================================================================

const App = memo(() => {
  const { mode, theme, toggleTheme } = useThemeMode();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

  // =========================================================================
  // Document Setup - Run once on mount
  // =========================================================================
  useEffect(() => {
    // Set language attribute for accessibility
    document.documentElement.lang = 'de';

    // Set document title if not already set
    if (!document.title.includes('SkillSwap')) {
      document.title = document.title ? `SkillSwap - ${document.title}` : 'SkillSwap';
    }
  }, []);

  // =========================================================================
  // Performance Dashboard Toggle (Development Only)
  // =========================================================================
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
        {import.meta.env.DEV && showPerformanceDashboard && (
          <Suspense fallback={null}>
            <PerformanceDashboard visible={showPerformanceDashboard} />
          </Suspense>
        )}
      </ThemeProvider>
    </GlobalErrorBoundary>
  );
});

App.displayName = 'App';

export default App;

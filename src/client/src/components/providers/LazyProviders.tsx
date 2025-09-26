import React, { useState, useEffect, Suspense, memo } from 'react';
import { ThemeProvider } from '@mui/material';
import LoadingSpinner from '../ui/LoadingSpinner';

// Lazy loaded providers to improve initial startup time
const AuthProvider = React.lazy(() => import('../../features/auth/AuthProvider'));
const TwoFactorDialogProvider = React.lazy(() => 
  import('../auth/TwoFactorDialog').then(m => ({ default: m.TwoFactorDialogProvider }))
);
const PermissionProvider = React.lazy(() => 
  import('../../contexts/PermissionContext').then(m => ({ default: m.PermissionProvider }))
);
const LoadingProvider = React.lazy(() => 
  import('../../contexts/LoadingContext').then(m => ({ default: m.LoadingProvider }))
);
const EmailVerificationProvider = React.lazy(() => 
  import('../../contexts/EmailVerificationContext').then(m => ({ default: m.EmailVerificationProvider }))
);

interface LazyProvidersProps {
  children: React.ReactNode;
  theme: any;
}

// Progressive loading of providers to avoid 333ms initial render
const LazyProviders: React.FC<LazyProvidersProps> = memo(({ children, theme }) => {
  const [loadStage, setLoadStage] = useState(0);
  
  useEffect(() => {
    // PERFORMANCE CRITICAL: Aggressive progressive loading to reduce startup time
    const stages = [
      () => setLoadStage(1), // Load AuthProvider
      () => setLoadStage(2), // Load LoadingProvider  
      () => setLoadStage(3), // Load PermissionProvider
      () => setLoadStage(4), // Load remaining providers
    ];
    
    let currentStage = 0;
    const loadNext = () => {
      if (currentStage < stages.length) {
        stages[currentStage]();
        currentStage++;
        // Immediate loading for startup optimization
        if (currentStage < stages.length) {
          // Use scheduler for non-blocking updates
          requestAnimationFrame(loadNext);
        }
      }
    };
    
    // Start loading immediately
    requestAnimationFrame(loadNext);
  }, []);

  // Minimal loading state during progressive initialization
  if (loadStage === 0) {
    return (
      <ThemeProvider theme={theme}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '14px',
          color: theme.palette.text.secondary
        }}>
          Initializing...
        </div>
      </ThemeProvider>
    );
  }

  return (
    <Suspense fallback={
      <ThemeProvider theme={theme}>
        <LoadingSpinner />
      </ThemeProvider>
    }>
      <ThemeProvider theme={theme}>
        {loadStage >= 1 && (
          <AuthProvider>
            {loadStage >= 2 && (
              <Suspense fallback={<LoadingSpinner />}>
                <LoadingProvider>
                  {loadStage >= 3 && (
                    <Suspense fallback={<LoadingSpinner />}>
                      <PermissionProvider>
                        {loadStage >= 4 && (
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailVerificationProvider>
                              <TwoFactorDialogProvider>
                                {children}
                              </TwoFactorDialogProvider>
                            </EmailVerificationProvider>
                          </Suspense>
                        )}
                      </PermissionProvider>
                    </Suspense>
                  )}
                </LoadingProvider>
              </Suspense>
            )}
          </AuthProvider>
        )}
      </ThemeProvider>
    </Suspense>
  );
});

LazyProviders.displayName = 'LazyProviders';

export default LazyProviders;
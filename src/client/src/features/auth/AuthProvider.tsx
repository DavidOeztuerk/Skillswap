import React, { useEffect, useState, useRef, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import tokenRefreshService from '../../services/tokenRefreshService';
import { silentLogin } from './authThunks';
import { removeToken, getToken } from '../../utils/authHelpers';

interface AuthProviderProps {
  children: React.ReactNode;
}

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_AUTH === 'true';

/**
 * AuthProvider - Handles authentication initialization and token refresh
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Ref to track previous auth state for token refresh service
  const prevAuthStateRef = useRef<boolean | null>(null);

  // =========================================================================
  // Authentication Initialization - Einmalig beim Mount
  // =========================================================================
  useEffect(() => {
    // Track if this effect instance is still active
    let isActive = true;

    const initializeAuth = async (): Promise<void> => {
      if (DEBUG) console.debug('🔐 AuthProvider: Starting initialization...');

      const storedToken = getToken();

      if (!storedToken) {
        if (DEBUG) console.debug('ℹ️ AuthProvider: No stored token found');
        if (isActive) {
          setInitializationComplete(true);
        }
        return;
      }

      try {
        if (DEBUG) console.debug('🔄 AuthProvider: Token found, attempting silent login...');
        const result = await dispatch(silentLogin());

        if (!isActive) return; // Component unmounted during async operation

        if (result.meta.requestStatus === 'fulfilled') {
          if (DEBUG) console.debug('✅ AuthProvider: Silent login successful');
        } else {
          if (DEBUG)
            console.debug(
              '⚠️ AuthProvider: Silent login failed:',
              result.payload ?? 'Unknown error'
            );
          removeToken();
        }
      } catch (error: unknown) {
        if (!isActive) return; // Component unmounted during async operation

        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ AuthProvider: Silent login exception:', errorMessage);
        removeToken();
      } finally {
        if (isActive) {
          setInitializationComplete(true);
          if (DEBUG) console.debug('✅ AuthProvider: Initialization complete');
        }
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
      tokenRefreshService.stop();
      if (DEBUG) console.debug('🧹 AuthProvider: Cleanup completed');
    };
  }, [dispatch]); // dispatch is stable from Redux

  // =========================================================================
  // Token Refresh Service Management
  // =========================================================================
  useEffect(() => {
    // Only react to actual state changes, not initial render
    if (!initializationComplete) return;
    if (prevAuthStateRef.current === isAuthenticated) return;

    prevAuthStateRef.current = isAuthenticated;

    if (isAuthenticated) {
      if (DEBUG) console.debug('🔑 AuthProvider: Starting token refresh service');
      tokenRefreshService.start();
    } else {
      if (DEBUG) console.debug('🔒 AuthProvider: Stopping token refresh service');
      tokenRefreshService.stop();
    }
  }, [isAuthenticated, initializationComplete]);

  // =========================================================================
  // Render
  // =========================================================================
  if (!initializationComplete) {
    return <LoadingSpinner fullPage message="Anwendung wird initialisiert..." />;
  }

  return <>{children}</>;
};

export default memo(AuthProvider);

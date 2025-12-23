import React, { useEffect, useState, useRef, memo } from 'react';
import tokenRefreshService from '../../core/services/tokenRefreshService';
import { useAppDispatch, useAppSelector } from '../../core/store/store.hooks';
import LoadingSpinner from '../../shared/components/ui/LoadingSpinner';
import { getToken, removeToken } from '../../shared/utils/authHelpers';
import { silentLogin } from './store/authThunks';

interface AuthProviderProps {
  children: React.ReactNode;
}

const DEBUG = import.meta.env.DEV && import.meta.env.VITE_VERBOSE_AUTH === 'true';

/** Debug logger that only logs in development with verbose auth enabled */
function debugLog(message: string, ...args: unknown[]): void {
  if (DEBUG) console.debug(message, ...args);
}

/**
 * AuthProvider - Handles authentication initialization and token refresh
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);
  const prevAuthStateRef = useRef<boolean | null>(null);

  useEffect(() => {
    let isActive = true;

    const initializeAuth = async (): Promise<void> => {
      debugLog('🔐 AuthProvider: Starting initialization...');

      const storedToken = getToken();

      if (!storedToken) {
        debugLog('ℹ️ AuthProvider: No stored token found');
        if (isActive) setInitializationComplete(true);
        return;
      }

      try {
        debugLog('🔄 AuthProvider: Token found, attempting silent login...');
        const result = await dispatch(silentLogin());

        if (!isActive) return;

        if (result.meta.requestStatus === 'fulfilled') {
          debugLog('✅ AuthProvider: Silent login successful');
        } else {
          debugLog('⚠️ AuthProvider: Silent login failed:', result.payload ?? 'Unknown error');
          removeToken();
        }
      } catch (error: unknown) {
        if (!isActive) return;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ AuthProvider: Silent login exception:', errorMessage);
        removeToken();
      } finally {
        if (isActive) {
          setInitializationComplete(true);
          debugLog('✅ AuthProvider: Initialization complete');
        }
      }
    };

    void initializeAuth();

    return () => {
      isActive = false;
      tokenRefreshService.stop();
      debugLog('🧹 AuthProvider: Cleanup completed');
    };
  }, [dispatch]);

  useEffect(() => {
    if (!initializationComplete || prevAuthStateRef.current === isAuthenticated) return;

    prevAuthStateRef.current = isAuthenticated;

    if (isAuthenticated) {
      debugLog('🔑 AuthProvider: Starting token refresh service');
      tokenRefreshService.start();
    } else {
      debugLog('🔒 AuthProvider: Stopping token refresh service');
      tokenRefreshService.stop();
    }
  }, [isAuthenticated, initializationComplete]);

  if (!initializationComplete) {
    return <LoadingSpinner fullPage message="Anwendung wird initialisiert..." />;
  }

  return <>{children}</>;
};

export default memo(AuthProvider);

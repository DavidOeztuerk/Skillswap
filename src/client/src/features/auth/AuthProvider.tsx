import React, { useEffect, useState, memo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import tokenRefreshService from '../../services/tokenRefreshService';
import { silentLogin } from './authThunks';
import { removeToken, getToken } from '../../utils/authHelpers';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Handles authentication initialization and token refresh
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // =========================================================================
  // Authentication Initialization - Einmalig beim Mount
  // =========================================================================
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: Starting initialization...');

      const storedToken = getToken();

      if (!storedToken) {
        console.log('ℹ️ AuthProvider: No stored token found');
        if (mounted) {
          setInitializationComplete(true);
        }
        return;
      }

      try {
        console.log('🔄 AuthProvider: Token found, attempting silent login...');
        const result = await dispatch(silentLogin());

        if (result.meta.requestStatus === 'fulfilled') {
          console.log('✅ AuthProvider: Silent login successful');
        } else {
          console.log('⚠️ AuthProvider: Silent login failed:', result.payload || 'Unknown error');
          removeToken();
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ AuthProvider: Silent login exception:', errorMessage);
        removeToken();
      } finally {
        if (mounted) {
          setInitializationComplete(true);
          console.log('✅ AuthProvider: Initialization complete');
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      tokenRefreshService.stop();
      console.log('🧹 AuthProvider: Cleanup completed');
    };
  }, [dispatch]); // dispatch ist stabil, also sollte dieser Effect nur einmal laufen

  // =========================================================================
  // Token Refresh Service Management
  // =========================================================================
  useEffect(() => {
    if (initializationComplete) {
      if (isAuthenticated) {
        console.log('🔑 AuthProvider: Starting token refresh service');
        tokenRefreshService.start();
      } else {
        console.log('🔒 AuthProvider: Stopping token refresh service');
        tokenRefreshService.stop();
      }
    }
  }, [isAuthenticated, initializationComplete]);

  // =========================================================================
  // Render
  // =========================================================================
  if (!initializationComplete) {
    return (
      <LoadingSpinner
        fullPage
        message="Anwendung wird initialisiert..."
      />
    );
  }

  return <>{children}</>;
};

export default memo(AuthProvider);
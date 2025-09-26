import React, { useEffect, useState, memo, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import tokenRefreshService from '../../services/tokenRefreshService';
import { silentLogin } from './authThunks';
import { isTokenExpired, removeToken } from '../../utils/authHelpers';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);
  
  // ✅ STABLE REFS - prevent infinite loops
  const initializationStartedRef = useRef(false);
  const mountedRef = useRef(true);

  // ✅ ROBUST INITIALIZATION FUNCTION
  const initializeAuth = useCallback(async () => {
    // Prevent multiple initializations
    if (initializationStartedRef.current) {
      console.log('⚠️ AuthProvider: Initialization already started, skipping...');
      return;
    }
    initializationStartedRef.current = true;

    console.log('🔐 AuthProvider: Starting secure initialization...');

    // Check for stored token before trying silent login
    const storedToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    
    if (!storedToken?.trim()) {
      console.log('ℹ️ AuthProvider: No stored token found, skipping silent login');
      if (mountedRef.current) {
        setInitializationComplete(true);
      }
      return;
    }

    // ✅ Check if token is expired before attempting silent login
    if (isTokenExpired(storedToken)) {
      console.log('⚠️ AuthProvider: Stored token is expired, clearing and skipping silent login');
      removeToken(); // Use helper to clean all token storage
      if (mountedRef.current) {
        setInitializationComplete(true);
      }
      return;
    }

    try {
      console.log('🔄 AuthProvider: Token valid, attempting silent login...');
      
      // Try silent login - this will validate token and load user data
      const result = await dispatch(silentLogin());
      
      if (result.meta.requestStatus === 'fulfilled') {
        console.log('✅ AuthProvider: Silent login successful, user authenticated');
      } else {
        console.log('⚠️ AuthProvider: Silent login rejected:', result.payload || 'Unknown error');
        // Clear invalid tokens using helper
        removeToken();
        console.log('🧹 AuthProvider: Cleared invalid tokens from storage');
      }
      
    } catch (error: any) {
      console.error('❌ AuthProvider: Silent login failed with exception:', error?.message || error);
      // Clear invalid tokens on exception using helper
      removeToken();
      console.log('🧹 AuthProvider: Cleared invalid tokens after exception');
    } finally {
      // ✅ CRITICAL: ALWAYS set initialization complete, regardless of silent login success/failure
      if (mountedRef.current) {
        setInitializationComplete(true);
        console.log('✅ AuthProvider: Initialization complete (success or failure)');
      }
    }
  }, [dispatch]);

  useEffect(() => {
    initializeAuth();
    
    return () => {
      mountedRef.current = false;
    };
  }, [initializeAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔐 Starting token refresh service (user authenticated)');
      tokenRefreshService.start();
    } else {
      console.log('🔓 Stopping token refresh service (user not authenticated)');  
      tokenRefreshService.stop();
    }
    
    return () => {
      tokenRefreshService.stop();
    };
  }, [isAuthenticated]); // ✅ STABLE DEPENDENCY - only changes when auth status changes

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      tokenRefreshService.stop();
      console.log('🧹 AuthProvider: Cleanup completed');
    };
  }, []); // ✅ EMPTY DEPS - only on unmount

  // Show loading screen during initialization
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
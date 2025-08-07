import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { silentLogin } from '../../features/auth/authSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import tokenRefreshService from '../../services/tokenRefreshService';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Führt Silent Login beim App-Start durch
 * Zeigt Loading-Screen bis Authentication initialisiert ist
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Start/stop token refresh service based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔐 User authenticated, starting token refresh service');
      tokenRefreshService.start();
    } else {
      console.log('🔓 User not authenticated, stopping token refresh service');
      tokenRefreshService.stop();
    }
    
    // Cleanup on unmount
    return () => {
      tokenRefreshService.stop();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: Starting initialization...');

      // Check for stored token before trying silent login
      // Token is stored under 'access_token' key, not 'token'
      const storedToken = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      if (!storedToken) {
        console.log('ℹ️ AuthProvider: No stored token found, skipping silent login');
        if (mounted) {
          setInitializationComplete(true);
        }
        return;
      }

      try {
        console.log('🔄 AuthProvider: Attempting silent login...');
        await dispatch(silentLogin()).unwrap();
        console.log('✅ AuthProvider: Silent login successful');
        
        // Token refresh service will be started by the isAuthenticated effect
      } catch (error) {
        // Silent login failure ist normal wenn kein Token vorhanden
        console.log('ℹ️ AuthProvider: Silent login failed (expected if no token)');
      } finally {
        // Setze initialization complete nur wenn component noch mounted ist
        if (mounted) {
          setInitializationComplete(true);
          console.log('✅ AuthProvider: Initialization complete');
        }
      }
    };

    // Only run if not already initialized
    if (!initializationComplete) {
      initializeAuth();
    }
    
    // Cleanup
    return () => {
      mounted = false;
    };
  }, [dispatch, initializationComplete]); // Include necessary dependencies

  // Zeige Loading-Screen während der Initialisierung
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

export default AuthProvider;
import React, { useEffect, useState } from 'react';
import { useAppDispatch } from '../../store/store.hooks';
import { silentLogin } from '../../features/auth/authSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider - Führt Silent Login beim App-Start durch
 * Zeigt Loading-Screen bis Authentication initialisiert ist
 */
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      console.log('🔐 AuthProvider: Starting initialization...');

      // Check for stored token before trying silent login
      const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      
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
// src/components/auth/AuthProvider.tsx
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { silentLogin, setLoading } from '../../features/auth/authSlice';
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
  const { isLoading } = useAppSelector(state => state.auth);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Verhindere mehrfache Initialisierung
      if (initializationComplete) return;

      console.log('🔐 Initializing authentication...');
      dispatch(setLoading(true));

      try {
        // Versuche Silent Login
        await dispatch(silentLogin()).unwrap();
        console.log('✅ Silent login successful');
      } catch (error) {
        console.log('ℹ️ Silent login failed (normal if no token):', error);
        // Das ist normal, wenn kein Token vorhanden ist
      } finally {
        dispatch(setLoading(false));
        setInitializationComplete(true);
        console.log('🔐 Authentication initialization complete');
      }
    };

    initializeAuth();
  }, [dispatch, initializationComplete]);

  // Zeige Loading-Screen während der Initialisierung
  if (!initializationComplete || isLoading) {
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
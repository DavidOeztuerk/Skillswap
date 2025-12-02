import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  /** Check if a specific operation is loading */
  isLoading: (key?: string) => boolean;
  /** Start loading for a specific operation */
  startLoading: (key: string) => void;
  /** Stop loading for a specific operation */
  stopLoading: (key: string) => void;
  /** Execute an async operation with automatic loading state */
  withLoading: <T>(key: string, operation: () => Promise<T>) => Promise<T>;
  /** Get all loading states (for debugging) */
  getLoadingStates: () => LoadingState;
  /** Check if anything is loading */
  isAnyLoading: () => boolean;
  /** Clear all loading states */
  clearAllLoading: () => void;
}

// ============================================================================
// Context
// ============================================================================

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  
  // Track nested loading calls (for operations that might overlap)
  const loadingCountRef = useRef<Record<string, number>>({});

  const startLoading = useCallback((key: string) => {
    // Increment count for nested operations
    loadingCountRef.current[key] = (loadingCountRef.current[key] || 0) + 1;

    setLoadingStates(prev => {
      // Only update if not already loading
      if (prev[key]) return prev;
      return { ...prev, [key]: true };
    });
  }, []);

  const stopLoading = useCallback((key: string) => {
    // Decrement count
    if (loadingCountRef.current[key]) {
      loadingCountRef.current[key]--;

      // Only stop when count reaches 0
      if (loadingCountRef.current[key] === 0) {
        delete loadingCountRef.current[key];
        setLoadingStates(prev => {
          if (!prev[key]) return prev;
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
      }
    }
  }, []);

  const isLoading = useCallback((key?: string): boolean => {
    if (key) {
      return !!loadingStates[key];
    }
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const withLoading = useCallback(async <T,>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    startLoading(key);
    try {
      return await operation();
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const getLoadingStates = useCallback((): LoadingState => {
    return { ...loadingStates };
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    loadingCountRef.current = {};
  }, []);

  // Memoize value to prevent unnecessary re-renders
  // Functions are stable due to useCallback
  const value = useMemo<LoadingContextType>(() => ({
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    getLoadingStates,
    isAnyLoading,
    clearAllLoading,
  }), [isLoading, startLoading, stopLoading, withLoading, getLoadingStates, isAnyLoading, clearAllLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// ============================================================================
// Hooks
// ============================================================================

/** Main hook to access loading context */
export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

/** Hook for component-specific loading with namespaced keys */
export const useComponentLoading = (componentName: string) => {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

  return useMemo(() => ({
    isLoading: (operation?: string) =>
      isLoading(operation ? `${componentName}.${operation}` : componentName),
    startLoading: (operation: string) =>
      startLoading(`${componentName}.${operation}`),
    stopLoading: (operation: string) =>
      stopLoading(`${componentName}.${operation}`),
    withLoading: <T,>(operation: string, fn: () => Promise<T>) =>
      withLoading(`${componentName}.${operation}`, fn),
  }), [componentName, isLoading, startLoading, stopLoading, withLoading]);
};

// ============================================================================
// Loading Keys Constants
// ============================================================================

export const LoadingKeys = {
  // Auth operations
  LOGIN: 'auth.login',
  REGISTER: 'auth.register',
  LOGOUT: 'auth.logout',
  REFRESH_TOKEN: 'auth.refreshToken',
  VERIFY_EMAIL: 'auth.verifyEmail',
  RESET_PASSWORD: 'auth.resetPassword',

  // User operations
  FETCH_PROFILE: 'user.fetchProfile',
  UPDATE_PROFILE: 'user.updateProfile',
  UPLOAD_AVATAR: 'user.uploadAvatar',

  // Skill operations
  FETCH_SKILLS: 'skills.fetch',
  CREATE_SKILL: 'skills.create',
  UPDATE_SKILL: 'skills.update',
  DELETE_SKILL: 'skills.delete',
  SEARCH_SKILLS: 'skills.search',

  // Matching operations
  FETCH_MATCHES: 'matches.fetch',
  CREATE_MATCH: 'matches.create',
  ACCEPT_MATCH: 'matches.accept',
  REJECT_MATCH: 'matches.reject',

  // Appointment operations
  FETCH_APPOINTMENTS: 'appointments.fetch',
  CREATE_APPOINTMENT: 'appointments.create',
  UPDATE_APPOINTMENT: 'appointments.update',
  CANCEL_APPOINTMENT: 'appointments.cancel',

  // Video call operations
  VIDEO_CALL_INIT: 'videocall.init',
  VIDEO_CALL_JOIN: 'videocall.join',
  VIDEO_CALL_LEAVE: 'videocall.leave',

  // Admin operations
  FETCH_USERS: 'admin.fetchUsers',
  UPDATE_USER: 'admin.updateUser',
  DELETE_USER: 'admin.deleteUser',
  FETCH_STATS: 'admin.fetchStats',

  // General operations
  FETCH_DATA: 'general.fetchData',
  SUBMIT_FORM: 'general.submitForm',
  SEARCH: 'general.search',
  PAGINATION: 'general.pagination',
} as const;

export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys];

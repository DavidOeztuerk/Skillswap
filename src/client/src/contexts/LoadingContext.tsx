import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  // Check if a specific operation is loading
  isLoading: (key?: string) => boolean;
  // Start loading for a specific operation
  startLoading: (key: string) => void;
  // Stop loading for a specific operation
  stopLoading: (key: string) => void;
  // Execute an async operation with automatic loading state
  withLoading: <T>(key: string, operation: () => Promise<T>) => Promise<T>;
  // Get all loading states
  getLoadingStates: () => LoadingState;
  // Check if anything is loading
  isAnyLoading: () => boolean;
  // Clear all loading states
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const loadingCountRef = useRef<{ [key: string]: number }>({});

  const startLoading = useCallback((key: string) => {
    // Track loading count for nested operations
    loadingCountRef.current[key] = (loadingCountRef.current[key] || 0) + 1;
    
    setLoadingStates(prev => ({
      ...prev,
      [key]: true
    }));
  }, []);

  const stopLoading = useCallback((key: string) => {
    // Decrement loading count
    if (loadingCountRef.current[key]) {
      loadingCountRef.current[key]--;
      
      // Only stop loading when count reaches 0
      if (loadingCountRef.current[key] === 0) {
        setLoadingStates(prev => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        delete loadingCountRef.current[key];
      }
    }
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    // If no key provided, check if anything is loading
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const withLoading = useCallback(async <T,>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    startLoading(key);
    try {
      const result = await operation();
      return result;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  const getLoadingStates = useCallback(() => {
    return { ...loadingStates };
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.keys(loadingStates).length > 0;
  }, [loadingStates]);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
    loadingCountRef.current = {};
  }, []);

  const value: LoadingContextType = {
    isLoading,
    startLoading,
    stopLoading,
    withLoading,
    getLoadingStates,
    isAnyLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook to use loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Hook for component-specific loading
export const useComponentLoading = (componentName: string) => {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();

  return {
    isLoading: (operation?: string) => 
      isLoading(operation ? `${componentName}.${operation}` : componentName),
    startLoading: (operation: string) => 
      startLoading(`${componentName}.${operation}`),
    stopLoading: (operation: string) => 
      stopLoading(`${componentName}.${operation}`),
    withLoading: <T,>(operation: string, fn: () => Promise<T>) =>
      withLoading(`${componentName}.${operation}`, fn),
  };
};

// Loading keys constants for consistency
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
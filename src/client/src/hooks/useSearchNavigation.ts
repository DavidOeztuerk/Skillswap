import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ensureArray, ensureString, withDefault } from '../utils/safeAccess';

interface SearchState {
  isOpen: boolean;
  query: string;
  isSearching: boolean;
  results: any[];
  recentSearches: string[];
}

/**
 * Hook for managing search navigation and state across desktop/mobile
 */
export const useSearchNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const getRecentSearches = (): string[] => {
    try {
      const stored = localStorage.getItem('recentSearches');
      return ensureArray(stored ? JSON.parse(stored) : []);
    } catch {
      return [];
    }
  };

  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    query: ensureString(searchParams.get('q')),
    isSearching: false,
    results: [],
    recentSearches: getRecentSearches(),
  });

  // Sync query with URL params - optimized to prevent unnecessary re-renders
  useEffect(() => {
    const urlQuery = ensureString(searchParams.get('q'));
    if (urlQuery !== searchState.query) {
      setSearchState(prev => ({
        ...prev,
        query: urlQuery,
      }));
    }
  }, [searchParams]); // Removed searchState.query from dependencies to prevent infinite loops

  // Open search overlay
  const openSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      isOpen: true,
    }));
  }, []);

  // Close search overlay
  const closeSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Update search query
  const updateQuery = useCallback((query: string) => {
    setSearchState(prev => ({
      ...prev,
      query: ensureString(query),
    }));
  }, []);

  // Perform search
  const performSearch = useCallback((query: string, options?: { 
    navigateToResults?: boolean;
    addToRecent?: boolean;
  }) => {
    const safeQuery = ensureString(query);
    const { navigateToResults = true, addToRecent = true } = options || {};
    
    setSearchState(prev => ({
      ...prev,
      isSearching: true,
      query: safeQuery,
    }));

    // Add to recent searches with error handling
    if (addToRecent && safeQuery.trim()) {
      try {
        const stored = localStorage.getItem('recentSearches');
        const currentRecentSearches = ensureArray(stored ? JSON.parse(stored) : []);
        const newRecentSearches = [
          safeQuery,
          ...currentRecentSearches.filter((s: string) => s !== safeQuery)
        ].slice(0, 10); // Keep last 10 searches
        
        localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));
        
        setSearchState(prev => ({
          ...prev,
          recentSearches: newRecentSearches,
        }));
      } catch (error) {
        console.warn('Failed to save recent searches:', error);
      }
    }

    // Navigate to search results with query parameter
    if (navigateToResults) {
      const currentPath = location.pathname;
      const searchPath = '/search';
      
      if (currentPath !== searchPath) {
        navigate(`${searchPath}?q=${encodeURIComponent(safeQuery)}`);
      } else {
        // Update search params if already on search page
        setSearchParams({ q: safeQuery });
      }
    }

    // Simulate search completion with cleanup
    const searchTimer = setTimeout(() => {
      setSearchState(prev => ({
        ...prev,
        isSearching: false,
      }));
    }, 500);
    
    // Return cleanup function for component unmount
    return () => clearTimeout(searchTimer);
  }, [navigate, location.pathname, setSearchParams]); // Removed searchState.recentSearches to optimize dependencies

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
    }));
    
    // Clear URL params if on search page
    if (location.pathname === '/search') {
      setSearchParams({});
    }
  }, [location.pathname, setSearchParams]);

  // Handle browser back/forward navigation with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handlePopState = () => {
      // Throttle popstate events to prevent excessive state updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const urlQuery = ensureString(searchParams.get('q'));
        setSearchState(prev => ({
          ...prev,
          query: urlQuery,
        }));
      }, 100);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      clearTimeout(timeoutId);
    };
  }, [searchParams]);

  // Handle Escape key to close search
  useEffect(() => {
    if (!searchState.isOpen) return;
    
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Inline close logic to avoid function dependency
        setSearchState(prev => ({
          ...prev,
          isOpen: false,
        }));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [searchState.isOpen]); // Nur isOpen als Dependency

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
    setSearchState(prev => ({
      ...prev,
      recentSearches: [],
    }));
  }, []);

  return {
    isOpen: withDefault(searchState.isOpen, false),
    query: ensureString(searchState.query),
    isSearching: withDefault(searchState.isSearching, false),
    results: ensureArray(searchState.results),
    recentSearches: ensureArray(searchState.recentSearches),
    openSearch,
    closeSearch,
    updateQuery,
    performSearch,
    clearSearch,
    clearRecentSearches,
  };
};

export default useSearchNavigation;
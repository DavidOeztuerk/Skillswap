import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { withDefault } from '../utils/safeAccess';

interface SearchState {
  isOpen: boolean;
  query: string;
  isSearching: boolean;
  results: unknown[];
  recentSearches: string[];
}

interface UseSearchNavigationReturn {
  isOpen: boolean;
  query: string;
  isSearching: boolean;
  results: unknown[];
  recentSearches: string[];
  openSearch: () => void;
  closeSearch: () => void;
  updateQuery: (query: string) => void;
  performSearch: (
    query: string,
    options?: { navigateToResults?: boolean; addToRecent?: boolean }
  ) => () => void;
  clearSearch: () => void;
  clearRecentSearches: () => void;
}

/**
 * Hook for managing search navigation and state across desktop/mobile
 */
export const useSearchNavigation = (): UseSearchNavigationReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const getRecentSearches = (): string[] => {
    try {
      const stored = localStorage.getItem('recentSearches');
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  };

  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    query: searchParams.get('q') ?? '',
    isSearching: false,
    results: [],
    recentSearches: getRecentSearches(),
  });

  // Sync query with URL params using derived state
  // Convert to useMemo to avoid synchronous setState in effect
  const urlQuery = useMemo(() => searchParams.get('q') ?? '', [searchParams]);

  useEffect(() => {
    if (urlQuery !== searchState.query) {
      const timer = setTimeout(() => {
        setSearchState((prev) => ({
          ...prev,
          query: urlQuery,
        }));
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [urlQuery, searchState.query]);

  // Open search overlay
  const openSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      isOpen: true,
    }));
  }, []);

  // Close search overlay
  const closeSearch = useCallback(() => {
    setSearchState((prev) => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  // Update search query
  const updateQuery = useCallback((query: string) => {
    setSearchState((prev) => ({
      ...prev,
      query,
    }));
  }, []);

  // Perform search
  const performSearch = useCallback(
    (
      query: string,
      options?: {
        navigateToResults?: boolean;
        addToRecent?: boolean;
      }
    ) => {
      const safeQuery = query;
      const { navigateToResults = true, addToRecent = true } = options ?? {};

      setSearchState((prev) => ({
        ...prev,
        isSearching: true,
        query: safeQuery,
      }));

      // Add to recent searches with error handling
      if (addToRecent && safeQuery.trim()) {
        try {
          const stored = localStorage.getItem('recentSearches');
          const currentRecentSearches: string[] = stored ? (JSON.parse(stored) as string[]) : [];
          const newRecentSearches: string[] = [
            safeQuery,
            ...currentRecentSearches.filter((s) => s !== safeQuery),
          ].slice(0, 10); // Keep last 10 searches

          localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches));

          setSearchState((prev) => ({
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
          void Promise.resolve(navigate(`${searchPath}?q=${encodeURIComponent(safeQuery)}`));
        } else {
          // Update search params if already on search page
          setSearchParams({ q: safeQuery });
        }
      }

      // Simulate search completion with cleanup
      const searchTimer = setTimeout(() => {
        setSearchState((prev) => ({
          ...prev,
          isSearching: false,
        }));
      }, 500);

      // Return cleanup function for component unmount
      return () => {
        clearTimeout(searchTimer);
      };
    },
    [navigate, location.pathname, setSearchParams]
  ); // Removed searchState.recentSearches to optimize dependencies

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchState((prev) => ({
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

    const handlePopState = (): void => {
      // Throttle popstate events to prevent excessive state updates
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentUrlQuery = searchParams.get('q') ?? '';
        setSearchState((prev) => ({
          ...prev,
          query: currentUrlQuery,
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

    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        // Inline close logic to avoid function dependency
        setSearchState((prev) => ({
          ...prev,
          isOpen: false,
        }));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [searchState.isOpen]); // Nur isOpen als Dependency

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.warn('Failed to clear recent searches:', error);
    }
    setSearchState((prev) => ({
      ...prev,
      recentSearches: [],
    }));
  }, []);

  return {
    isOpen: withDefault(searchState.isOpen, false),
    query: searchState.query,
    isSearching: withDefault(searchState.isSearching, false),
    results: searchState.results,
    recentSearches: searchState.recentSearches,
    openSearch,
    closeSearch,
    updateQuery,
    performSearch,
    clearSearch,
    clearRecentSearches,
  };
};

export default useSearchNavigation;

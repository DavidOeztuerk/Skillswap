import { useState, useEffect, useCallback } from 'react';

interface UseProgressiveLoadingOptions<T> {
  loadFn: (page: number, pageSize: number, ...args: any[]) => Promise<{
    data: T[];
    totalCount: number;
    hasMore: boolean;
  }>;
  pageSize?: number;
  initialLoad?: boolean;
  deps?: any[];
}

interface UseProgressiveLoadingReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => void;
}

export function useProgressiveLoading<T>({
  loadFn,
  pageSize = 10,
  initialLoad = true,
  deps = [],
}: UseProgressiveLoadingOptions<T>): UseProgressiveLoadingReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const loadPage = useCallback(async (page: number, isLoadingMore = false) => {
    try {
      if (!isLoadingMore) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      setError(null);

      const result = await loadFn(page, pageSize, ...deps);
      
      if (page === 0) {
        setItems(result.data);
      } else {
        setItems(prev => [...prev, ...result.data]);
      }
      
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      setCurrentPage(page);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Daten';
      setError(errorMessage);
      console.error('Progressive loading error:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [loadFn, pageSize, ...deps]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    
    await loadPage(currentPage + 1, true);
  }, [hasMore, isLoading, isLoadingMore, currentPage, loadPage]);

  const refresh = useCallback(async () => {
    setCurrentPage(0);
    setHasMore(true);
    await loadPage(0, false);
  }, [loadPage]);

  const reset = useCallback(() => {
    setItems([]);
    setIsLoading(false);
    setIsLoadingMore(false);
    setHasMore(true);
    setError(null);
    setTotalCount(0);
    setCurrentPage(0);
  }, []);

  useEffect(() => {
    if (initialLoad) {
      loadPage(0, false);
    }
  }, [initialLoad, ...deps]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    totalCount,
    currentPage,
    loadMore,
    refresh,
    reset,
  };
}

export default useProgressiveLoading;
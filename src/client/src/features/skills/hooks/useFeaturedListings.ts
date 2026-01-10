import { useState, useCallback, useEffect } from 'react';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { listingService } from '../services/listingService';
import type { Listing } from '../types/Listing';

/**
 * Return type for useFeaturedListings hook
 */
interface UseFeaturedListingsReturn {
  featuredListings: Listing[];
  isLoading: boolean;
  error: string | null;
  fetchFeaturedListings: (fetchLimit?: number) => Promise<void>;
  refetch: (fetchLimit?: number) => Promise<void>;
}

/**
 * Hook for fetching featured listings for homepage (Phase 15)
 * Returns top listings sorted by boost status, rating, and popularity
 */
export const useFeaturedListings = (autoFetch = false, limit = 6): UseFeaturedListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedListings = useCallback(
    async (fetchLimit?: number): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await listingService.getFeaturedListings(fetchLimit ?? limit);
        if (isSuccessResponse(response)) {
          setListings(response.data);
        } else {
          setError(response.errors[0]);
          setListings([]);
        }
      } catch (err) {
        console.error('[useFeaturedListings] Error:', err);
        setError('Failed to load featured listings');
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [limit]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      void fetchFeaturedListings();
    }
  }, [autoFetch, fetchFeaturedListings]);

  return {
    featuredListings: listings,
    isLoading,
    error,
    fetchFeaturedListings,
    refetch: fetchFeaturedListings,
  };
};

export default useFeaturedListings;

import { useState, useEffect, useCallback, useMemo } from 'react';
import errorService from '../../../core/services/errorService';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import { listingService } from '../services/listingService';
import type { Listing } from '../types/Listing';

interface UseUserListingsReturn {
  // State
  listings: Listing[];
  isLoading: boolean;
  error: string | null;

  // Actions
  refreshListings: () => Promise<void>;
  findListingBySkillId: (skillId: string) => Listing | undefined;
  getOrCreateListingForSkill: (
    skillId: string,
    type: 'Offer' | 'Request'
  ) => Promise<Listing | null>;
  isSkillBoosted: (skillId: string) => boolean;

  // Computed
  hasListings: boolean;
}

/**
 * Hook for managing user's own listings
 * Used for boost functionality in "My Skills" view
 */
export const useUserListings = (enabled = true): UseUserListingsReturn => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async (): Promise<Listing[]> => {
    if (!enabled) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await listingService.getMyListings({ includeExpired: false });

      if (isSuccessResponse(response)) {
        setListings(response.data);
        return response.data;
      }
      const errorMessage = response.errors[0] ?? 'Failed to load listings';
      setError(errorMessage);
      errorService.addBreadcrumb('Failed to load user listings', 'error', { errorMessage });
      return [];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load listings';
      setError(errorMessage);
      errorService.addBreadcrumb('Error loading user listings', 'error', { err });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  // Find listing by skill ID
  const findListingBySkillId = useCallback(
    (skillId: string): Listing | undefined => listings.find((l) => l.skillId === skillId),
    [listings]
  );

  // Check if a skill is currently boosted
  const isSkillBoosted = useCallback(
    (skillId: string): boolean => {
      const listing = listings.find((l) => l.skillId === skillId);
      return listing?.isCurrentlyBoosted ?? false;
    },
    [listings]
  );

  // Get or create a listing for a skill (handles 409 gracefully)
  const getOrCreateListingForSkill = useCallback(
    async (skillId: string, type: 'Offer' | 'Request'): Promise<Listing | null> => {
      // First check local state
      let listing = listings.find((l) => l.skillId === skillId);
      if (listing) {
        return listing;
      }

      // Try to create - if 409, refresh and find
      try {
        const response = await listingService.createListing({ skillId, type });

        if (isSuccessResponse(response)) {
          // New listing created, refresh list and return it
          await fetchListings();
          return response.data;
        }

        // Check for 409 Conflict - listing already exists
        // Response will have error message about existing listing
        const errorMsg = response.errors[0] ?? '';
        if (errorMsg.toLowerCase().includes('already exists')) {
          // Refresh listings from server and find the existing one
          const freshListings = await fetchListings();
          listing = freshListings.find((l) => l.skillId === skillId);
          if (listing) {
            return listing;
          }
        }

        // Some other error
        errorService.addBreadcrumb('Failed to create listing', 'error', { error: errorMsg });
        return null;
      } catch (err: unknown) {
        errorService.addBreadcrumb('Error creating listing', 'error', { err });
        return null;
      }
    },
    [listings, fetchListings]
  );

  // Stable refresh function
  const refreshListings = useCallback(async (): Promise<void> => {
    await fetchListings();
  }, [fetchListings]);

  return useMemo(
    () => ({
      listings,
      isLoading,
      error,
      refreshListings,
      findListingBySkillId,
      getOrCreateListingForSkill,
      isSkillBoosted,
      hasListings: listings.length > 0,
    }),
    [
      listings,
      isLoading,
      error,
      refreshListings,
      findListingBySkillId,
      getOrCreateListingForSkill,
      isSkillBoosted,
    ]
  );
};

export default useUserListings;

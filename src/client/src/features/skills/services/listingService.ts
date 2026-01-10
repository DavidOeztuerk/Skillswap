import { apiClient } from '../../../core/api/apiClient';
import { LISTING_ENDPOINTS } from '../../../core/config/endpoints';
import type { PagedResponse, ApiResponse } from '../../../shared/types/api/UnifiedResponse';
import type {
  Listing,
  CreateListingRequest,
  BoostListingRequest,
  CloseListingRequest,
  ListingSearchParams,
  GetUserListingsRequest,
} from '../types/Listing';

/**
 * Service for listing operations
 * Phase 10: Listing concept with expiration
 */
export const listingService = {
  /**
   * Search listings (public endpoint)
   */
  async searchListings(params?: ListingSearchParams): Promise<PagedResponse<Listing>> {
    return apiClient.getPaged<Listing>(LISTING_ENDPOINTS.SEARCH, params);
  },

  /**
   * Get featured listings for homepage (public endpoint, Phase 15)
   * Returns top listings sorted by boost status, rating, and popularity
   */
  async getFeaturedListings(limit = 6): Promise<ApiResponse<Listing[]>> {
    return apiClient.get<Listing[]>(LISTING_ENDPOINTS.FEATURED, { limit });
  },

  /**
   * Get listing by ID (public endpoint)
   */
  async getListingById(listingId: string): Promise<ApiResponse<Listing>> {
    return apiClient.get<Listing>(LISTING_ENDPOINTS.GET_BY_ID(listingId));
  },

  /**
   * Get current user's listings
   */
  async getMyListings(params?: GetUserListingsRequest): Promise<ApiResponse<Listing[]>> {
    return apiClient.get<Listing[]>(LISTING_ENDPOINTS.MY_LISTINGS, params);
  },

  /**
   * Create a new listing for a skill
   */
  async createListing(data: CreateListingRequest): Promise<ApiResponse<Listing>> {
    return apiClient.post<Listing>(LISTING_ENDPOINTS.CREATE, data);
  },

  /**
   * Refresh a listing (extend expiration)
   * @param listingId - The listing ID to refresh
   * @returns Updated listing
   */
  async refreshListing(listingId: string): Promise<ApiResponse<Listing>> {
    return apiClient.post<Listing>(LISTING_ENDPOINTS.REFRESH(listingId));
  },

  /**
   * Boost a listing for higher visibility
   * @param listingId - The listing ID to boost
   * @param data - Optional boost duration
   * @returns Updated listing
   */
  async boostListing(listingId: string, data?: BoostListingRequest): Promise<ApiResponse<Listing>> {
    return apiClient.post<Listing>(LISTING_ENDPOINTS.BOOST(listingId), data);
  },

  /**
   * Close a listing manually
   * @param listingId - The listing ID to close
   * @param data - Optional closure reason
   * @returns Updated listing
   */
  async closeListing(listingId: string, data?: CloseListingRequest): Promise<ApiResponse<Listing>> {
    return apiClient.post<Listing>(LISTING_ENDPOINTS.CLOSE(listingId), data);
  },

  /**
   * Delete a listing (soft delete)
   * @param listingId - The listing ID to delete
   * @returns Success status
   */
  async deleteListing(listingId: string): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(LISTING_ENDPOINTS.DELETE(listingId));
  },
};

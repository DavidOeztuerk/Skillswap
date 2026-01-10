/**
 * Listing Types
 * Phase 10: Listing concept with expiration
 */

/**
 * Listing type - determines if it's an offer or request
 */
export type ListingType = 'Offer' | 'Request';

/**
 * Listing status - lifecycle state
 */
export type ListingStatus = 'Active' | 'Expiring' | 'Expired' | 'Closed' | 'Deleted';

/**
 * Skill summary included in listing response
 */
export interface ListingSkillSummary {
  id: string;
  name: string;
  description?: string;
  topicId?: string;
  topicName?: string;
  subcategoryId?: string;
  subcategoryName?: string;
  categoryId?: string;
  categoryName?: string;
  locationType?: string;
  locationCity?: string;
  averageRating?: number;
  reviewCount?: number;
  viewCount?: number;
  tags?: string[];
}

/**
 * Full listing response from API
 */
export interface Listing {
  id: string;
  skillId: string;
  userId: string;
  type: ListingType;
  status: ListingStatus;
  expiresAt: string;
  refreshedAt?: string;
  refreshCount: number;
  refreshesRemaining: number;
  isBoosted: boolean;
  boostedUntil?: string;
  boostCount: number;
  createdAt: string;
  updatedAt?: string;
  isVisible: boolean;
  daysUntilExpiration: number;
  isCurrentlyBoosted: boolean;
  skill?: ListingSkillSummary;
}

/**
 * Request to create a new listing
 */
export interface CreateListingRequest {
  skillId: string;
  type: ListingType;
}

/**
 * Request to boost a listing
 */
export interface BoostListingRequest {
  durationDays?: number;
}

/**
 * Request to close a listing
 */
export interface CloseListingRequest {
  reason?: string;
}

/**
 * Search parameters for listing search
 */
export interface ListingSearchParams {
  searchTerm?: string;
  categoryId?: string;
  topicId?: string;
  listingType?: ListingType;
  tags?: string[];
  minRating?: number;
  locationType?: string;
  maxDistanceKm?: number;
  userLatitude?: number;
  userLongitude?: number;
  boostedOnly?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  pageNumber?: number;
  pageSize?: number;
}

/**
 * Request to get user's listings
 */
export interface GetUserListingsRequest {
  includeExpired?: boolean;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get display label for listing type (German)
 */
export const getListingTypeLabel = (type: ListingType): string => {
  switch (type) {
    case 'Offer':
      return 'Angebot';
    case 'Request':
      return 'Gesuch';
    default:
      return type;
  }
};

/**
 * Get display label for listing status (German)
 */
export const getListingStatusLabel = (status: ListingStatus): string => {
  switch (status) {
    case 'Active':
      return 'Aktiv';
    case 'Expiring':
      return 'Bald ablaufend';
    case 'Expired':
      return 'Abgelaufen';
    case 'Closed':
      return 'Geschlossen';
    case 'Deleted':
      return 'Geloscht';
    default:
      return status;
  }
};

/**
 * Get status color for MUI
 */
export const getListingStatusColor = (
  status: ListingStatus
): 'success' | 'warning' | 'error' | 'default' | 'info' => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Expiring':
      return 'warning';
    case 'Expired':
      return 'error';
    case 'Closed':
      return 'default';
    case 'Deleted':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Format expiration info for display
 */
export const formatExpirationInfo = (listing: Listing): string => {
  if (listing.status === 'Expired') {
    return 'Abgelaufen';
  }
  if (listing.status === 'Closed') {
    return 'Geschlossen';
  }

  const days = listing.daysUntilExpiration;
  if (days <= 0) {
    return 'Lauft heute ab';
  }
  if (days === 1) {
    return 'Lauft morgen ab';
  }
  return `Noch ${days} Tage`;
};

/**
 * Check if listing can be refreshed
 */
export const canRefreshListing = (listing: Listing): boolean =>
  listing.refreshesRemaining > 0 && listing.status !== 'Deleted' && listing.status !== 'Closed';

/**
 * Check if listing can be boosted
 */
export const canBoostListing = (listing: Listing): boolean =>
  listing.isVisible && listing.status === 'Active';

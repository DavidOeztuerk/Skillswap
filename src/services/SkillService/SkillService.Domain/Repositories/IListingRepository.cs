using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

/// <summary>
/// Repository interface for Listing operations
/// Phase 10: Listing concept with expiration
/// </summary>
public interface IListingRepository
{
    // =============================================
    // Basic CRUD Operations
    // =============================================

    Task<Listing?> GetByIdAsync(string listingId, CancellationToken cancellationToken = default);

    Task<Listing?> GetByIdWithSkillAsync(string listingId, CancellationToken cancellationToken = default);

    Task<Listing?> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);

    Task<Listing?> GetActiveBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);

    Task<List<Listing>> GetByUserIdAsync(string userId, bool includeExpired = false, CancellationToken cancellationToken = default);

    Task<Listing> CreateAsync(Listing listing, CancellationToken cancellationToken = default);

    Task<Listing> UpdateAsync(Listing listing, CancellationToken cancellationToken = default);

    Task DeleteAsync(string listingId, CancellationToken cancellationToken = default);

    Task HardDeleteAsync(string listingId, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    // =============================================
    // Expiration-Related Queries
    // =============================================

    /// <summary>
    /// Get listings that have expired (ExpiresAt < now) but status is still Active/Expiring
    /// Used by background service to mark as Expired
    /// </summary>
    Task<List<Listing>> GetExpiredListingsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Get listings that will expire within the specified number of minutes
    /// and haven't been notified yet
    /// Used by background service to send expiring notifications
    /// </summary>
    Task<List<Listing>> GetExpiringListingsAsync(int minutesUntilExpiry, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get listings that have been expired/deleted for longer than the retention period
    /// Used by background service for hard delete
    /// </summary>
    Task<List<Listing>> GetListingsForHardDeleteAsync(int minutesSinceExpired, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get boosted listings where boost has expired
    /// Used by background service to remove expired boosts
    /// </summary>
    Task<List<Listing>> GetExpiredBoostsAsync(CancellationToken cancellationToken = default);

    // =============================================
    // Search Operations
    // =============================================

    /// <summary>
    /// Get featured listings for homepage (Phase 15)
    /// Sorted by: Boost status > Rating > Popularity > Recency
    /// </summary>
    Task<List<Listing>> GetFeaturedListingsAsync(int limit = 6, CancellationToken cancellationToken = default);

    /// <summary>
    /// Search active listings with filters
    /// This replaces the old skill search - we now search listings
    /// </summary>
    Task<(List<Listing> Listings, int TotalCount)> SearchListingsPagedAsync(
        string? searchTerm,
        string? categoryId,
        string? topicId,
        List<string>? tags,
        string? listingType, // Offer or Request
        decimal? minRating,
        string? sortBy,
        string? sortDirection,
        int pageNumber,
        int pageSize,
        // Location filters
        string? locationType = null,
        int? maxDistanceKm = null,
        double? userLatitude = null,
        double? userLongitude = null,
        // Boost filter
        bool? boostedOnly = null,
        CancellationToken cancellationToken = default);

    // =============================================
    // Statistics
    // =============================================

    /// <summary>
    /// Count active listings by type
    /// </summary>
    Task<int> CountActiveListingsAsync(string? listingType = null, CancellationToken cancellationToken = default);

    /// <summary>
    /// Count expiring listings (within X days)
    /// </summary>
    Task<int> CountExpiringListingsAsync(int daysUntilExpiry, CancellationToken cancellationToken = default);

    /// <summary>
    /// Count boosted listings
    /// </summary>
    Task<int> CountBoostedListingsAsync(CancellationToken cancellationToken = default);

    // =============================================
    // Validation
    // =============================================

    /// <summary>
    /// Check if a listing exists for a skill
    /// </summary>
    Task<bool> ExistsForSkillAsync(string skillId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get boost status for multiple skills (Phase 15)
    /// Returns a dictionary mapping skillId to (IsBoosted, IsCurrentlyBoosted)
    /// </summary>
    Task<Dictionary<string, (bool IsBoosted, bool IsCurrentlyBoosted)>> GetBoostStatusForSkillsAsync(
        List<string> skillIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if user owns the listing
    /// </summary>
    Task<bool> IsOwnerAsync(string listingId, string userId, CancellationToken cancellationToken = default);

    // =============================================
    // Bulk Operations (for background service)
    // =============================================

    /// <summary>
    /// Bulk update listings to expired status
    /// </summary>
    Task<int> BulkExpireListingsAsync(List<string> listingIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk hard delete listings
    /// </summary>
    Task<int> BulkHardDeleteListingsAsync(List<string> listingIds, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bulk remove expired boosts
    /// </summary>
    Task<int> BulkRemoveExpiredBoostsAsync(List<string> listingIds, CancellationToken cancellationToken = default);
}

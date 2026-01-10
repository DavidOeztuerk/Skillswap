using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Listing operations
/// Phase 10: Listing concept with expiration
/// </summary>
public class ListingRepository : IListingRepository
{
    private readonly SkillDbContext _dbContext;

    public ListingRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    // =============================================
    // Basic CRUD Operations
    // =============================================

    public async Task<Listing?> GetByIdAsync(string listingId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .FirstOrDefaultAsync(l => l.Id == listingId && !l.IsDeleted, cancellationToken);
    }

    public async Task<Listing?> GetByIdWithSkillAsync(string listingId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .Include(l => l.Skill)
                .ThenInclude(s => s.Topic)
                    .ThenInclude(t => t.Subcategory)
                        .ThenInclude(sc => sc.Category)
            .AsSplitQuery()
            .FirstOrDefaultAsync(l => l.Id == listingId && !l.IsDeleted, cancellationToken);
    }

    public async Task<Listing?> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .FirstOrDefaultAsync(l => l.SkillId == skillId && !l.IsDeleted, cancellationToken);
    }

    public async Task<Listing?> GetActiveBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .FirstOrDefaultAsync(l =>
                l.SkillId == skillId &&
                !l.IsDeleted &&
                (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring),
                cancellationToken);
    }

    public async Task<List<Listing>> GetByUserIdAsync(string userId, bool includeExpired = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Listings
            .Include(l => l.Skill)
                .ThenInclude(s => s.Topic)
                    .ThenInclude(t => t.Subcategory)
                        .ThenInclude(sc => sc.Category)
            .AsSplitQuery()
            .Where(l => l.UserId == userId && !l.IsDeleted);

        if (!includeExpired)
        {
            query = query.Where(l => l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring);
        }

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Listing> CreateAsync(Listing listing, CancellationToken cancellationToken = default)
    {
        await _dbContext.Listings.AddAsync(listing, cancellationToken);
        return listing;
    }

    public async Task<Listing> UpdateAsync(Listing listing, CancellationToken cancellationToken = default)
    {
        _dbContext.Listings.Update(listing);
        return await Task.FromResult(listing);
    }

    public async Task DeleteAsync(string listingId, CancellationToken cancellationToken = default)
    {
        var listing = await GetByIdAsync(listingId, cancellationToken);
        if (listing != null)
        {
            listing.SoftDelete();
            _dbContext.Listings.Update(listing);
        }
    }

    public async Task HardDeleteAsync(string listingId, CancellationToken cancellationToken = default)
    {
        var listing = await _dbContext.Listings
            .FirstOrDefaultAsync(l => l.Id == listingId, cancellationToken);

        if (listing != null)
        {
            _dbContext.Listings.Remove(listing);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    // =============================================
    // Expiration-Related Queries
    // =============================================

    public async Task<List<Listing>> GetExpiredListingsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Listings
            .Where(l =>
                !l.IsDeleted &&
                l.ExpiresAt < now &&
                (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Listing>> GetExpiringListingsAsync(int minutesUntilExpiry, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expiryThreshold = now.AddMinutes(minutesUntilExpiry);

        return await _dbContext.Listings
            .Include(l => l.Skill)
            .Where(l =>
                !l.IsDeleted &&
                l.Status == ListingStatus.Active &&
                l.ExpiresAt <= expiryThreshold &&
                l.ExpiresAt > now &&
                !l.ExpiringNotificationSent)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Listing>> GetListingsForHardDeleteAsync(int minutesSinceExpired, CancellationToken cancellationToken = default)
    {
        var cutoffDate = DateTime.UtcNow.AddMinutes(-minutesSinceExpired);

        return await _dbContext.Listings
            .Where(l =>
                (l.Status == ListingStatus.Expired || l.Status == ListingStatus.Deleted || l.IsDeleted) &&
                l.UpdatedAt <= cutoffDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Listing>> GetExpiredBoostsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Listings
            .Where(l =>
                !l.IsDeleted &&
                l.IsBoosted &&
                l.BoostedUntil.HasValue &&
                l.BoostedUntil.Value < now)
            .ToListAsync(cancellationToken);
    }

    // =============================================
    // Search Operations
    // =============================================

    public async Task<(List<Listing> Listings, int TotalCount)> SearchListingsPagedAsync(
        string? searchTerm,
        string? categoryId,
        string? topicId,
        List<string>? tags,
        string? listingType,
        decimal? minRating,
        string? sortBy,
        string? sortDirection,
        int pageNumber,
        int pageSize,
        string? locationType = null,
        int? maxDistanceKm = null,
        double? userLatitude = null,
        double? userLongitude = null,
        bool? boostedOnly = null,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Listings
            .AsNoTracking()
            .Include(l => l.Skill)
                .ThenInclude(s => s.Topic)
                    .ThenInclude(t => t.Subcategory)
                        .ThenInclude(sc => sc.Category)
            .AsSplitQuery()
            .Where(l =>
                !l.IsDeleted &&
                (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring) &&
                l.Skill.IsActive &&
                !l.Skill.IsDeleted);

        // Apply listing type filter
        if (!string.IsNullOrEmpty(listingType))
        {
            query = query.Where(l => l.Type == listingType);
        }

        // Apply search term on skill
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(l =>
                l.Skill.Name.ToLower().Contains(term) ||
                l.Skill.Description.ToLower().Contains(term) ||
                (l.Skill.SearchKeywords != null && l.Skill.SearchKeywords.Contains(term)));
        }

        // Apply category filter (through Topic hierarchy)
        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(l => l.Skill.Topic.Subcategory.SkillCategoryId == categoryId);
        }

        // Apply topic filter
        if (!string.IsNullOrEmpty(topicId))
        {
            query = query.Where(l => l.Skill.SkillTopicId == topicId);
        }

        // Apply minRating filter
        if (minRating.HasValue)
        {
            query = query.Where(l => l.Skill.AverageRating >= (double)minRating.Value);
        }

        // Apply tags filter
        if (tags != null && tags.Count > 0)
        {
            foreach (var tag in tags)
            {
                var tagLower = tag.ToLower();
                query = query.Where(l => l.Skill.TagsJson != null && l.Skill.TagsJson.Contains(tagLower));
            }
        }

        // Apply boosted only filter
        if (boostedOnly == true)
        {
            var now = DateTime.UtcNow;
            query = query.Where(l => l.IsBoosted && l.BoostedUntil.HasValue && l.BoostedUntil.Value > now);
        }

        // Apply location type filter on skill
        if (!string.IsNullOrEmpty(locationType))
        {
            query = locationType.ToLower() switch
            {
                "remote" => query.Where(l => l.Skill.LocationType == "remote" || l.Skill.LocationType == "both"),
                "in_person" => query.Where(l => l.Skill.LocationType == "in_person" || l.Skill.LocationType == "both"),
                "both" => query.Where(l => !string.IsNullOrEmpty(l.Skill.LocationType)),
                _ => query
            };
        }

        // Apply sorting - boosted listings first, then by criteria
        var now2 = DateTime.UtcNow;
        query = sortBy?.ToLower() switch
        {
            "name" => sortDirection == "desc"
                ? query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenByDescending(l => l.Skill.Name)
                : query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenBy(l => l.Skill.Name),
            "rating" => sortDirection == "desc"
                ? query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenByDescending(l => l.Skill.AverageRating)
                : query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenBy(l => l.Skill.AverageRating),
            "createdat" => sortDirection == "desc"
                ? query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenByDescending(l => l.CreatedAt)
                : query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenBy(l => l.CreatedAt),
            "expiresat" => sortDirection == "desc"
                ? query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenByDescending(l => l.ExpiresAt)
                : query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenBy(l => l.ExpiresAt),
            "popularity" => sortDirection == "desc"
                ? query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenByDescending(l => l.Skill.ViewCount + l.Skill.MatchCount)
                : query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                       .ThenBy(l => l.Skill.ViewCount + l.Skill.MatchCount),
            _ => query.OrderByDescending(l => l.IsBoosted && l.BoostedUntil > now2)
                      .ThenByDescending(l => l.Skill.SearchRelevanceScore)
        };

        // Handle distance filtering in memory if needed
        List<Listing> listings;
        int totalCount;

        if (maxDistanceKm.HasValue && userLatitude.HasValue && userLongitude.HasValue)
        {
            var allListings = await query.ToListAsync(cancellationToken);

            var filteredListings = allListings.Where(l =>
            {
                // Remote skills are always included
                if (l.Skill.LocationType == "remote")
                {
                    return true;
                }

                // In-person/both skills: check distance if coordinates exist
                if (l.Skill.LocationLatitude.HasValue && l.Skill.LocationLongitude.HasValue)
                {
                    var distance = CalculateHaversineDistance(
                        userLatitude.Value, userLongitude.Value,
                        l.Skill.LocationLatitude.Value, l.Skill.LocationLongitude.Value);
                    return distance <= maxDistanceKm.Value;
                }

                return false;
            }).ToList();

            totalCount = filteredListings.Count;
            listings = filteredListings
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }
        else
        {
            totalCount = await query.CountAsync(cancellationToken);
            listings = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
        }

        return (listings, totalCount);
    }

    /// <summary>
    /// Get featured listings for homepage (Phase 15)
    /// Sorted by: Boost status > Rating > Popularity > Recency
    /// </summary>
    public async Task<List<Listing>> GetFeaturedListingsAsync(
        int limit = 6,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Listings
            .AsNoTracking()
            .Include(l => l.Skill)
                .ThenInclude(s => s.Topic)
                    .ThenInclude(t => t.Subcategory)
                        .ThenInclude(sc => sc.Category)
            .AsSplitQuery()
            .Where(l =>
                !l.IsDeleted &&
                (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring) &&
                l.Skill.IsActive &&
                !l.Skill.IsDeleted)
            // Sortierung: Bezahlte Boosts zuerst, dann Rating, dann Popularität
            .OrderByDescending(l => l.IsTopListing && l.BoostedUntil > now) // Premium-Boost
            .ThenByDescending(l => l.IsBoosted && l.BoostedUntil > now)     // Standard-Boost
            .ThenByDescending(l => l.Skill.AverageRating)                   // Rating
            .ThenByDescending(l => l.Skill.ViewCount + l.Skill.MatchCount)  // Popularität
            .ThenByDescending(l => l.CreatedAt)                             // Neueste
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    // =============================================
    // Statistics
    // =============================================

    public async Task<int> CountActiveListingsAsync(string? listingType = null, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Listings
            .Where(l => !l.IsDeleted && (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring));

        if (!string.IsNullOrEmpty(listingType))
        {
            query = query.Where(l => l.Type == listingType);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountExpiringListingsAsync(int daysUntilExpiry, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expiryThreshold = now.AddDays(daysUntilExpiry);

        return await _dbContext.Listings
            .Where(l =>
                !l.IsDeleted &&
                l.Status == ListingStatus.Active &&
                l.ExpiresAt <= expiryThreshold &&
                l.ExpiresAt > now)
            .CountAsync(cancellationToken);
    }

    public async Task<int> CountBoostedListingsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        return await _dbContext.Listings
            .Where(l =>
                !l.IsDeleted &&
                l.IsBoosted &&
                l.BoostedUntil.HasValue &&
                l.BoostedUntil.Value > now)
            .CountAsync(cancellationToken);
    }

    // =============================================
    // Validation
    // =============================================

    public async Task<bool> ExistsForSkillAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .AnyAsync(l => l.SkillId == skillId && !l.IsDeleted, cancellationToken);
    }

    public async Task<bool> IsOwnerAsync(string listingId, string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Listings
            .AnyAsync(l => l.Id == listingId && l.UserId == userId && !l.IsDeleted, cancellationToken);
    }

    /// <summary>
    /// Get boost status for multiple skills (Phase 15)
    /// Returns a dictionary mapping skillId to (IsBoosted, IsCurrentlyBoosted)
    /// </summary>
    public async Task<Dictionary<string, (bool IsBoosted, bool IsCurrentlyBoosted)>> GetBoostStatusForSkillsAsync(
        List<string> skillIds, CancellationToken cancellationToken = default)
    {
        if (skillIds.Count == 0)
            return new Dictionary<string, (bool, bool)>();

        var now = DateTime.UtcNow;

        var boostData = await _dbContext.Listings
            .AsNoTracking()
            .Where(l => skillIds.Contains(l.SkillId) && !l.IsDeleted &&
                       (l.Status == ListingStatus.Active || l.Status == ListingStatus.Expiring))
            .Select(l => new
            {
                l.SkillId,
                l.IsBoosted,
                l.BoostedUntil
            })
            .ToListAsync(cancellationToken);

        return boostData.ToDictionary(
            x => x.SkillId,
            x => (x.IsBoosted, x.IsBoosted && x.BoostedUntil.HasValue && x.BoostedUntil > now)
        );
    }

    // =============================================
    // Bulk Operations
    // =============================================

    public async Task<int> BulkExpireListingsAsync(List<string> listingIds, CancellationToken cancellationToken = default)
    {
        if (listingIds.Count == 0) return 0;

        var listings = await _dbContext.Listings
            .Where(l => listingIds.Contains(l.Id))
            .ToListAsync(cancellationToken);

        foreach (var listing in listings)
        {
            listing.Expire();
        }

        return listings.Count;
    }

    public async Task<int> BulkHardDeleteListingsAsync(List<string> listingIds, CancellationToken cancellationToken = default)
    {
        if (listingIds.Count == 0) return 0;

        var listings = await _dbContext.Listings
            .Where(l => listingIds.Contains(l.Id))
            .ToListAsync(cancellationToken);

        _dbContext.Listings.RemoveRange(listings);

        return listings.Count;
    }

    public async Task<int> BulkRemoveExpiredBoostsAsync(List<string> listingIds, CancellationToken cancellationToken = default)
    {
        if (listingIds.Count == 0) return 0;

        var listings = await _dbContext.Listings
            .Where(l => listingIds.Contains(l.Id))
            .ToListAsync(cancellationToken);

        foreach (var listing in listings)
        {
            listing.RemoveBoost();
        }

        return listings.Count;
    }

    // =============================================
    // Helper Methods
    // =============================================

    /// <summary>
    /// Calculates distance between two coordinates using Haversine formula
    /// </summary>
    private static double CalculateHaversineDistance(
        double lat1, double lon1,
        double lat2, double lon2)
    {
        const double EarthRadiusKm = 6371.0;

        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return EarthRadiusKm * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180.0;
}

using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class SkillRepository : ISkillRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<Skill?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<Skill>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<Skill> CreateAsync(Skill entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.Skills.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<Skill> UpdateAsync(Skill entity, CancellationToken cancellationToken = default)
    {
        _dbContext.Skills.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.Skills.Remove(entity);
        }
    }


    public async Task<List<Skill>> GetUserSkillsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Skill>> GetUserSkillsWithRelationsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Include(s => s.Topic)
                .ThenInclude(t => t.Subcategory)
                    .ThenInclude(sc => sc.Category)
            .AsSplitQuery()
            .AsNoTracking()
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Skill>> GetByTopicAsync(string topicId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(s => s.SkillTopicId == topicId && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Skill>> SearchSkillsAsync(string searchTerm, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(s => !s.IsDeleted && s.Name.Contains(searchTerm))
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var skills = await GetUserSkillsAsync(userId, cancellationToken);
        _dbContext.Skills.RemoveRange(skills);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Skill?> GetByIdAndUserIdAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.Id == skillId && s.UserId == userId);

        if (!includeDeleted)
        {
            query = query.Where(s => !s.IsDeleted);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Skill?> GetByNameAndUserIdAsync(string name, string? userId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.Name == name && !s.IsDeleted);

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(s => s.UserId == userId);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<int> CountByTopicAsync(string topicId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.SkillTopicId == topicId);

        if (!includeDeleted)
        {
            query = query.Where(s => !s.IsDeleted);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountByCategoryAsync(string categoryId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills
            .Include(s => s.Topic)
                .ThenInclude(t => t.Subcategory)
            .Where(s => s.Topic.Subcategory.SkillCategoryId == categoryId);

        if (!includeDeleted)
        {
            query = query.Where(s => !s.IsDeleted);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<List<Skill>> GetByIdsAsync(IEnumerable<string> skillIds, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(s => skillIds.Contains(s.Id) && !s.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Skill>> GetActiveSkillsWithTagsAsync(string? topicId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.IsActive && !s.IsDeleted);

        if (!string.IsNullOrEmpty(topicId))
        {
            query = query.Where(s => s.SkillTopicId == topicId);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public void RemoveRange(IEnumerable<Skill> skills)
    {
        _dbContext.Set<Skill>().RemoveRange(skills);
    }

    public async Task<(List<Skill> Skills, int TotalCount)> SearchSkillsPagedAsync(
        string? userId,
        string? searchTerm,
        string? categoryId,
        List<string>? tags,
        bool? isOffered,
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
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills
            .AsNoTracking()
            .Include(s => s.Topic)
                .ThenInclude(t => t.Subcategory)
                    .ThenInclude(sc => sc.Category)
            .Where(s => s.IsActive && !s.IsDeleted);

        // Exclude user's own skills if userId provided
        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(s => s.UserId != userId);
        }

        // Apply search term
        if (!string.IsNullOrEmpty(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(term) ||
                s.Description.ToLower().Contains(term) ||
                (s.SearchKeywords != null && s.SearchKeywords.Contains(term)));
        }

        // Apply category filter (filters through the hierarchy: Topic -> Subcategory -> Category)
        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(s => s.Topic.Subcategory.SkillCategoryId == categoryId);
        }

        // Apply isOffered filter
        if (isOffered.HasValue)
        {
            query = query.Where(s => s.IsOffered == isOffered.Value);
        }

        // Apply minRating filter
        if (minRating.HasValue)
        {
            query = query.Where(s => s.AverageRating >= (double)minRating.Value);
        }

        // Apply tags filter
        if (tags != null && tags.Count > 0)
        {
            foreach (var tag in tags)
            {
                var tagLower = tag.ToLower();
                query = query.Where(s => s.TagsJson != null && s.TagsJson.Contains(tagLower));
            }
        }

        // Apply location type filter
        // Logic:
        // - "remote": Skills available remotely (LocationType = "remote" or "both")
        // - "in_person": Skills available in-person (LocationType = "in_person" or "both")
        // - "both": Skills that can be done either way - shows remote OR in_person OR both
        //           (This is inclusive - if user is flexible, show all location-aware skills)
        if (!string.IsNullOrEmpty(locationType))
        {
            query = locationType.ToLower() switch
            {
                "remote" => query.Where(s => s.LocationType == "remote" || s.LocationType == "both"),
                "in_person" => query.Where(s => s.LocationType == "in_person" || s.LocationType == "both"),
                "both" => query.Where(s => !string.IsNullOrEmpty(s.LocationType)),
                _ => query
            };
        }

        // Note: Distance filter is applied AFTER fetching, in memory (see below)
        // We need to handle "Alle Orte" + distance specially:
        // - Remote skills should ALWAYS be included (no distance check)
        // - In-person/both skills should be filtered by distance

        // Apply sorting
        query = sortBy?.ToLower() switch
        {
            "name" => sortDirection == "desc"
                ? query.OrderByDescending(s => s.Name)
                : query.OrderBy(s => s.Name),
            "rating" => sortDirection == "desc"
                ? query.OrderByDescending(s => s.AverageRating)
                : query.OrderBy(s => s.AverageRating),
            "createdat" => sortDirection == "desc"
                ? query.OrderByDescending(s => s.CreatedAt)
                : query.OrderBy(s => s.CreatedAt),
            "updatedat" => sortDirection == "desc"
                ? query.OrderByDescending(s => s.UpdatedAt)
                : query.OrderBy(s => s.UpdatedAt),
            "popularity" => sortDirection == "desc"
                ? query.OrderByDescending(s => s.ViewCount + s.MatchCount)
                : query.OrderBy(s => s.ViewCount + s.MatchCount),
            _ => query.OrderByDescending(s => s.SearchRelevanceScore)
        };

        // Get all results for distance filtering (if needed)
        List<Skill> skills;
        int totalCount;

        if (maxDistanceKm.HasValue && userLatitude.HasValue && userLongitude.HasValue)
        {
            // Fetch all matching skills and filter by distance in memory
            var allSkills = await query.ToListAsync(cancellationToken);

            // Distance filtering logic:
            // - Remote skills (LocationType = "remote"): ALWAYS include, no distance check
            // - In-person/both skills: Include only if within distance OR if no coordinates set
            var filteredSkills = allSkills.Where(s =>
            {
                // Remote skills are always included (distance doesn't apply)
                if (s.LocationType == "remote")
                {
                    return true;
                }

                // In-person/both skills: check distance if coordinates exist
                if (s.LocationLatitude.HasValue && s.LocationLongitude.HasValue)
                {
                    var distance = CalculateHaversineDistance(
                        userLatitude.Value, userLongitude.Value,
                        s.LocationLatitude.Value, s.LocationLongitude.Value);
                    return distance <= maxDistanceKm.Value;
                }

                // No coordinates set - exclude from distance-filtered results
                return false;
            }).ToList();

            totalCount = filteredSkills.Count;
            skills = filteredSkills
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToList();
        }
        else
        {
            // Standard pagination without distance filtering
            totalCount = await query.CountAsync(cancellationToken);
            skills = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
        }

        return (skills, totalCount);
    }

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

    public async Task<(
        int TotalSkills,
        int OfferedSkills,
        int RequestedSkills,
        int ActiveSkills,
        double AverageRating,
        Dictionary<string, int> SkillsByCategory,
        List<(string Id, string Name, double Rating, int ReviewCount)> TopRatedSkills,
        List<(string Id, string Name, string CategoryName, int ViewCount)> TrendingSkills,
        Dictionary<string, int> PopularTags
    )> GetStatisticsAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string? categoryId,
        string? userId,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => !s.IsDeleted);

        // Apply date filters
        if (fromDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(s => s.CreatedAt <= toDate.Value);
        }

        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(s => s.Topic.Subcategory.SkillCategoryId == categoryId);
        }

        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(s => s.UserId == userId);
        }

        var totalSkills = await query.CountAsync(cancellationToken);
        var offeredSkills = await query.Where(s => s.IsOffered).CountAsync(cancellationToken);
        var requestedSkills = await query.Where(s => !s.IsOffered).CountAsync(cancellationToken);
        var activeSkills = await query.Where(s => s.IsActive).CountAsync(cancellationToken);

        var averageRating = await query
            .Where(s => s.AverageRating > 0)
            .AverageAsync(s => (double?)s.AverageRating, cancellationToken) ?? 0.0;

        var skillsByCategory = await query
            .Include(s => s.Topic)
                .ThenInclude(t => t.Subcategory)
                    .ThenInclude(sc => sc.Category)
            .GroupBy(s => s.Topic.Subcategory.Category.Name)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count, cancellationToken);

        var topRatedSkills = await query
            .Where(s => s.AverageRating > 0 && s.ReviewCount > 0)
            .OrderByDescending(s => s.AverageRating)
            .ThenByDescending(s => s.ReviewCount)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.AverageRating,
                s.ReviewCount
            })
            .ToListAsync(cancellationToken);

        var topRated = topRatedSkills
            .Select(s => (s.Id, s.Name, Rating: s.AverageRating ?? 0.0, s.ReviewCount))
            .ToList();

        var trendingSkills = await query
            .Include(s => s.Topic)
                .ThenInclude(t => t.Subcategory)
                    .ThenInclude(sc => sc.Category)
            .Where(s => s.LastViewedAt >= DateTime.UtcNow.AddDays(-7))
            .OrderByDescending(s => s.ViewCount)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.Name,
                CategoryName = s.Topic.Subcategory.Category.Name,
                s.ViewCount
            })
            .ToListAsync(cancellationToken);

        var trending = trendingSkills
            .Select(s => (s.Id, s.Name, s.CategoryName, s.ViewCount))
            .ToList();

        // Get popular tags
        var allTags = await query
            .Where(s => !string.IsNullOrEmpty(s.TagsJson))
            .Select(s => s.TagsJson!)
            .ToListAsync(cancellationToken);

        var popularTags = new Dictionary<string, int>();
        foreach (var tagJson in allTags)
        {
            var tags = System.Text.Json.JsonSerializer.Deserialize<List<string>>(tagJson);
            if (tags != null)
            {
                foreach (var tag in tags)
                {
                    if (popularTags.ContainsKey(tag))
                        popularTags[tag]++;
                    else
                        popularTags[tag] = 1;
                }
            }
        }

        var topTags = popularTags
            .OrderByDescending(x => x.Value)
            .Take(20)
            .ToDictionary(x => x.Key, x => x.Value);

        return (
            totalSkills,
            offeredSkills,
            requestedSkills,
            activeSkills,
            Math.Round(averageRating, 2),
            skillsByCategory,
            topRated,
            trending,
            topTags);
    }
}

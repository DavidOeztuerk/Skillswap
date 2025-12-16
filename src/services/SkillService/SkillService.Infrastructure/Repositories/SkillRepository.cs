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
            .Include(s => s.SkillCategory)
            .Include(s => s.ProficiencyLevel)
            .AsSplitQuery()
            .AsNoTracking()
            .Where(s => s.UserId == userId && !s.IsDeleted)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Skill>> GetByCategoryAsync(string categoryId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Skills
            .Where(s => s.SkillCategoryId == categoryId && !s.IsDeleted)
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

    public async Task<int> CountByProficiencyLevelAsync(string proficiencyLevelId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.ProficiencyLevelId == proficiencyLevelId);

        if (!includeDeleted)
        {
            query = query.Where(s => !s.IsDeleted);
        }

        return await query.CountAsync(cancellationToken);
    }

    public async Task<int> CountByCategoryAsync(string categoryId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.SkillCategoryId == categoryId);

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

    public async Task<List<Skill>> GetActiveSkillsWithTagsAsync(string? categoryId, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills.Where(s => s.IsActive && !s.IsDeleted);

        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(s => s.SkillCategoryId == categoryId);
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
        string? proficiencyLevelId,
        List<string>? tags,
        bool? isOffered,
        decimal? minRating,
        string? sortBy,
        string? sortDirection,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Skills
            .AsNoTracking()
            .Include(s => s.SkillCategory)
            .Include(s => s.ProficiencyLevel)
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

        // Apply category filter
        if (!string.IsNullOrEmpty(categoryId))
        {
            query = query.Where(s => s.SkillCategoryId == categoryId);
        }

        // Apply proficiency level filter
        if (!string.IsNullOrEmpty(proficiencyLevelId))
        {
            query = query.Where(s => s.ProficiencyLevelId == proficiencyLevelId);
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

        // Get total count
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply paging
        var skills = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (skills, totalCount);
    }

    public async Task<(
        int TotalSkills,
        int OfferedSkills,
        int RequestedSkills,
        int ActiveSkills,
        double AverageRating,
        Dictionary<string, int> SkillsByCategory,
        Dictionary<string, int> SkillsByProficiencyLevel,
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
            query = query.Where(s => s.SkillCategoryId == categoryId);
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
            .Include(s => s.SkillCategory)
            .GroupBy(s => s.SkillCategory.Name)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Category, x => x.Count, cancellationToken);

        var skillsByProficiencyLevel = await query
            .Include(s => s.ProficiencyLevel)
            .GroupBy(s => s.ProficiencyLevel.Level)
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Level, x => x.Count, cancellationToken);

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
            .Include(s => s.SkillCategory)
            .Where(s => s.LastViewedAt >= DateTime.UtcNow.AddDays(-7))
            .OrderByDescending(s => s.ViewCount)
            .Take(10)
            .Select(s => new
            {
                s.Id,
                s.Name,
                CategoryName = s.SkillCategory.Name,
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
            skillsByProficiencyLevel,
            topRated,
            trending,
            topTags);
    }
}

using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using Infrastructure.Models;
// using Infrastructure.Services;
using SkillService.Application.Queries;
using CQRS.Models;

namespace SkillService.Application.QueryHandlers;

// ============================================================================
// GET SKILL STATISTICS QUERY HANDLER
// ============================================================================

public class GetSkillStatisticsQueryHandler(
    SkillDbContext dbContext,
    // IUserLookupService userLookup,
    ILogger<GetSkillStatisticsQueryHandler> logger)
    : BaseQueryHandler<
    GetSkillStatisticsQuery,
    SkillStatisticsResponse>(
        logger)
{
    private readonly SkillDbContext _dbContext = dbContext;
    // private readonly IUserLookupService _userLookup = userLookup;

    public override async Task<ApiResponse<SkillStatisticsResponse>> Handle(
        GetSkillStatisticsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = _dbContext.Skills.Where(s => !s.IsDeleted);

            // Apply date filters
            if (request.FromDate.HasValue)
            {
                query = query.Where(s => s.CreatedAt >= request.FromDate.Value);
            }

            if (request.ToDate.HasValue)
            {
                query = query.Where(s => s.CreatedAt <= request.ToDate.Value);
            }

            if (!string.IsNullOrEmpty(request.CategoryId))
            {
                query = query.Where(s => s.SkillCategoryId == request.CategoryId);
            }

            if (!string.IsNullOrEmpty(request.UserId))
            {
                query = query.Where(s => s.UserId == request.UserId);
            }

            var totalSkills = await query.CountAsync(cancellationToken);
            var offeredSkills = await query.CountAsync(s => s.IsOffered, cancellationToken);
            var requestedSkills = await query.CountAsync(s => !s.IsOffered, cancellationToken);
            var activeSkills = await query.CountAsync(s => s.IsActive, cancellationToken);

            var averageRating = await query
                .Where(s => s.AverageRating.HasValue)
                .AverageAsync(s => s.AverageRating!.Value, cancellationToken);

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

            var rawTopRated = await query
                .Where(s => s.AverageRating.HasValue && s.ReviewCount > 0)
                .OrderByDescending(s => s.AverageRating)
                .ThenByDescending(s => s.ReviewCount)
                .Take(10)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.UserId,
                    s.AverageRating,
                    s.ReviewCount
                })
                .ToListAsync(cancellationToken);

            var topRatedSkills = new List<TopSkillResponse>();
            foreach (var s in rawTopRated)
            {
                // var user = await _userLookup.GetUserAsync(s.UserId, cancellationToken);
                topRatedSkills.Add(new TopSkillResponse(
                    s.Id,
                    s.Name,
                    s.AverageRating!.Value,
                    s.ReviewCount));
            }

            var trendingSkills = await query
                .Include(s => s.SkillCategory)
                .Where(s => s.LastViewedAt >= DateTime.UtcNow.AddDays(-7))
                .OrderByDescending(s => s.ViewCount)
                .Take(10)
                .Select(s => new TrendingSkillResponse(
                    s.Id,
                    s.Name,
                    s.SkillCategory.Name,
                    s.ViewCount,
                    25)) // TODO: Calculate actual growth percentage
                .ToListAsync(cancellationToken);

            // Get popular tags
            var allTags = await query
                .Where(s => !string.IsNullOrEmpty(s.TagsJson))
                .Select(s => s.TagsJson!)
                .ToListAsync(cancellationToken);

            var popularTags = new Dictionary<string, int>();
            foreach (var tagJson in allTags)
            {
                try
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
                catch
                {
                    // Skip invalid JSON
                }
            }

            var topTags = popularTags
                .OrderByDescending(x => x.Value)
                .Take(20)
                .ToDictionary(x => x.Key, x => x.Value);

            var response = new SkillStatisticsResponse(
                totalSkills,
                offeredSkills,
                requestedSkills,
                activeSkills,
                Math.Round(averageRating, 2),
                skillsByCategory,
                skillsByProficiencyLevel,
                topRatedSkills,
                trendingSkills,
                topTags);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error getting skill statistics");
            return Error("An error occurred while retrieving skill statistics");
        }
    }
}

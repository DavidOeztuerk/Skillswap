using CQRS.Interfaces;

namespace SkillService.Application.Queries;

// ============================================================================
// GET SKILL STATISTICS QUERY
// ============================================================================

public record GetSkillStatisticsQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? CategoryId = null,
    string? UserId = null)
    : IQuery<SkillStatisticsResponse>, ICacheableQuery
{
    public string CacheKey => $"skill-stats:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}:{CategoryId}:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record SkillStatisticsResponse(
    int TotalSkills,
    int OfferedSkills,
    int RequestedSkills,
    int ActiveSkills,
    double AverageRating,
    Dictionary<string, int> SkillsByCategory,
    Dictionary<string, int> SkillsByProficiencyLevel,
    List<TopSkillResponse> TopRatedSkills,
    List<TrendingSkillResponse> TrendingSkills,
    Dictionary<string, int> PopularTags);

public record TopSkillResponse(
    string SkillId,
    string Name,
    string UserName,
    double AverageRating,
    int ReviewCount);

public record TrendingSkillResponse(
    string SkillId,
    string Name,
    string CategoryName,
    int RecentViews,
    int GrowthPercentage);

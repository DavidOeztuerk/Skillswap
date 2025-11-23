using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetMatchStatisticsQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null) 
    : IQuery<MatchStatisticsResponse>, ICacheableQuery
{
    public string CacheKey => $"match-statistics:{FromDate:yyyy-MM-dd}:{ToDate:yyyy-MM-dd}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record MatchStatisticsResponse(
    int TotalMatches,
    int PendingMatches,
    int AcceptedMatches,
    int CompletedMatches,
    int RejectedMatches,
    double SuccessRate,
    double AverageCompatibilityScore,
    Dictionary<string, int> MatchesBySkill,
    List<TopSkillMatchResponse> TopMatchedSkills);

public record TopSkillMatchResponse(
    string SkillName,
    int MatchCount,
    double AverageCompatibility);

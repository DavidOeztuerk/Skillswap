using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetMatchDetailsQuery(
    string MatchId) 
    : IQuery<MatchDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"match-details:{MatchId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record MatchDetailsResponse(
    string MatchId,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string OfferingUserId,
    string RequestingUserId,
    string Status,
    double? CompatibilityScore,
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,
    bool IsMonetary,
    decimal? OfferedAmount,
    string? Currency,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    int CompletedSessions,
    int TotalSessions,
    int? SessionDurationMinutes,
    string[]? PreferredDays,
    string[]? PreferredTimes);

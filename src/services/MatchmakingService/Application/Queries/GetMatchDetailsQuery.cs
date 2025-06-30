using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetMatchDetailsQuery(
    string MatchId) : IQuery<MatchDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"match-details:{MatchId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record MatchDetailsResponse(
    string MatchId,
    string OfferedSkillId,
    string OfferedSkillName,
    string RequestedSkillId,
    string RequestedSkillName,
    string OfferingUserId,
    string RequestingUserId,
    string Status,
    double CompatibilityScore,
    string? MatchReason,
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt,
    int? SessionDurationMinutes);

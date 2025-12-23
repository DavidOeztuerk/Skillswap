using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetMatchDetailsQuery(
    string MatchId,
    string? RequestingUserId = null)
    : IQuery<MatchDetailsResponse>, ICacheableQuery
{
    public string CacheKey => $"match-details:{MatchId}:{RequestingUserId ?? "anon"}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record MatchDetailsResponse(
    string MatchId,
    string SkillId,
    string SkillName,
    string SkillCategory,
    string Status,

    // Partner info (resolved based on requesting user)
    string PartnerId,
    string PartnerName,
    double PartnerRating,
    string? PartnerAvatar,

    // Original participants
    string OfferingUserId,
    string RequestingUserId,

    // Match details
    bool IsOffering,
    double? CompatibilityScore,

    // Exchange info
    bool IsSkillExchange,
    string? ExchangeSkillId,
    string? ExchangeSkillName,

    // Monetary info
    bool IsMonetary,
    decimal? OfferedAmount,
    string? Currency,

    // Session info (nested object for frontend compatibility)
    MatchSessionInfo? SessionInfo,

    // Preferences
    bool IsLearningMode,
    string[]? PreferredDays,
    string[]? PreferredTimes,
    string? AdditionalNotes,

    // Timestamps
    DateTime CreatedAt,
    DateTime? AcceptedAt,
    DateTime? CompletedAt);

public record MatchSessionInfo(
    int CompletedSessions,
    int TotalSessions,
    DateTime? NextSessionDate);

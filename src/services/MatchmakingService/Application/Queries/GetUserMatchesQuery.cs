using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetUserMatchesQuery(
    string UserId,
    string? Status = null,
    bool IncludeCompleted = true,
    int PageNumber = 1,
    int PageSize = 20) : IPagedQuery<UserMatchResponse>, ICacheableQuery
{
    int IPagedQuery<UserMatchResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<UserMatchResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-matches:{Status}:{IncludeCompleted}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

public record UserMatchResponse(
    string MatchId,
    string SkillName,
    string Status,
    double CompatibilityScore,
    bool IsOffering,
    DateTime CreatedAt,
    DateTime? AcceptedAt);

using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetIncomingMatchRequestsQuery(
    string? UserId,
    int PageNumber = 1,
    int PageSize = 12)
    : IPagedQuery<MatchRequestDisplayResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"incoming-match-requests:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

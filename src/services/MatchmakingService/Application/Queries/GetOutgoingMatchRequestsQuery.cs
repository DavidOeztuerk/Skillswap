using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetOutgoingMatchRequestsQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<MatchRequestDisplayResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"outgoing-match-requests:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

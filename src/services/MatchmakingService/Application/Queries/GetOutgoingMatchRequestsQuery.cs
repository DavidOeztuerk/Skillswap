using CQRS.Interfaces;
using MatchmakingService.Application.Commands;

namespace MatchmakingService.Application.Queries;

public record GetOutgoingMatchRequestsQuery(
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<MatchRequestResponse>, ICacheableQuery
{
    public string? UserId { get; set; }
    int IPagedQuery<MatchRequestResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<MatchRequestResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"outgoing-match-requests:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

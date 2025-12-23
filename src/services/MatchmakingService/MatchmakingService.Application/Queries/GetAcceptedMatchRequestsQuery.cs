using CQRS.Interfaces;
using Contracts.Matchmaking.Responses;

namespace MatchmakingService.Application.Queries;

public record GetAcceptedMatchRequestsQuery(
    string? UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<MatchRequestDisplayResponse>, ICacheableQuery
{
    int IPagedQuery<MatchRequestDisplayResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<MatchRequestDisplayResponse>.PageSize { get; set; } = PageSize;
    
    public string CacheKey => $"accepted-match-requests:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}
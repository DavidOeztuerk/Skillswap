using Contracts.Matchmaking.Responses;
using CQRS.Interfaces;

namespace MatchmakingService.Application.Queries;

public record GetIncomingMatchRequestsQuery(
    string? UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<MatchRequestDisplayResponse>
{
    int IPagedQuery<MatchRequestDisplayResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<MatchRequestDisplayResponse>.PageSize { get; set; } = PageSize;

    // public string CacheKey => $"incoming-match-requests:{UserId}:{PageNumber}:{PageSize}";
    // public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

using CQRS.Interfaces;
using Contracts.Matchmaking.Responses;

namespace MatchmakingService.Application.Queries;

public record GetMatchRequestThreadQuery(
    string ThreadId)
    : IQuery<MatchRequestThreadResponse>, ICacheableQuery
{
     public string CacheKey => $"match-requests-thread-with-id:{ThreadId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries.SocialConnections;

/// <summary>
/// Query to get all social connections and imported data for a user
/// </summary>
public record GetSocialConnectionsQuery : IQuery<SocialConnectionsResponse>, ICacheableQuery
{
  public required string UserId { get; init; }

  public string CacheKey => $"social-connections:{UserId}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Queries;

/// <summary>
/// Query to get profile completeness for a user
/// </summary>
public record GetProfileCompletenessQuery(Guid UserId)
    : IQuery<ProfileCompletenessResponse>, ICacheableQuery
{
  public string CacheKey => $"profile-completeness:{UserId}";
  public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

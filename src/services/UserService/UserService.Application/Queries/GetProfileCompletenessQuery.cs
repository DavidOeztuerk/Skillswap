using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Queries;

/// <summary>
/// Query to get profile completeness for a user
/// Phase 13: Profile Completeness
/// </summary>
public record GetProfileCompletenessQuery(Guid UserId)
    : IQuery<ProfileCompletenessResponse>, ICacheableQuery
{
    public string CacheKey => $"profile-completeness:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

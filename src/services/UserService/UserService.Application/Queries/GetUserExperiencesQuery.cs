using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries;

public record GetUserExperiencesQuery(string UserId) : IQuery<List<UserExperienceResponse>>, ICacheableQuery
{
    public string CacheKey => $"user-experience:{UserId}:list";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

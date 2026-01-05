using Contracts.User.Responses;
using CQRS.Interfaces;

namespace UserService.Application.Queries;

public record GetUserEducationQuery(string UserId) : IQuery<List<UserEducationResponse>>, ICacheableQuery
{
    public string CacheKey => $"user-education:{UserId}:list";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

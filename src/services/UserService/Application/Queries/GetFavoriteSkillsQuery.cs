using CQRS.Interfaces;

namespace UserService.Application.Queries;

public record GetFavoriteSkillsQuery(
    string UserId,
    string PageSize,
    string PageNumber)
    : IQuery<List<string>>, ICacheableQuery
{
    public string CacheKey => $"user-favourites:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

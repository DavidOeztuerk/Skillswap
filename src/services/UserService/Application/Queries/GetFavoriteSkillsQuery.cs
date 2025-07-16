using CQRS.Interfaces;

namespace UserService.Application.Queries.Favorites;

public record GetFavoriteSkillsQuery(string UserId) 
: IQuery<List<string>>, ICacheableQuery
{
    public string CacheKey => $"user-favourites:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

using CQRS.Interfaces;

namespace UserService.Application.Queries;

public record GetFavoriteSkillsQuery(
    string UserId,
    int PageNumber,
    int PageSize)
    : IPagedQuery<string>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
    public string CacheKey => $"favorite-skills:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

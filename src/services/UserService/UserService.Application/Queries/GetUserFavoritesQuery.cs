// using CQRS.Interfaces;

// namespace UserService.Application.Queries;

// public record GetUserFavoritesQuery(
//     string UserId,
//     int PageNumber,
//     int PageSize)
//     : IPagedQuery<string>, ICacheableQuery
// {
//     public int PageNumber { get; set; } = PageNumber;
//     public int PageSize { get; set; } = PageSize;
//     public string CacheKey => $"user-favorite-skill:{UserId}:{PageNumber}:{PageSize}";
//     public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
// }


// public record FavoriteSkillResponse
// {
//     public string SkillId { get; set; } = string.Empty;
//     public string Name { get; set; } = string.Empty;
//     public string Category { get; set; } = string.Empty;
//     public DateTime AddedAt { get; set; }
// }
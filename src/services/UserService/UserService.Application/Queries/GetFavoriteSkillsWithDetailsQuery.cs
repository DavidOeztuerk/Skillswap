using CQRS.Interfaces;

namespace UserService.Application.Queries;

/// <summary>
/// Query to get user's favorite skills with full details from SkillService
/// </summary>
public record GetFavoriteSkillsWithDetailsQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<FavoriteSkillDetailResponse>, ICacheableQuery
{
    public int PageNumber { get; set; } = PageNumber;

    public int PageSize { get; set; } = PageSize;

    public string CacheKey => $"user-favorite-skills-details:{UserId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

/// <summary>
/// Response containing full skill details for favorite skills
/// </summary>
public record FavoriteSkillDetailResponse
{
    public string SkillId { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string ProficiencyLevel { get; init; } = string.Empty;
    public bool IsOffered { get; init; }
    public decimal? Price { get; init; }
    public string? Currency { get; init; }
    public double Rating { get; init; }
    public int ReviewCount { get; init; }
    public int MatchCount { get; init; }
    public DateTime AddedToFavoritesAt { get; init; }
    public string? ThumbnailUrl { get; init; }
    public List<string> Tags { get; init; } = new();

    // User who owns the skill
    public string OwnerId { get; init; } = string.Empty;
    public string OwnerName { get; init; } = string.Empty;
    public string? OwnerAvatarUrl { get; init; }
}
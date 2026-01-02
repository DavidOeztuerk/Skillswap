using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

/// <summary>
/// Repository interface for managing skill favorites.
/// </summary>
public interface ISkillFavoriteRepository
{
    /// <summary>
    /// Gets a favorite by its ID.
    /// </summary>
    Task<SkillFavorite?> GetByIdAsync(string favoriteId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Checks if a skill is favorited by a user.
    /// </summary>
    Task<bool> IsFavoriteAsync(string userId, string skillId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets all favorite skill IDs for a user.
    /// </summary>
    Task<List<string>> GetFavoriteSkillIdsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets favorite skills for a user with pagination.
    /// </summary>
    Task<(List<Skill> Skills, int TotalCount)> GetFavoriteSkillsPagedAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Adds a new favorite.
    /// </summary>
    Task<SkillFavorite> AddAsync(SkillFavorite favorite, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes a favorite by user ID and skill ID.
    /// </summary>
    Task RemoveAsync(string userId, string skillId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Removes all favorites for a user (used when user is deleted).
    /// </summary>
    Task RemoveAllForUserAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Saves changes to the database.
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

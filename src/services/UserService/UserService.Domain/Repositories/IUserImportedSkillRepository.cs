using UserService.Domain.Models;

namespace UserService.Domain.Repositories;

/// <summary>
/// Repository interface for managing user imported skills (professional competencies)
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public interface IUserImportedSkillRepository
{
    /// <summary>
    /// Get all skills for a user
    /// </summary>
    Task<List<UserImportedSkill>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get visible skills for a user (for public profile)
    /// </summary>
    Task<List<UserImportedSkill>> GetVisibleByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a skill by ID
    /// </summary>
    Task<UserImportedSkill?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a skill by external ID and source
    /// </summary>
    Task<UserImportedSkill?> GetByExternalIdAsync(string userId, string externalId, string source, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a skill by normalized name (for deduplication)
    /// </summary>
    Task<UserImportedSkill?> GetByNormalizedNameAsync(string userId, string normalizedName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get skills by source (linkedin, xing, manual)
    /// </summary>
    Task<List<UserImportedSkill>> GetBySourceAsync(string userId, string source, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new skill
    /// </summary>
    Task<UserImportedSkill> CreateAsync(UserImportedSkill skill, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create multiple skills (bulk import)
    /// </summary>
    Task<List<UserImportedSkill>> CreateManyAsync(List<UserImportedSkill> skills, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing skill
    /// </summary>
    Task<UserImportedSkill> UpdateAsync(UserImportedSkill skill, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a skill (soft delete)
    /// </summary>
    Task DeleteAsync(UserImportedSkill skill, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete all skills from a specific source for a user
    /// </summary>
    Task DeleteBySourceAsync(string userId, string source, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a skill exists for a user by normalized name
    /// </summary>
    Task<bool> ExistsByNameAsync(string userId, string normalizedName, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get count of skills by source for a user
    /// </summary>
    Task<int> GetCountBySourceAsync(string userId, string source, CancellationToken cancellationToken = default);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

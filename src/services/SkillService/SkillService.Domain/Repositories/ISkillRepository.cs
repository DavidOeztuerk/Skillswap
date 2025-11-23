using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillRepository
{
    Task<Skill?> GetByIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<Skill?> GetByIdAndUserIdAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<List<Skill>> GetUserSkillsAsync(string userId, CancellationToken cancellationToken = default);
    Task<List<Skill>> GetByCategoryAsync(string categoryId, CancellationToken cancellationToken = default);
    Task<List<Skill>> SearchSkillsAsync(string searchTerm, CancellationToken cancellationToken = default);
    Task<Skill> CreateAsync(Skill skill, CancellationToken cancellationToken = default);
    Task<Skill> UpdateAsync(Skill skill, CancellationToken cancellationToken = default);
    Task DeleteAsync(string skillId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<Skill?> GetByNameAndUserIdAsync(string name, string? userId, CancellationToken cancellationToken);
    Task<int> CountByProficiencyLevelAsync(string proficiencyLevelId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<int> CountByCategoryAsync(string categoryId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<List<Skill>> GetByIdsAsync(IEnumerable<string> skillIds, CancellationToken cancellationToken = default);
    Task<List<Skill>> GetActiveSkillsWithTagsAsync(string? categoryId, CancellationToken cancellationToken = default);
    void RemoveRange(IEnumerable<Skill> skills);

    Task<(List<Skill> Skills, int TotalCount)> SearchSkillsPagedAsync(
        string? userId,
        string? searchTerm,
        string? categoryId,
        string? proficiencyLevelId,
        List<string>? tags,
        bool? isOffered,
        decimal? minRating,
        string? sortBy,
        string? sortDirection,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<(
        int TotalSkills,
        int OfferedSkills,
        int RequestedSkills,
        int ActiveSkills,
        double AverageRating,
        Dictionary<string, int> SkillsByCategory,
        Dictionary<string, int> SkillsByProficiencyLevel,
        List<(string Id, string Name, double Rating, int ReviewCount)> TopRatedSkills,
        List<(string Id, string Name, string CategoryName, int ViewCount)> TrendingSkills,
        Dictionary<string, int> PopularTags
    )> GetStatisticsAsync(
        DateTime? fromDate,
        DateTime? toDate,
        string? categoryId,
        string? userId,
        CancellationToken cancellationToken = default);
}

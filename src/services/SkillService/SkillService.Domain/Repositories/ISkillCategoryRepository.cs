using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillCategoryRepository
{
    Task<SkillCategory?> GetByIdAsync(string categoryId, CancellationToken cancellationToken = default);
    Task<SkillCategory?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<List<SkillCategory>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<SkillCategory> CreateAsync(SkillCategory category, CancellationToken cancellationToken = default);
    Task<SkillCategory> UpdateAsync(SkillCategory category, CancellationToken cancellationToken = default);
    Task DeleteAsync(string categoryId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

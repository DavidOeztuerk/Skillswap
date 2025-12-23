using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillResourceRepository
{
    Task<SkillResource?> GetByIdAsync(string resourceId, CancellationToken cancellationToken = default);
    Task<List<SkillResource>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<SkillResource> CreateAsync(SkillResource resource, CancellationToken cancellationToken = default);
    Task<SkillResource> UpdateAsync(SkillResource resource, CancellationToken cancellationToken = default);
    Task DeleteAsync(string resourceId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

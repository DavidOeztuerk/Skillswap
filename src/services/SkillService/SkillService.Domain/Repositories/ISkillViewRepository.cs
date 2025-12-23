using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillViewRepository
{
    Task<SkillView?> GetByIdAsync(string viewId, CancellationToken cancellationToken = default);
    Task<List<SkillView>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<SkillView>> GetByViewerUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<SkillView> CreateAsync(SkillView view, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    void RemoveRange(IEnumerable<SkillView> views);
}

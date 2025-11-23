using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillMatchRepository
{
    Task<SkillMatch?> GetByIdAsync(string matchId, CancellationToken cancellationToken = default);
    Task<List<SkillMatch>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<SkillMatch> CreateAsync(SkillMatch match, CancellationToken cancellationToken = default);
    Task<SkillMatch> UpdateAsync(SkillMatch match, CancellationToken cancellationToken = default);
    Task DeleteAsync(string matchId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

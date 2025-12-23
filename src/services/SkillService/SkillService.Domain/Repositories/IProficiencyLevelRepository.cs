using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface IProficiencyLevelRepository
{
    Task<ProficiencyLevel?> GetByIdAsync(string levelId, CancellationToken cancellationToken = default);
    Task<ProficiencyLevel?> GetByLevelAsync(string level, CancellationToken cancellationToken = default);
    Task<List<ProficiencyLevel>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ProficiencyLevel> CreateAsync(ProficiencyLevel level, CancellationToken cancellationToken = default);
    Task<ProficiencyLevel> UpdateAsync(ProficiencyLevel level, CancellationToken cancellationToken = default);
    Task DeleteAsync(string levelId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

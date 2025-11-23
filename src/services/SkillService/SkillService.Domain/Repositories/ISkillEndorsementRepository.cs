using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillEndorsementRepository
{
    Task<SkillEndorsement?> GetByIdAsync(string endorsementId, CancellationToken cancellationToken = default);
    Task<SkillEndorsement?> GetBySkillAndUserAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<List<SkillEndorsement>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<SkillEndorsement>> GetByEndorserUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<SkillEndorsement> CreateAsync(SkillEndorsement endorsement, CancellationToken cancellationToken = default);
    Task DeleteAsync(string endorsementId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    void RemoveRange(IEnumerable<SkillEndorsement> endorsements);
}

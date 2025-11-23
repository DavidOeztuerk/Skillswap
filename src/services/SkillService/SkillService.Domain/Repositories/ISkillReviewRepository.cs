using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillReviewRepository
{
    Task<SkillReview?> GetByIdAsync(string reviewId, CancellationToken cancellationToken = default);
    Task<SkillReview?> GetBySkillAndUserAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default);
    Task<List<SkillReview>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<SkillReview>> GetVisibleReviewsBySkillAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<SkillReview>> GetByReviewerUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<SkillReview> CreateAsync(SkillReview review, CancellationToken cancellationToken = default);
    Task<SkillReview> UpdateAsync(SkillReview review, CancellationToken cancellationToken = default);
    Task DeleteAsync(string reviewId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    void RemoveRange(IEnumerable<SkillReview> reviews);
}

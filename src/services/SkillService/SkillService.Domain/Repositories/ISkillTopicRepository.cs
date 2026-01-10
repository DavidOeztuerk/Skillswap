using SkillService.Domain.Entities;

namespace SkillService.Domain.Repositories;

public interface ISkillTopicRepository
{
    Task<SkillTopic?> GetByIdAsync(string topicId, CancellationToken cancellationToken = default);
    Task<SkillTopic?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<List<SkillTopic>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<List<SkillTopic>> GetBySubcategoryIdAsync(string subcategoryId, CancellationToken cancellationToken = default);
    Task<SkillTopic> CreateAsync(SkillTopic topic, CancellationToken cancellationToken = default);
    Task<SkillTopic> UpdateAsync(SkillTopic topic, CancellationToken cancellationToken = default);
    Task DeleteAsync(string topicId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class SkillTopicRepository : ISkillTopicRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillTopicRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<SkillTopic?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillTopics
            .Include(t => t.Subcategory)
            .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive, cancellationToken);
    }

    public async Task<List<SkillTopic>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillTopics
            .Include(t => t.Subcategory)
            .ThenInclude(s => s.Category)
            .Where(e => e.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SkillTopic>> GetBySubcategoryIdAsync(string subcategoryId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillTopics
            .Include(t => t.Subcategory)
            .ThenInclude(s => s.Category)
            .Where(e => e.SkillSubcategoryId == subcategoryId && e.IsActive)
            .OrderBy(t => t.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillTopic> CreateAsync(SkillTopic entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillTopics.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillTopic> UpdateAsync(SkillTopic entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillTopics.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            entity.IsActive = false;
            _dbContext.SkillTopics.Update(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<SkillTopic?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillTopics
            .Include(t => t.Subcategory)
            .ThenInclude(s => s.Category)
            .FirstOrDefaultAsync(c => c.Name == name && c.IsActive, cancellationToken);
    }
}

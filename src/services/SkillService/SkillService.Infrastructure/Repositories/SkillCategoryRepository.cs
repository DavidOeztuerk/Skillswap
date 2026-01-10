using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class SkillCategoryRepository : ISkillCategoryRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillCategoryRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<SkillCategory?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillCategories
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillCategory>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillCategories
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SkillCategory>> GetAllWithHierarchyAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillCategories
            .Where(c => !c.IsDeleted && c.IsActive)
            .Include(c => c.Subcategories.Where(s => s.IsActive))
                .ThenInclude(s => s.Topics.Where(t => t.IsActive))
                    .ThenInclude(t => t.Skills.Where(sk => !sk.IsDeleted))
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.Name)
            .AsSplitQuery()
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillCategory> CreateAsync(SkillCategory entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillCategories.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillCategory> UpdateAsync(SkillCategory entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillCategories.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillCategories.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<SkillCategory?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillCategories
            .FirstOrDefaultAsync(c => c.Name == name && !c.IsDeleted, cancellationToken);
    }
}

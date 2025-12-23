using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

public class SkillResourceRepository(
    SkillDbContext dbContext) 
    : ISkillResourceRepository
{
    private readonly SkillDbContext _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public async Task<SkillResource?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillResources
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillResource>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillResources
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillResource> CreateAsync(SkillResource entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillResources.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillResource> UpdateAsync(SkillResource entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillResources.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillResources.Remove(entity);
        }
    }


    public async Task<List<SkillResource>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillResources
            .Where(e => e.SkillId == skillId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        // SkillResource doesn't have a direct UserId property
        // Delete resources associated with skills owned by the user
        var entities = await _dbContext.SkillResources
            .Where(e => !e.IsDeleted && _dbContext.Skills.Any(s => s.Id == e.SkillId && s.UserId == userId))
            .ToListAsync(cancellationToken);
        _dbContext.SkillResources.RemoveRange(entities);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

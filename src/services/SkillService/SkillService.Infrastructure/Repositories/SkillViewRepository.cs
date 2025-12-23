using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

public class SkillViewRepository(
    SkillDbContext dbContext) 
    : ISkillViewRepository
{
    private readonly SkillDbContext _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public async Task<SkillView?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillViews
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillView>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillViews
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillView> CreateAsync(SkillView entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillViews.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillView> UpdateAsync(SkillView entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillViews.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillViews.Remove(entity);
        }
    }


    public async Task<List<SkillView>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillViews
            .Where(e => e.SkillId == skillId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        // SkillView has ViewerUserId property
        var entities = await _dbContext.SkillViews
            .Where(e => e.ViewerUserId == userId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
        _dbContext.SkillViews.RemoveRange(entities);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<List<SkillView>> GetByViewerUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillViews
            .Where(v => v.ViewerUserId == userId && !v.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public void RemoveRange(IEnumerable<SkillView> views)
    {
        _dbContext.Set<SkillView>().RemoveRange(views);
    }
}

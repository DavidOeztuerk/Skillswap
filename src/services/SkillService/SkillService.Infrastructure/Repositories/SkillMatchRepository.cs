using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class SkillMatchRepository : ISkillMatchRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillMatchRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<SkillMatch?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillMatches
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillMatch>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillMatches
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillMatch> CreateAsync(SkillMatch entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillMatches.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillMatch> UpdateAsync(SkillMatch entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillMatches.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillMatches.Remove(entity);
        }
    }


    public async Task<List<SkillMatch>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        // SkillMatch has OfferedSkillId and RequestedSkillId, not SkillId
        return await _dbContext.SkillMatches
            .Where(e => (e.OfferedSkillId == skillId || e.RequestedSkillId == skillId) && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        // SkillMatch has OfferingUserId and RequestingUserId properties
        // Delete matches where user is either offering or requesting
        var entities = await _dbContext.SkillMatches
            .Where(e => (e.OfferingUserId == userId || e.RequestingUserId == userId) && !e.IsDeleted)
            .ToListAsync(cancellationToken);
        _dbContext.SkillMatches.RemoveRange(entities);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

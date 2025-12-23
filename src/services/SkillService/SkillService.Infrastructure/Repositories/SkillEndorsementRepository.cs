using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class SkillEndorsementRepository : ISkillEndorsementRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillEndorsementRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<SkillEndorsement?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillEndorsements
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillEndorsement>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillEndorsements
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillEndorsement> CreateAsync(SkillEndorsement entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillEndorsements.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillEndorsement> UpdateAsync(SkillEndorsement entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillEndorsements.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillEndorsements.Remove(entity);
        }
    }


    public async Task<List<SkillEndorsement>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillEndorsements
            .Where(e => e.SkillId == skillId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        // SkillEndorsement has EndorserUserId and EndorsedUserId properties
        // Delete endorsements where user is either endorser or endorsed
        var entities = await _dbContext.SkillEndorsements
            .Where(e => (e.EndorserUserId == userId || e.EndorsedUserId == userId) && !e.IsDeleted)
            .ToListAsync(cancellationToken);
        _dbContext.SkillEndorsements.RemoveRange(entities);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<SkillEndorsement?> GetBySkillAndUserAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SkillEndorsements.Where(e => e.SkillId == skillId && e.EndorserUserId == userId);

        if (!includeDeleted)
        {
            query = query.Where(e => !e.IsDeleted);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<SkillEndorsement>> GetByEndorserUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillEndorsements
            .Where(e => e.EndorserUserId == userId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public void RemoveRange(IEnumerable<SkillEndorsement> endorsements)
    {
        _dbContext.Set<SkillEndorsement>().RemoveRange(endorsements);
    }
}

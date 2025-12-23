using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Infrastructure.Data;

namespace SkillService.Infrastructure.Repositories;

public class ProficiencyLevelRepository : IProficiencyLevelRepository
{
    private readonly SkillDbContext _dbContext;

    public ProficiencyLevelRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ProficiencyLevel?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProficiencyLevels
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<ProficiencyLevel>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProficiencyLevels
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProficiencyLevel> CreateAsync(ProficiencyLevel entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.ProficiencyLevels.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<ProficiencyLevel> UpdateAsync(ProficiencyLevel entity, CancellationToken cancellationToken = default)
    {
        _dbContext.ProficiencyLevels.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.ProficiencyLevels.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProficiencyLevel?> GetByLevelAsync(string level, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ProficiencyLevels
            .FirstOrDefaultAsync(p => p.Level == level && !p.IsDeleted, cancellationToken);
    }
}

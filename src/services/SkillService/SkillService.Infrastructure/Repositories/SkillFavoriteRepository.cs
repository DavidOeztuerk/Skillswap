using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for managing skill favorites.
/// </summary>
public class SkillFavoriteRepository : ISkillFavoriteRepository
{
    private readonly SkillDbContext _dbContext;

    public SkillFavoriteRepository(SkillDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<SkillFavorite?> GetByIdAsync(string favoriteId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillFavorites
            .FirstOrDefaultAsync(f => f.Id == favoriteId && !f.IsDeleted, cancellationToken);
    }

    public async Task<bool> IsFavoriteAsync(string userId, string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillFavorites
            .AnyAsync(f => f.UserId == userId && f.SkillId == skillId && !f.IsDeleted, cancellationToken);
    }

    public async Task<List<string>> GetFavoriteSkillIdsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillFavorites
            .Where(f => f.UserId == userId && !f.IsDeleted)
            .Select(f => f.SkillId)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<Skill> Skills, int TotalCount)> GetFavoriteSkillsPagedAsync(
        string userId,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SkillFavorites
            .Where(f => f.UserId == userId && !f.IsDeleted)
            .Include(f => f.Skill)
                .ThenInclude(s => s.SkillCategory)
            .Include(f => f.Skill)
                .ThenInclude(s => s.ProficiencyLevel)
            .Select(f => f.Skill)
            .Where(s => s.IsActive && !s.IsDeleted);

        var totalCount = await query.CountAsync(cancellationToken);

        var skills = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (skills, totalCount);
    }

    public async Task<SkillFavorite> AddAsync(SkillFavorite favorite, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillFavorites.AddAsync(favorite, cancellationToken);
        return favorite;
    }

    public async Task RemoveAsync(string userId, string skillId, CancellationToken cancellationToken = default)
    {
        var favorite = await _dbContext.SkillFavorites
            .FirstOrDefaultAsync(f => f.UserId == userId && f.SkillId == skillId && !f.IsDeleted, cancellationToken);

        if (favorite != null)
        {
            _dbContext.SkillFavorites.Remove(favorite);
        }
    }

    public async Task RemoveAllForUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var favorites = await _dbContext.SkillFavorites
            .Where(f => f.UserId == userId && !f.IsDeleted)
            .ToListAsync(cancellationToken);

        _dbContext.SkillFavorites.RemoveRange(favorites);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

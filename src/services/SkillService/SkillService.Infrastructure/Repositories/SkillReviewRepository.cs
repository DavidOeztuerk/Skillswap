using Microsoft.EntityFrameworkCore;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Repositories;

public class SkillReviewRepository(
    SkillDbContext dbContext) 
    : ISkillReviewRepository
{
    private readonly SkillDbContext _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));

    public async Task<SkillReview?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillReviews
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);
    }

    public async Task<List<SkillReview>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillReviews
            .Where(e => !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillReview> CreateAsync(SkillReview entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.SkillReviews.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<SkillReview> UpdateAsync(SkillReview entity, CancellationToken cancellationToken = default)
    {
        _dbContext.SkillReviews.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.SkillReviews.Remove(entity);
        }
    }


    public async Task<List<SkillReview>> GetBySkillIdAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillReviews
            .Where(e => e.SkillId == skillId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        // SkillReview has ReviewerUserId and ReviewedUserId properties
        // Delete reviews where user is either reviewer or reviewed
        var entities = await _dbContext.SkillReviews
            .Where(e => (e.ReviewerUserId == userId || e.ReviewedUserId == userId) && !e.IsDeleted)
            .ToListAsync(cancellationToken);
        _dbContext.SkillReviews.RemoveRange(entities);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<SkillReview?> GetBySkillAndUserAsync(string skillId, string userId, bool includeDeleted = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.SkillReviews.Where(r => r.SkillId == skillId && r.ReviewerUserId == userId);

        if (!includeDeleted)
        {
            query = query.Where(r => !r.IsDeleted);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<SkillReview>> GetVisibleReviewsBySkillAsync(string skillId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillReviews
            .Where(r => r.SkillId == skillId && !r.IsDeleted && r.IsVisible)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<SkillReview>> GetByReviewerUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SkillReviews
            .Where(r => r.ReviewerUserId == userId && !r.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public void RemoveRange(IEnumerable<SkillReview> reviews)
    {
        _dbContext.Set<SkillReview>().RemoveRange(reviews);
    }
}

using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

/// <summary>
/// Repository for user statistics (Phase 13: Profile Completeness)
/// </summary>
public class UserStatisticsRepository(UserDbContext dbContext) : IUserStatisticsRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<UserStatistics?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserStatistics
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<UserStatistics> CreateAsync(UserStatistics statistics, CancellationToken cancellationToken = default)
    {
        _dbContext.UserStatistics.Add(statistics);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return statistics;
    }

    public async Task<UserStatistics> UpdateAsync(UserStatistics statistics, CancellationToken cancellationToken = default)
    {
        _dbContext.UserStatistics.Update(statistics);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return statistics;
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

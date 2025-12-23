using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

public class UserCalendarConnectionRepository(UserDbContext dbContext) : IUserCalendarConnectionRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<List<UserCalendarConnection>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserCalendarConnections
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .OrderBy(c => c.Provider)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<UserCalendarConnection?> GetByUserAndProviderAsync(string userId, string provider, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserCalendarConnections
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == provider && !c.IsDeleted, cancellationToken);
    }

    public async Task<UserCalendarConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserCalendarConnections
            .FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted, cancellationToken);
    }

    public async Task<UserCalendarConnection> CreateAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default)
    {
        connection.CreatedAt = DateTime.UtcNow;
        _dbContext.UserCalendarConnections.Add(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task<UserCalendarConnection> UpdateAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default)
    {
        connection.UpdatedAt = DateTime.UtcNow;
        _dbContext.UserCalendarConnections.Update(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task DeleteAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default)
    {
        connection.IsDeleted = true;
        connection.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(string userId, string provider, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserCalendarConnections
            .AnyAsync(c => c.UserId == userId && c.Provider == provider && !c.IsDeleted, cancellationToken);
    }

    public async Task<List<UserCalendarConnection>> GetConnectionsNeedingRefreshAsync(CancellationToken cancellationToken = default)
    {
        var refreshThreshold = DateTime.UtcNow.AddMinutes(10);
        return await _dbContext.UserCalendarConnections
            .Where(c => !c.IsDeleted && c.SyncEnabled && c.TokenExpiresAt <= refreshThreshold)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

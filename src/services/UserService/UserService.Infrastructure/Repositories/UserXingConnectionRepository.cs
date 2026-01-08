using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Xing connections
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class UserXingConnectionRepository(UserDbContext dbContext) : IUserXingConnectionRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<UserXingConnection?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserXingConnections
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserXingConnection?> GetByXingIdAsync(string xingId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserXingConnections
            .Where(c => c.XingId == xingId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserXingConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserXingConnections
            .Where(c => c.Id == id && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserXingConnection> CreateAsync(UserXingConnection connection, CancellationToken cancellationToken = default)
    {
        _dbContext.UserXingConnections.Add(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task<UserXingConnection> UpdateAsync(UserXingConnection connection, CancellationToken cancellationToken = default)
    {
        _dbContext.UserXingConnections.Update(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task DeleteAsync(UserXingConnection connection, CancellationToken cancellationToken = default)
    {
        connection.IsDeleted = true;
        connection.DeletedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserXingConnections
            .AnyAsync(c => c.UserId == userId && !c.IsDeleted, cancellationToken);
    }

    public async Task<List<UserXingConnection>> GetAutoSyncConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserXingConnections
            .Where(c => !c.IsDeleted && c.AutoSyncEnabled)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

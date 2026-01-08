using Microsoft.EntityFrameworkCore;
using UserService.Domain.Models;
using UserService.Domain.Repositories;

namespace UserService.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for LinkedIn connections
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public class UserLinkedInConnectionRepository(UserDbContext dbContext) : IUserLinkedInConnectionRepository
{
    private readonly UserDbContext _dbContext = dbContext;

    public async Task<UserLinkedInConnection?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserLinkedInConnections
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserLinkedInConnection?> GetByLinkedInIdAsync(string linkedInId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserLinkedInConnections
            .Where(c => c.LinkedInId == linkedInId && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserLinkedInConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserLinkedInConnections
            .Where(c => c.Id == id && !c.IsDeleted)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<UserLinkedInConnection> CreateAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default)
    {
        _dbContext.UserLinkedInConnections.Add(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task<UserLinkedInConnection> UpdateAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default)
    {
        _dbContext.UserLinkedInConnections.Update(connection);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return connection;
    }

    public async Task DeleteAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default)
    {
        connection.IsDeleted = true;
        connection.DeletedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> ExistsAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserLinkedInConnections
            .AnyAsync(c => c.UserId == userId && !c.IsDeleted, cancellationToken);
    }

    public async Task<List<UserLinkedInConnection>> GetConnectionsNeedingRefreshAsync(CancellationToken cancellationToken = default)
    {
        var refreshThreshold = DateTime.UtcNow.AddHours(1);
        return await _dbContext.UserLinkedInConnections
            .Where(c => !c.IsDeleted && c.TokenExpiresAt <= refreshThreshold)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<UserLinkedInConnection>> GetAutoSyncConnectionsAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.UserLinkedInConnections
            .Where(c => !c.IsDeleted && c.AutoSyncEnabled)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

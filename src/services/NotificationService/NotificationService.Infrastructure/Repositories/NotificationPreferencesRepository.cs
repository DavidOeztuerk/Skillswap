using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationPreferencesRepository : INotificationPreferencesRepository
{
    private readonly NotificationDbContext _dbContext;

    public NotificationPreferencesRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<NotificationPreferences?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<NotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var preferences = await GetByUserIdAsync(userId, cancellationToken);
        if (preferences != null)
        {
            _dbContext.NotificationPreferences.Remove(preferences);
        }
    }

    public async Task<NotificationPreferences> CreateAsync(NotificationPreferences entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.NotificationPreferences.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<NotificationPreferences> UpdateAsync(NotificationPreferences entity, CancellationToken cancellationToken = default)
    {
        _dbContext.NotificationPreferences.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.NotificationPreferences.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

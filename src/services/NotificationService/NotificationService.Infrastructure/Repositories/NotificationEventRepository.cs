using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationEventRepository : INotificationEventRepository
{
    private readonly NotificationDbContext _dbContext;

    public NotificationEventRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<NotificationEvent?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationEvents
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<List<NotificationEvent>> GetByNotificationIdAsync(string notificationId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationEvents
            .Where(e => e.NotificationId == notificationId)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var events = await _dbContext.NotificationEvents
            .Where(e => e.UserId == userId)
            .ToListAsync(cancellationToken);
        _dbContext.NotificationEvents.RemoveRange(events);
    }

    public async Task<NotificationEvent> CreateAsync(NotificationEvent entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.NotificationEvents.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<NotificationEvent> UpdateAsync(NotificationEvent entity, CancellationToken cancellationToken = default)
    {
        _dbContext.NotificationEvents.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.NotificationEvents.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

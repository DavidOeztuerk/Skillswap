using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationDigestEntryRepository : INotificationDigestEntryRepository
{
    private readonly NotificationDbContext _dbContext;

    public NotificationDigestEntryRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<NotificationDigestEntry?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationDigestEntries
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<List<NotificationDigestEntry>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationDigestEntries
            .Where(e => e.UserId == userId && !e.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var entries = await GetByUserIdAsync(userId, cancellationToken);
        _dbContext.NotificationDigestEntries.RemoveRange(entries);
    }

    public async Task<NotificationDigestEntry> CreateAsync(NotificationDigestEntry entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.NotificationDigestEntries.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<NotificationDigestEntry> UpdateAsync(NotificationDigestEntry entity, CancellationToken cancellationToken = default)
    {
        _dbContext.NotificationDigestEntries.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.NotificationDigestEntries.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

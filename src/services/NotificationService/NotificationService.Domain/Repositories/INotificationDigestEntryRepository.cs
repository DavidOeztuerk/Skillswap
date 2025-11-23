using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface INotificationDigestEntryRepository
{
    Task<NotificationDigestEntry?> GetByIdAsync(string entryId, CancellationToken cancellationToken = default);
    Task<List<NotificationDigestEntry>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<NotificationDigestEntry> CreateAsync(NotificationDigestEntry entry, CancellationToken cancellationToken = default);
    Task DeleteAsync(string entryId, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

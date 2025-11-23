using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface INotificationPreferencesRepository
{
    Task<NotificationPreferences?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<NotificationPreferences> CreateAsync(NotificationPreferences preferences, CancellationToken cancellationToken = default);
    Task<NotificationPreferences> UpdateAsync(NotificationPreferences preferences, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

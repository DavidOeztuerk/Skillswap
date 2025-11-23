using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface INotificationEventRepository
{
    Task<NotificationEvent?> GetByIdAsync(string eventId, CancellationToken cancellationToken = default);
    Task<List<NotificationEvent>> GetByNotificationIdAsync(string notificationId, CancellationToken cancellationToken = default);
    Task<NotificationEvent> CreateAsync(NotificationEvent notificationEvent, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

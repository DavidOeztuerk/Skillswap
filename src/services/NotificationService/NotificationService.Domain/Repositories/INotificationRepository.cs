using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetByUserIdAsync(string userId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<List<Notification>> GetPendingNotificationsAsync(CancellationToken cancellationToken = default);
    Task<List<Notification>> GetFailedNotificationsAsync(CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(string userId, CancellationToken cancellationToken = default);
    Task AddAsync(Notification notification, CancellationToken cancellationToken = default);
    Task UpdateAsync(Notification notification, CancellationToken cancellationToken = default);
    Task DeleteAsync(Notification notification, CancellationToken cancellationToken = default);
}

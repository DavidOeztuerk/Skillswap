using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface IReminderSettingsRepository
{
    Task<ReminderSettings?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<ReminderSettings> CreateAsync(ReminderSettings settings, CancellationToken cancellationToken = default);
    Task<ReminderSettings> UpdateAsync(ReminderSettings settings, CancellationToken cancellationToken = default);
    Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
